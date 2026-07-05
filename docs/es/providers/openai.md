---
read_when:
    - Quieres usar modelos de OpenAI en OpenClaw
    - Quieres autenticación por suscripción de Codex en lugar de claves de API
    - Necesitas un comportamiento de ejecución de agentes GPT-5 más estricto
summary: Usar OpenAI mediante claves de API o una suscripción de Codex en OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-07-05T11:37:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7cfb010354b98f0d5a40db27abda2e51f0e7c0b7098e643b16ec8a6adfc3d668
    source_path: providers/openai.md
    workflow: 16
---

OpenClaw usa un único id de proveedor, `openai`, tanto para la autenticación directa con clave de API como para la autenticación de suscripción de ChatGPT/Codex. `openai/*` es la ruta de modelo canónica.
Los turnos de agente integrados en `openai/*` se ejecutan de forma predeterminada mediante el runtime de app-server Codex incluido; la autenticación directa con clave de API sigue estando disponible para superficies de OpenAI que no son de agente (imágenes, video, embeddings, voz, realtime) y como una ruta de compatibilidad explícita para turnos de agente.

- **Modelos de agente** - `openai/*` mediante el runtime de Codex. Inicia sesión con autenticación de Codex para usar una suscripción de ChatGPT/Codex, o configura un perfil de autenticación con clave de API cuando quieras facturación basada en clave.
- **API de OpenAI que no son de agente** - acceso directo a OpenAI Platform, facturado por uso, mediante `OPENAI_API_KEY` o un perfil de autenticación con clave de API `openai`.
- **Configuración heredada** - las referencias de modelos Codex y los ids de perfil antiguos se reparan a `openai/*` mediante `openclaw doctor --fix`.

OpenAI admite explícitamente el uso de OAuth de suscripción en herramientas externas y flujos de trabajo como OpenClaw.

Proveedor, modelo, runtime y canal son capas separadas. Si esas etiquetas se están mezclando, lee [Runtimes de agente](/es/concepts/agent-runtimes) antes de cambiar la configuración.

## Elección rápida

| Objetivo                                          | Uso                                                                | Notas                                                                   |
| ------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| Suscripción de ChatGPT/Codex, runtime nativo de Codex | `openai/gpt-5.5`                                                   | Configuración predeterminada. Inicia sesión con autenticación de Codex. |
| Vista previa limitada de GPT-5.6                  | `openai/gpt-5.6-sol`, `-terra`, or `-luna`                         | Requiere una organización de API aprobada por OpenAI o una entrada en la allowlist del espacio de trabajo de Codex. |
| Facturación directa con clave de API para turnos de agente | `openai/gpt-5.5` más un perfil de autenticación con clave de API ordenado | Configura `auth.order.openai` para colocar el perfil de clave después de la autenticación de suscripción. |
| Facturación directa con clave de API, runtime explícito de OpenClaw | `openai/gpt-5.5` más provider/model `agentRuntime.id: "openclaw"` | Selecciona un perfil normal de clave de API `openai`. |
| Alias del modelo ChatGPT Instant más reciente     | `openai/chat-latest`                                               | Solo clave de API directa; alias cambiante, no el valor predeterminado estable. |
| Generación o edición de imágenes                  | `openai/gpt-image-2`                                               | Funciona con `OPENAI_API_KEY` u OAuth de Codex.                         |
| Imágenes con fondo transparente                   | `openai/gpt-image-1.5`                                             | Configura `outputFormat` en `png` o `webp` y `background=transparent`.  |

## Mapa de nombres

| Nombre que ves                          | Capa              | Significado                                                                              |
| --------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------- |
| `openai`                                | Prefijo de proveedor | Ruta de modelo OpenAI canónica; los turnos de agente usan de forma predeterminada el runtime de Codex. |
| `codex` plugin                          | Plugin            | Plugin incluido que proporciona el runtime nativo de app-server Codex y los controles de chat `/codex`. |
| provider/model `agentRuntime.id: codex` | Runtime de agente | Fuerza el arnés nativo de app-server Codex para los turnos integrados coincidentes.       |
| `/codex ...`                            | Conjunto de comandos de chat | Vincula/controla hilos de app-server Codex desde una conversación.                        |
| `runtime: "acp", agentId: "codex"`      | Ruta de sesión ACP | Ruta de reserva explícita que ejecuta Codex mediante ACP/acpx.                            |

`openclaw doctor --fix` migra las referencias de modelos Codex heredadas, los ids de perfil de autenticación Codex heredados y las entradas de orden de autenticación Codex heredadas a la ruta canónica `openai`.
Usa `auth.order.openai` para la nueva configuración de orden de autenticación.

<Note>
GPT-5.5 está disponible tanto mediante acceso directo con clave de API de OpenAI Platform como mediante rutas de suscripción/OAuth. Para una suscripción de ChatGPT/Codex con ejecución nativa de Codex, usa `openai/gpt-5.5` y deja la configuración de runtime sin definir; eso ya selecciona el arnés de Codex. Usa un perfil de autenticación con clave de API solo cuando quieras autenticación directa con clave de API para un modelo de agente.
</Note>

## Vista previa limitada de GPT-5.6

OpenClaw reconoce tres ids públicos de modelo GPT-5.6: `openai/gpt-5.6-sol`, `openai/gpt-5.6-terra` y `openai/gpt-5.6-luna`. Los tres exponen razonamiento `xhigh` y `max` en el catálogo actual. OpenAI describe Sol como el nivel insignia, Terra como el nivel equilibrado y Luna como el nivel rápido y de menor costo. Consulta el [anuncio de lanzamiento de GPT-5.6](https://openai.com/index/previewing-gpt-5-6-sol/) y la [guía de acceso a la vista previa](https://help.openai.com/en/articles/20001325-a-preview-of-gpt-5-6-sol-terra-and-luna).

El acceso está en allowlist durante la vista previa y puede concederse por separado para la API y Codex; un plan de pago de ChatGPT por sí solo no concede acceso. OpenClaw mantiene `openai/gpt-5.5` como valor predeterminado y no trata de forma especial el error de acceso, por lo que seleccionar una referencia GPT-5.6 sin acceso muestra directamente el error ascendente en lugar de recurrir silenciosamente a otra opción.

<Note>
Los turnos de modelos de agente en `openai/*` requieren de forma predeterminada el Plugin de app-server Codex incluido. La configuración explícita del runtime de OpenClaw sigue disponible como ruta de compatibilidad opt-in: cuando OpenClaw se selecciona explícitamente con un perfil OAuth `openai`, la referencia de modelo permanece como `openai/*`, pero las solicitudes se enrutan internamente mediante el transporte con autenticación Codex. Ejecuta `openclaw doctor --fix` para reparar referencias de modelos Codex heredadas obsoletas, referencias `codex-cli/*` o pines antiguos de sesión de runtime que no fueron establecidos por configuración explícita de runtime.
</Note>

## Cobertura de funciones de OpenClaw

| Capacidad de OpenAI       | Superficie de OpenClaw                                                                       | Estado                                                              |
| ------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Chat / Responses          | Proveedor de modelos `openai/<model>`                                                        | Sí                                                                  |
| Modelos de suscripción Codex | `openai/<model>` con OAuth de OpenAI                                                       | Sí                                                                  |
| Referencias heredadas de modelos Codex | referencias de modelos Codex antiguas, `codex-cli/<model>`                         | Reparadas por doctor a `openai/<model>`                             |
| Arnés de app-server Codex | `openai/<model>` con runtime sin definir, o provider/model `agentRuntime.id: codex`           | Sí                                                                  |
| Búsqueda web del lado del servidor | Herramienta nativa de OpenAI Responses                                                | Sí, cuando la búsqueda web está activada y no hay otro proveedor fijado |
| Imágenes                  | `image_generate`                                                                              | Sí                                                                  |
| Videos                    | `video_generate`                                                                              | Sí                                                                  |
| Texto a voz               | `messages.tts.provider: "openai"` / `tts`                                                     | Sí                                                                  |
| Voz a texto por lotes     | `tools.media.audio` / comprensión de medios                                                   | Sí                                                                  |
| Voz a texto en streaming  | Voice Call `streaming.provider: "openai"`                                                     | Sí                                                                  |
| Voz realtime              | Voice Call `realtime.provider: "openai"` / Control UI Talk `talk.realtime.provider: "openai"` | Sí (requiere créditos de OpenAI Platform, no suscripción de Codex/ChatGPT) |
| Embeddings                | Proveedor de embeddings de memoria                                                            | Sí                                                                  |

<Note>
La voz Realtime de OpenAI pasa por la **API Realtime de OpenAI Platform** pública, facturada contra créditos de OpenAI Platform en lugar de la cuota de suscripción de Codex/ChatGPT. Una cuenta cuyos modelos de chat respaldados por Codex funcionen correctamente con OAuth sigue necesitando una clave de API de Platform con facturación financiada para la voz Realtime.

Solución: recarga créditos de Platform en
[platform.openai.com/account/billing](https://platform.openai.com/account/billing)
para la organización que respalda tus credenciales realtime. La voz Realtime acepta el perfil de autenticación con clave de API `openai` creado por
`openclaw onboard --auth-choice openai-api-key`, una `OPENAI_API_KEY` de Platform configurada mediante `talk.realtime.providers.openai.apiKey` para Control UI Talk o
`plugins.entries.voice-call.config.realtime.providers.openai.apiKey` para Voice Call, o la variable de entorno `OPENAI_API_KEY`. Los perfiles OAuth de OpenAI aún pueden ejecutar modelos de chat `openai/*` respaldados por Codex en la misma instalación, pero no configuran la voz Realtime.
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

Para endpoints compatibles con OpenAI que requieren etiquetas de embeddings asimétricas, configura `queryInputType` y `documentInputType` bajo `memorySearch`. OpenClaw los reenvía como campos de solicitud `input_type` específicos del proveedor: los embeddings de consulta usan `queryInputType`; los fragmentos de memoria indexados y la indexación por lotes usan `documentInputType`. Consulta la
[referencia de configuración de memoria](/es/reference/memory-config#provider-specific-config)
para ver el ejemplo completo.

## Primeros pasos

<Tabs>
  <Tab title="Clave de API (OpenAI Platform)">
    **Ideal para:** acceso directo a la API y facturación basada en uso.

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

    ### Resumen de rutas

    | Referencia de modelo   | Configuración de runtime                           | Ruta                     | Autenticación                     |
    | ----------------------- | ------------------------------------------------------ | --------------------------- | ------------------------------------ |
    | `openai/gpt-5.5`       | sin definir, o provider/model `agentRuntime.id: "codex"` | Arnés de app-server Codex | Perfil de autenticación con clave de API ordenado |
    | `openai/gpt-5.4-mini`  | sin definir, o provider/model `agentRuntime.id: "codex"` | Arnés de app-server Codex | Perfil de autenticación con clave de API ordenado |
    | `openai/gpt-5.5`       | provider/model `agentRuntime.id: "openclaw"`          | Runtime integrado de OpenClaw | Perfil de clave de API `openai` seleccionado  |

    <Note>
    Los turnos de agente en `openai/*` usan el arnés de app-server de Codex de forma predeterminada. Para
    autenticación con clave de API en un modelo de agente, crea un perfil de autenticación con clave de API de `openai` y
    ordénalo con `auth.order.openai`; `OPENAI_API_KEY` sigue siendo el respaldo directo
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

    Para probar el modelo Instant actual de ChatGPT desde la API de OpenAI, establece el modelo
    en `openai/chat-latest`:

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` es un alias cambiante. OpenAI recomienda `gpt-5.5` para el uso de API
    en producción, así que mantén `openai/gpt-5.5` como valor predeterminado estable salvo que quieras
    ese comportamiento de alias. El alias solo acepta verbosidad de texto `medium`;
    OpenClaw fuerza cualquier otra verbosidad solicitada a `medium` para este modelo.

    <Warning>
    OpenClaw **no** expone `gpt-5.3-codex-spark` en la ruta directa de
    clave de API de OpenAI. Solo está disponible mediante entradas del catálogo de suscripción de Codex
    cuando tu cuenta con sesión iniciada lo expone.
    </Warning>

  </Tab>

  <Tab title="Codex subscription">
    **Ideal para:** usar tu suscripción de ChatGPT/Codex con ejecución nativa de
    app-server de Codex en lugar de una clave de API separada. Codex cloud requiere
    iniciar sesión en ChatGPT.

    <Steps>
      <Step title="Run Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai
        ```

        O ejecuta OAuth directamente:

        ```bash
        openclaw models auth login --provider openai
        ```

        Para configuraciones sin interfaz o problemáticas con callbacks, agrega `--device-code` para iniciar
        sesión con un flujo de código de dispositivo de ChatGPT en lugar del callback de navegador
        localhost:

        ```bash
        openclaw models auth login --provider openai --device-code
        ```
      </Step>
      <Step title="Use the canonical OpenAI model route">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        No se requiere configuración de runtime para la ruta predeterminada. Los turnos de agente de OpenAI
        seleccionan automáticamente el runtime nativo de app-server de Codex, y
        OpenClaw instala o repara el Plugin de Codex incluido cuando se elige esta ruta.
      </Step>
      <Step title="Verify Codex auth is available">
        ```bash
        openclaw models list --provider openai
        ```

        Después de que Gateway esté en ejecución, envía `/codex status` o `/codex models`
        en el chat para verificar el runtime nativo de app-server.
      </Step>
    </Steps>

    ### Resumen de rutas

    | Referencia de modelo                | Configuración de runtime                                | Ruta                                                  | Autenticación                                            |
    | -------------------------- | ------------------------------------------------ | --------------------------------------------------------- | -------------------------------------------------- |
    | `openai/gpt-5.5`         | sin establecer, o `agentRuntime.id: "codex"` de proveedor/modelo | Arnés nativo de app-server de Codex                        | Inicio de sesión de Codex, o un perfil de autenticación `openai` ordenado |
    | `openai/gpt-5.5`         | `agentRuntime.id: "openclaw"` de proveedor/modelo  | Runtime integrado de OpenClaw, transporte interno con autenticación de Codex | Perfil OAuth `openai` seleccionado                 |
    | Referencia heredada Codex GPT-5.5 | reparada por doctor                            | Reescrita a `openai/gpt-5.5`                            | Perfil OAuth de OpenAI migrado                   |
    | `codex-cli/gpt-5.5`      | reparada por doctor                            | Reescrita a `openai/gpt-5.5`                            | Autenticación de app-server de Codex                           |

    <Warning>
    Prefiere `openai/gpt-5.5` para la nueva configuración de agente respaldada por suscripción. Las referencias
    antiguas de Codex GPT son rutas heredadas de OpenClaw, no la ruta nativa del runtime de Codex;
    ejecuta `openclaw doctor --fix` para migrarlas. `gpt-5.3-codex-spark`
    sigue limitado a cuentas cuyo catálogo de suscripción de Codex lo anuncia;
    las referencias directas de clave de API de OpenAI y Azure para él permanecen suprimidas.
    </Warning>

    <Note>
    La nueva configuración debe colocar el orden de autenticación de agente de OpenAI bajo `auth.order.openai`;
    doctor migra las entradas antiguas heredadas de orden de autenticación de Codex.
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

    Con un respaldo de clave de API, mantén el modelo en `openai/gpt-5.5` y coloca el
    orden de autenticación bajo `openai`. OpenClaw prueba primero la suscripción y luego la
    clave de API, mientras se mantiene en el arnés de Codex:

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
    El onboarding ya no importa material OAuth desde `~/.codex`. Inicia sesión con
    OAuth de navegador (predeterminado) o el flujo de código de dispositivo anterior; OpenClaw administra las
    credenciales resultantes en su propio almacén de autenticación de agente.
    </Note>

    ### Comprobar y recuperar el enrutamiento OAuth de Codex

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

    Si una configuración antigua todavía tiene referencias heredadas Codex GPT, o un pin obsoleto de sesión de runtime de OpenAI
    sin configuración explícita de runtime, repáralo:

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

    Usa `--profile-id` para varios inicios de sesión OAuth de Codex en el mismo agente, y luego
    contrólalos mediante el orden de autenticación o `/model ...@<profileId>`:

    ```bash
    openclaw models auth login --provider openai --profile-id openai:ritsuko
    openclaw models auth login --provider openai --profile-id openai:lain
    ```

    Ejecuta `openclaw doctor --fix` para migrar ids de perfil con prefijo heredado OpenAI Codex
    y entradas de orden antes de depender del orden de perfiles.

    ### Indicador de estado

    El chat `/status` muestra qué runtime de modelo está activo para la
    sesión actual. El arnés de app-server de Codex incluido aparece como
    `Runtime: OpenAI Codex` para turnos de agente `openai/*`. Los pins obsoletos de sesión de runtime de OpenAI
    se reparan a Codex salvo que la configuración fije explícitamente OpenClaw.

    ### Advertencia de doctor

    Si referencias heredadas de modelo de Codex o pins obsoletos de runtime de OpenAI permanecen en la configuración
    o en el estado de sesión, `openclaw doctor --fix` los reescribe a `openai/*` con
    el runtime de Codex salvo que OpenClaw esté configurado explícitamente.

    ### Límite de ventana de contexto

    OpenClaw trata los metadatos del modelo y el límite de contexto del runtime como valores
    separados. Para `openai/gpt-5.5` mediante el catálogo OAuth de Codex:

    - `contextWindow` nativa: `400000`
    - Límite predeterminado de `contextTokens` del runtime: `272000`

    El límite predeterminado más pequeño tiene mejores características de latencia y calidad en
    la práctica. Sobrescríbelo con `contextTokens`:

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
    para limitar el presupuesto de contexto del runtime. La ruta directa de clave de API de OpenAI
    informa una `contextWindow` nativa mayor (`1000000`) para `gpt-5.5`; las dos
    rutas se rastrean por separado porque los catálogos upstream difieren.
    </Note>

    ### Recuperación de catálogo

    OpenClaw usa metadatos del catálogo upstream de Codex para `gpt-5.5` cuando están
    presentes. Si el descubrimiento en vivo de Codex omite la fila `gpt-5.5` mientras la cuenta
    está autenticada, OpenClaw sintetiza esa fila de modelo OAuth para que las ejecuciones de Cron,
    subagente y modelo predeterminado configurado no fallen con
    `Unknown model`.

  </Tab>
</Tabs>

## Autenticación nativa del app-server de Codex

El arnés nativo de app-server de Codex usa referencias de modelo `openai/*` con la configuración de runtime
sin establecer o `agentRuntime.id: "codex"` de proveedor/modelo, pero su autenticación
sigue basándose en la cuenta. OpenClaw selecciona la autenticación en este orden:

1. Perfiles de autenticación de OpenAI ordenados para el agente, preferiblemente bajo
   `auth.order.openai`. Ejecuta `openclaw doctor --fix` para migrar ids antiguos heredados
   de perfil de autenticación de Codex y el orden de autenticación.
2. La cuenta existente del app-server, como un inicio de sesión local de ChatGPT en la CLI de Codex.
3. Solo para lanzamientos locales de app-server por stdio, y solo cuando el app-server
   informa que no hay cuenta: `CODEX_API_KEY`, luego `OPENAI_API_KEY`.

Un inicio de sesión local de suscripción de ChatGPT/Codex no se reemplaza solo porque el
proceso de Gateway también tenga `OPENAI_API_KEY` para modelos directos de OpenAI o
embeddings. El respaldo de clave de API de env solo aplica a la ruta local stdio sin cuenta;
nunca se envía por conexiones WebSocket de app-server. Cuando se
selecciona un perfil de Codex de estilo suscripción, OpenClaw también mantiene
`CODEX_API_KEY` y `OPENAI_API_KEY` fuera del proceso hijo de app-server por stdio generado
y envía las credenciales seleccionadas mediante el RPC de inicio de sesión del app-server.

Cuando ese perfil de suscripción está bloqueado por un límite de uso de Codex, OpenClaw
marca el perfil como bloqueado hasta la hora de restablecimiento anunciada por Codex y permite que el orden de autenticación
rote al siguiente perfil `openai:*`, sin cambiar el modelo seleccionado
ni salir del arnés de Codex. Una vez que pasa la hora de restablecimiento, el
perfil de suscripción vuelve a ser elegible.

## Generación de imágenes

El Plugin `openai` incluido registra la generación de imágenes mediante la herramienta
`image_generate`. Admite generación de imágenes tanto con clave de API de OpenAI como con OAuth de Codex
mediante la misma referencia de modelo `openai/gpt-image-2`.

| Capacidad                | Clave de API de OpenAI                     | OAuth de Codex                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Referencia de modelo                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Autenticación                      | `OPENAI_API_KEY`                   | Inicio de sesión OAuth OpenAI Codex           |
| Transporte                 | API de imágenes de OpenAI                  | Backend de Responses de Codex              |
| Imágenes máximas por solicitud    | 4                                  | 4                                    |
| Modo de edición                 | Habilitado (hasta 5 imágenes de referencia) | Habilitado (hasta 5 imágenes de referencia)   |
| Sobrescrituras de tamaño            | Admitidas, incluidos tamaños 2K/4K   | Admitidas, incluidos tamaños 2K/4K     |
| Relación de aspecto / resolución | No se reenvía a la API de imágenes de OpenAI | Se asigna a un tamaño admitido cuando es seguro |

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
Consulta [Generación de imágenes](/es/tools/image-generation) para ver parámetros compartidos de herramientas,
selección de proveedor y comportamiento de conmutación por error.
</Note>

`gpt-image-2` es el valor predeterminado para la generación de texto a imagen y la
edición de imágenes de OpenAI. `gpt-image-1.5`, `gpt-image-1` y `gpt-image-1-mini` siguen siendo utilizables
como sobrescrituras explícitas de modelo. Usa `openai/gpt-image-1.5` para
salida PNG/WebP con fondo transparente; la API actual de `gpt-image-2` rechaza
`background: "transparent"`.

Para una solicitud con fondo transparente, llama a `image_generate` con
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` o `"webp"`, y
`background: "transparent"`; la opción de proveedor `openai.background` anterior
sigue aceptándose. OpenClaw también protege las rutas públicas OAuth de OpenAI y OpenAI Codex
reescribiendo las solicitudes transparentes predeterminadas de `openai/gpt-image-2` a
`gpt-image-1.5`; Azure y los endpoints personalizados compatibles con OpenAI conservan sus
nombres de implementación/modelo configurados.

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
`openclaw infer image edit` al empezar desde un archivo de entrada.
`--openai-background` sigue disponible como alias específico de OpenAI. Usa
`--quality low|medium|high|auto` para controlar la calidad y el coste de OpenAI Images.
Usa `--openai-moderation low|auto` para pasar la sugerencia de moderación de OpenAI desde
`image generate` o `image edit`.

Para instalaciones OAuth de ChatGPT/Codex, conserva la misma referencia `openai/gpt-image-2`. Cuando
se configura un perfil OAuth de `openai`, OpenClaw resuelve ese token de acceso OAuth
almacenado y envía las solicitudes de imagen mediante el backend Codex Responses; no
intenta primero `OPENAI_API_KEY` ni recurre silenciosamente a una clave de API.
Configura `models.providers.openai` explícitamente con una clave de API, una URL base
personalizada o un endpoint de Azure cuando quieras usar la ruta directa de la API de OpenAI Images
en su lugar. Si ese endpoint de imagen personalizado está en una dirección LAN/privada de confianza,
configura también `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw
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

El Plugin `openai` incluido registra la generación de video mediante la
herramienta `video_generate`.

| Capacidad               | Valor                                                                                         |
| ----------------------- | --------------------------------------------------------------------------------------------- |
| Modelo predeterminado   | `openai/sora-2`                                                                               |
| Modos                   | Texto a video, imagen a video, edición de un solo video                                       |
| Entradas de referencia  | 1 imagen o 1 video                                                                            |
| Sobrescrituras de tamaño | Compatibles con texto a video e imagen a video                                                |
| Relación de aspecto     | Convertida al tamaño compatible más cercano, no reenviada sin procesar                        |
| Otras sobrescrituras    | `resolution`, `audio`, `watermark` no son compatibles y se descartan con una advertencia de herramienta |

Las solicitudes de imagen a video de OpenAI usan `POST /v1/videos` con una imagen
`input_reference`. Las ediciones de un solo video usan `POST /v1/videos/edits` con el
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
Consulta [Generación de video](/es/tools/video-generation) para ver los parámetros de herramienta compartidos,
la selección de proveedor y el comportamiento de conmutación por error.

El proveedor de OpenAI declara `supportsSize`, pero no `supportsAspectRatio` ni
`supportsResolution`. La capa de normalización compartida de OpenClaw convierte una
solicitud de `aspectRatio` al `size` de OpenAI más cercano antes de que la
solicitud llegue al proveedor, por lo que las solicitudes de relación de aspecto suelen funcionar.
`resolution` no tiene alternativa de tamaño y se descarta, y se muestra al llamador como
`Ignored unsupported overrides for openai/<model>: resolution=<value>`.
</Note>

## Contribución de prompt de GPT-5

OpenClaw añade una contribución de prompt de GPT-5 compartida para modelos de la familia GPT-5 en
el proveedor `openai` (incluidas las referencias heredadas de Codex anteriores a la reparación que se normalizan
a `openai/*`). Otros proveedores que también sirven identificadores de modelo de la familia GPT-5, como
OpenRouter o rutas de opencode, no reciben esta superposición; está condicionada al
identificador de proveedor `openai`, no solo al identificador de modelo. Los modelos GPT-4.x anteriores nunca
la reciben.

El arnés de servidor de aplicaciones nativo de Codex no recibe el contrato de comportamiento de persona/disciplina
de herramientas ni la superposición amistosa de estilo de interacción mediante
instrucciones de desarrollador; Codex nativo conserva el comportamiento base, de modelo y de
documentación de proyecto propiedad de Codex, y OpenClaw desactiva la personalidad integrada de Codex para
hilos nativos, de modo que los archivos de personalidad del espacio de trabajo del agente sigan siendo autoritativos.
OpenClaw solo aporta contexto de tiempo de ejecución a los hilos nativos de Codex: entrega por canal,
herramientas dinámicas de OpenClaw, delegación ACP, contexto del espacio de trabajo y
Skills de OpenClaw. El texto de guía de Heartbeat de esta misma contribución es la
única excepción: los turnos de Heartbeat de Codex nativo sí lo reciben, inyectado como
instrucciones de colaboración dedicadas en lugar de mediante el hook compartido de contribución de prompt.

La contribución de GPT-5 agrega un contrato de comportamiento etiquetado para la
persistencia de persona, la seguridad de ejecución, la disciplina de herramientas,
la forma de salida, las comprobaciones de finalización y la verificación en prompts
ensamblados por OpenClaw que coinciden. El comportamiento de respuesta específico
del canal y de mensajes silenciosos permanece en el prompt de sistema compartido de
OpenClaw y en la política de entrega saliente. La capa de estilo de interacción
amigable es independiente y configurable.

| Valor                  | Efecto                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (predeterminado) | Habilita la capa de estilo de interacción amigable |
| `"on"`                 | Alias de `"friendly"`                      |
| `"off"`                | Deshabilita solo la capa de estilo amigable       |

<Tabs>
  <Tab title="Config">
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
Los valores no distinguen entre mayúsculas y minúsculas en tiempo de ejecución, por
lo que `"Off"` y `"off"` deshabilitan ambos la capa de estilo amigable.
</Tip>

<Note>
La opción heredada `plugins.entries.openai.config.personality` todavía se lee como
respaldo de compatibilidad cuando no está configurado el ajuste compartido
`agents.defaults.promptOverlays.gpt5.personality`.
</Note>

## Voz y habla

<AccordionGroup>
  <Accordion title="Speech synthesis (TTS)">
    El Plugin `openai` incluido registra la síntesis de voz para la superficie
    `messages.tts`.

    | Ajuste      | Ruta de configuración                                            | Predeterminado                          |
    | ------------- | --------------------------------------------------------- | ----------------------------------- |
    | Modelo        | `messages.tts.providers.openai.model`                  | `gpt-4o-mini-tts`                |
    | Voz        | `messages.tts.providers.openai.speakerVoice`           | `coral`                          |
    | Velocidad        | `messages.tts.providers.openai.speed`                  | (sin configurar)                          |
    | Instrucciones | `messages.tts.providers.openai.instructions`           | (sin configurar, solo `gpt-4o-mini-tts`)  |
    | Formato       | `messages.tts.providers.openai.responseFormat`         | `opus` para notas de voz, `mp3` para archivos |
    | Clave de API      | `messages.tts.providers.openai.apiKey`                 | Recurre a `OPENAI_API_KEY`   |
    | URL base     | `messages.tts.providers.openai.baseUrl`                | `https://api.openai.com/v1`      |
    | Cuerpo adicional   | `messages.tts.providers.openai.extraBody` / `extra_body` | (sin configurar)                        |

    Modelos disponibles: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Voces disponibles:
    `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`,
    `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` se combina en el JSON de solicitud de `/audio/speech` después de
    los campos generados por OpenClaw, así que úsalo para endpoints compatibles con
    OpenAI que requieren claves adicionales como `lang`. Las claves de prototipo se ignoran.

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
    Configura `OPENAI_TTS_BASE_URL` para anular la URL base de TTS sin afectar
    el endpoint de la API de chat. Tanto OpenAI TTS como la voz Realtime se configuran
    mediante una clave de API de OpenAI Platform; las instalaciones solo con OAuth
    aún pueden usar modelos de chat respaldados por Codex, pero no respuesta hablada
    en vivo de OpenAI.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    El Plugin `openai` incluido registra voz a texto por lotes mediante la
    superficie de transcripción de comprensión multimedia de OpenClaw.

    - Modelo predeterminado: `gpt-4o-transcribe`
    - Endpoint: REST de OpenAI `/v1/audio/transcriptions`
    - Ruta de entrada: carga de archivo de audio multipart
    - Se usa dondequiera que la transcripción de audio entrante lee `tools.media.audio`,
      incluidos segmentos de canales de voz de Discord y adjuntos de audio de canales

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
    configuración multimedia de audio compartida o la solicitud de transcripción por llamada.

  </Accordion>

  <Accordion title="Realtime transcription">
    El Plugin `openai` incluido registra transcripción en tiempo real para el
    Plugin Voice Call.

    | Ajuste          | Ruta de configuración                                                          | Predeterminado |
    | ----------------- | ----------------------------------------------------------------------- | --------- |
    | Modelo            | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Idioma         | `...openai.language`                                                 | (sin configurar) |
    | Prompt           | `...openai.prompt`                                                   | (sin configurar) |
    | Duración del silencio | `...openai.silenceDurationMs`                                        | `800`   |
    | Umbral de VAD    | `...openai.vadThreshold`                                             | `0.5`   |
    | Autenticación             | `...openai.apiKey`, `OPENAI_API_KEY`, u OAuth de `openai`              | Las claves de API se conectan directamente; OAuth emite un secreto de cliente de transcripción Realtime |

    <Note>
    Usa una conexión WebSocket a `wss://api.openai.com/v1/realtime` con audio
    G.711 u-law (`g711_ulaw` / `audio/pcmu`). Cuando solo está configurado OAuth de `openai`,
    el Gateway emite un secreto efímero de cliente de transcripción Realtime antes de abrir el
    WebSocket. Este proveedor de streaming es para la ruta de transcripción en tiempo real de
    Voice Call; actualmente, la voz de Discord graba segmentos cortos y usa en su lugar
    la ruta de transcripción por lotes `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Voz en tiempo real">
    El plugin `openai` incluido registra voz en tiempo real para el plugin Voice Call.

    | Ajuste                               | Ruta de configuración                                                              | Predeterminado             |
    | --------------------------------------- | ---------------------------------------------------------------------------- | ---------------------- |
    | Modelo                                  | `plugins.entries.voice-call.config.realtime.providers.openai.model`     | `gpt-realtime-2`    |
    | Voz                                  | `...openai.voice`                                                       | `alloy`             |
    | Temperatura (puente de despliegue de Azure)  | `...openai.temperature`                                                 | `0.8`               |
    | Umbral de VAD                          | `...openai.vadThreshold`                                                | `0.5`                |
    | Duración del silencio                       | `...openai.silenceDurationMs`                                           | `500`                |
    | Relleno de prefijo                         | `...openai.prefixPaddingMs`                                             | `300`                |
    | Esfuerzo de razonamiento                       | `...openai.reasoningEffort`                                             | (sin definir)              |
    | Autenticación                                   | perfil de autenticación con clave de API `openai`, `...openai.apiKey` u `OPENAI_API_KEY`  | Se requiere clave de API de OpenAI Platform; OpenAI OAuth no configura la voz en tiempo real |

    Voces integradas de Realtime disponibles para `gpt-realtime-2`: `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`.
    OpenAI recomienda `marin` y `cedar` para obtener la mejor calidad de Realtime. Este
    es un conjunto separado de las voces de texto a voz anteriores; una voz solo de TTS
    como `fable`, `nova` u `onyx` no es válida para sesiones de Realtime.

    <Note>
    Los puentes OpenAI realtime de backend usan la forma de sesión WebSocket de Realtime
    GA, que no acepta `session.temperature`. Los despliegues de Azure OpenAI
    siguen estando disponibles mediante `azureEndpoint` y `azureDeployment`, y
    conservan la forma de sesión compatible con despliegues (incluido `temperature`).
    Admite llamadas a herramientas bidireccionales y audio G.711 u-law.
    </Note>

    <Note>
    La voz en tiempo real se selecciona cuando se crea la sesión. OpenAI permite cambiar
    la mayoría de los campos de sesión más adelante, pero la voz no se puede cambiar después de que el
    modelo haya emitido audio en esa sesión. OpenClaw actualmente expone los
    id. de voz de Realtime integrados como cadenas.
    </Note>

    <Note>
    Talk de Control UI usa sesiones realtime de navegador de OpenAI con un secreto de cliente efímero
    emitido por el Gateway y un intercambio SDP WebRTC directo del navegador
    contra la API Realtime de OpenAI. El Gateway emite ese secreto de cliente con
    el perfil de autenticación con clave de API `openai` seleccionado o la clave de API de OpenAI Platform
    configurada. El relay del Gateway y los puentes WebSocket realtime de backend de Voice Call
    usan la misma ruta de autenticación solo con clave de API para endpoints nativos de OpenAI.
    La verificación en vivo para mantenedores está disponible con
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    los tramos de OpenAI verifican tanto el puente WebSocket de backend como el intercambio SDP WebRTC
    del navegador sin registrar secretos.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoints de Azure OpenAI

El proveedor `openai` incluido puede apuntar a un recurso de Azure OpenAI para la generación de imágenes
sobrescribiendo la URL base. En la ruta de generación de imágenes, OpenClaw
detecta nombres de host de Azure en `models.providers.openai.baseUrl` y cambia a
la forma de solicitud de Azure automáticamente.

<Note>
La voz en tiempo real usa una ruta de configuración separada
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
y no se ve afectada por `models.providers.openai.baseUrl`. Consulta el acordeón **Voz en tiempo real**
en [Voz y habla](#voice-and-speech) para sus ajustes de Azure.
</Note>

Usa Azure OpenAI cuando:

- Ya tienes una suscripción, cuota o acuerdo empresarial de Azure OpenAI
- Necesitas residencia regional de datos o controles de cumplimiento que proporciona Azure
- Quieres mantener el tráfico dentro de una tenencia de Azure existente

### Configuración

Para generar imágenes en Azure mediante el proveedor `openai` incluido, apunta
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

OpenClaw reconoce estos sufijos de host de Azure para la ruta de generación de imágenes de Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Para solicitudes de generación de imágenes en un host de Azure reconocido, OpenClaw:

- Envía el encabezado `api-key` en lugar de `Authorization: Bearer`
- Usa rutas con ámbito de despliegue (`/openai/deployments/{deployment}/...`)
- Añade `?api-version=...` a cada solicitud
- Usa un tiempo de espera de solicitud predeterminado de 600 s para llamadas de generación de imágenes de Azure.
  Los valores `timeoutMs` por llamada siguen sobrescribiendo este valor predeterminado.

Otras URL base (OpenAI público, proxies compatibles con OpenAI) mantienen la forma estándar
de solicitud de imágenes de OpenAI.

<Note>
El enrutamiento de Azure para la ruta de generación de imágenes del proveedor `openai` requiere
OpenClaw 2026.4.22 o posterior. Las versiones anteriores tratan cualquier
`openai.baseUrl` personalizado como el endpoint público de OpenAI y fallan con despliegues de imágenes
de Azure.
</Note>

### Versión de la API

Establece `AZURE_OPENAI_API_VERSION` para fijar una versión específica de Azure preview o GA
para la ruta de generación de imágenes de Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

El valor predeterminado es `2024-12-01-preview` cuando la variable no está definida.

### Los nombres de modelo son nombres de despliegue

Azure OpenAI vincula modelos a despliegues. Para solicitudes de generación de imágenes de Azure
enrutadas mediante el proveedor `openai` incluido, el campo `model` en OpenClaw
debe ser el **nombre de despliegue de Azure** que configuraste en el portal de Azure, no
el id. de modelo público de OpenAI.

Si creas un despliegue llamado `gpt-image-2-prod` que sirve `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

La misma regla de nombre de despliegue se aplica a cualquier llamada de generación de imágenes enrutada
mediante el proveedor `openai` incluido.

### Disponibilidad regional

La generación de imágenes de Azure está disponible actualmente solo en un subconjunto de regiones
(por ejemplo `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Consulta la lista actual de regiones de Microsoft antes de crear un
despliegue y confirma que el modelo específico se ofrezca en tu región.

### Diferencias de parámetros

Azure OpenAI y OpenAI público no siempre aceptan los mismos parámetros de imagen.
Azure puede rechazar opciones que OpenAI público permite (por ejemplo, ciertos valores de
`background` en `gpt-image-2`) o exponerlas solo en versiones específicas de modelo.
Estas diferencias provienen de Azure y del modelo subyacente, no de
OpenClaw. Si una solicitud de Azure falla con un error de validación, consulta el
conjunto de parámetros admitido por tu despliegue y versión de API específicos en el
portal de Azure.

<Note>
Azure OpenAI usa transporte nativo y comportamiento de compatibilidad, pero no recibe
los encabezados de atribución ocultos de OpenClaw; consulta el acordeón **Rutas nativas vs. compatibles con OpenAI**
en [Configuración avanzada](#advanced-configuration).

Para tráfico de chat o Responses en Azure (más allá de la generación de imágenes), usa el
flujo de incorporación o una configuración de proveedor de Azure dedicada; `openai.baseUrl` por sí solo
no adopta la forma de API/autenticación de Azure. Existe un proveedor separado
`azure-openai-responses/*`; consulta el acordeón Compaction del lado del servidor
a continuación.
</Note>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Transporte (WebSocket vs SSE)">
    OpenClaw usa primero WebSocket con respaldo SSE (`"auto"`) para `openai/*`.

    En modo `"auto"`, OpenClaw:
    - Reintenta un fallo temprano de WebSocket antes de recurrir a SSE
    - Después de un fallo, marca WebSocket como degradado durante 60 segundos y usa SSE
      durante el enfriamiento
    - Adjunta encabezados estables de identidad de sesión y turno para reintentos y
      reconexiones
    - Normaliza contadores de uso (`input_tokens` / `prompt_tokens`) entre
      variantes de transporte

    | Valor                | Comportamiento                          |
    | ---------------------- | ------------------------------------ |
    | `"auto"` (predeterminado)   | WebSocket primero, respaldo SSE     |
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

    Cuando está activado, OpenClaw asigna el modo rápido al procesamiento prioritario de OpenAI
    (`service_tier = "priority"`). Los valores `service_tier` existentes se
    conservan, y el modo rápido no reescribe `reasoning` ni
    `text.verbosity`. `fastMode: "auto"` inicia las nuevas llamadas de modelo rápido hasta el
    límite automático, y luego inicia llamadas posteriores de reintento, respaldo, resultado de herramienta o
    continuación sin modo rápido. El límite predeterminado es 60 segundos;
    establece `params.fastAutoOnSeconds` en el modelo activo para cambiarlo.

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
    Las anulaciones de sesión prevalecen sobre la configuración. Borrar la anulación de sesión en la
    UI de sesiones devuelve la sesión al valor predeterminado configurado.
    </Note>

  </Accordion>

  <Accordion title="Procesamiento prioritario (service_tier)">
    La API de OpenAI expone el procesamiento prioritario mediante `service_tier`. Establécelo por
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
    `serviceTier` se reenvía solo a endpoints nativos de OpenAI
    (`api.openai.com`) y endpoints nativos de Codex (`chatgpt.com/backend-api`).
    Si enrutas cualquiera de los proveedores mediante un proxy, OpenClaw deja
    `service_tier` sin modificar.
    </Warning>

  </Accordion>

  <Accordion title="Compaction del lado del servidor (API Responses)">
    Para modelos directos de OpenAI Responses (`openai/*` en `api.openai.com`), el
    contenedor de stream de OpenClaw del plugin de OpenAI activa automáticamente la Compaction
    del lado del servidor:

    - Fuerza `store: true` (salvo que la compatibilidad del modelo establezca `supportsStore: false`)
    - Inyecta `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` predeterminado: 70 % de `contextWindow` (o `80000` cuando
      no esté disponible)

    Esto se aplica a la ruta de runtime integrada de OpenClaw y a los hooks del proveedor OpenAI
    usados por ejecuciones integradas. El arnés de servidor de aplicaciones nativo de Codex gestiona
    su propio contexto mediante Codex y no se ve afectado por este ajuste.

    <Tabs>
      <Tab title="Activar explícitamente">
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
    Los modelos directos de OpenAI Responses siguen forzando `store: true` a menos que la compatibilidad
    establezca `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Modo GPT strict-agentic">
    Para los modelos de la familia GPT-5 del proveedor `openai` ejecutados mediante el
    runtime integrado de OpenClaw, OpenClaw ya usa de forma predeterminada un contrato de ejecución más estricto llamado
    `strict-agentic`. Se activa automáticamente siempre que el proveedor resuelto sea
    `openai` y el id del modelo coincida con la familia GPT-5, a menos que la configuración
    lo desactive explícitamente:

    ```json5
    {
      agents: {
        defaults: {
          embeddedAgent: { executionContract: "default" },
        },
      },
    }
    ```

    Establecer `"strict-agentic"` explícitamente no tiene efecto en una vía compatible (ya
    es el valor predeterminado) y queda inerte en pares proveedor/modelo no compatibles.

    Con `strict-agentic` activo, OpenClaw:
    - Activa automáticamente `update_plan` para trabajo sustancial
    - Reintenta turnos estructuralmente vacíos o solo de razonamiento con una continuación
      de respuesta visible
    - Usa eventos explícitos de plan del arnés cuando el arnés seleccionado los proporciona

    OpenClaw no clasifica la prosa del asistente para decidir si un turno es un
    plan, una actualización de progreso o una respuesta final.

    <Note>
    Este contrato vive por completo en el ejecutor de agente integrado de OpenClaw. No
    se aplica al arnés nativo del servidor de aplicación de Codex, que gestiona su propio
    comportamiento de turnos y planes; la selección del arnés importa más que la
    configuración del contrato de ejecución para las ejecuciones nativas de Codex.
    </Note>

  </Accordion>

  <Accordion title="Rutas nativas frente a compatibles con OpenAI">
    OpenClaw trata los endpoints directos de OpenAI, Codex y Azure OpenAI
    de forma diferente a los proxies `/v1` genéricos compatibles con OpenAI:

    **Rutas nativas** (`openai/*`, Azure OpenAI):
    - Mantienen `reasoning: { effort: "none" }` solo para modelos que admiten el
      esfuerzo `none` de OpenAI
    - Omiten el razonamiento deshabilitado para modelos o proxies que rechazan
      `reasoning.effort: "none"`
    - Usan de forma predeterminada el modo estricto para los esquemas de herramientas
    - Adjuntan encabezados de atribución ocultos solo en hosts nativos verificados (Azure
      OpenAI no recibe estos encabezados, aunque sea una ruta nativa)
    - Mantienen la conformación de solicitudes exclusiva de OpenAI (`service_tier`, `store`,
      compatibilidad de razonamiento, indicaciones de caché de prompts)

    **Rutas de proxy/compatibles:**
    - Usan un comportamiento de compatibilidad más flexible
    - Eliminan `store` de Completions de las cargas útiles `openai-completions` no nativas
    - Aceptan JSON avanzado de paso directo `params.extra_body`/`params.extraBody`
      para proxies de Completions compatibles con OpenAI
    - Aceptan `params.chat_template_kwargs` para proxies de Completions compatibles con OpenAI
      como vLLM
    - No fuerzan esquemas estrictos de herramientas ni encabezados exclusivos de rutas nativas

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelo" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="Generación de imágenes" href="/es/tools/image-generation" icon="image">
    Parámetros compartidos de la herramienta de imágenes y selección de proveedor.
  </Card>
  <Card title="Generación de vídeo" href="/es/tools/video-generation" icon="video">
    Parámetros compartidos de la herramienta de vídeo y selección de proveedor.
  </Card>
  <Card title="OAuth y autenticación" href="/es/gateway/authentication" icon="key">
    Detalles de autenticación y reglas de reutilización de credenciales.
  </Card>
</CardGroup>
