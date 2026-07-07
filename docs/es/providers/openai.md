---
read_when:
    - Quieres usar modelos de OpenAI en OpenClaw
    - Quieres autenticación por suscripción de Codex en lugar de claves de API
    - Necesitas un comportamiento de ejecución de agentes GPT-5 más estricto
summary: Usa OpenAI mediante claves de API o una suscripción a Codex en OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-07-06T21:53:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 70d1f583ce1ddaed9a4f394847e697a0b1ff21d5fd90ba7e0b837206db52659b
    source_path: providers/openai.md
    workflow: 16
---

OpenClaw usa un único id de proveedor, `openai`, tanto para la autenticación directa con clave de API como para la autenticación de suscripción de ChatGPT/Codex. `openai/*` es la ruta de modelo canónica. Los turnos de agente embebidos en `openai/*` se ejecutan de forma predeterminada mediante el runtime del servidor de aplicaciones Codex incluido; la autenticación directa con clave de API sigue disponible para superficies de OpenAI que no son de agente (imágenes, video, embeddings, voz, realtime) y como ruta de compatibilidad explícita para turnos de agente.

- **Modelos de agente** - `openai/*` mediante el runtime de Codex. Inicia sesión con autenticación de Codex para usar la suscripción de ChatGPT/Codex, o configura un perfil de autenticación con clave de API cuando quieras facturación basada en clave.
- **API de OpenAI que no son de agente** - acceso directo a OpenAI Platform, facturado por uso, mediante `OPENAI_API_KEY` o un perfil de autenticación con clave de API `openai`.
- **Configuración heredada** - las referencias de modelos Codex e ids de perfil antiguos se reparan a `openai/*` con `openclaw doctor --fix`.

OpenAI admite explícitamente el uso de OAuth de suscripción en herramientas y flujos de trabajo externos como OpenClaw.

## Seguimiento de uso y costos

OpenClaw mantiene separadas la cuota de suscripción y la facturación de la API de Platform:

- OAuth de ChatGPT/Codex muestra el plan de suscripción, las ventanas de cuota y el saldo de créditos.
- `OPENAI_ADMIN_KEY` muestra 30 días de costo de organización y uso de completions reportados por el proveedor en **Uso** de Control UI, incluidos gasto diario, totales de solicitudes/tokens, modelos principales y categorías de costo.
- `OPENAI_PROJECT_ID` limita opcionalmente el historial de la API de administración a un proyecto.
- OpenClaw nunca envía `OPENAI_API_KEY` ni un perfil de inferencia `openai` a las API de organización; esas credenciales pueden pertenecer a endpoints personalizados, de Azure o locales del agente.

Una clave de administración explícita tiene prioridad sobre OAuth. El historial reportado por el proveedor no se combina con el costo estimado derivado de la sesión de OpenClaw; puede incluir actividad de API de otros clientes y ajustes de facturación del lado del proveedor.

La documentación del [panel de uso de API](https://help.openai.com/en/articles/10478918) de OpenAI describe los requisitos de propietario de organización y de permiso explícito del panel de uso para los datos de uso.

Proveedor, modelo, runtime y canal son capas separadas. Si esas etiquetas se están mezclando, lee [Runtimes de agente](/es/concepts/agent-runtimes) antes de cambiar la configuración.

## Elección rápida

| Objetivo                                          | Usar                                                               | Notas                                                                   |
| ------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| Suscripción ChatGPT/Codex, runtime nativo de Codex | `openai/gpt-5.5`                                                   | Configuración predeterminada. Inicia sesión con autenticación de Codex. |
| Vista previa limitada de GPT-5.6                 | `openai/gpt-5.6-sol`, `-terra`, o `-luna`                          | Requiere una organización de API aprobada por OpenAI o una entrada en la lista de permitidos del workspace de Codex. |
| Facturación directa con clave de API para turnos de agente | `openai/gpt-5.5` más un perfil de autenticación con clave de API ordenado | Define `auth.order.openai` para colocar el perfil de clave después de la autenticación de suscripción. |
| Facturación directa con clave de API, runtime explícito de OpenClaw | `openai/gpt-5.5` más provider/model `agentRuntime.id: "openclaw"` | Selecciona un perfil normal de clave de API `openai`. |
| Alias del último modelo ChatGPT Instant          | `openai/chat-latest`                                               | Solo clave de API directa; alias móvil, no el valor predeterminado estable. |
| Generación o edición de imágenes                 | `openai/gpt-image-2`                                               | Funciona con `OPENAI_API_KEY` u OAuth de Codex.                         |
| Imágenes con fondo transparente                  | `openai/gpt-image-1.5`                                             | Define `outputFormat` como `png` o `webp` y `background=transparent`.   |

## Mapa de nombres

| Nombre que ves                          | Capa              | Significado                                                                              |
| --------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------- |
| `openai`                                | Prefijo de proveedor | Ruta canónica de modelo de OpenAI; los turnos de agente usan por defecto el runtime de Codex. |
| `codex` plugin                          | Plugin            | Plugin incluido que proporciona el runtime nativo del servidor de aplicaciones Codex y controles de chat `/codex`. |
| provider/model `agentRuntime.id: codex` | Runtime de agente | Fuerza el arnés nativo del servidor de aplicaciones Codex para los turnos embebidos coincidentes. |
| `/codex ...`                            | Conjunto de comandos de chat | Vincula/controla hilos del servidor de aplicaciones Codex desde una conversación. |
| `runtime: "acp", agentId: "codex"`      | Ruta de sesión ACP | Ruta de reserva explícita que ejecuta Codex mediante ACP/acpx. |

`openclaw doctor --fix` migra referencias de modelos Codex heredadas, ids de perfil de autenticación Codex heredados y entradas de orden de autenticación Codex heredadas a la ruta canónica `openai`. Usa `auth.order.openai` para la nueva configuración de orden de autenticación.

<Note>
GPT-5.5 está disponible tanto mediante acceso directo con clave de API de OpenAI Platform como mediante rutas de suscripción/OAuth. Para suscripción de ChatGPT/Codex con ejecución nativa de Codex, usa `openai/gpt-5.5` y deja la configuración de runtime sin definir; eso ya selecciona el arnés de Codex. Usa un perfil de autenticación con clave de API solo cuando quieras autenticación directa con clave de API para un modelo de agente.
</Note>

## Vista previa limitada de GPT-5.6

OpenClaw reconoce tres ids públicos de modelo GPT-5.6: `openai/gpt-5.6-sol`, `openai/gpt-5.6-terra` y `openai/gpt-5.6-luna`. Los tres exponen razonamiento `xhigh` y `max` en el catálogo actual. OpenAI describe Sol como el nivel insignia, Terra como el nivel equilibrado y Luna como el nivel rápido y de menor costo. Consulta el [anuncio de lanzamiento de GPT-5.6](https://openai.com/index/previewing-gpt-5-6-sol/) y la [guía de acceso a la vista previa](https://help.openai.com/en/articles/20001325-a-preview-of-gpt-5-6-sol-terra-and-luna).

El acceso está en lista de permitidos durante la vista previa y se puede conceder por separado para la API y Codex; un plan de pago de ChatGPT por sí solo no concede acceso. OpenClaw mantiene `openai/gpt-5.5` como valor predeterminado y no trata de forma especial el error de acceso, por lo que seleccionar una ref de GPT-5.6 sin acceso muestra directamente el error upstream en lugar de volver silenciosamente a otro modelo.

<Note>
Los turnos de modelo de agente en `openai/*` requieren de forma predeterminada el plugin incluido del servidor de aplicaciones Codex. La configuración explícita de runtime de OpenClaw sigue disponible como ruta de compatibilidad opcional: cuando OpenClaw se selecciona explícitamente con un perfil OAuth `openai`, la ref de modelo permanece como `openai/*`, pero las solicitudes se enrutan internamente mediante el transporte de autenticación Codex. Ejecuta `openclaw doctor --fix` para reparar referencias de modelos Codex heredadas obsoletas, refs `codex-cli/*` o pins antiguos de sesión de runtime que no se definieron mediante configuración explícita de runtime.
</Note>

## Cobertura de funciones de OpenClaw

| Capacidad de OpenAI       | Superficie de OpenClaw                                                                        | Estado                                                          |
| ------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Chat / Responses          | proveedor de modelo `openai/<model>`                                                         | Sí                                                              |
| Modelos de suscripción Codex | `openai/<model>` con OAuth de OpenAI                                                       | Sí                                                              |
| Refs de modelos Codex heredadas | refs de modelos Codex antiguas, `codex-cli/<model>`                                    | Reparado por doctor a `openai/<model>`                          |
| Arnés del servidor de aplicaciones Codex | `openai/<model>` con runtime sin definir, o provider/model `agentRuntime.id: codex` | Sí                                                              |
| Búsqueda web del lado del servidor | Herramienta nativa OpenAI Responses                                                  | Sí, cuando la búsqueda web está habilitada y no hay otro proveedor fijado |
| Imágenes                  | `image_generate`                                                                              | Sí                                                              |
| Videos                    | `video_generate`                                                                              | Sí                                                              |
| Texto a voz               | `messages.tts.provider: "openai"` / `tts`                                                     | Sí                                                              |
| Voz a texto por lotes     | `tools.media.audio` / comprensión de medios                                                   | Sí                                                              |
| Voz a texto en streaming  | Voice Call `streaming.provider: "openai"`                                                     | Sí                                                              |
| Voz realtime              | Voice Call `realtime.provider: "openai"` / Control UI Talk `talk.realtime.provider: "openai"` | Sí (clave de API de OpenAI u OAuth de Codex)                    |
| Embeddings                | proveedor de embeddings de memoria                                                           | Sí                                                              |

<Note>
La voz OpenAI Realtime pasa por la **API Realtime de OpenAI Platform** pública. Acepta una clave de API de Platform o un perfil OAuth `openai`, incluido un inicio de sesión externo de Codex detectado automáticamente. Las sesiones con clave de API usan la facturación de Platform de la clave; la disponibilidad y la facturación de OAuth siguen el derecho de Realtime de la cuenta autenticada.

Si la autenticación con clave de API informa que falta facturación, recarga créditos de Platform en [platform.openai.com/account/billing](https://platform.openai.com/account/billing) para la organización que respalda tus credenciales realtime cuando uses autenticación con clave de API. La voz realtime acepta el perfil de autenticación con clave de API `openai` creado por `openclaw onboard --auth-choice openai-api-key`, un perfil OAuth `openai` o inicio de sesión externo de Codex, una `OPENAI_API_KEY` de Platform definida mediante `talk.realtime.providers.openai.apiKey` para Control UI Talk, o `plugins.entries.voice-call.config.realtime.providers.openai.apiKey` para Voice Call, o la variable de entorno `OPENAI_API_KEY`.
</Note>

## Embeddings de memoria

OpenClaw puede usar OpenAI, o un endpoint de embeddings compatible con OpenAI, para la indexación de `memory_search` y los embeddings de consulta:

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

Para endpoints compatibles con OpenAI que requieran etiquetas de embeddings asimétricas, define `queryInputType` y `documentInputType` en `memorySearch`. OpenClaw los reenvía como campos de solicitud `input_type` específicos del proveedor: los embeddings de consulta usan `queryInputType`; los fragmentos de memoria indexados y la indexación por lotes usan `documentInputType`. Consulta la [referencia de configuración de memoria](/es/reference/memory-config#provider-specific-config) para ver el ejemplo completo.

## Primeros pasos

<Tabs>
  <Tab title="Clave de API (OpenAI Platform)">
    **Ideal para:** acceso directo a la API y facturación basada en uso.

    <Steps>
      <Step title="Obtén tu clave de API">
        Crea o copia una clave de API desde el [panel de OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Ejecuta onboarding">
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

    ### Resumen de rutas

    | Referencia de modelo    | Configuración del entorno de ejecución               | Ruta                        | Autenticación                        |
    | ----------------------- | ------------------------------------------------------ | --------------------------- | ------------------------------------ |
    | `openai/gpt-5.5`       | sin definir, o provider/model `agentRuntime.id: "codex"` | arnés de servidor de aplicaciones Codex | perfil de autenticación con clave de API ordenado |
    | `openai/gpt-5.4-mini`  | sin definir, o provider/model `agentRuntime.id: "codex"` | arnés de servidor de aplicaciones Codex | perfil de autenticación con clave de API ordenado |
    | `openai/gpt-5.5`       | provider/model `agentRuntime.id: "openclaw"`          | entorno de ejecución integrado de OpenClaw | perfil de clave de API `openai` seleccionado |

    <Note>
    Los turnos de agente en `openai/*` usan de forma predeterminada el arnés de servidor de aplicaciones Codex. Para la
    autenticación con clave de API en un modelo de agente, crea un perfil de autenticación de clave de API `openai` y
    ordénalo con `auth.order.openai`; `OPENAI_API_KEY` sigue siendo la reserva directa
    para superficies de API de OpenAI que no son de agente. Ejecuta `openclaw doctor --fix` para
    migrar entradas antiguas heredadas de orden de autenticación de Codex.
    </Note>

    ### Ejemplo de configuración

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    Para probar el modelo Instant actual de ChatGPT desde la API de OpenAI, configura el modelo
    en `openai/chat-latest`:

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` es un alias móvil. OpenAI recomienda `gpt-5.5` para el uso de la
    API en producción, así que conserva `openai/gpt-5.5` como valor predeterminado estable salvo que quieras
    ese comportamiento de alias. El alias solo acepta verbosidad de texto `medium`;
    OpenClaw fuerza cualquier otra verbosidad solicitada a `medium` para este modelo.

    <Warning>
    OpenClaw **no** expone `gpt-5.3-codex-spark` en la ruta directa con
    clave de API de OpenAI. Solo está disponible mediante entradas del catálogo de suscripción de Codex
    cuando tu cuenta con sesión iniciada lo expone.
    </Warning>

  </Tab>

  <Tab title="Suscripción de Codex">
    **Ideal para:** usar tu suscripción de ChatGPT/Codex con ejecución nativa de
    servidor de aplicaciones Codex en lugar de una clave de API separada. La nube de Codex requiere
    iniciar sesión en ChatGPT.

    <Steps>
      <Step title="Ejecuta OAuth de Codex">
        ```bash
        openclaw onboard --auth-choice openai
        ```

        O ejecuta OAuth directamente:

        ```bash
        openclaw models auth login --provider openai
        ```

        Para configuraciones sin interfaz o incompatibles con callbacks, añade `--device-code` para iniciar
        sesión con un flujo de código de dispositivo de ChatGPT en lugar del callback de navegador
        localhost:

        ```bash
        openclaw models auth login --provider openai --device-code
        ```
      </Step>
      <Step title="Usa la ruta canónica del modelo de OpenAI">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        No se requiere configuración del entorno de ejecución para la ruta predeterminada. Los turnos de agente de OpenAI
        seleccionan automáticamente el entorno de ejecución nativo de servidor de aplicaciones Codex, y
        OpenClaw instala o repara el Plugin Codex incluido cuando se elige esta ruta.
      </Step>
      <Step title="Verifica que la autenticación de Codex esté disponible">
        ```bash
        openclaw models list --provider openai
        ```

        Después de que el Gateway esté en ejecución, envía `/codex status` o `/codex models`
        en el chat para verificar el entorno de ejecución nativo de servidor de aplicaciones.
      </Step>
    </Steps>

    ### Resumen de rutas

    | Referencia de modelo      | Configuración del entorno de ejecución          | Ruta                                                      | Autenticación                                      |
    | -------------------------- | ------------------------------------------------ | --------------------------------------------------------- | -------------------------------------------------- |
    | `openai/gpt-5.5`         | sin definir, o provider/model `agentRuntime.id: "codex"` | arnés nativo de servidor de aplicaciones Codex            | inicio de sesión de Codex, o un perfil de autenticación `openai` ordenado |
    | `openai/gpt-5.5`         | provider/model `agentRuntime.id: "openclaw"`  | entorno de ejecución integrado de OpenClaw, transporte interno de autenticación Codex | perfil OAuth `openai` seleccionado |
    | Referencia heredada de Codex GPT-5.5 | reparada por doctor                            | reescrita a `openai/gpt-5.5`                              | perfil OAuth de OpenAI migrado                    |
    | `codex-cli/gpt-5.5`      | reparada por doctor                            | reescrita a `openai/gpt-5.5`                              | autenticación de servidor de aplicaciones Codex    |

    <Warning>
    Prefiere `openai/gpt-5.5` para la configuración nueva de agentes respaldados por suscripción. Las referencias
    antiguas de Codex GPT son rutas heredadas de OpenClaw, no la ruta nativa del entorno de ejecución Codex;
    ejecuta `openclaw doctor --fix` para migrarlas. `gpt-5.3-codex-spark`
    sigue limitado a cuentas cuyo catálogo de suscripción de Codex lo anuncia;
    las referencias directas de clave de API de OpenAI y Azure para él permanecen suprimidas.
    </Warning>

    <Note>
    La configuración nueva debe colocar el orden de autenticación de agentes de OpenAI bajo `auth.order.openai`;
    doctor migra entradas antiguas heredadas de orden de autenticación de Codex.
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

    Con una copia de respaldo de clave de API, mantén el modelo en `openai/gpt-5.5` y coloca el
    orden de autenticación bajo `openai`. OpenClaw prueba primero la suscripción y luego la
    clave de API, mientras permanece en el arnés Codex:

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
    La incorporación ya no importa material OAuth desde `~/.codex`. Inicia sesión con
    OAuth de navegador (predeterminado) o con el flujo de código de dispositivo anterior; OpenClaw administra las
    credenciales resultantes en su propio almacén de autenticación de agentes.
    </Note>

    ### Comprobar y recuperar el enrutamiento OAuth de Codex

    ```bash
    openclaw models status
    openclaw models auth list --provider openai
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    Para un agente específico, añade `--agent <id>`:

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai
    ```

    Si una configuración antigua todavía tiene referencias heredadas de Codex GPT, o una fijación obsoleta de sesión de entorno de ejecución
    de OpenAI sin configuración explícita de entorno de ejecución, repárala:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    Si `models auth list --provider openai` no muestra ningún perfil utilizable, inicia sesión
    de nuevo:

    ```bash
    openclaw models auth login --provider openai
    openclaw models status --probe --probe-provider openai
    ```

    Usa `--profile-id` para varios inicios de sesión OAuth de Codex en el mismo agente y luego
    contrólalos mediante el orden de autenticación o `/model ...@<profileId>`:

    ```bash
    openclaw models auth login --provider openai --profile-id openai:ritsuko
    openclaw models auth login --provider openai --profile-id openai:lain
    ```

    Ejecuta `openclaw doctor --fix` para migrar identificadores de perfil antiguos con prefijo heredado de OpenAI Codex
    y entradas de orden antes de depender del orden de perfiles.

    ### Indicador de estado

    El chat `/status` muestra qué entorno de ejecución de modelo está activo para la sesión
    actual. El arnés incluido de servidor de aplicaciones Codex aparece como
    `Runtime: OpenAI Codex` para turnos de agente `openai/*`. Las fijaciones obsoletas de sesión de entorno de ejecución de OpenAI
    se reparan a Codex salvo que la configuración fije explícitamente OpenClaw.

    ### Advertencia de doctor

    Si quedan referencias heredadas de modelo Codex o fijaciones obsoletas de entorno de ejecución de OpenAI en la configuración
    o en el estado de sesión, `openclaw doctor --fix` las reescribe a `openai/*` con
    el entorno de ejecución Codex salvo que OpenClaw esté configurado explícitamente.

    ### Límite de ventana de contexto

    OpenClaw trata los metadatos de modelo y el límite de contexto del entorno de ejecución como valores
    separados. Para `openai/gpt-5.5` mediante el catálogo OAuth de Codex:

    - `contextWindow` nativo: `400000`
    - Límite predeterminado de `contextTokens` del entorno de ejecución: `272000`

    El límite predeterminado más pequeño tiene mejores características de latencia y calidad en la
    práctica. Sobrescríbelo con `contextTokens`:

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
    Usa `contextWindow` para declarar metadatos nativos del modelo. Usa `contextTokens`
    para limitar el presupuesto de contexto del entorno de ejecución. La ruta directa con clave de API de OpenAI
    informa un `contextWindow` nativo mayor (`1000000`) para `gpt-5.5`; las dos
    rutas se rastrean por separado porque los catálogos ascendentes difieren.
    </Note>

    ### Recuperación del catálogo

    OpenClaw usa metadatos del catálogo ascendente de Codex para `gpt-5.5` cuando están
    presentes. Si el descubrimiento en vivo de Codex omite la fila `gpt-5.5` mientras la cuenta
    está autenticada, OpenClaw sintetiza esa fila de modelo OAuth para que las ejecuciones de Cron,
    subagente y modelo predeterminado configurado no fallen con
    `Unknown model`.

  </Tab>
</Tabs>

## Autenticación nativa del servidor de aplicaciones Codex

El arnés nativo de servidor de aplicaciones Codex usa referencias de modelo `openai/*` con la configuración del entorno de ejecución
sin definir o provider/model `agentRuntime.id: "codex"`, pero su autenticación
sigue estando basada en cuentas. OpenClaw selecciona la autenticación en este orden:

1. Perfiles de autenticación de OpenAI ordenados para el agente, preferiblemente bajo
   `auth.order.openai`. Ejecuta `openclaw doctor --fix` para migrar identificadores antiguos heredados de perfiles de autenticación
   de Codex y el orden de autenticación.
2. La cuenta existente del servidor de aplicaciones, como un inicio de sesión local de ChatGPT
   en la CLI de Codex.
3. Solo para lanzamientos locales de servidor de aplicaciones stdio, y solo cuando el servidor de aplicaciones
   no informa ninguna cuenta: `CODEX_API_KEY`, luego `OPENAI_API_KEY`.

Un inicio de sesión local de suscripción ChatGPT/Codex no se reemplaza solo porque el
proceso del Gateway también tenga `OPENAI_API_KEY` para modelos o embeddings directos
de OpenAI. La reserva de clave de API de entorno se aplica solo a la ruta local stdio sin cuenta;
nunca se envía por conexiones WebSocket de servidor de aplicaciones. Cuando se selecciona un
perfil de Codex de estilo suscripción, OpenClaw también mantiene
`CODEX_API_KEY` y `OPENAI_API_KEY` fuera del proceso hijo de servidor de aplicaciones stdio
generado y envía las credenciales seleccionadas mediante el RPC de inicio de sesión del servidor de aplicaciones.

Cuando ese perfil de suscripción está bloqueado por un límite de uso de Codex, OpenClaw
marca el perfil como bloqueado hasta la hora de restablecimiento anunciada por Codex y deja que el orden de autenticación
rote al siguiente perfil `openai:*`, sin cambiar el modelo seleccionado
ni salir del arnés Codex. Una vez que pasa la hora de restablecimiento, el
perfil de suscripción vuelve a ser apto.

## Generación de imágenes

El Plugin `openai` incluido registra la generación de imágenes mediante la herramienta
`image_generate`. Admite generación de imágenes tanto con clave de API de OpenAI como con OAuth de Codex
mediante la misma referencia de modelo `openai/gpt-image-2`.

| Capacidad                | Clave de API de OpenAI              | Codex OAuth                              |
| ------------------------ | ----------------------------------- | ---------------------------------------- |
| Ref. de modelo           | `openai/gpt-image-2`                | `openai/gpt-image-2`                     |
| Autenticación            | `OPENAI_API_KEY`                    | Inicio de sesión de OpenAI Codex OAuth   |
| Transporte               | API de OpenAI Images                | backend de Codex Responses               |
| Imágenes máx. por solicitud | 4                                | 4                                        |
| Modo de edición          | Habilitado (hasta 5 imágenes de referencia) | Habilitado (hasta 5 imágenes de referencia) |
| Sustituciones de tamaño  | Compatibles, incluidos tamaños 2K/4K | Compatibles, incluidos tamaños 2K/4K    |
| Relación de aspecto / resolución | No se reenvía a la API de OpenAI Images | Se asigna a un tamaño compatible cuando es seguro |

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
Consulta [Generación de imágenes](/es/tools/image-generation) para conocer los parámetros compartidos de la herramienta,
la selección de proveedor y el comportamiento de conmutación por error.
</Note>

`gpt-image-2` es el valor predeterminado para la generación de texto a imagen y la
edición de imágenes de OpenAI. `gpt-image-1.5`, `gpt-image-1` y `gpt-image-1-mini` siguen siendo utilizables
como sustituciones explícitas de modelo. Usa `openai/gpt-image-1.5` para
salida PNG/WebP con fondo transparente; la API actual de `gpt-image-2` rechaza
`background: "transparent"`.

Para una solicitud con fondo transparente, llama a `image_generate` con
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` o `"webp"`, y
`background: "transparent"`; la opción de proveedor anterior `openai.background` todavía
se acepta. OpenClaw también protege las rutas públicas de OpenAI y OpenAI Codex OAuth
reescribiendo las solicitudes transparentes predeterminadas de `openai/gpt-image-2` a
`gpt-image-1.5`; Azure y los endpoints personalizados compatibles con OpenAI conservan sus
nombres de implementación/modelo configurados.

La misma configuración se expone para ejecuciones de CLI sin interfaz:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

Usa las mismas marcas `--output-format` y `--background` con
`openclaw infer image edit` al partir de un archivo de entrada.
`--openai-background` sigue disponible como alias específico de OpenAI. Usa
`--quality low|medium|high|auto` para controlar la calidad y el costo de OpenAI Images.
Usa `--openai-moderation low|auto` para pasar la indicación de moderación de OpenAI desde
`image generate` o `image edit`.

Para instalaciones de ChatGPT/Codex OAuth, conserva la misma ref. `openai/gpt-image-2`. Cuando
se configura un perfil OAuth de `openai`, OpenClaw resuelve ese token de acceso OAuth
almacenado y envía solicitudes de imagen mediante el backend de Codex Responses; no
intenta primero `OPENAI_API_KEY` ni recurre silenciosamente a una clave de API.
Configura `models.providers.openai` explícitamente con una clave de API, URL base
personalizada o endpoint de Azure cuando quieras la ruta directa de la API de OpenAI Images
en su lugar. Si ese endpoint personalizado de imagen está en una LAN/dirección privada de confianza,
también configura `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw
mantiene bloqueados los endpoints de imagen privados/internos compatibles con OpenAI salvo que esta
opción explícita esté presente.

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

El Plugin incluido `openai` registra la generación de video mediante la
herramienta `video_generate`.

| Capacidad              | Valor                                                                              |
| ---------------------- | ---------------------------------------------------------------------------------- |
| Modelo predeterminado  | `openai/sora-2`                                                                    |
| Modos                  | Texto a video, imagen a video, edición de un solo video                            |
| Entradas de referencia | 1 imagen o 1 video                                                                 |
| Sustituciones de tamaño | Compatibles para texto a video e imagen a video                                   |
| Relación de aspecto    | Se convierte al tamaño compatible más cercano, no se reenvía sin procesar          |
| Otras sustituciones    | `resolution`, `audio`, `watermark` no son compatibles y se descartan con una advertencia de herramienta |

Las solicitudes de imagen a video de OpenAI usan `POST /v1/videos` con una
`input_reference` de imagen. Las ediciones de un solo video usan `POST /v1/videos/edits` con el
video subido en el campo `video`.

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
Consulta [Generación de video](/es/tools/video-generation) para conocer los parámetros compartidos de la herramienta,
la selección de proveedor y el comportamiento de conmutación por error.

El proveedor OpenAI declara `supportsSize`, pero no `supportsAspectRatio` ni
`supportsResolution`. La capa de normalización compartida de OpenClaw convierte una
`aspectRatio` solicitada en el `size` de OpenAI coincidente más cercano antes de que la
solicitud llegue al proveedor, por lo que las solicitudes de relación de aspecto suelen funcionar.
`resolution` no tiene alternativa de tamaño y se descarta, mostrándose al llamador como
`Ignored unsupported overrides for openai/<model>: resolution=<value>`.
</Note>

## Contribución de prompt de GPT-5

OpenClaw agrega una contribución de prompt compartida de GPT-5 para modelos de la familia GPT-5 en
el proveedor `openai` (incluidas refs heredadas de Codex previas a la reparación que se normalizan
a `openai/*`). Otros proveedores que también sirven ids de modelo de la familia GPT-5, como
OpenRouter o rutas de opencode, no reciben esta superposición; está limitada por el
id de proveedor `openai`, no solo por el id de modelo. Los modelos GPT-4.x anteriores nunca
la reciben.

El arnés nativo del servidor de aplicación de Codex no recibe el contrato de comportamiento de
persona/disciplina de herramientas ni la superposición de estilo de interacción amigable mediante
instrucciones de desarrollador; Codex nativo conserva el comportamiento base, de modelo y de
documentos de proyecto propiedad de Codex, y OpenClaw deshabilita la personalidad integrada de Codex para
hilos nativos, de modo que los archivos de personalidad del espacio de trabajo del agente sigan siendo autoritativos.
OpenClaw aporta solo contexto de runtime a los hilos nativos de Codex: entrega de canal,
herramientas dinámicas de OpenClaw, delegación ACP, contexto del espacio de trabajo y
Skills de OpenClaw. El texto de orientación de Heartbeat de esta misma contribución es la
única excepción: los turnos Heartbeat de Codex nativo sí lo reciben, inyectado como
instrucciones de colaboración dedicadas en lugar de mediante el enlace de contribución de prompt
compartido.

La contribución de GPT-5 agrega un contrato de comportamiento etiquetado para persistencia de persona,
seguridad de ejecución, disciplina de herramientas, forma de salida, comprobaciones de finalización
y verificación en prompts ensamblados por OpenClaw que coincidan. El comportamiento de respuesta específico
del canal y de mensajes silenciosos permanece en el prompt de sistema compartido de OpenClaw
y en la política de entrega saliente. La capa de estilo de interacción amigable es
independiente y configurable.

| Valor                  | Efecto                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (predeterminado) | Habilita la capa de estilo de interacción amigable |
| `"on"`                 | Alias de `"friendly"`                       |
| `"off"`                | Deshabilita solo la capa de estilo amigable |

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
Los valores no distinguen mayúsculas de minúsculas en runtime, por lo que `"Off"` y `"off"` deshabilitan ambos la
capa de estilo amigable.
</Tip>

<Note>
`plugins.entries.openai.config.personality` heredado todavía se lee como
alternativa de compatibilidad cuando la configuración compartida
`agents.defaults.promptOverlays.gpt5.personality` no está establecida.
</Note>

## Voz y habla

<AccordionGroup>
  <Accordion title="Síntesis de voz (TTS)">
    El Plugin incluido `openai` registra la síntesis de voz para la
    superficie `messages.tts`.

    | Configuración | Ruta de configuración                              | Predeterminado                    |
    | ------------- | -------------------------------------------------- | --------------------------------- |
    | Modelo        | `messages.tts.providers.openai.model`              | `gpt-4o-mini-tts`                 |
    | Voz           | `messages.tts.providers.openai.speakerVoice`       | `coral`                           |
    | Velocidad     | `messages.tts.providers.openai.speed`              | (sin establecer)                  |
    | Instrucciones | `messages.tts.providers.openai.instructions`       | (sin establecer, solo `gpt-4o-mini-tts`) |
    | Formato       | `messages.tts.providers.openai.responseFormat`     | `opus` para notas de voz, `mp3` para archivos |
    | Clave de API  | `messages.tts.providers.openai.apiKey`             | Recurre a `OPENAI_API_KEY`        |
    | URL base      | `messages.tts.providers.openai.baseUrl`            | `https://api.openai.com/v1`       |
    | Cuerpo adicional | `messages.tts.providers.openai.extraBody` / `extra_body` | (sin establecer)             |

    Modelos disponibles: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Voces disponibles:
    `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`,
    `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` se fusiona en el JSON de solicitud `/audio/speech` después de los
    campos generados por OpenClaw, así que úsalo para endpoints compatibles con OpenAI que requieran
    claves adicionales como `lang`. Las claves de prototipo se ignoran.

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
    Configura `OPENAI_TTS_BASE_URL` para sustituir la URL base de TTS sin afectar
    al endpoint de la API de chat. OpenAI TTS y la voz en Realtime se configuran ambos
    mediante una clave de API de OpenAI Platform; las instalaciones solo con OAuth aún pueden usar
    modelos de chat respaldados por Codex, pero no respuesta de voz en vivo de OpenAI.
    </Note>

  </Accordion>

  <Accordion title="Voz a texto">
    El Plugin incluido `openai` registra voz a texto por lotes mediante
    la superficie de transcripción de comprensión multimedia de OpenClaw.

    - Modelo predeterminado: `gpt-4o-transcribe`
    - Endpoint: REST de OpenAI `/v1/audio/transcriptions`
    - Ruta de entrada: carga de archivo de audio multipart
    - Se usa dondequiera que la transcripción de audio entrante lea `tools.media.audio`,
      incluidos segmentos de canal de voz de Discord y adjuntos de audio de canales

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

    Las indicaciones de idioma y prompt se reenvían a OpenAI cuando las suministra la
    configuración compartida de medios de audio o la solicitud de transcripción por llamada.

  </Accordion>

  <Accordion title="Transcripción en tiempo real">
    El Plugin incluido `openai` registra transcripción en tiempo real para el
    Plugin Voice Call.

    | Ajuste          | Ruta de configuración                                                          | Predeterminado |
    | ----------------- | ----------------------------------------------------------------------- | --------- |
    | Modelo            | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Idioma         | `...openai.language`                                                 | (sin configurar) |
    | Instrucción           | `...openai.prompt`                                                   | (sin configurar) |
    | Duración del silencio | `...openai.silenceDurationMs`                                        | `800`   |
    | Umbral de VAD    | `...openai.vadThreshold`                                             | `0.5`   |
    | Autenticación             | `...openai.apiKey`, `OPENAI_API_KEY`, u OAuth de `openai`              | Las claves de API se conectan directamente; OAuth emite un secreto de cliente de transcripción Realtime |

    <Note>
    Usa una conexión WebSocket a `wss://api.openai.com/v1/realtime` con
    audio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Cuando solo está configurado
    OAuth de `openai`, el Gateway emite un secreto de cliente efímero de
    transcripción Realtime antes de abrir el WebSocket. Este proveedor de streaming
    es para la ruta de transcripción en tiempo real de Voice Call; la voz de Discord
    actualmente graba segmentos cortos y usa en su lugar la ruta de transcripción
    por lotes `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Voz en tiempo real">
    El plugin `openai` incluido registra voz en tiempo real para el plugin
    Voice Call.

    | Ajuste                               | Ruta de configuración                                                              | Predeterminado             |
    | --------------------------------------- | ---------------------------------------------------------------------------- | ---------------------- |
    | Modelo                                  | `plugins.entries.voice-call.config.realtime.providers.openai.model`     | `gpt-realtime-2`    |
    | Voz                                  | `...openai.voice`                                                       | `alloy`             |
    | Temperatura (puente de despliegue de Azure)  | `...openai.temperature`                                                 | `0.8`               |
    | Umbral de VAD                          | `...openai.vadThreshold`                                                | `0.5`                |
    | Duración del silencio                       | `...openai.silenceDurationMs`                                           | `500`                |
    | Relleno de prefijo                         | `...openai.prefixPaddingMs`                                             | `300`                |
    | Esfuerzo de razonamiento                       | `...openai.reasoningEffort`                                             | (sin configurar)              |
    | Autenticación                                   | perfil de clave de API/OAuth de `openai`, inicio de sesión externo de Codex, `...openai.apiKey`, u `OPENAI_API_KEY` | Primero las fuentes de clave de API; fallback a OAuth de Codex |

    Voces Realtime integradas disponibles para `gpt-realtime-2`: `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`.
    OpenAI recomienda `marin` y `cedar` para la mejor calidad Realtime. Este
    es un conjunto separado de las voces de texto a voz anteriores; una voz solo
    de TTS como `fable`, `nova` u `onyx` no es válida para sesiones Realtime.

    <Note>
    Los puentes realtime de backend de OpenAI usan la forma de sesión WebSocket
    Realtime GA, que no acepta `session.temperature`. Los despliegues de Azure OpenAI
    siguen disponibles mediante `azureEndpoint` y `azureDeployment`, y conservan
    la forma de sesión compatible con el despliegue (incluida `temperature`).
    Admite llamadas a herramientas bidireccionales y audio G.711 u-law.
    </Note>

    <Note>
    La voz en tiempo real se selecciona cuando se crea la sesión. OpenAI permite
    cambiar la mayoría de los campos de sesión más tarde, pero la voz no puede
    cambiarse después de que el modelo haya emitido audio en esa sesión. OpenClaw
    actualmente expone los ids de voz Realtime integrados como cadenas.
    </Note>

    <Note>
    Control UI Talk usa sesiones realtime de OpenAI en el navegador con un
    secreto de cliente efímero emitido por el Gateway y un intercambio SDP WebRTC
    directo desde el navegador contra la API Realtime de OpenAI. El Gateway emite
    ese secreto de cliente con la credencial `openai` seleccionada. Las claves
    configuradas, los perfiles de clave de API y `OPENAI_API_KEY` tienen prioridad;
    un perfil OAuth de `openai` o un inicio de sesión externo de Codex es el
    fallback. El relay del Gateway y los puentes WebSocket realtime de backend
    de Voice Call usan el mismo orden de credenciales para endpoints nativos de OpenAI.
    La verificación en vivo para mantenedores está disponible con
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    los tramos de OpenAI verifican tanto el puente WebSocket de backend como el
    intercambio SDP WebRTC del navegador sin registrar secretos.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoints de Azure OpenAI

El proveedor `openai` incluido puede apuntar a un recurso de Azure OpenAI para
generación de imágenes anulando la URL base. En la ruta de generación de imágenes,
OpenClaw detecta nombres de host de Azure en `models.providers.openai.baseUrl` y
cambia automáticamente a la forma de solicitud de Azure.

<Note>
La voz en tiempo real usa una ruta de configuración separada
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
y no se ve afectada por `models.providers.openai.baseUrl`. Consulta el acordeón
**Voz en tiempo real** en [Voz y habla](#voice-and-speech) para sus ajustes de Azure.
</Note>

Usa Azure OpenAI cuando:

- Ya tienes una suscripción, cuota o contrato empresarial de Azure OpenAI
- Necesitas residencia regional de datos o controles de cumplimiento que proporciona Azure
- Quieres mantener el tráfico dentro de una tenencia de Azure existente

### Configuración

Para generación de imágenes de Azure mediante el proveedor `openai` incluido, apunta
`models.providers.openai.baseUrl` a tu recurso de Azure y establece `apiKey` en
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

OpenClaw reconoce estos sufijos de host de Azure para la ruta de generación de
imágenes de Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Para solicitudes de generación de imágenes en un host de Azure reconocido, OpenClaw:

- Envía el encabezado `api-key` en lugar de `Authorization: Bearer`
- Usa rutas con alcance de despliegue (`/openai/deployments/{deployment}/...`)
- Añade `?api-version=...` a cada solicitud
- Usa un tiempo de espera de solicitud predeterminado de 600 s para llamadas de generación de imágenes de Azure.
  Los valores `timeoutMs` por llamada siguen anulando este valor predeterminado.

Otras URL base (OpenAI público, proxies compatibles con OpenAI) conservan la forma
estándar de solicitud de imágenes de OpenAI.

<Note>
El enrutamiento de Azure para la ruta de generación de imágenes del proveedor `openai`
requiere OpenClaw 2026.4.22 o posterior. Las versiones anteriores tratan cualquier
`openai.baseUrl` personalizado como el endpoint público de OpenAI y fallan contra
despliegues de imágenes de Azure.
</Note>

### Versión de API

Establece `AZURE_OPENAI_API_VERSION` para fijar una versión específica preview o GA
de Azure para la ruta de generación de imágenes de Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

El valor predeterminado es `2024-12-01-preview` cuando la variable no está configurada.

### Los nombres de modelo son nombres de despliegue

Azure OpenAI vincula modelos a despliegues. Para solicitudes de generación de imágenes
de Azure enrutadas mediante el proveedor `openai` incluido, el campo `model` en OpenClaw
debe ser el **nombre de despliegue de Azure** que configuraste en el portal de Azure,
no el id de modelo público de OpenAI.

Si creas un despliegue llamado `gpt-image-2-prod` que sirve `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

La misma regla de nombre de despliegue se aplica a cualquier llamada de generación
de imágenes enrutada mediante el proveedor `openai` incluido.

### Disponibilidad regional

La generación de imágenes de Azure está disponible actualmente solo en un subconjunto
de regiones (por ejemplo `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Consulta la lista actual de regiones de Microsoft antes de crear un
despliegue y confirma que el modelo específico se ofrezca en tu región.

### Diferencias de parámetros

Azure OpenAI y OpenAI público no siempre aceptan los mismos parámetros de imagen.
Azure puede rechazar opciones que OpenAI público permite (por ejemplo ciertos
valores de `background` en `gpt-image-2`) o exponerlas solo en versiones de modelo
específicas. Estas diferencias provienen de Azure y del modelo subyacente, no de
OpenClaw. Si una solicitud de Azure falla con un error de validación, revisa el
conjunto de parámetros admitido por tu despliegue y versión de API específicos en
el portal de Azure.

<Note>
Azure OpenAI usa transporte nativo y comportamiento de compatibilidad, pero no recibe
los encabezados de atribución ocultos de OpenClaw; consulta el acordeón **Rutas nativas
frente a compatibles con OpenAI** en [Configuración avanzada](#advanced-configuration).

Para tráfico de chat o Responses en Azure (más allá de la generación de imágenes), usa
el flujo de incorporación o una configuración dedicada de proveedor Azure; `openai.baseUrl`
por sí solo no adopta la forma de API/autenticación de Azure. Existe un proveedor
`azure-openai-responses/*` separado; consulta el acordeón de Compaction del lado del
servidor a continuación.
</Note>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Transporte (WebSocket frente a SSE)">
    OpenClaw usa primero WebSocket con fallback a SSE (`"auto"`) para `openai/*`.

    En modo `"auto"`, OpenClaw:
    - Reintenta un fallo temprano de WebSocket antes de recurrir a SSE
    - Después de un fallo, marca WebSocket como degradado durante 60 segundos y usa SSE
      durante el enfriamiento
    - Adjunta encabezados estables de identidad de sesión y turno para reintentos y
      reconexiones
    - Normaliza contadores de uso (`input_tokens` / `prompt_tokens`) entre variantes
      de transporte

    | Valor                | Comportamiento                          |
    | ---------------------- | ------------------------------------ |
    | `"auto"` (predeterminado)   | WebSocket primero, fallback a SSE     |
    | `"sse"`              | Forzar solo SSE                    |
    | `"websocket"`        | Forzar solo WebSocket              |

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

    Cuando está habilitado, OpenClaw asigna el modo rápido al procesamiento prioritario
    de OpenAI (`service_tier = "priority"`). Los valores existentes de `service_tier`
    se preservan, y el modo rápido no reescribe `reasoning` ni `text.verbosity`.
    `fastMode: "auto"` inicia nuevas llamadas de modelo en modo rápido hasta el
    límite automático; luego inicia llamadas posteriores de reintento, fallback,
    resultado de herramienta o continuación sin modo rápido. El límite predeterminado
    es de 60 segundos; establece `params.fastAutoOnSeconds` en el modelo activo para
    cambiarlo.

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
    Las anulaciones de sesión tienen prioridad sobre la configuración. Borrar la
    anulación de sesión en la UI de sesiones devuelve la sesión al valor predeterminado
    configurado.
    </Note>

  </Accordion>

  <Accordion title="Procesamiento prioritario (service_tier)">
    La API de OpenAI expone procesamiento prioritario mediante `service_tier`. Configúralo por
    modelo en OpenClaw:

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
    `serviceTier` se reenvía solo a los endpoints nativos de OpenAI
    (`api.openai.com`) y a los endpoints nativos de Codex (`chatgpt.com/backend-api`).
    Si enrutas cualquiera de los proveedores mediante un proxy, OpenClaw deja
    `service_tier` intacto.
    </Warning>

  </Accordion>

  <Accordion title="Compaction del lado del servidor (Responses API)">
    Para modelos directos de OpenAI Responses (`openai/*` en `api.openai.com`), el
    envoltorio de stream de OpenClaw del Plugin de OpenAI habilita automáticamente
    la Compaction del lado del servidor:

    - Fuerza `store: true` (salvo que la compatibilidad del modelo establezca `supportsStore: false`)
    - Inyecta `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` predeterminado: 70% de `contextWindow` (o `80000` cuando
      no esté disponible)

    Esto se aplica a la ruta de runtime integrada de OpenClaw y a los hooks del proveedor
    OpenAI usados por ejecuciones incrustadas. El harness nativo de servidor de aplicación
    de Codex gestiona su propio contexto mediante Codex y no se ve afectado por este ajuste.

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
    `responsesServerCompaction` solo controla la inyección de `context_management`.
    Los modelos directos de OpenAI Responses aún fuerzan `store: true`, salvo que la compatibilidad
    establezca `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Modo GPT strict-agentic">
    Para los modelos de la familia GPT-5 del proveedor `openai` ejecutados mediante el
    runtime incrustado de OpenClaw, OpenClaw ya usa de forma predeterminada un contrato de
    ejecución más estricto llamado `strict-agentic`. Se activa automáticamente siempre que el
    proveedor resuelto sea `openai` y el id del modelo coincida con la familia GPT-5, salvo que la configuración
    opte explícitamente por excluirlo:

    ```json5
    {
      agents: {
        defaults: {
          embeddedAgent: { executionContract: "default" },
        },
      },
    }
    ```

    Establecer `"strict-agentic"` explícitamente no tiene efecto en una ruta admitida (ya
    es el valor predeterminado) y queda inerte en pares proveedor/modelo no admitidos.

    Con `strict-agentic` activo, OpenClaw:
    - Habilita automáticamente `update_plan` para trabajos sustanciales
    - Reintenta turnos estructuralmente vacíos o solo de razonamiento con una continuación
      de respuesta visible
    - Usa eventos de plan explícitos del harness cuando el harness seleccionado los proporciona

    OpenClaw no clasifica la prosa del asistente para decidir si un turno es un
    plan, una actualización de progreso o una respuesta final.

    <Note>
    Este contrato vive por completo en el ejecutor de agente incrustado de OpenClaw. No se
    aplica al harness nativo de servidor de aplicación de Codex, que gestiona su propio
    comportamiento de turnos y planes; la selección del harness importa más que el
    ajuste del contrato de ejecución para ejecuciones nativas de Codex.
    </Note>

  </Accordion>

  <Accordion title="Rutas nativas vs. compatibles con OpenAI">
    OpenClaw trata los endpoints directos de OpenAI, Codex y Azure OpenAI
    de forma distinta a los proxies `/v1` genéricos compatibles con OpenAI:

    **Rutas nativas** (`openai/*`, Azure OpenAI):
    - Mantienen `reasoning: { effort: "none" }` solo para modelos compatibles con el
      esfuerzo `none` de OpenAI
    - Omiten el razonamiento deshabilitado para modelos o proxies que rechazan
      `reasoning.effort: "none"`
    - Usan de forma predeterminada esquemas de herramientas en modo estricto
    - Adjuntan encabezados de atribución ocultos solo en hosts nativos verificados (Azure
      OpenAI no recibe estos encabezados, aunque sea una ruta nativa)
    - Mantienen el modelado de solicitudes exclusivo de OpenAI (`service_tier`, `store`,
      compatibilidad de razonamiento, indicaciones de caché de prompts)

    **Rutas proxy/compatibles:**
    - Usan un comportamiento de compatibilidad más flexible
    - Eliminan `store` de Completions en cargas útiles `openai-completions` no nativas
    - Aceptan JSON avanzado de paso directo `params.extra_body`/`params.extraBody`
      para proxies de Completions compatibles con OpenAI
    - Aceptan `params.chat_template_kwargs` para proxies de Completions compatibles con OpenAI
      como vLLM
    - No fuerzan esquemas de herramientas estrictos ni encabezados solo nativos

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="Generación de imágenes" href="/es/tools/image-generation" icon="image">
    Parámetros compartidos de la herramienta de imagen y selección de proveedor.
  </Card>
  <Card title="Generación de video" href="/es/tools/video-generation" icon="video">
    Parámetros compartidos de la herramienta de video y selección de proveedor.
  </Card>
  <Card title="OAuth y autenticación" href="/es/gateway/authentication" icon="key">
    Detalles de autenticación y reglas de reutilización de credenciales.
  </Card>
</CardGroup>
