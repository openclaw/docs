---
read_when:
    - Quieres usar modelos de OpenAI en OpenClaw
    - Quieres autenticación con suscripción de Codex en lugar de claves de API
    - Necesitas un comportamiento de ejecución de agente GPT-5 más estricto
summary: Usa OpenAI mediante claves de API o una suscripción a Codex en OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-06-27T12:40:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f5346c6bb85341c4e1709e3023dee8b32a413189d5564778e9c919b7eaa78f1
    source_path: providers/openai.md
    workflow: 16
---

OpenAI proporciona API para desarrolladores para modelos GPT, y Codex también está disponible como
agente de programación del plan de ChatGPT a través de los clientes de Codex de OpenAI. OpenClaw usa un
id de proveedor, `openai`, para ambas formas de autenticación.

OpenClaw usa `openai/*` como la ruta canónica de modelos de OpenAI. Los turnos de agentes integrados
en modelos de OpenAI se ejecutan mediante el entorno de ejecución nativo del servidor de aplicaciones de Codex de forma
predeterminada; la autenticación directa con clave de API de OpenAI sigue estando disponible para superficies de OpenAI que no son de agente,
como imágenes, embeddings, voz y realtime.

- **Modelos de agente** - modelos `openai/*` mediante el entorno de ejecución de Codex; inicia sesión con
  autenticación de Codex para usar una suscripción de ChatGPT/Codex, o configura una copia de respaldo
  de clave de API de OpenAI compatible con Codex cuando quieras intencionalmente usar autenticación con clave de API.
- **API de OpenAI que no son de agente** - acceso directo a OpenAI Platform con facturación
  basada en uso mediante `OPENAI_API_KEY` o incorporación con clave de API de OpenAI.
- **Configuración heredada** - las referencias heredadas de modelos de Codex son reparadas por
  `openclaw doctor --fix` a `openai/*` más el entorno de ejecución de Codex.

OpenAI admite explícitamente el uso de OAuth de suscripción en herramientas externas y flujos de trabajo como OpenClaw.

Proveedor, modelo, entorno de ejecución y canal son capas separadas. Si esas etiquetas se están
mezclando, lee [Entornos de ejecución de agentes](/es/concepts/agent-runtimes) antes de
cambiar la configuración.

## Elección rápida

| Objetivo                                             | Usar                                                     | Notas                                                                 |
| ---------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| Suscripción de ChatGPT/Codex con entorno de ejecución nativo de Codex | `openai/gpt-5.5`                                         | Configuración predeterminada de agente de OpenAI. Inicia sesión con autenticación de Codex. |
| Facturación directa con clave de API para modelos de agente | `openai/gpt-5.5` más un perfil de clave de API compatible con Codex | Usa `auth.order.openai` para colocar la copia de respaldo después de la autenticación de suscripción. |
| Facturación directa con clave de API mediante OpenClaw explícito | `openai/gpt-5.5` más entorno de ejecución de proveedor/modelo `openclaw` | Selecciona un perfil normal de clave de API `openai`. |
| Alias de la API de ChatGPT Instant más reciente      | `openai/chat-latest`                                     | Solo clave de API directa. Alias móvil para experimentos, no el predeterminado. |
| Autenticación de suscripción de ChatGPT/Codex mediante OpenClaw | `openai/gpt-5.5` más entorno de ejecución de proveedor/modelo `openclaw` | Selecciona un perfil OAuth de `openai` para la ruta de compatibilidad. |
| Generación o edición de imágenes                     | `openai/gpt-image-2`                                     | Funciona con `OPENAI_API_KEY` o con OAuth de OpenAI Codex. |
| Imágenes con fondo transparente                      | `openai/gpt-image-1.5`                                   | Usa `outputFormat=png` o `webp` y `openai.background=transparent`. |

## Mapa de nombres

Los nombres son similares, pero no son intercambiables:

| Nombre que ves                          | Capa              | Significado                                                                                       |
| --------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                                | Prefijo de proveedor | Ruta canónica de modelos de OpenAI; los turnos de agente usan el entorno de ejecución de Codex. |
| prefijo heredado de OpenAI Codex        | Prefijo heredado  | Espacio de nombres anterior de modelo/perfil. `openclaw doctor --fix` lo migra a `openai`. |
| Plugin `codex`                          | Plugin            | Plugin incluido de OpenClaw que proporciona el entorno de ejecución nativo del servidor de aplicaciones de Codex y controles de chat `/codex`. |
| proveedor/modelo `agentRuntime.id: codex` | Entorno de ejecución de agente | Fuerza el arnés nativo del servidor de aplicaciones de Codex para turnos integrados coincidentes. |
| `/codex ...`                            | Conjunto de comandos de chat | Vincula/controla hilos del servidor de aplicaciones de Codex desde una conversación. |
| `runtime: "acp", agentId: "codex"`      | Ruta de sesión ACP | Ruta de respaldo explícita que ejecuta Codex mediante ACP/acpx. |

Esto significa que una configuración puede contener intencionalmente referencias de modelo `openai/*` mientras los
perfiles de autenticación apuntan a credenciales OAuth de clave de API o ChatGPT/Codex. Usa
`auth.order.openai` para la configuración; `openclaw doctor --fix` reescribe las referencias heredadas
heredadas de modelos de Codex, los ids heredados de perfiles de autenticación de Codex y
el orden de autenticación heredado de Codex a la ruta canónica de OpenAI.

<Note>
GPT-5.5 está disponible tanto mediante acceso directo con clave de API de OpenAI Platform como mediante
rutas de suscripción/OAuth. Para suscripción de ChatGPT/Codex más ejecución nativa de Codex,
usa `openai/gpt-5.5`; la configuración de entorno de ejecución sin definir ahora selecciona el arnés de Codex
para turnos de agente de OpenAI. Usa perfiles de clave de API de OpenAI solo cuando quieras
autenticación directa con clave de API para un modelo de agente de OpenAI.
</Note>

<Note>
Los turnos de modelos de agente de OpenAI requieren el Plugin incluido de servidor de aplicaciones de Codex. La configuración explícita
del entorno de ejecución de OpenClaw sigue disponible como ruta de compatibilidad opcional. Cuando OpenClaw se
selecciona explícitamente con un perfil OAuth de `openai`, OpenClaw mantiene la
referencia pública de modelo como `openai/*` y enruta internamente mediante el transporte
autenticado por Codex. Ejecuta `openclaw doctor --fix` para reparar referencias obsoletas
heredadas de modelos de Codex, `codex-cli/*` o antiguos pines de sesión de entorno de ejecución que no provengan de
configuración explícita de entorno de ejecución.
</Note>

## Cobertura de funciones de OpenClaw

| Capacidad de OpenAI       | Superficie de OpenClaw                                                                       | Estado                                                                 |
| ------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Chat / Responses          | proveedor de modelos `openai/<model>`                                                        | Sí                                                                     |
| Modelos de suscripción de Codex | `openai/<model>` con OAuth de OpenAI                                                    | Sí                                                                     |
| Referencias heredadas de modelos de Codex | referencias heredadas de modelos de Codex o `codex-cli/<model>`                  | Reparadas por doctor a `openai/<model>`                                |
| Arnés de servidor de aplicaciones de Codex | `openai/<model>` con entorno de ejecución omitido o proveedor/modelo `agentRuntime.id: codex` | Sí                                                                     |
| Búsqueda web del lado del servidor | Herramienta nativa OpenAI Responses                                                   | Sí, cuando la búsqueda web está habilitada y no hay proveedor fijado    |
| Imágenes                  | `image_generate`                                                                              | Sí                                                                     |
| Videos                    | `video_generate`                                                                              | Sí                                                                     |
| Texto a voz               | `messages.tts.provider: "openai"` / `tts`                                                     | Sí                                                                     |
| Voz a texto por lotes     | `tools.media.audio` / comprensión de medios                                                   | Sí                                                                     |
| Voz a texto en streaming  | Voice Call `streaming.provider: "openai"`                                                     | Sí                                                                     |
| Voz realtime              | Voice Call `realtime.provider: "openai"` / Control UI Talk `talk.realtime.provider: "openai"` | Sí (requiere créditos de OpenAI Platform, no suscripción de Codex/ChatGPT) |
| Embeddings                | proveedor de embeddings de memoria                                                           | Sí                                                                     |

<Note>
  La voz Realtime de OpenAI (usada por `realtime.provider: "openai"` de Voice Call y
  Control UI Talk con `talk.realtime.provider: "openai"`) pasa por la
  **API Realtime de OpenAI Platform** pública, que se factura contra créditos de OpenAI
  Platform en lugar de la cuota de suscripción de Codex/ChatGPT. Una cuenta
  con OAuth de OpenAI en buen estado que ejecute modelos de chat respaldados por Codex sin problemas
  sigue necesitando un perfil de autenticación con clave de API de OpenAI o una clave de API de Platform con facturación de
  Platform financiada para voz Realtime.

Solución: recarga créditos de Platform en
[platform.openai.com/account/billing](https://platform.openai.com/account/billing)
para la organización que respalda tus credenciales de realtime. La voz Realtime acepta
el perfil de autenticación con clave de API `openai` creado por `openclaw onboard --auth-choice openai-api-key`,
una `OPENAI_API_KEY` de Platform configurada mediante `talk.realtime.providers.openai.apiKey`
para Control UI Talk, `plugins.entries.voice-call.config.realtime.providers.openai.apiKey`
para Voice Call, o la variable de entorno `OPENAI_API_KEY`. Los perfiles OAuth de OpenAI
todavía pueden ejecutar modelos de chat `openai/*` respaldados por Codex en la misma
instalación de OpenClaw, pero no configuran la voz Realtime.
</Note>

## Embeddings de memoria

OpenClaw puede usar OpenAI, o un endpoint de embeddings compatible con OpenAI, para la
indexación de `memory_search` y embeddings de consulta:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
        model: "text-embedding-3-small",
      },
    },
  },
}
```

Para endpoints compatibles con OpenAI que requieren etiquetas de embeddings asimétricas, establece
`queryInputType` y `documentInputType` en `memorySearch`. OpenClaw los reenvía
como campos de solicitud `input_type` específicos del proveedor: los embeddings de consulta usan
`queryInputType`; los fragmentos de memoria indexados y la indexación por lotes usan
`documentInputType`. Consulta la [referencia de configuración de memoria](/es/reference/memory-config#provider-specific-config) para ver el ejemplo completo.

## Primeros pasos

Elige tu método de autenticación preferido y sigue los pasos de configuración.

<Tabs>
  <Tab title="Clave de API (OpenAI Platform)">
    **Ideal para:** acceso directo a API y facturación basada en uso.

    <Steps>
      <Step title="Obtén tu clave de API">
        Crea o copia una clave de API desde el [panel de OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Ejecuta la incorporación">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        O pasa la clave directamente:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Verifica que el modelo esté disponible">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Resumen de ruta

    | Referencia de modelo   | Configuración de entorno de ejecución | Ruta                        | Autenticación    |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | omitido / proveedor/modelo `agentRuntime.id: "codex"` | Arnés de servidor de aplicaciones de Codex | Perfil de OpenAI compatible con Codex |
    | `openai/gpt-5.4-mini` | omitido / proveedor/modelo `agentRuntime.id: "codex"` | Arnés de servidor de aplicaciones de Codex | Perfil de OpenAI compatible con Codex |
    | `openai/gpt-5.5`      | proveedor/modelo `agentRuntime.id: "openclaw"`              | Entorno de ejecución integrado de OpenClaw | Perfil `openai` seleccionado |

    <Note>
    Los modelos de agente `openai/*` usan el arnés de servidor de aplicación de Codex. Para usar autenticación
    con clave de API en un modelo de agente, crea un perfil de clave de API compatible con Codex y ordénalo
    con `auth.order.openai`; `OPENAI_API_KEY` sigue siendo la alternativa directa para
    superficies de API de OpenAI que no son de agente. Ejecuta `openclaw doctor --fix` para migrar entradas antiguas
    de orden de autenticación de Codex heredadas.
    </Note>

    ### Ejemplo de configuración

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    Para probar el modelo Instant actual de ChatGPT desde la API de OpenAI, establece el modelo
    en `openai/chat-latest`:

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` es un alias móvil. OpenAI lo documenta como el modelo Instant más reciente
    usado en ChatGPT y recomienda `gpt-5.5` para uso de API en producción, así que
    mantén `openai/gpt-5.5` como valor predeterminado estable salvo que quieras explícitamente ese
    comportamiento de alias. Actualmente, el alias solo acepta verbosidad de texto `medium`, por lo que
    OpenClaw normaliza las anulaciones incompatibles de verbosidad de texto de OpenAI para este
    modelo.

    <Warning>
    OpenClaw **no** expone `gpt-5.3-codex-spark` en la ruta directa de clave de API de OpenAI. Solo está disponible mediante entradas del catálogo de suscripción de Codex cuando tu cuenta con sesión iniciada lo expone.
    </Warning>

  </Tab>

  <Tab title="Suscripción de Codex">
    **Ideal para:** usar tu suscripción de ChatGPT/Codex con ejecución nativa del servidor de aplicación de Codex en lugar de una clave de API separada. La nube de Codex requiere iniciar sesión en ChatGPT.

    <Steps>
      <Step title="Ejecutar OAuth de Codex">
        ```bash
        openclaw onboard --auth-choice openai
        ```

        O ejecuta OAuth directamente:

        ```bash
        openclaw models auth login --provider openai
        ```

        Para configuraciones sin interfaz o que no admiten bien callbacks, agrega `--device-code` para iniciar sesión con un flujo de código de dispositivo de ChatGPT en lugar del callback del navegador localhost:

        ```bash
        openclaw models auth login --provider openai --device-code
        ```
      </Step>
      <Step title="Usar la ruta canónica de modelo de OpenAI">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        No se requiere configuración en tiempo de ejecución para la ruta predeterminada. Los turnos de agente de OpenAI
        seleccionan automáticamente el runtime nativo de servidor de aplicación de Codex, y OpenClaw
        instala o repara el Plugin de Codex incluido cuando se elige esta ruta.
      </Step>
      <Step title="Verificar que la autenticación de Codex esté disponible">
        ```bash
        openclaw models list --provider openai
        ```

        Después de que el Gateway esté en ejecución, envía `/codex status` o `/codex models`
        en el chat para verificar el runtime nativo de servidor de aplicación.
      </Step>
    </Steps>

    ### Resumen de rutas

    | Ref. de modelo | Configuración de runtime | Ruta | Autenticación |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | omitida / proveedor/modelo `agentRuntime.id: "codex"` | Arnés nativo de servidor de aplicación de Codex | Inicio de sesión de Codex o perfil de autenticación `openai` ordenado |
    | `openai/gpt-5.5` | proveedor/modelo `agentRuntime.id: "openclaw"` | Runtime integrado de OpenClaw con transporte interno de autenticación de Codex | Perfil OAuth `openai` seleccionado |
    | ref. heredada de Codex GPT-5.5 | reparada por doctor | Ruta heredada reescrita a `openai/gpt-5.5` | Perfil OAuth de OpenAI migrado |
    | `codex-cli/gpt-5.5` | reparada por doctor | Ruta CLI heredada reescrita a `openai/gpt-5.5` | Autenticación de servidor de aplicación de Codex |

    <Warning>
    Prefiere `openai/gpt-5.5` para nueva configuración de agente respaldada por suscripción. Las referencias
    heredadas antiguas de Codex GPT son rutas heredadas de OpenClaw, no la ruta nativa del runtime de Codex;
    ejecuta `openclaw doctor --fix` cuando quieras migrarlas a referencias canónicas
    `openai/*`. `gpt-5.3-codex-spark` sigue limitado a cuentas cuyo
    catálogo de suscripción de Codex anuncia ese modelo; las referencias directas de clave de API de OpenAI y
    Azure para él siguen suprimidas.
    </Warning>

    <Note>
    El prefijo de modelo heredado de Codex es configuración heredada reparada por doctor. Para
    la configuración común de suscripción más runtime nativo, inicia sesión con autenticación de Codex
    pero mantén la ref. de modelo como `openai/gpt-5.5`. La nueva configuración debe poner el orden
    de autenticación de agente de OpenAI bajo `auth.order.openai`; doctor migra entradas antiguas
    de orden de autenticación de Codex heredadas.
    </Note>

    ### Ejemplo de configuración

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
        },
      },
    }
    ```

    Con una copia de seguridad de clave de API, mantén el modelo en `openai/gpt-5.5` y pon el
    orden de autenticación bajo `openai`. OpenClaw probará primero la suscripción y luego
    la clave de API, mientras permanece en el arnés de Codex:

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
        },
      },
      auth: {
        order: {
          openai: [
            "openai:user@example.com",
            "openai:api-key-backup",
          ],
        },
      },
    }
    ```

    <Note>
    El onboarding ya no importa material OAuth desde `~/.codex`. Inicia sesión con OAuth en navegador (predeterminado) o con el flujo de código de dispositivo anterior: OpenClaw administra las credenciales resultantes en su propio almacén de autenticación de agente.
    </Note>

    ### Comprobar y recuperar el enrutamiento OAuth de Codex

    Usa estos comandos para ver qué modelo, runtime y ruta de autenticación está usando tu agente
    predeterminado:

    ```bash
    openclaw models status
    openclaw models auth list --provider openai
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    Para un agente específico, agrega `--agent <id>`:

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai
    ```

    Si una configuración antigua todavía tiene refs. heredadas de Codex GPT o una fijación obsoleta de sesión de runtime de OpenAI
    sin configuración explícita de runtime, repárala:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    Si `models auth list --provider openai` no muestra ningún perfil utilizable, inicia
    sesión de nuevo:

    ```bash
    openclaw models auth login --provider openai
    openclaw models status --probe --probe-provider openai
    ```

    Usa `--profile-id` cuando quieras múltiples inicios de sesión OAuth de Codex en el mismo
    agente y más adelante quieras controlarlos mediante ordenamiento de autenticación o `/model ...@<profileId>`:

    ```bash
    openclaw models auth login --provider openai --profile-id openai:ritsuko
    openclaw models auth login --provider openai --profile-id openai:lain
    ```

    `openai/*` es la ruta de modelo para turnos de agente de OpenAI mediante Codex. Ejecuta
    `openclaw doctor --fix` para migrar ids de perfil de prefijo heredado de OpenAI Codex y
    entradas de orden antiguas antes de confiar en el ordenamiento de perfiles.

    ### Indicador de estado

    Chat `/status` muestra qué runtime de modelo está activo para la sesión actual.
    El arnés de servidor de aplicación de Codex incluido aparece como `Runtime: OpenAI Codex` para
    turnos de modelo de agente de OpenAI. Las fijaciones obsoletas de sesión de runtime de OpenAI se reparan a Codex salvo que
    la configuración fije explícitamente OpenClaw.

    ### Advertencia de doctor

    Si quedan refs. de modelo de Codex heredadas o fijaciones obsoletas de runtime de OpenAI en la configuración o
    en el estado de sesión, `openclaw doctor --fix` las reescribe a `openai/*` con el
    runtime de Codex salvo que OpenClaw esté configurado explícitamente.

    ### Límite de ventana de contexto

    OpenClaw trata los metadatos del modelo y el límite de contexto del runtime como valores separados.

    Para `openai/gpt-5.5` mediante el catálogo OAuth de Codex:

    - `contextWindow` nativo: `1000000`
    - Límite predeterminado `contextTokens` del runtime: `272000`

    En la práctica, el límite predeterminado más pequeño tiene mejores características de latencia y calidad. Anúlalo con `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          openai: {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    Usa `contextWindow` para declarar metadatos nativos del modelo. Usa `contextTokens` para limitar el presupuesto de contexto del runtime.
    </Note>

    ### Recuperación del catálogo

    OpenClaw usa metadatos del catálogo upstream de Codex para `gpt-5.5` cuando están
    presentes. Si el descubrimiento en vivo de Codex omite la fila `gpt-5.5` mientras
    la cuenta está autenticada, OpenClaw sintetiza esa fila de modelo OAuth para que
    cron, subagente y ejecuciones configuradas de modelo predeterminado no fallen con
    `Unknown model`.

  </Tab>
</Tabs>

## Autenticación nativa del servidor de aplicación de Codex

El arnés nativo de servidor de aplicación de Codex usa refs. de modelo `openai/*` más configuración de
runtime omitida o proveedor/modelo `agentRuntime.id: "codex"`, pero su autenticación
sigue estando basada en cuenta. OpenClaw selecciona la autenticación en este orden:

1. Perfiles de autenticación de OpenAI ordenados para el agente, preferiblemente bajo
   `auth.order.openai`. Ejecuta `openclaw doctor --fix` para migrar ids antiguos
   de perfil de autenticación de Codex heredados y el orden de autenticación de Codex heredado.
2. La cuenta existente del servidor de aplicación, como una sesión local de Codex CLI en ChatGPT.
3. Solo para lanzamientos locales de servidor de aplicación por stdio, `CODEX_API_KEY`, luego
   `OPENAI_API_KEY`, cuando el servidor de aplicación informa que no hay cuenta y aún requiere
   autenticación de OpenAI.

Eso significa que un inicio de sesión local de suscripción de ChatGPT/Codex no se reemplaza solo
porque el proceso del Gateway también tenga `OPENAI_API_KEY` para modelos directos de OpenAI
o embeddings. La alternativa de clave de API por env solo es la ruta local stdio sin cuenta; no
se envía a conexiones WebSocket del servidor de aplicación. Cuando se selecciona un perfil de Codex
de estilo suscripción, OpenClaw también mantiene `CODEX_API_KEY` y `OPENAI_API_KEY`
fuera del proceso hijo stdio del servidor de aplicación generado y envía las credenciales seleccionadas
mediante el RPC de inicio de sesión del servidor de aplicación. Cuando ese perfil de suscripción queda bloqueado por un
límite de uso de Codex, OpenClaw puede rotar al siguiente perfil ordenado de clave de API `openai:*`
sin cambiar el modelo seleccionado ni salir del arnés de Codex. Una vez que pasa la hora de restablecimiento de la suscripción, el perfil de suscripción
vuelve a ser elegible.

## Generación de imágenes

El Plugin `openai` incluido registra la generación de imágenes mediante la herramienta `image_generate`.
Admite tanto generación de imágenes con clave de API de OpenAI como generación de imágenes con OAuth de Codex
mediante la misma ref. de modelo `openai/gpt-image-2`.

| Capacidad                 | Clave de API de OpenAI             | OAuth de Codex                       |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Ref. de modelo            | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Autenticación             | `OPENAI_API_KEY`                   | Inicio de sesión OAuth de OpenAI Codex |
| Transporte                | API Images de OpenAI               | Backend Responses de Codex           |
| Imágenes máximas por solicitud | 4                              | 4                                    |
| Modo de edición           | Habilitado (hasta 5 imágenes de referencia) | Habilitado (hasta 5 imágenes de referencia) |
| Anulaciones de tamaño     | Admitidas, incluidos tamaños 2K/4K | Admitidas, incluidos tamaños 2K/4K   |
| Relación de aspecto / resolución | No se reenvía a la API Images de OpenAI | Se asigna a un tamaño admitido cuando es seguro |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
Consulta [Generación de imágenes](/es/tools/image-generation) para ver los parámetros compartidos de la herramienta, la selección de proveedor y el comportamiento de conmutación por error.
</Note>

`gpt-image-2` es el valor predeterminado tanto para la generación de texto a imagen de OpenAI como para la edición de imágenes.
`gpt-image-1.5`, `gpt-image-1` y `gpt-image-1-mini` siguen siendo utilizables como
anulaciones explícitas de modelo. Usa `openai/gpt-image-1.5` para salida PNG/WebP
con fondo transparente; la API actual de `gpt-image-2` rechaza
`background: "transparent"`.

Para una solicitud con fondo transparente, los agentes deben llamar a `image_generate` con
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` o `"webp"`, y
`background: "transparent"`; la opción de proveedor anterior `openai.background`
todavía se acepta. OpenClaw también protege las rutas públicas de OAuth de OpenAI y
OpenAI Codex reescribiendo las solicitudes transparentes predeterminadas de
`openai/gpt-image-2` a `gpt-image-1.5`; Azure y los endpoints personalizados
compatibles con OpenAI conservan sus nombres de implementación/modelo configurados.

La misma configuración está expuesta para ejecuciones de CLI sin interfaz:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

Usa las mismas marcas `--output-format` y `--background` con
`openclaw infer image edit` al iniciar desde un archivo de entrada.
`--openai-background` sigue disponible como alias específico de OpenAI.
Usa `--quality low|medium|high|auto` cuando necesites controlar la calidad y el
costo de OpenAI Images. Usa `--openai-moderation low|auto` para pasar la sugerencia
de moderación específica del proveedor de OpenAI desde `image generate` o `image edit`.

Para instalaciones OAuth de ChatGPT/Codex, conserva la misma referencia `openai/gpt-image-2`. Cuando se configura un perfil OAuth de
`openai`, OpenClaw resuelve ese token de acceso OAuth almacenado y envía las
solicitudes de imagen a través del backend Codex Responses. No intenta primero
`OPENAI_API_KEY` ni recurre silenciosamente a una clave de API para esa solicitud.
Configura `models.providers.openai` explícitamente con una clave de API,
una URL base personalizada o un endpoint de Azure cuando quieras usar en su lugar
la ruta directa de la API OpenAI Images.
Si ese endpoint de imagen personalizado está en una dirección LAN/privada de confianza, configura también
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw mantiene
bloqueados los endpoints de imagen privados/internos compatibles con OpenAI salvo que
esta aceptación explícita esté presente.

Generar:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Generar un PNG transparente:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

Editar:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Generación de video

El Plugin `openai` incluido registra la generación de video mediante la herramienta `video_generate`.

| Capacidad | Valor |
| ---------------- | --------------------------------------------------------------------------------- |
| Modelo predeterminado | `openai/sora-2` |
| Modos | Texto a video, imagen a video, edición de un solo video |
| Entradas de referencia | 1 imagen o 1 video |
| Sobrescrituras de tamaño | Admitidas para texto a video e imagen a video |
| Otras sobrescrituras | `aspectRatio`, `resolution`, `audio`, `watermark` se ignoran con una advertencia de herramienta |

Las solicitudes de imagen a video de OpenAI usan `POST /v1/videos` con una
`input_reference` de imagen. Las ediciones de un solo video usan `POST /v1/videos/edits` con el
video cargado en el campo `video`.

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
Consulta [Generación de video](/es/tools/video-generation) para ver los parámetros compartidos de la herramienta, la selección de proveedor y el comportamiento de conmutación por error.
</Note>

## Contribución de prompt de GPT-5

OpenClaw agrega una contribución compartida de prompt de GPT-5 para ejecuciones de la familia GPT-5 en superficies de prompt ensambladas por OpenClaw. Se aplica por id de modelo, por lo que las rutas de OpenClaw/proveedor como referencias heredadas previas a reparación (referencia heredada de Codex GPT-5.5), `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` y otras referencias compatibles de GPT-5 reciben la misma capa. Los modelos GPT-4.x anteriores no la reciben.

El arnés nativo de Codex incluido no recibe esta capa GPT-5 de OpenClaw a través de las instrucciones de desarrollador del servidor de aplicaciones de Codex. Codex nativo conserva el comportamiento base, de modelo y de documentación del proyecto propio de Codex, mientras OpenClaw desactiva la personalidad integrada de Codex para hilos nativos, de modo que los archivos de personalidad del espacio de trabajo del agente sigan siendo autoritativos. OpenClaw solo contribuye contexto de runtime, como entrega por canal, herramientas dinámicas de OpenClaw, delegación ACP, contexto del espacio de trabajo y Skills de OpenClaw.

La contribución de GPT-5 agrega un contrato de comportamiento etiquetado para persistencia de persona, seguridad de ejecución, disciplina de herramientas, forma de salida, comprobaciones de finalización y verificación en prompts ensamblados por OpenClaw que coincidan. El comportamiento de respuesta específico del canal y de mensajes silenciosos permanece en el prompt de sistema compartido de OpenClaw y en la política de entrega saliente. La capa de estilo de interacción amigable está separada y es configurable.

| Valor | Efecto |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (predeterminado) | Habilita la capa de estilo de interacción amigable |
| `"on"` | Alias de `"friendly"` |
| `"off"` | Deshabilita solo la capa de estilo amigable |

<Tabs>
  <Tab title="Configuración">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
Los valores no distinguen mayúsculas y minúsculas en runtime, por lo que `"Off"` y `"off"` deshabilitan la capa de estilo amigable.
</Tip>

<Note>
El valor heredado `plugins.entries.openai.config.personality` todavía se lee como fallback de compatibilidad cuando la configuración compartida `agents.defaults.promptOverlays.gpt5.personality` no está definida.
</Note>

## Voz y habla

<AccordionGroup>
  <Accordion title="Síntesis de voz (TTS)">
    El Plugin `openai` incluido registra la síntesis de voz para la superficie `messages.tts`.

    | Configuración | Ruta de configuración | Predeterminado |
    |---------|------------|---------|
    | Modelo | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Voz | `messages.tts.providers.openai.speakerVoice` | `coral` |
    | Velocidad | `messages.tts.providers.openai.speed` | (sin definir) |
    | Instrucciones | `messages.tts.providers.openai.instructions` | (sin definir, solo `gpt-4o-mini-tts`) |
    | Formato | `messages.tts.providers.openai.responseFormat` | `opus` para notas de voz, `mp3` para archivos |
    | Clave de API | `messages.tts.providers.openai.apiKey` | Recurre a `OPENAI_API_KEY` |
    | URL base | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | Cuerpo adicional | `messages.tts.providers.openai.extraBody` / `extra_body` | (sin definir) |

    Modelos disponibles: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Voces disponibles: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` se combina en el JSON de solicitud `/audio/speech` después de los campos generados por OpenClaw, así que úsalo para endpoints compatibles con OpenAI que requieren claves adicionales como `lang`. Las claves de prototipo se ignoran.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", speakerVoice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    Configura `OPENAI_TTS_BASE_URL` para sobrescribir la URL base de TTS sin afectar el endpoint de la API de chat. OpenAI TTS y la voz Realtime se configuran ambos mediante una clave de API de OpenAI Platform; las instalaciones solo con OAuth todavía pueden usar modelos de chat respaldados por Codex, pero no respuesta hablada en vivo de OpenAI.
    </Note>

  </Accordion>

  <Accordion title="Voz a texto">
    El Plugin `openai` incluido registra voz a texto por lotes mediante
    la superficie de transcripción de comprensión de medios de OpenClaw.

    - Modelo predeterminado: `gpt-4o-transcribe`
    - Endpoint: REST de OpenAI `/v1/audio/transcriptions`
    - Ruta de entrada: carga de archivo de audio multipart
    - Compatible con OpenClaw en cualquier lugar donde la transcripción de audio entrante use
      `tools.media.audio`, incluidos segmentos de canales de voz de Discord y archivos adjuntos
      de audio de canal

    Para forzar OpenAI para la transcripción de audio entrante:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    Las sugerencias de idioma y prompt se reenvían a OpenAI cuando las proporciona la
    configuración compartida de medios de audio o la solicitud de transcripción por llamada.

  </Accordion>

  <Accordion title="Transcripción Realtime">
    El Plugin `openai` incluido registra transcripción Realtime para el Plugin Voice Call.

    | Configuración | Ruta de configuración | Predeterminado |
    |---------|------------|---------|
    | Modelo | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Idioma | `...openai.language` | (sin definir) |
    | Prompt | `...openai.prompt` | (sin definir) |
    | Duración del silencio | `...openai.silenceDurationMs` | `800` |
    | Umbral VAD | `...openai.vadThreshold` | `0.5` |
    | Autenticación | `...openai.apiKey`, `OPENAI_API_KEY` u OAuth de `openai` | Las claves de API se conectan directamente; OAuth emite un secreto de cliente de transcripción Realtime |

    <Note>
    Usa una conexión WebSocket a `wss://api.openai.com/v1/realtime` con audio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Cuando solo está configurado OAuth de `openai`, el Gateway emite un secreto de cliente efímero de transcripción Realtime antes de abrir el WebSocket. Este proveedor de streaming es para la ruta de transcripción Realtime de Voice Call; actualmente la voz de Discord graba segmentos cortos y usa en su lugar la ruta de transcripción por lotes `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Voz Realtime">
    El Plugin `openai` incluido registra voz Realtime para el Plugin Voice Call.

    | Configuración | Ruta de configuración | Predeterminado |
    |---------|------------|---------|
    | Modelo | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-2` |
    | Voz | `...openai.voice` | `alloy` |
    | Temperatura (puente de implementación de Azure) | `...openai.temperature` | `0.8` |
    | Umbral VAD | `...openai.vadThreshold` | `0.5` |
    | Duración del silencio | `...openai.silenceDurationMs` | `500` |
    | Relleno de prefijo | `...openai.prefixPaddingMs` | `300` |
    | Esfuerzo de razonamiento | `...openai.reasoningEffort` | (sin definir) |
    | Autenticación | Perfil de autenticación con clave de API de `openai`, `...openai.apiKey` u `OPENAI_API_KEY` | Se requiere clave de API de OpenAI Platform; OpenAI OAuth no configura voz Realtime |

    Voces Realtime integradas disponibles para `gpt-realtime-2`: `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`.
    OpenAI recomienda `marin` y `cedar` para obtener la mejor calidad Realtime. Este
    es un conjunto separado de las voces de texto a voz anteriores; no asumas que una voz TTS
    como `fable`, `nova` u `onyx` sea válida para sesiones Realtime.

    <Note>
    Los puentes Realtime de backend de OpenAI usan la forma de sesión WebSocket Realtime GA, que no acepta `session.temperature`. Las implementaciones de Azure OpenAI siguen disponibles mediante `azureEndpoint` y `azureDeployment`, y conservan la forma de sesión compatible con la implementación. Admite llamadas de herramientas bidireccionales y audio G.711 u-law.
    </Note>

    <Note>
    La voz Realtime se selecciona cuando se crea la sesión. OpenAI permite que la mayoría
    de los campos de sesión cambien después, pero la voz no se puede cambiar una vez que el
    modelo ha emitido audio en esa sesión. OpenClaw actualmente expone los ids de voz
    Realtime integrados como cadenas.
    </Note>

    <Note>
    Control UI Talk usa sesiones en tiempo real del navegador de OpenAI con un secreto de cliente efímero
    acuñado por Gateway y un intercambio SDP WebRTC directo del navegador contra la
    API Realtime de OpenAI. Gateway acuña ese secreto de cliente con el perfil de autenticación
    de clave de API `openai` seleccionado o la clave de API configurada de OpenAI Platform. El
    retransmisor de Gateway y los puentes WebSocket en tiempo real del backend de Voice Call usan la misma
    ruta de autenticación solo con clave de API para los endpoints nativos de OpenAI. La verificación en vivo
    de mantenedores está disponible con
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    las fases de OpenAI verifican tanto el puente WebSocket del backend como el intercambio SDP
    WebRTC del navegador sin registrar secretos.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoints de Azure OpenAI

El proveedor `openai` incluido puede apuntar a un recurso de Azure OpenAI para la generación
de imágenes sobrescribiendo la URL base. En la ruta de generación de imágenes, OpenClaw
detecta nombres de host de Azure en `models.providers.openai.baseUrl` y cambia automáticamente
a la forma de solicitud de Azure.

<Note>
La voz en tiempo real usa una ruta de configuración separada
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
y no se ve afectada por `models.providers.openai.baseUrl`. Consulta el acordeón **Voz
en tiempo real** en [Voz y habla](#voice-and-speech) para ver su configuración de Azure.
</Note>

Usa Azure OpenAI cuando:

- Ya tengas una suscripción, cuota o acuerdo empresarial de Azure OpenAI
- Necesites residencia regional de datos o controles de cumplimiento que ofrece Azure
- Quieras mantener el tráfico dentro de un arrendamiento existente de Azure

### Configuración

Para la generación de imágenes de Azure mediante el proveedor `openai` incluido, apunta
`models.providers.openai.baseUrl` a tu recurso de Azure y configura `apiKey` con
la clave de Azure OpenAI (no una clave de OpenAI Platform):

```json5
{
  models: {
    providers: {
      openai: {
        baseUrl: "https://<your-resource>.openai.azure.com",
        apiKey: "<azure-openai-api-key>",
      },
    },
  },
}
```

OpenClaw reconoce estos sufijos de host de Azure para la ruta de generación de imágenes
de Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Para solicitudes de generación de imágenes en un host de Azure reconocido, OpenClaw:

- Envía el encabezado `api-key` en lugar de `Authorization: Bearer`
- Usa rutas con alcance de implementación (`/openai/deployments/{deployment}/...`)
- Añade `?api-version=...` a cada solicitud
- Usa un tiempo de espera de solicitud predeterminado de 600 s para llamadas de generación de imágenes de Azure.
  Los valores `timeoutMs` por llamada siguen sobrescribiendo este valor predeterminado.

Otras URL base (OpenAI público, proxies compatibles con OpenAI) mantienen la forma estándar
de solicitud de imagen de OpenAI.

<Note>
El enrutamiento de Azure para la ruta de generación de imágenes del proveedor `openai` requiere
OpenClaw 2026.4.22 o posterior. Las versiones anteriores tratan cualquier
`openai.baseUrl` personalizado como el endpoint público de OpenAI y fallarán contra implementaciones
de imagen de Azure.
</Note>

### Versión de API

Configura `AZURE_OPENAI_API_VERSION` para fijar una versión preliminar o GA específica de Azure
para la ruta de generación de imágenes de Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

El valor predeterminado es `2024-12-01-preview` cuando la variable no está configurada.

### Los nombres de modelo son nombres de implementación

Azure OpenAI vincula modelos a implementaciones. Para solicitudes de generación de imágenes de Azure
enrutadas mediante el proveedor `openai` incluido, el campo `model` en OpenClaw
debe ser el **nombre de implementación de Azure** que configuraste en el portal de Azure, no
el id público del modelo de OpenAI.

Si creas una implementación llamada `gpt-image-2-prod` que sirve `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

La misma regla de nombre de implementación se aplica a las llamadas de generación de imágenes enrutadas mediante
el proveedor `openai` incluido.

### Disponibilidad regional

La generación de imágenes de Azure está disponible actualmente solo en un subconjunto de regiones
(por ejemplo `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Consulta la lista actual de regiones de Microsoft antes de crear una
implementación y confirma que el modelo específico se ofrezca en tu región.

### Diferencias de parámetros

Azure OpenAI y OpenAI público no siempre aceptan los mismos parámetros de imagen.
Azure puede rechazar opciones que OpenAI público permite (por ejemplo, ciertos
valores de `background` en `gpt-image-2`) o exponerlas solo en versiones específicas
del modelo. Estas diferencias provienen de Azure y del modelo subyacente, no de
OpenClaw. Si una solicitud de Azure falla con un error de validación, comprueba el
conjunto de parámetros admitido por tu implementación y versión de API específicas en el
portal de Azure.

<Note>
Azure OpenAI usa transporte nativo y comportamiento de compatibilidad, pero no recibe
los encabezados de atribución ocultos de OpenClaw; consulta el acordeón **Rutas nativas frente a rutas compatibles con OpenAI**
en [Configuración avanzada](#advanced-configuration).

Para tráfico de chat o Responses en Azure (más allá de la generación de imágenes), usa el
flujo de incorporación o una configuración dedicada de proveedor de Azure; `openai.baseUrl` por sí solo
no adopta la forma de API/autenticación de Azure. Existe un proveedor
`azure-openai-responses/*` separado; consulta el acordeón Compaction del lado del servidor abajo.
</Note>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Transporte (WebSocket frente a SSE)">
    OpenClaw usa WebSocket primero con alternativa SSE (`"auto"`) para `openai/*`.

    En modo `"auto"`, OpenClaw:
    - Reintenta un fallo temprano de WebSocket una vez antes de recurrir a SSE
    - Después de un fallo, marca WebSocket como degradado durante unos 60 segundos y usa SSE durante el enfriamiento
    - Adjunta encabezados estables de identidad de sesión y turno para reintentos y reconexiones
    - Normaliza contadores de uso (`input_tokens` / `prompt_tokens`) entre variantes de transporte

    | Valor | Comportamiento |
    |-------|----------|
    | `"auto"` (predeterminado) | WebSocket primero, alternativa SSE |
    | `"sse"` | Forzar solo SSE |
    | `"websocket"` | Forzar solo WebSocket |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    Documentación relacionada de OpenAI:
    - [API Realtime con WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Respuestas de API en streaming (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Modo rápido">
    OpenClaw expone un conmutador compartido de modo rápido para `openai/*`:

    - **Chat/UI:** `/fast status|auto|on|off`
    - **Configuración:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Cuando está activado, OpenClaw asigna el modo rápido al procesamiento prioritario de OpenAI (`service_tier = "priority"`). Los valores existentes de `service_tier` se conservan, y el modo rápido no reescribe `reasoning` ni `text.verbosity`. `fastMode: "auto"` inicia nuevas llamadas de modelo en modo rápido hasta el corte automático; después, inicia llamadas posteriores de reintento, alternativa, resultado de herramienta o continuación sin modo rápido. El corte predeterminado es de 60 segundos; configura `params.fastAutoOnSeconds` en el modelo activo para cambiarlo.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: "auto", fastAutoOnSeconds: 30 } },
          },
        },
      },
    }
    ```

    <Note>
    Las anulaciones de sesión prevalecen sobre la configuración. Borrar la anulación de sesión en la UI de Sessions devuelve la sesión al valor predeterminado configurado.
    </Note>

  </Accordion>

  <Accordion title="Procesamiento prioritario (service_tier)">
    La API de OpenAI expone el procesamiento prioritario mediante `service_tier`. Configúralo por modelo en OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Valores admitidos: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` solo se reenvía a endpoints nativos de OpenAI (`api.openai.com`) y endpoints nativos de Codex (`chatgpt.com/backend-api`). Si enrutas cualquiera de los proveedores mediante un proxy, OpenClaw deja `service_tier` intacto.
    </Warning>

  </Accordion>

  <Accordion title="Compaction del lado del servidor (API Responses)">
    Para modelos directos de OpenAI Responses (`openai/*` en `api.openai.com`), el envoltorio de flujo de OpenClaw del Plugin de OpenAI habilita automáticamente la Compaction del lado del servidor:

    - Fuerza `store: true` (salvo que la compatibilidad del modelo configure `supportsStore: false`)
    - Inyecta `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` predeterminado: 70 % de `contextWindow` (o `80000` cuando no esté disponible)

    Esto se aplica a la ruta de runtime integrada de OpenClaw y a los hooks del proveedor OpenAI usados por ejecuciones integradas. El arnés nativo de servidor de aplicación Codex gestiona su propio contexto mediante Codex y se configura mediante la ruta de agente predeterminada de OpenAI o la política de runtime de proveedor/modelo.

    <Tabs>
      <Tab title="Habilitar explícitamente">
        Útil para endpoints compatibles como Azure OpenAI Responses:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.5": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Umbral personalizado">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: {
                    responsesServerCompaction: true,
                    responsesCompactThreshold: 120000,
                  },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Deshabilitar">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    `responsesServerCompaction` solo controla la inyección de `context_management`. Los modelos directos de OpenAI Responses siguen forzando `store: true` salvo que la compatibilidad configure `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Modo GPT agentic estricto">
    Para ejecuciones de la familia GPT-5 en `openai/*`, OpenClaw puede usar un contrato de ejecución integrada más estricto:

    ```json5
    {
      agents: {
        defaults: {
          embeddedAgent: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    Con `strict-agentic`, OpenClaw:
    - Habilita automáticamente `update_plan` para trabajo sustancial
    - Reintenta turnos estructuralmente vacíos o solo de razonamiento con una continuación de respuesta visible
    - Usa eventos explícitos de plan del arnés cuando el arnés seleccionado los proporciona

    OpenClaw no clasifica la prosa del asistente para decidir si un turno es un plan, una actualización de progreso o una respuesta final.

    <Note>
    Limitado solo a ejecuciones de la familia GPT-5 de OpenAI y Codex. Otros proveedores y familias de modelos anteriores mantienen el comportamiento predeterminado.
    </Note>

  </Accordion>

  <Accordion title="Rutas nativas frente a rutas compatibles con OpenAI">
    OpenClaw trata los endpoints directos de OpenAI, Codex y Azure OpenAI de forma diferente a los proxies `/v1` genéricos compatibles con OpenAI:

    **Rutas nativas** (`openai/*`, Azure OpenAI):
    - Mantienen `reasoning: { effort: "none" }` solo para modelos que admiten el esfuerzo `none` de OpenAI
    - Omiten el razonamiento deshabilitado para modelos o proxies que rechazan `reasoning.effort: "none"`
    - Configuran los esquemas de herramientas en modo estricto de forma predeterminada
    - Adjuntan encabezados de atribución ocultos solo en hosts nativos verificados
    - Mantienen la forma de solicitud exclusiva de OpenAI (`service_tier`, `store`, compatibilidad de razonamiento, pistas de caché de prompts)

    **Rutas de proxy/compatibles:**
    - Usar un comportamiento de compatibilidad más flexible
    - Eliminar `store` de Completions de las cargas útiles `openai-completions` no nativas
    - Aceptar JSON de paso avanzado `params.extra_body`/`params.extraBody` para proxies de Completions compatibles con OpenAI
    - Aceptar `params.chat_template_kwargs` para proxies de Completions compatibles con OpenAI como vLLM
    - No forzar esquemas de herramientas estrictos ni encabezados solo nativos

    Azure OpenAI usa transporte nativo y comportamiento de compatibilidad, pero no recibe los encabezados de atribución ocultos.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Generación de imágenes" href="/es/tools/image-generation" icon="image">
    Parámetros compartidos de herramientas de imagen y selección de proveedor.
  </Card>
  <Card title="Generación de video" href="/es/tools/video-generation" icon="video">
    Parámetros compartidos de herramientas de video y selección de proveedor.
  </Card>
  <Card title="OAuth y autenticación" href="/es/gateway/authentication" icon="key">
    Detalles de autenticación y reglas de reutilización de credenciales.
  </Card>
</CardGroup>
