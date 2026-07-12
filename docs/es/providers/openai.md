---
read_when:
    - Quieres usar modelos de OpenAI en OpenClaw
    - Quieres usar la autenticación mediante suscripción de Codex en lugar de claves de API
    - Necesitas un comportamiento de ejecución de agentes GPT-5 más estricto
summary: Usar OpenAI mediante claves de API o una suscripción a Codex en OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-07-12T14:48:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: bc433abdf4fb8984430054acecdda3ba01b9795ad52cc89b19e10b09c6bcc8c3
    source_path: providers/openai.md
    workflow: 16
---

OpenClaw usa un único id de proveedor, `openai`, tanto para la autenticación directa mediante clave de API como para la autenticación de suscripción de ChatGPT/Codex. `openai/*` es la ruta de modelo canónica.
Para los turnos de agentes integrados cuya política de entorno de ejecución no esté configurada o sea `auto`, los datos de ruta de OpenAI determinan si OpenClaw puede seleccionar implícitamente el entorno de ejecución incluido del servidor de aplicaciones Codex. El prefijo `openai/*` por sí solo no selecciona un entorno de ejecución.

- **Modelos de agente** - `openai/*` mediante el entorno de ejecución seleccionado por la configuración explícita de `agentRuntime` o la política de ruta implícita de OpenAI. Inicie sesión con la autenticación de Codex para usar una suscripción de ChatGPT/Codex o configure un perfil de autenticación mediante clave de API si desea facturación basada en claves.
- **API de OpenAI ajenas a agentes** - acceso directo a OpenAI Platform, facturado por uso, mediante `OPENAI_API_KEY` o un perfil `openai` de autenticación mediante clave de API.
- **Configuración heredada** - `openclaw doctor --fix` repara las referencias antiguas a modelos Codex y los ids de perfil para convertirlos a `openai/*`.

OpenAI admite explícitamente el uso de OAuth de suscripción en herramientas externas y flujos de trabajo como OpenClaw.

## Seguimiento del uso y los costes

OpenClaw mantiene separadas la cuota de suscripción y la facturación de la API de Platform:

- OAuth de ChatGPT/Codex muestra el plan de suscripción, los períodos de cuota y el saldo de créditos.
- `OPENAI_ADMIN_KEY` muestra en **Usage** de la interfaz de control 30 días de costes de la organización y uso de completions notificados por el proveedor, incluidos el gasto diario, los totales de solicitudes/tokens, los modelos principales y las categorías de costes.
- `OPENAI_PROJECT_ID` limita opcionalmente el historial de la API de administración a un proyecto.
- OpenClaw nunca envía `OPENAI_API_KEY` ni un perfil de inferencia `openai` a las API de la organización; esas credenciales pueden pertenecer a endpoints personalizados, de Azure o locales del agente.

Una clave de administración explícita tiene prioridad sobre OAuth. El historial notificado por el proveedor no se combina con el coste estimado que OpenClaw deriva de las sesiones; puede incluir actividad de la API procedente de otros clientes y ajustes de facturación del proveedor.

La documentación del [panel de uso de la API](https://help.openai.com/en/articles/10478918) de OpenAI describe los requisitos de propietario de la organización y de permiso explícito para el panel de uso necesarios para acceder a los datos de uso.

El proveedor, el modelo, el entorno de ejecución y el canal son capas independientes. Si se están mezclando esas etiquetas, consulte [Entornos de ejecución de agentes](/es/concepts/agent-runtimes) antes de cambiar la configuración.

## Elección rápida

| Objetivo                                          | Uso                                                                | Notas                                                               |
| ------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------- |
| Suscripción de ChatGPT/Codex, entorno de ejecución nativo de Codex | `openai/gpt-5.6-sol`                                               | Configuración nueva de suscripción; inicie sesión con la autenticación de Codex. |
| Facturación directa mediante clave de API para turnos de agentes | `openai/gpt-5.6` más un perfil ordenado de autenticación mediante clave de API | Configuración nueva de clave de API; el id básico de API directa se resuelve como Sol. |
| Elegir un nivel exacto de GPT-5.6                 | `openai/gpt-5.6-sol`, `-terra` o `-luna`                          | Consulte `models list` para conocer los niveles disponibles para esta cuenta. |
| Cuenta sin acceso a GPT-5.6                       | `openai/gpt-5.5`                                                   | Opción explícita de recuperación; OpenClaw no cambia silenciosamente a una versión inferior. |
| Facturación directa mediante clave de API, entorno de ejecución explícito de OpenClaw | `openai/gpt-5.6` más `agentRuntime.id: "openclaw"` de proveedor/modelo | Seleccione un perfil normal `openai` de clave de API.               |
| Alias del modelo ChatGPT Instant más reciente     | `openai/chat-latest`                                               | Solo para clave de API directa; es un alias variable, no el valor predeterminado estable. |
| Generación o edición de imágenes                  | `openai/gpt-image-2`                                               | Funciona con `OPENAI_API_KEY` u OAuth de Codex.                     |
| Imágenes con fondo transparente                   | `openai/gpt-image-1.5`                                             | Establezca `outputFormat` en `png` o `webp` y `background=transparent`. |

## Mapa de nombres

| Nombre que aparece                       | Capa              | Significado                                                                              |
| ---------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------- |
| `openai`                                 | Prefijo del proveedor | Ruta de modelo canónica de OpenAI; los datos de ruta determinan el entorno de ejecución implícito. |
| Plugin `codex`                           | Plugin            | Plugin incluido que proporciona el entorno de ejecución nativo del servidor de aplicaciones Codex y los controles de chat `/codex`. |
| `agentRuntime.id: codex` de proveedor/modelo | Entorno de ejecución del agente | Fuerza el ejecutor nativo del servidor de aplicaciones Codex para los turnos integrados coincidentes. |
| `/codex ...`                             | Conjunto de comandos de chat | Vincula y controla hilos del servidor de aplicaciones Codex desde una conversación. |
| `runtime: "acp", agentId: "codex"`       | Ruta de sesión ACP | Ruta alternativa explícita que ejecuta Codex mediante ACP/acpx.                          |

## Entorno de ejecución implícito del agente

Cuando la política `agentRuntime` de proveedor/modelo no está configurada o es `auto`, la política de ruta propiedad del proveedor OpenAI elige el entorno de ejecución implícito a partir del endpoint y el adaptador efectivos:

| Datos de ruta efectivos                                                                                                                                                 | Entorno de ejecución implícito |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| Endpoint HTTPS oficial exacto de Platform con `openai-responses`, o endpoint HTTPS oficial exacto de ChatGPT con `openai-chatgpt-responses`; sin sobrescritura de solicitud definida | Puede seleccionarse Codex      |
| Adaptador `openai-completions` definido                                                                                                                                | OpenClaw                       |
| Endpoint personalizado                                                                                                                                                  | OpenClaw                       |
| Endpoint oficial exacto configurado explícitamente mediante HTTP                                                                                                       | Rechazado                      |
| Ruta con una sobrescritura de solicitud de proveedor/modelo definida                                                                                                   | OpenClaw                       |

Un `agentRuntime.id` explícito no predeterminado de proveedor/modelo sigue siendo la autoridad.
Por ejemplo, `agentRuntime.id: "openclaw"` mantiene en OpenClaw una ruta que, de otro modo, sería apta para Codex, mientras que `agentRuntime.id: "codex"` exige Codex y aplica un cierre seguro cuando la ruta efectiva no está declarada como compatible con Codex.
La selección del entorno de ejecución no cambia el tipo de credencial ni la facturación: la autenticación mediante clave de API de Platform y la autenticación de suscripción de ChatGPT/Codex siguen siendo distintas.

`openclaw doctor --fix` migra las referencias heredadas a modelos Codex, los ids heredados de perfiles de autenticación de Codex y las entradas heredadas del orden de autenticación a la ruta canónica `openai`.
Use `auth.order.openai` para la nueva configuración del orden de autenticación.

<Note>
La configuración nueva de OpenAI solo aplica GPT-5.6 como modelo principal cuando no hay ningún modelo principal configurado. Añadir o actualizar la autenticación de OpenAI conserva una selección explícita existente, incluido `openai/gpt-5.5`, salvo que use explícitamente `models auth login --set-default` o `models set`. Use un perfil de autenticación mediante clave de API solo cuando desee este tipo de autenticación para un modelo de agente.
</Note>

## Vista previa limitada de GPT-5.6

OpenClaw reconoce los ids de modelo exactos `openai/gpt-5.6-sol`, `openai/gpt-5.6-terra` y `openai/gpt-5.6-luna`. Los tres ofrecen razonamiento `xhigh` y `max` en el catálogo actual. OpenAI describe Sol como el nivel insignia, Terra como el nivel equilibrado y Luna como el nivel rápido y de menor coste. Consulte el [anuncio de lanzamiento de GPT-5.6](https://openai.com/index/previewing-gpt-5-6-sol/) y la [guía de acceso](https://help.openai.com/en/articles/20001325-a-preview-of-gpt-5-6-sol-terra-and-luna).

Con autenticación directa mediante clave de API de OpenAI, el id básico `openai/gpt-5.6` es un alias de Sol y el valor predeterminado de una configuración nueva. El catálogo nativo de Codex no aplica ese alias de API directa en el cliente; según el acceso del espacio de trabajo, puede mostrar los ids exactos de Sol, Terra y Luna. Por tanto, una configuración nueva de OAuth de ChatGPT/Codex usa `openai/gpt-5.6-sol`. Consulte la cuenta actual con:

```bash
openclaw models list --provider openai
```

El acceso de la organización de la API y el del espacio de trabajo de Codex pueden ser diferentes. Si GPT-5.6 no está disponible, seleccione GPT-5.5 explícitamente:

```bash
openclaw models set openai/gpt-5.5
```

OpenClaw muestra el error de acceso original y no sustituye silenciosamente una selección de GPT-5.6 por GPT-5.5.

<Note>
Las rutas HTTPS oficiales exactas aptas pueden seleccionar el Plugin incluido del servidor de aplicaciones Codex cuando la política del entorno de ejecución no está configurada o es `auto`; las rutas de Completions definidas, los endpoints personalizados y las sobrescrituras del transporte de solicitudes permanecen en OpenClaw. Los endpoints HTTP oficiales sin cifrar se rechazan. La configuración explícita del entorno de ejecución de proveedor/modelo sigue siendo la autoridad. Ejecute `openclaw doctor --fix` para reparar referencias heredadas obsoletas a modelos Codex, referencias `codex-cli/*` o fijaciones antiguas de sesiones del entorno de ejecución que no se hayan establecido mediante una configuración explícita del entorno de ejecución.
</Note>

## Cobertura de funciones de OpenClaw

| Capacidad de OpenAI       | Superficie de OpenClaw                                                                       | Estado                                                                 |
| ------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Chat / Respuestas         | proveedor de modelos `openai/<model>`                                                         | Sí                                                                     |
| Modelos de suscripción de Codex | `openai/<model>` con OAuth de OpenAI                                                     | Sí                                                                     |
| Referencias de modelos de Codex heredadas | referencias de modelos de Codex antiguas, `codex-cli/<model>`                      | Reparadas por doctor a `openai/<model>`                                |
| Entorno de app-server de Codex | ruta HTTPS compatible con Codex con runtime sin configurar/`auto`, o `agentRuntime.id: codex` explícito | Sí                                                                     |
| Búsqueda web del lado del servidor | herramienta nativa de OpenAI Responses                                                | Sí, cuando la búsqueda web está habilitada y no hay otro proveedor fijado |
| Imágenes                  | `image_generate`                                                                              | Sí                                                                     |
| Vídeos                    | `video_generate`                                                                              | Sí                                                                     |
| Texto a voz               | `messages.tts.provider: "openai"` / `tts`                                                     | Sí                                                                     |
| Voz a texto por lotes     | `tools.media.audio` / comprensión de medios                                                    | Sí                                                                     |
| Voz a texto en streaming  | Voice Call `streaming.provider: "openai"`                                                     | Sí                                                                     |
| Voz en tiempo real        | Voice Call `realtime.provider: "openai"` / Talk de Control UI `talk.realtime.provider: "openai"` | Sí (clave de API de OpenAI Platform)                                   |
| Embeddings                | proveedor de embeddings de memoria                                                            | Sí                                                                     |

<Note>
La voz en tiempo real de OpenAI pasa por la **API pública Realtime de OpenAI
Platform** y requiere una clave de API de Platform. En cambio, los tokens OAuth
de Codex autentican el backend de ChatGPT Codex; no son intercambiables con las
claves de API de Platform para los endpoints públicos de Realtime.

Si la autenticación mediante clave de API indica que falta facturación, recargue
los créditos de Platform en
[platform.openai.com/account/billing](https://platform.openai.com/account/billing)
para la organización que respalda sus credenciales de tiempo real cuando use
autenticación mediante clave de API. La voz en tiempo real acepta el perfil de
autenticación mediante clave de API `openai` creado por
`openclaw onboard --auth-choice openai-api-key`, una clave de API de Platform
configurada mediante `talk.realtime.providers.openai.apiKey` para Talk de
Control UI, o `plugins.entries.voice-call.config.realtime.providers.openai.apiKey`
para Voice Call, o la variable de entorno `OPENAI_API_KEY`.
</Note>

## Embeddings de memoria

OpenClaw puede usar OpenAI, o un endpoint de embeddings compatible con OpenAI,
para la indexación y los embeddings de consultas de `memory_search`:

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

Para los endpoints compatibles con OpenAI que requieran etiquetas de embeddings
asimétricas, configure `queryInputType` y `documentInputType` en `memorySearch`.
OpenClaw los reenvía como campos de solicitud `input_type` específicos del
proveedor: los embeddings de consultas usan `queryInputType`; los fragmentos
de memoria indexados y la indexación por lotes usan `documentInputType`.
Consulte la
[referencia de configuración de memoria](/es/reference/memory-config#provider-specific-config)
para ver el ejemplo completo.

## Primeros pasos

<Tabs>
  <Tab title="Clave de API (OpenAI Platform)">
    **Ideal para:** acceso directo a la API y facturación basada en el uso.

    <Steps>
      <Step title="Obtenga su clave de API">
        Cree o copie una clave de API desde el [panel de OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Ejecute la incorporación">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        O pase la clave directamente:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Verifique que el modelo esté disponible">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Resumen de rutas

    | Referencia del modelo | Política del runtime o datos de la ruta                       | Ruta                      | Autenticación                      |
    | --------------------- | ------------------------------------------------------------- | ------------------------- | ---------------------------------- |
    | `openai/gpt-5.6`      | sin configurar/`auto`, ruta nativa HTTPS oficial exacta, sin sobrescritura de solicitud | Puede seleccionarse Codex | Perfil de autenticación mediante clave de API ordenado |
    | `openai/gpt-5.6`      | `agentRuntime.id: "openclaw"` del proveedor/modelo            | runtime integrado de OpenClaw | Perfil de clave de API `openai` seleccionado |
    | `openai/gpt-5.5`      | `agentRuntime.id` explícito del proveedor/modelo              | runtime de agente seleccionado | Perfil de clave de API de OpenAI seleccionado |
    | `openai/*`            | Completions creadas, personalizadas o sobrescritura de solicitud | runtime integrado de OpenClaw | El tipo de credencial permanece sin cambios |
    | `openai/*`            | endpoint HTTP oficial de texto sin cifrar                     | Rechazada                  | La credencial no se envía          |

    <Note>
    Con el runtime sin configurar o establecido en `auto`, solo una ruta nativa
    HTTPS oficial exacta que cumpla los requisitos puede seleccionar
    implícitamente el entorno de app-server de Codex. Para la autenticación
    mediante clave de API en un modelo de agente, cree un perfil de autenticación
    mediante clave de API `openai` y ordénelo con `auth.order.openai`;
    `OPENAI_API_KEY` sigue siendo la alternativa directa para las superficies
    de la API de OpenAI que no sean de agente. Ejecute `openclaw doctor --fix`
    para migrar entradas antiguas del orden de autenticación de Codex heredado.
    </Note>

    ### Ejemplo de configuración

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/gpt-5.6" } } },
    }
    ```

    El identificador de API directa sin calificador `gpt-5.6` se resuelve al
    nivel Sol. Si esta organización de API no ofrece GPT-5.6, establezca
    explícitamente el modelo principal en `openai/gpt-5.5`.

    Para probar el modelo Instant actual de ChatGPT desde la API de OpenAI,
    establezca el modelo en `openai/chat-latest`:

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` es un alias variable. En su lugar, la configuración nueva
    mediante clave de API de OpenAI usa `openai/gpt-5.6`, cuyo identificador de
    API directa sin calificador se resuelve a Sol. Los modelos principales
    explícitos existentes, incluido `openai/gpt-5.5`, permanecen sin cambios.
    El alias `chat-latest` solo acepta la verbosidad de texto `medium`; OpenClaw
    fuerza a `medium` cualquier otra verbosidad solicitada para este modelo.

    <Warning>
    OpenClaw **no** ofrece `gpt-5.3-codex-spark` en la ruta directa mediante
    clave de API de OpenAI. Solo está disponible mediante entradas del catálogo
    de suscripción de Codex cuando su cuenta con sesión iniciada lo ofrece.
    </Warning>

  </Tab>

  <Tab title="Suscripción de Codex">
    **Ideal para:** usar su suscripción de ChatGPT/Codex con ejecución nativa
    del app-server de Codex en lugar de una clave de API independiente. Codex
    en la nube requiere iniciar sesión en ChatGPT.

    <Steps>
      <Step title="Ejecute OAuth de Codex">
        ```bash
        openclaw onboard --auth-choice openai
        ```

        O ejecute OAuth directamente:

        ```bash
        openclaw models auth login --provider openai
        ```

        Para configuraciones sin interfaz gráfica o incompatibles con la
        devolución de llamada, añada `--device-code` para iniciar sesión con
        un flujo de código de dispositivo de ChatGPT en lugar de la devolución
        de llamada del navegador local:

        ```bash
        openclaw models auth login --provider openai --device-code
        ```
      </Step>
      <Step title="Use la ruta canónica del modelo de OpenAI">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.6-sol
        ```

        No se requiere configuración del runtime para esta ruta nativa HTTPS
        oficial exacta. Puede seleccionar automáticamente el runtime de
        app-server de Codex, y OpenClaw instala o repara el Plugin de Codex
        incluido cuando se elige ese runtime.
      </Step>
      <Step title="Verifique que la autenticación de Codex esté disponible">
        ```bash
        openclaw models list --provider openai
        ```

        Cuando el Gateway esté en ejecución, envíe `/codex status` o
        `/codex models` en el chat para verificar el runtime nativo de
        app-server.
      </Step>
    </Steps>

    ### Resumen de rutas

    | Referencia del modelo     | Política del runtime o datos de la ruta                       | Ruta                                                     | Autenticación                                      |
    | ------------------------- | ------------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------- |
    | `openai/gpt-5.6-sol`      | sin configurar/`auto`, ruta nativa HTTPS oficial exacta, sin sobrescritura de solicitud | Puede seleccionarse Codex                                | Inicio de sesión de Codex o un perfil de autenticación `openai` ordenado |
    | `openai/gpt-5.6-terra`    | sin configurar/`auto`, ruta nativa HTTPS oficial exacta, sin sobrescritura de solicitud | Puede seleccionarse Codex                                | Inicio de sesión de Codex cuando el catálogo ofrece Terra |
    | `openai/gpt-5.6-luna`     | sin configurar/`auto`, ruta nativa HTTPS oficial exacta, sin sobrescritura de solicitud | Puede seleccionarse Codex                                | Inicio de sesión de Codex cuando el catálogo ofrece Luna |
    | `openai/gpt-5.6-sol`      | `agentRuntime.id: "openclaw"` del proveedor/modelo            | runtime integrado de OpenClaw, transporte interno con autenticación de Codex | Perfil OAuth `openai` seleccionado                 |
    | `openai/gpt-5.5`          | `agentRuntime.id` explícito del proveedor/modelo              | runtime de agente seleccionado                           | Perfil de autenticación de OpenAI seleccionado     |
    | `openai/*`                | Completions creadas, personalizadas o sobrescritura de solicitud | runtime integrado de OpenClaw                            | El requisito de credenciales sigue siendo específico de la ruta |
    | `openai/*`                | endpoint HTTP oficial de texto sin cifrar                     | Rechazada                                                 | La credencial no se envía                          |
    | Referencia heredada de Codex GPT-5.5 | reparada por doctor                                  | Reescrita como `openai/gpt-5.5`                          | Perfil OAuth de OpenAI migrado                     |
    | `codex-cli/gpt-5.5`       | reparada por doctor                                            | Reescrita como `openai/gpt-5.5`                          | Autenticación de app-server de Codex               |

    <Warning>
    La configuración nueva respaldada por una suscripción usa exactamente `openai/gpt-5.6-sol`; el
    catálogo nativo de Codex también puede mostrar referencias exactas de Terra o Luna. Si la
    cuenta no ofrece GPT-5.6, seleccione explícitamente `openai/gpt-5.5`. Las
    referencias anteriores de Codex GPT son rutas heredadas de OpenClaw, no la ruta
    del entorno de ejecución nativo de Codex; ejecute `openclaw doctor --fix` para migrarlas sin actualizar una
    selección explícita existente de GPT-5.5. `gpt-5.3-codex-spark` sigue limitado
    a las cuentas cuyo catálogo de suscripción de Codex lo anuncia; las referencias directas
    mediante clave de API de OpenAI y Azure para este modelo siguen ocultas.
    </Warning>

    <Note>
    La configuración nueva debe establecer el orden de autenticación del agente de OpenAI en `auth.order.openai`;
    doctor migra las entradas anteriores del orden de autenticación heredado de Codex.
    </Note>

    ### Ejemplo de configuración

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.6-sol" },
        },
      },
    }
    ```

    Con una clave de API de respaldo, mantenga el modelo seleccionado en `openai/*` y establezca
    el orden de autenticación en `openai`. OpenClaw prueba primero la suscripción y después
    la clave de API, sin abandonar el arnés de Codex:

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.6-sol" },
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
    La incorporación ya no importa material OAuth desde `~/.codex`. Inicie sesión mediante
    OAuth en el navegador (opción predeterminada) o mediante el flujo de código de dispositivo anterior; OpenClaw administra las
    credenciales resultantes en su propio almacén de autenticación de agentes.
    </Note>

    ### Comprobar y recuperar el enrutamiento OAuth de Codex

    ```bash
    openclaw models status
    openclaw models auth list --provider openai
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    Para un agente específico, añada `--agent <id>`:

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai
    ```

    Si una configuración anterior aún contiene referencias heredadas de Codex GPT, o una fijación obsoleta
    de una sesión del entorno de ejecución de OpenAI sin configuración explícita del entorno de ejecución, repárela:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    Si `models auth list --provider openai` no muestra ningún perfil utilizable, vuelva a iniciar
    sesión:

    ```bash
    openclaw models auth login --provider openai
    openclaw models status --probe --probe-provider openai
    ```

    Use `--profile-id` para varios inicios de sesión OAuth de Codex en el mismo agente y, después,
    contrólelos mediante el orden de autenticación o `/model ...@<profileId>`:

    ```bash
    openclaw models auth login --provider openai --profile-id openai:ritsuko
    openclaw models auth login --provider openai --profile-id openai:lain
    ```

    Ejecute `openclaw doctor --fix` para migrar los identificadores de perfil con prefijos heredados
    de OpenAI Codex y las entradas de orden anteriores antes de depender del orden de perfiles.

    ### Indicador de estado

    `/status` en el chat muestra qué entorno de ejecución del modelo está activo para la
    sesión actual. El arnés incluido del servidor de aplicaciones de Codex aparece como
    `Runtime: OpenAI Codex` cuando lo selecciona una ruta implícita apta o una política
    explícita del entorno de ejecución del proveedor/modelo.

    ### Advertencia de doctor

    Si permanecen referencias heredadas de modelos Codex o fijaciones obsoletas del entorno de ejecución de OpenAI en la configuración
    o en el estado de la sesión, `openclaw doctor --fix` las reescribe como `openai/*` con
    el entorno de ejecución de Codex, salvo que OpenClaw esté configurado explícitamente.

    ### Límite de la ventana de contexto

    OpenClaw trata los metadatos del modelo y el límite de contexto del entorno de ejecución como valores
    independientes. Para `openai/gpt-5.5` mediante el catálogo OAuth de Codex:

    - `contextWindow` nativo: `400000`
    - Límite predeterminado de `contextTokens` del entorno de ejecución: `272000`

    En la práctica, el límite predeterminado más pequeño ofrece mejores características de latencia y calidad.
    Sobrescríbalo mediante `contextTokens`:

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
    Use `contextWindow` para declarar los metadatos nativos del modelo. Use `contextTokens`
    para limitar el presupuesto de contexto del entorno de ejecución. La ruta directa mediante clave de API de OpenAI
    informa de un `contextWindow` nativo mayor (`1000000`) para `gpt-5.5`; ambas
    rutas se registran por separado porque los catálogos de origen difieren.
    </Note>

    ### Recuperación del catálogo

    OpenClaw usa los metadatos del catálogo de origen de Codex para `gpt-5.5` cuando están
    presentes. Si la detección activa de Codex omite la fila de `gpt-5.5` mientras la cuenta
    está autenticada, OpenClaw sintetiza esa fila del modelo OAuth para que las ejecuciones de cron,
    subagentes y del modelo predeterminado configurado no fallen con
    `Unknown model`.

  </Tab>
</Tabs>

## Autenticación del servidor de aplicaciones nativo de Codex

El arnés del servidor de aplicaciones nativo de Codex usa referencias de modelos `openai/*` cuando una ruta
HTTPS oficial exacta y apta lo selecciona implícitamente, o cuando
`agentRuntime.id: "codex"` del proveedor/modelo lo selecciona explícitamente. Su autenticación sigue
estando basada en cuentas. OpenClaw selecciona la autenticación en este orden:

1. Perfiles de autenticación de OpenAI ordenados para el agente, preferiblemente en
   `auth.order.openai`. Ejecute `openclaw doctor --fix` para migrar los identificadores anteriores de perfiles de
   autenticación heredados de Codex y el orden de autenticación.
2. La cuenta existente del servidor de aplicaciones, como un inicio de sesión local de ChatGPT
   en la CLI de Codex. Para el directorio principal aislado predeterminado del agente, OpenClaw conecta esa cuenta nativa
   de la CLI con el servidor de aplicaciones mediante su RPC de inicio de sesión; no comparte la
   configuración, los plugins ni el almacén de hilos de la CLI.
3. Solo para inicios locales del servidor de aplicaciones mediante stdio, y únicamente cuando el servidor de aplicaciones
   informa que no hay ninguna cuenta: `CODEX_API_KEY` y después `OPENAI_API_KEY`.

Un inicio de sesión local de suscripción a ChatGPT/Codex no se sustituye únicamente porque el
proceso del Gateway también tenga `OPENAI_API_KEY` para modelos directos de OpenAI o
embeddings. La alternativa mediante clave de API del entorno solo se aplica a la ruta local mediante stdio sin cuenta;
nunca se envía mediante conexiones WebSocket al servidor de aplicaciones. Cuando se
selecciona un perfil de Codex de tipo suscripción, OpenClaw también evita que
`CODEX_API_KEY` y `OPENAI_API_KEY` lleguen al proceso secundario del servidor de aplicaciones mediante stdio
y, en su lugar, envía las credenciales seleccionadas mediante el RPC de inicio de sesión del servidor de aplicaciones.

Cuando ese perfil de suscripción está bloqueado por un límite de uso de Codex, OpenClaw
marca el perfil como bloqueado hasta la hora de restablecimiento anunciada por Codex y permite que el orden
de autenticación rote al siguiente perfil `openai:*`, sin cambiar el modelo seleccionado
ni abandonar el arnés de Codex. Una vez que pasa la hora de restablecimiento, el
perfil de suscripción vuelve a ser apto.

## Generación de imágenes

El plugin `openai` incluido registra la generación de imágenes mediante la
herramienta `image_generate`. Admite tanto la generación de imágenes mediante clave de API de OpenAI como mediante OAuth de Codex
con la misma referencia de modelo `openai/gpt-image-2`.

| Capacidad                  | Clave de API de OpenAI                       | OAuth de Codex                                      |
| -------------------------- | -------------------------------------------- | --------------------------------------------------- |
| Referencia del modelo      | `openai/gpt-image-2`                         | `openai/gpt-image-2`                                |
| Autenticación              | `OPENAI_API_KEY`                             | Inicio de sesión OAuth de OpenAI Codex               |
| Transporte                 | API de imágenes de OpenAI                    | Backend de respuestas de Codex                      |
| Máximo de imágenes por solicitud | 4                                      | 4                                                   |
| Modo de edición            | Activado (hasta 5 imágenes de referencia)    | Activado (hasta 5 imágenes de referencia)           |
| Sobrescrituras de tamaño   | Admitidas, incluidos tamaños 2K/4K           | Admitidas, incluidos tamaños 2K/4K                  |
| Relación de aspecto/resolución | No se reenvía a la API de imágenes de OpenAI | Se asigna a un tamaño compatible cuando es seguro |

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
Consulte [Generación de imágenes](/es/tools/image-generation) para conocer los parámetros compartidos de la herramienta,
la selección del proveedor y el comportamiento de conmutación por error.
</Note>

`gpt-image-2` es el valor predeterminado para la generación de imágenes a partir de texto y la edición de
imágenes de OpenAI. `gpt-image-1.5`, `gpt-image-1` y `gpt-image-1-mini` siguen siendo utilizables
como sobrescrituras explícitas del modelo. Use `openai/gpt-image-1.5` para generar
PNG/WebP con fondo transparente; la API actual de `gpt-image-2` rechaza
`background: "transparent"`.

Para una solicitud con fondo transparente, llame a `image_generate` con
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` o `"webp"` y
`background: "transparent"`; la opción anterior del proveedor `openai.background` aún
se acepta. OpenClaw también protege las rutas públicas de OpenAI y OAuth de OpenAI Codex
reescribiendo las solicitudes transparentes predeterminadas de `openai/gpt-image-2` como
`gpt-image-1.5`; Azure y los endpoints personalizados compatibles con OpenAI conservan sus
nombres configurados de implementación/modelo.

La misma configuración está disponible para ejecuciones sin interfaz de la CLI:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "Una pegatina sencilla de un círculo rojo sobre un fondo transparente" \
  --json
```

Use los mismos indicadores `--output-format` y `--background` con
`openclaw infer image edit` cuando parta de un archivo de entrada.
`--openai-background` sigue disponible como alias específico de OpenAI. Use
`--quality low|medium|high|auto` para controlar la calidad y el coste de OpenAI Images.
Use `--openai-moderation low|auto` para pasar la indicación de moderación de OpenAI desde
`image generate` o `image edit`.

Para instalaciones con OAuth de ChatGPT/Codex, mantenga la misma referencia `openai/gpt-image-2`. Cuando
se configura un perfil OAuth de `openai`, OpenClaw resuelve ese token de acceso OAuth
almacenado y envía las solicitudes de imágenes mediante el backend de respuestas de Codex; no
prueba primero `OPENAI_API_KEY` ni recurre silenciosamente a una clave de API.
Configure `models.providers.openai` explícitamente con una clave de API, una URL base
personalizada o un endpoint de Azure cuando desee usar la ruta directa de la API de imágenes de OpenAI.
Si ese endpoint personalizado de imágenes se encuentra en una dirección privada/LAN de confianza,
también establezca `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw
mantiene bloqueados los endpoints privados/internos de imágenes compatibles con OpenAI salvo que esta
activación explícita esté presente.

Generar:

```
/tool image_generate model=openai/gpt-image-2 prompt="Un póster de lanzamiento refinado para OpenClaw en macOS" size=3840x2160 count=1
```

Generar un PNG transparente:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="Una pegatina sencilla de un círculo rojo sobre un fondo transparente" outputFormat=png background=transparent
```

Editar:

```
/tool image_generate model=openai/gpt-image-2 prompt="Conserva la forma del objeto y cambia el material a vidrio translúcido" image=/path/to/reference.png size=1024x1536
```

## Generación de vídeo

El plugin `openai` incluido registra la generación de vídeo mediante la
herramienta `video_generate`.

| Capacidad                | Valor                                                                                         |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| Modelo predeterminado    | `openai/sora-2`                                                                               |
| Modos                    | Texto a vídeo, imagen a vídeo, edición de un solo vídeo                                        |
| Entradas de referencia   | 1 imagen o 1 vídeo                                                                            |
| Sobrescrituras de tamaño | Admitidas para texto a vídeo e imagen a vídeo                                                  |
| Relación de aspecto      | Se convierte al tamaño compatible más cercano, no se reenvía sin procesar                     |
| Otras sobrescrituras     | `resolution`, `audio` y `watermark` no se admiten y se descartan con una advertencia de la herramienta |

Las solicitudes de imagen a vídeo de OpenAI usan `POST /v1/videos` con una imagen
`input_reference`. Las ediciones de un solo vídeo usan `POST /v1/videos/edits` con el
vídeo cargado en el campo `video`.

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
Consulte [Generación de vídeo](/es/tools/video-generation) para conocer los parámetros compartidos de la herramienta,
la selección de proveedores y el comportamiento de conmutación por error.

El proveedor de OpenAI declara `supportsSize`, pero no `supportsAspectRatio` ni
`supportsResolution`. La capa de normalización compartida de OpenClaw convierte
el valor solicitado de `aspectRatio` al `size` de OpenAI más aproximado antes de
que la solicitud llegue al proveedor, por lo que las solicitudes de relación de aspecto
suelen seguir funcionando. `resolution` no tiene una alternativa basada en el tamaño y se descarta,
lo que se comunica al invocador como
`Ignored unsupported overrides for openai/<model>: resolution=<value>`.
</Note>

## Contribución al prompt de GPT-5

OpenClaw añade una contribución compartida al prompt de GPT-5 para los modelos de la
familia GPT-5 en el proveedor `openai` (incluidas las referencias heredadas de Codex anteriores
a la reparación que se normalizan a `openai/*`). Otros proveedores que también ofrecen
identificadores de modelos de la familia GPT-5, como OpenRouter o las rutas de opencode,
no reciben esta capa; se condiciona al identificador de proveedor `openai`, no solo
al identificador de modelo. Los modelos GPT-4.x anteriores nunca la reciben.

El arnés nativo del servidor de aplicaciones de Codex no recibe mediante las instrucciones
del desarrollador el contrato de comportamiento de personalidad y disciplina de herramientas,
ni la capa de estilo de interacción cordial; Codex nativo conserva el comportamiento base,
del modelo y de los documentos del proyecto que pertenece a Codex, y OpenClaw desactiva la
personalidad integrada de Codex para los hilos nativos, de modo que los archivos de personalidad
del espacio de trabajo del agente mantengan la autoridad. OpenClaw solo aporta contexto de
ejecución a los hilos nativos de Codex: entrega por canales, herramientas dinámicas de OpenClaw,
delegación ACP, contexto del espacio de trabajo y Skills de OpenClaw. El texto de orientación
de Heartbeat de esta misma contribución es la única excepción: los turnos de Heartbeat de
Codex nativo sí lo reciben, inyectado como instrucciones específicas de colaboración en lugar
de mediante el mecanismo compartido de contribución al prompt.

La contribución de GPT-5 añade un contrato de comportamiento etiquetado para la persistencia
de la personalidad, la seguridad de ejecución, la disciplina de herramientas, la forma de
la salida, las comprobaciones de finalización y la verificación en los prompts coincidentes
ensamblados por OpenClaw. El comportamiento específico de los canales para las respuestas y
los mensajes silenciosos permanece en el prompt compartido del sistema de OpenClaw y en la
política de entrega saliente. La capa de estilo de interacción cordial es independiente y
configurable.

| Valor                  | Efecto                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (predeterminado) | Activa la capa de estilo de interacción cordial |
| `"on"`                 | Alias de `"friendly"`                      |
| `"off"`                | Desactiva únicamente la capa de estilo cordial       |

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
Los valores no distinguen entre mayúsculas y minúsculas durante la ejecución, por lo que tanto
`"Off"` como `"off"` desactivan la capa de estilo cordial.
</Tip>

<Note>
El valor heredado `plugins.entries.openai.config.personality` todavía se consulta como
alternativa de compatibilidad cuando no está definida la opción compartida
`agents.defaults.promptOverlays.gpt5.personality`.
</Note>

## Voz y habla

<AccordionGroup>
  <Accordion title="Síntesis de voz (TTS)">
    El plugin `openai` incluido registra la síntesis de voz para la
    superficie `messages.tts`.

    | Opción        | Ruta de configuración                                    | Valor predeterminado               |
    | ------------- | --------------------------------------------------------- | ----------------------------------- |
    | Modelo        | `messages.tts.providers.openai.model`                  | `gpt-4o-mini-tts`                |
    | Voz           | `messages.tts.providers.openai.speakerVoice`           | `coral`                          |
    | Velocidad     | `messages.tts.providers.openai.speed`                  | (sin definir)                    |
    | Instrucciones | `messages.tts.providers.openai.instructions`           | (sin definir, solo `gpt-4o-mini-tts`) |
    | Formato       | `messages.tts.providers.openai.responseFormat`         | `opus` para notas de voz, `mp3` para archivos |
    | Clave de API  | `messages.tts.providers.openai.apiKey`                 | Recurre a `OPENAI_API_KEY`       |
    | URL base      | `messages.tts.providers.openai.baseUrl`                | `https://api.openai.com/v1`      |
    | Cuerpo adicional | `messages.tts.providers.openai.extraBody` / `extra_body` | (sin definir)                 |

    Modelos disponibles: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Voces disponibles:
    `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`,
    `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` se combina con el JSON de la solicitud a `/audio/speech` después de los
    campos generados por OpenClaw, por lo que debe utilizarse con extremos compatibles
    con OpenAI que requieran claves adicionales como `lang`. Las claves de prototipo se ignoran.

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
    Defina `OPENAI_TTS_BASE_URL` para sustituir la URL base de TTS sin afectar
    al extremo de la API de chat. Tanto TTS de OpenAI como la voz en tiempo real
    se configuran mediante una clave de API de OpenAI Platform; las instalaciones
    que solo usan OAuth pueden seguir utilizando modelos de chat respaldados por
    Codex, pero no la conversación de voz en directo de OpenAI.
    </Note>

  </Accordion>

  <Accordion title="Conversión de voz a texto">
    El plugin `openai` incluido registra la conversión de voz a texto por lotes
    mediante la superficie de transcripción de comprensión multimedia de OpenClaw.

    - Modelo predeterminado: `gpt-4o-transcribe`
    - Extremo: REST de OpenAI `/v1/audio/transcriptions`
    - Ruta de entrada: carga de archivos de audio multipart
    - Se utiliza siempre que la transcripción de audio entrante consulta `tools.media.audio`,
      incluidos los segmentos de canales de voz de Discord y los archivos adjuntos de audio de los canales

    Para forzar el uso de OpenAI en la transcripción de audio entrante:

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

    Las indicaciones de idioma y prompt se reenvían a OpenAI cuando las proporciona
    la configuración multimedia de audio compartida o la solicitud de transcripción
    de cada llamada.

  </Accordion>

  <Accordion title="Transcripción en tiempo real">
    El plugin `openai` incluido registra la transcripción en tiempo real para el
    plugin Voice Call.

    | Opción            | Ruta de configuración                                                   | Valor predeterminado |
    | ----------------- | ----------------------------------------------------------------------- | --------- |
    | Modelo            | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Idioma            | `...openai.language`                                                 | (sin definir) |
    | Prompt            | `...openai.prompt`                                                   | (sin definir) |
    | Duración del silencio | `...openai.silenceDurationMs`                                    | `800`   |
    | Umbral de VAD     | `...openai.vadThreshold`                                             | `0.5`   |
    | Autenticación     | `...openai.apiKey`, `OPENAI_API_KEY` o perfil de clave de API `openai` | Se requiere una clave de API de Platform |

    <Note>
    Utiliza una conexión WebSocket a `wss://api.openai.com/v1/realtime` con
    audio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Para un perfil de clave de
    API `openai`, el Gateway emite un secreto efímero de cliente de transcripción
    en tiempo real antes de abrir el WebSocket. Este proveedor de transmisión se
    utiliza para la ruta de transcripción en tiempo real de Voice Call; actualmente,
    la voz de Discord graba segmentos cortos y utiliza en su lugar la ruta de
    transcripción por lotes `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Voz en tiempo real">
    El plugin `openai` incluido registra la voz en tiempo real para el plugin
    Voice Call.

    | Opción                                  | Ruta de configuración                                                       | Valor predeterminado |
    | --------------------------------------- | ---------------------------------------------------------------------------- | ---------------------- |
    | Modelo                                  | `plugins.entries.voice-call.config.realtime.providers.openai.model`     | `gpt-realtime-2.1`  |
    | Voz                                     | `...openai.voice`                                                       | `alloy`             |
    | Temperatura (puente de implementación de Azure) | `...openai.temperature`                                          | `0.8`               |
    | Umbral de VAD                           | `...openai.vadThreshold`                                                | `0.5`                |
    | Duración del silencio                   | `...openai.silenceDurationMs`                                           | `500`                |
    | Relleno de prefijo                      | `...openai.prefixPaddingMs`                                             | `300`                |
    | Esfuerzo de razonamiento                | `...openai.reasoningEffort`                                             | (sin definir)        |
    | Autenticación                           | perfil de clave de API `openai`, `...openai.apiKey` o `OPENAI_API_KEY` | Se requiere una clave de API de OpenAI Platform |

    Voces integradas en tiempo real disponibles para `gpt-realtime-2.1`: `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`.
    OpenAI recomienda `marin` y `cedar` para obtener la mejor calidad en tiempo real.
    Este conjunto es independiente de las voces de conversión de texto a voz anteriores;
    una voz exclusiva de TTS como `fable`, `nova` u `onyx` no es válida para sesiones
    en tiempo real. Defina explícitamente el modelo como `gpt-realtime-2.1-mini` si
    prefiere la variante Realtime 2.1 más pequeña y de menor coste.

    <Note>
    **GPT-Live (próximamente).** Los modelos dúplex completo `gpt-live-1` y
    `gpt-live-1-mini` de OpenAI sustituyeron el modo de voz de ChatGPT en julio
    de 2026; la API para desarrolladores se está desplegando para organizaciones
    con acceso anticipado. OpenClaw reconoce la familia de modelos, pero todavía
    no la ejecuta: las sesiones GPT-Live solo utilizan WebRTC, gestionan sus propios
    turnos (sin VAD) y delegan el trabajo del agente mediante un protocolo de eventos
    de transferencia que los transportes en tiempo real de OpenClaw todavía no
    implementan. La configuración de un modelo `gpt-live-*` se cierra de forma segura
    con orientación tanto para el puente WebSocket como para las sesiones del navegador
    Talk, en lugar de conectar silenciosamente el audio sin acceso al agente. Durante
    el acceso anticipado, el acceso a la API también se habilita por organización de
    OpenAI. Mantenga `gpt-realtime-2.1` (el valor predeterminado) hasta que se incorpore
    la compatibilidad con GPT-Live.
    </Note>

    <Note>
    Los puentes de tiempo real de OpenAI en el backend utilizan la estructura de sesión
    WebSocket de Realtime con disponibilidad general, que no acepta `session.temperature`.
    Las implementaciones de Azure OpenAI siguen estando disponibles mediante `azureEndpoint`
    y `azureDeployment`, y conservan la estructura de sesión compatible con la implementación
    (incluida `temperature`). Admite llamadas bidireccionales a herramientas y audio G.711 u-law.
    </Note>

    <Note>
    La voz en tiempo real se selecciona al crear la sesión. OpenAI permite cambiar
    posteriormente la mayoría de los campos de la sesión, pero la voz no puede cambiarse
    después de que el modelo haya emitido audio en esa sesión. Actualmente, OpenClaw
    expone como cadenas los identificadores de voz integrados de Realtime.
    </Note>

    <Note>
    Control UI Talk usa sesiones en tiempo real de OpenAI en el navegador con un secreto efímero de cliente
    emitido por el Gateway y un intercambio SDP WebRTC directo desde el navegador
    con la API Realtime de OpenAI. El Gateway emite ese secreto de cliente con
    la credencial `openai` seleccionada. Las claves configuradas, los perfiles de clave de API y
    `OPENAI_API_KEY` tienen prioridad; un perfil OAuth de `openai` o un inicio de sesión
    externo de Codex se usa como alternativa. El relé del Gateway y los puentes WebSocket
    en tiempo real del backend de Voice Call usan el mismo orden de credenciales para los endpoints nativos de OpenAI.
    La verificación en vivo para responsables de mantenimiento está disponible con
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    los tramos de OpenAI verifican tanto el puente WebSocket del backend como el intercambio
    SDP WebRTC del navegador sin registrar secretos.
    Pase `--openai-only` para ejecutar esos dos tramos sin credenciales de Google.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoints de Azure OpenAI

El proveedor `openai` incluido puede usar un recurso de Azure OpenAI para la generación
de imágenes mediante la sobrescritura de la URL base. En la ruta de generación de imágenes, OpenClaw
detecta nombres de host de Azure en `models.providers.openai.baseUrl` y cambia
automáticamente al formato de solicitud de Azure.

<Note>
La voz en tiempo real usa una ruta de configuración independiente
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
y no se ve afectada por `models.providers.openai.baseUrl`. Consulte el acordeón **Voz
en tiempo real** de [Voz y habla](#voice-and-speech) para ver su configuración de Azure.
</Note>

Use Azure OpenAI cuando:

- Ya disponga de una suscripción, cuota o acuerdo empresarial
  de Azure OpenAI
- Necesite residencia regional de datos o los controles de cumplimiento que proporciona Azure
- Quiera mantener el tráfico dentro de un entorno de Azure existente

### Configuración

Para generar imágenes con Azure mediante el proveedor `openai` incluido, establezca
`models.providers.openai.baseUrl` en su recurso de Azure y configure `apiKey` con
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

OpenClaw reconoce estos sufijos de host de Azure para la ruta de generación
de imágenes de Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Para las solicitudes de generación de imágenes en un host de Azure reconocido, OpenClaw:

- Envía el encabezado `api-key` en lugar de `Authorization: Bearer`
- Usa rutas con ámbito de implementación (`/openai/deployments/{deployment}/...`)
- Añade `?api-version=...` a cada solicitud
- Usa un tiempo de espera predeterminado de 600s para las solicitudes de generación de imágenes de Azure.
  Los valores `timeoutMs` de cada llamada siguen sobrescribiendo este valor predeterminado.

Las demás URL base (OpenAI público y proxies compatibles con OpenAI) mantienen el formato
estándar de solicitud de imágenes de OpenAI.

<Note>
El enrutamiento de Azure para la ruta de generación de imágenes del proveedor `openai` requiere
OpenClaw 2026.4.22 o una versión posterior. Las versiones anteriores tratan cualquier
`openai.baseUrl` personalizado como el endpoint público de OpenAI y fallan con las implementaciones
de imágenes de Azure.
</Note>

### Versión de la API

Establezca `AZURE_OPENAI_API_VERSION` para fijar una versión preliminar o de disponibilidad general específica de Azure
para la ruta de generación de imágenes de Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

El valor predeterminado es `2024-12-01-preview` cuando la variable no está establecida.

### Los nombres de modelos son nombres de implementación

Azure OpenAI vincula los modelos a implementaciones. Para las solicitudes de generación de imágenes de Azure
enrutadas mediante el proveedor `openai` incluido, el campo `model` de OpenClaw
debe ser el **nombre de implementación de Azure** configurado en el portal de Azure, no
el identificador público del modelo de OpenAI.

Si crea una implementación denominada `gpt-image-2-prod` que proporciona `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="Un póster limpio" size=1024x1024 count=1
```

La misma regla de nombre de implementación se aplica a cualquier llamada de generación de imágenes enrutada
mediante el proveedor `openai` incluido.

### Disponibilidad regional

Actualmente, la generación de imágenes de Azure solo está disponible en un subconjunto de regiones
(por ejemplo, `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Consulte la lista actual de regiones de Microsoft antes de crear una
implementación y confirme que el modelo específico esté disponible en su región.

### Diferencias entre parámetros

Azure OpenAI y OpenAI público no siempre aceptan los mismos parámetros de imagen.
Azure puede rechazar opciones que OpenAI público permite (por ejemplo, determinados
valores de `background` en `gpt-image-2`) o exponerlas solo en versiones específicas
del modelo. Estas diferencias proceden de Azure y del modelo subyacente, no de
OpenClaw. Si una solicitud de Azure falla con un error de validación, consulte en el
portal de Azure el conjunto de parámetros admitido por su implementación y versión de la
API específicas.

<Note>
Azure OpenAI usa transporte nativo y comportamiento de compatibilidad, pero no recibe
los encabezados de atribución ocultos de OpenClaw; consulte el acordeón **Rutas nativas frente a rutas
compatibles con OpenAI** de [Configuración avanzada](#advanced-configuration).

Para el tráfico de chat o Responses en Azure (más allá de la generación de imágenes), use el
flujo de incorporación o una configuración específica del proveedor de Azure; `openai.baseUrl` por sí solo
no adopta el formato de API/autenticación de Azure. Existe un proveedor
`azure-openai-responses/*` independiente; consulte el acordeón Compaction del lado del
servidor que aparece a continuación.
</Note>

## Configuración avanzada

Los siguientes ejemplos de `params` por modelo determinan la solicitud del proveedor integrada
de OpenClaw. Su configuración constituye un comportamiento de solicitud definido explícitamente, por lo que una ruta
`auto` que, de otro modo, sería apta permanece en OpenClaw en lugar de seleccionar Codex de forma implícita. El entorno
nativo del servidor de aplicaciones de Codex gestiona su propio transporte y configuración de solicitudes; un
`agentRuntime.id: "codex"` explícito falla de forma segura cuando la ruta efectiva no está declarada
como compatible con Codex.

<AccordionGroup>
  <Accordion title="Transporte (WebSocket frente a SSE)">
    OpenClaw usa primero WebSocket y recurre a SSE como alternativa (`"auto"`) para `openai/*`.

    En el modo `"auto"`, OpenClaw:
    - Reintenta un fallo temprano de WebSocket antes de recurrir a SSE
    - Tras un fallo, marca WebSocket como degradado durante 60 segundos y usa SSE
      durante el periodo de espera
    - Adjunta encabezados estables de identidad de sesión y turno para los reintentos y
      las reconexiones
    - Normaliza los contadores de uso (`input_tokens` / `prompt_tokens`) entre las
      variantes de transporte

    | Valor                | Comportamiento                          |
    | ---------------------- | ------------------------------------ |
    | `"auto"` (predeterminado)   | Primero WebSocket, SSE como alternativa     |
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
    OpenClaw ofrece un selector compartido de modo rápido para `openai/*`:

    - **Chat/UI:** `/fast status|auto|on|off`
    - **Configuración:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Cuando está habilitado, OpenClaw asigna el modo rápido al procesamiento prioritario de OpenAI
    (`service_tier = "priority"`). Se conservan los valores existentes de `service_tier`
    y el modo rápido no modifica `reasoning` ni
    `text.verbosity`. `fastMode: "auto"` inicia rápidamente las nuevas llamadas al modelo hasta el
    límite automático; después, inicia los reintentos, las alternativas, los resultados de herramientas o
    las llamadas de continuación posteriores sin el modo rápido. El límite predeterminado es de 60 segundos;
    configure `params.fastAutoOnSeconds` en el modelo activo para cambiarlo.

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
    Las sobrescrituras de la sesión tienen prioridad sobre la configuración. Al borrar la sobrescritura de la sesión en la
    interfaz de sesiones, la sesión vuelve al valor predeterminado configurado.
    </Note>

  </Accordion>

  <Accordion title="Procesamiento prioritario (service_tier)">
    La API de OpenAI ofrece procesamiento prioritario mediante `service_tier`. Configúrelo por
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
    `serviceTier` solo se reenvía a endpoints nativos de OpenAI
    (`api.openai.com`) y endpoints nativos de Codex (`chatgpt.com/backend-api`).
    Si enruta cualquiera de los proveedores mediante un proxy, OpenClaw deja
    `service_tier` sin modificar.
    </Warning>

  </Accordion>

  <Accordion title="Compaction del lado del servidor (API Responses)">
    Para los modelos Responses directos de OpenAI (`openai/*` en `api.openai.com`), el
    contenedor de flujo de OpenClaw del Plugin de OpenAI habilita automáticamente la
    Compaction del lado del servidor:

    - Fuerza `store: true` (salvo que la compatibilidad del modelo establezca `supportsStore: false`)
    - Inyecta `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` predeterminado: el 70% de `contextWindow` (o `80000` cuando
      no está disponible)

    Esto se aplica a la ruta de ejecución integrada de OpenClaw y a los hooks del proveedor
    OpenAI usados por las ejecuciones integradas. El entorno nativo del servidor de aplicaciones de Codex administra
    su propio contexto mediante Codex y esta configuración no le afecta.

    <Tabs>
      <Tab title="Habilitar explícitamente">
        Resulta útil para endpoints compatibles, como Azure OpenAI Responses:

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
    Los modelos Responses directos de OpenAI siguen forzando `store: true`, salvo que la compatibilidad
    establezca `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Modo GPT estrictamente agéntico">
    Para los modelos de la familia GPT-5 del proveedor `openai` ejecutados mediante el entorno integrado
    de OpenClaw, OpenClaw ya usa de forma predeterminada un contrato de ejecución más estricto denominado
    `strict-agentic`. Se activa automáticamente siempre que el proveedor resuelto sea
    `openai` y el identificador del modelo coincida con la familia GPT-5, salvo que la configuración
    desactive explícitamente este comportamiento:

    ```json5
    {
      agents: {
        defaults: {
          embeddedAgent: { executionContract: "default" },
        },
      },
    }
    ```

    Establecer `"strict-agentic"` explícitamente no produce ningún cambio en una ruta compatible (ya
    es el valor predeterminado) y no tiene efecto en pares de proveedor/modelo no compatibles.

    Con `strict-agentic` activo, OpenClaw:
    - Habilita automáticamente `update_plan` para trabajos sustanciales
    - Reintenta los turnos estructuralmente vacíos o que solo contienen razonamiento con una continuación
      que produce una respuesta visible
    - Usa eventos explícitos de planificación del entorno cuando el entorno seleccionado los
      proporciona

    OpenClaw no clasifica la prosa del asistente para decidir si un turno es un
    plan, una actualización de progreso o una respuesta final.

    <Note>
    Este contrato reside íntegramente en el ejecutor de agentes integrado de OpenClaw. No se
    aplica al entorno nativo del servidor de aplicaciones de Codex, que gestiona su propio
    comportamiento de turnos y planes; la selección del entorno es más importante que la
    configuración del contrato de ejecución para las ejecuciones nativas de Codex.
    </Note>

  </Accordion>

  <Accordion title="Rutas nativas frente a rutas compatibles con OpenAI">
    OpenClaw trata los endpoints directos de OpenAI, Codex y Azure OpenAI
    de forma diferente a los proxies `/v1` genéricos compatibles con OpenAI:

    **Rutas nativas** (`openai/*`, Azure OpenAI):
    - Mantienen `reasoning: { effort: "none" }` solo para los modelos que admiten el
      nivel de esfuerzo `none` de OpenAI
    - Omiten el razonamiento deshabilitado para los modelos o proxies que rechazan
      `reasoning.effort: "none"`
    - Usan de forma predeterminada el modo estricto para los esquemas de herramientas
    - Adjuntan encabezados de atribución ocultos solo en hosts nativos verificados (Azure
      OpenAI no recibe estos encabezados, aunque sea una ruta nativa)
    - Mantienen la conformación de solicitudes exclusiva de OpenAI (`service_tier`, `store`,
      compatibilidad de razonamiento, indicaciones de caché de prompts)

    **Rutas proxy/compatibles:**
    - Usan un comportamiento de compatibilidad menos estricto
    - Eliminan `store` de Completions de las cargas útiles `openai-completions` no nativas
    - Aceptan el JSON avanzado de transferencia directa `params.extra_body`/`params.extraBody`
      para proxies de Completions compatibles con OpenAI
    - Aceptan `params.chat_template_kwargs` para proxies de Completions compatibles con OpenAI,
      como vLLM
    - No fuerzan esquemas de herramientas estrictos ni encabezados exclusivos de rutas nativas

  </Accordion>
</AccordionGroup>

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Generación de imágenes" href="/es/tools/image-generation" icon="image">
    Parámetros compartidos de la herramienta de imágenes y selección de proveedores.
  </Card>
  <Card title="Generación de vídeos" href="/es/tools/video-generation" icon="video">
    Parámetros compartidos de la herramienta de vídeo y selección de proveedores.
  </Card>
  <Card title="OAuth y autenticación" href="/es/gateway/authentication" icon="key">
    Detalles de autenticación y reglas de reutilización de credenciales.
  </Card>
</CardGroup>
