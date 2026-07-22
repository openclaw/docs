---
read_when:
    - Quiere usar modelos de OpenAI en OpenClaw
    - Se desea la autenticación mediante suscripción de Codex en lugar de claves de API
    - Necesita un comportamiento de ejecución de agentes GPT-5 más estricto
summary: Usar OpenAI mediante claves de API o una suscripción a Codex en OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-07-22T10:45:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4c7d922166283cd28787168979eb66dd34d303d394df241efdd94e3989e966fa
    source_path: providers/openai.md
    workflow: 16
---

OpenClaw utiliza un único id de proveedor, `openai`, tanto para la autenticación directa mediante clave de API como para
la autenticación mediante suscripción a ChatGPT/Codex. `openai/*` es la ruta canónica del modelo.
En los turnos del agente integrado con la política de runtime sin definir o con `auto`, los datos de ruta
de OpenAI determinan si OpenClaw puede seleccionar implícitamente el runtime de servidor de aplicaciones de Codex
incluido. El prefijo `openai/*` por sí solo no selecciona ningún runtime.

- **Modelos de agente** - `openai/*` mediante el runtime seleccionado por la configuración explícita
  `agentRuntime` o la política de ruta implícita de OpenAI. Inicie sesión con la autenticación de Codex
  para usar una suscripción a ChatGPT/Codex, o configure un perfil de autenticación
  mediante clave de API cuando quiera facturación basada en claves.
- **API de OpenAI no destinadas a agentes** - acceso directo a OpenAI Platform, facturado por uso,
  mediante `OPENAI_API_KEY` o un perfil de autenticación mediante clave de API `openai`.
- **Configuración heredada** - las referencias `codex/*` y `openai-codex/*` se reparan para usar
  `openai/*` junto con `agentRuntime.id: "codex"` específico del modelo mediante
  `openclaw doctor --fix`.

OpenAI admite explícitamente el uso de OAuth de suscripción en herramientas y
flujos de trabajo externos como OpenClaw.

## Seguimiento del uso y los costes

OpenClaw mantiene separadas la cuota de la suscripción y la facturación de la API de Platform:

- OAuth de ChatGPT/Codex muestra el plan de suscripción, los intervalos de cuota y el saldo de créditos.
- `OPENAI_ADMIN_KEY` muestra 30 días de costes de la organización y uso de completaciones notificados por el proveedor en **Uso** de Control UI, incluidos el gasto diario, los totales de solicitudes y tokens, los modelos principales y las categorías de costes.
- `OPENAI_PROJECT_ID` limita opcionalmente el historial de la API de administración a un proyecto.
- OpenClaw nunca envía `OPENAI_API_KEY` ni un perfil de inferencia `openai` a las API de la organización; esas credenciales pueden pertenecer a endpoints personalizados, de Azure o locales del agente.

Una clave de administración explícita tiene prioridad sobre OAuth. El historial notificado por el proveedor no se combina con el coste estimado por OpenClaw a partir de las sesiones; puede incluir actividad de API de otros clientes y ajustes de facturación realizados por el proveedor.

La documentación del [panel de uso de la API](https://help.openai.com/en/articles/10478918) de OpenAI describe los requisitos de propietario de la organización y de permisos explícitos del panel de uso para acceder a los datos de uso.

El proveedor, el modelo, el runtime y el canal son capas independientes. Si estas etiquetas
se están confundiendo, consulte [Runtimes de agente](/es/concepts/agent-runtimes) antes de
cambiar la configuración.

## Elección rápida

| Objetivo                                          | Usar                                                               | Notas                                                               |
| ------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------- |
| Suscripción a ChatGPT/Codex, runtime nativo de Codex | `openai/gpt-5.6-sol`                                               | Configuración nueva de la suscripción; inicie sesión con la autenticación de Codex. |
| Facturación directa mediante clave de API para turnos del agente | `openai/gpt-5.6` más un perfil de autenticación mediante clave de API ordenado | Configuración nueva de clave de API; el id básico de API directa se resuelve como Sol. |
| Elegir un nivel exacto de GPT-5.6                 | `openai/gpt-5.6-sol`, `-terra` o `-luna`                         | Consulte `models list` para conocer los niveles disponibles para esta cuenta. |
| Cuenta sin acceso a GPT-5.6                       | `openai/gpt-5.5`                                                   | Opción de recuperación explícita; OpenClaw no cambia silenciosamente a una versión inferior. |
| Facturación directa mediante clave de API, runtime explícito de OpenClaw | `openai/gpt-5.6` más `agentRuntime.id: "openclaw"` de proveedor/modelo | Seleccione un perfil normal de clave de API `openai`. |
| Alias del modelo ChatGPT Instant más reciente     | `openai/chat-latest`                                               | Solo con clave de API directa; es un alias variable, no el valor predeterminado estable. |
| Generación o edición de imágenes                  | `openai/gpt-image-2`                                               | Funciona con `OPENAI_API_KEY` u OAuth de Codex. |
| Imágenes con fondo transparente                   | `openai/gpt-image-1.5`                                             | Establezca `outputFormat` en `png` o `webp`, y `background=transparent`. |

## Mapa de nombres

| Nombre mostrado                          | Capa              | Significado                                                                              |
| ---------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------- |
| `openai`                                | Prefijo del proveedor | Ruta canónica del modelo de OpenAI; los datos de ruta determinan el runtime implícito. |
| Plugin `codex`                          | Plugin            | Plugin incluido que proporciona el runtime nativo de servidor de aplicaciones de Codex y los controles de chat `/codex`. |
| `agentRuntime.id: codex` de proveedor/modelo | Runtime de agente | Fuerza el entorno nativo de servidor de aplicaciones de Codex para los turnos integrados coincidentes. |
| `/codex ...`                            | Conjunto de comandos de chat | Vincula y controla hilos del servidor de aplicaciones de Codex desde una conversación. |
| `runtime: "acp", agentId: "codex"`      | Ruta de sesión ACP | Ruta alternativa explícita que ejecuta Codex mediante ACP/acpx. |

## Runtime implícito del agente

Cuando la política `agentRuntime` de proveedor/modelo no está definida o es `auto`, la política
de ruta propiedad del proveedor de OpenAI elige el runtime implícito a partir del
endpoint y el adaptador efectivos:

| Datos de ruta efectivos                                                                                                                                                 | Runtime implícito     |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| Endpoint HTTPS oficial exacto de Platform con `openai-responses`, o endpoint HTTPS oficial exacto de ChatGPT con `openai-chatgpt-responses`; sin sustitución de solicitud definida | Puede seleccionarse Codex |
| Adaptador `openai-completions` definido                                                                                                                                | OpenClaw              |
| Endpoint personalizado                                                                                                                                                | OpenClaw              |
| Endpoint oficial exacto explícito mediante HTTP                                                                                                                       | Rechazado             |
| Ruta con una sustitución de solicitud de proveedor/modelo definida                                                                                                    | OpenClaw              |

Una configuración `agentRuntime.id` explícita y no predeterminada de proveedor/modelo sigue siendo vinculante.
Por ejemplo, `agentRuntime.id: "openclaw"` mantiene en OpenClaw una ruta que, de otro modo, sería
apta para Codex, mientras que `agentRuntime.id: "codex"` exige Codex y produce un error
de forma segura cuando la ruta efectiva no está declarada como compatible con Codex.
La selección del runtime no cambia el tipo de credencial ni la facturación: la autenticación mediante clave de API
de Platform y la autenticación mediante suscripción a ChatGPT/Codex siguen siendo distintas.

`openclaw doctor --fix` migra las referencias de modelo heredadas `codex/*` y `openai-codex/*`,
los ids heredados de perfiles de autenticación de Codex y las entradas heredadas del orden de autenticación de Codex a la
ruta canónica `openai`. Las referencias de modelo migradas reciben
`agentRuntime.id: "codex"` específico del modelo; use `auth.order.openai` para la nueva configuración del orden de autenticación.

<Note>
La configuración nueva de OpenAI solo aplica un modelo principal GPT-5.6 cuando no hay ningún modelo principal
configurado. Añadir o actualizar la autenticación de OpenAI conserva cualquier selección explícita
existente, incluida `openai/gpt-5.5`, salvo que se use explícitamente
`models auth login --set-default` o `models set`. Use un perfil de autenticación mediante clave de API
solo cuando quiera autenticación mediante clave de API para un modelo de agente.
</Note>

## Vista previa limitada de GPT-5.6

OpenClaw reconoce los ids de modelo exactos `openai/gpt-5.6-sol`,
`openai/gpt-5.6-terra` y `openai/gpt-5.6-luna`. Los tres ofrecen
razonamiento `xhigh` y `max` en el catálogo actual. OpenAI describe Sol como
el nivel insignia, Terra como el nivel equilibrado y Luna como el nivel rápido
y de menor coste. Consulte el
[anuncio de lanzamiento de GPT-5.6](https://openai.com/index/previewing-gpt-5-6-sol/)
y la [guía de acceso](https://help.openai.com/en/articles/20001325-a-preview-of-gpt-5-6-sol-terra-and-luna).

Con autenticación directa mediante clave de API de OpenAI, el id básico `openai/gpt-5.6` es un alias de
Sol y el valor predeterminado para configuraciones nuevas. El catálogo nativo de Codex no aplica
ese alias de API directa en el cliente; según el acceso del espacio de trabajo, puede mostrar
los ids exactos de Sol, Terra y Luna. Por tanto, la configuración nueva mediante OAuth de ChatGPT/Codex
usa `openai/gpt-5.6-sol`. Compruebe la cuenta actual con:

```bash
openclaw models list --provider openai
```

El acceso de la organización de API y el del espacio de trabajo de Codex pueden ser distintos. Si GPT-5.6 no está
disponible, seleccione GPT-5.5 explícitamente:

```bash
openclaw models set openai/gpt-5.5
```

OpenClaw muestra el error de acceso del sistema de origen y no sustituye silenciosamente una
selección de GPT-5.6 por GPT-5.5.

<Note>
Las rutas HTTPS oficiales exactas aptas pueden seleccionar el Plugin de servidor de aplicaciones de Codex
incluido cuando la política del runtime no está definida o es `auto`; las rutas de Completions definidas,
los endpoints personalizados y las sustituciones del transporte de solicitudes permanecen en OpenClaw. Los endpoints
HTTP oficiales sin cifrar se rechazan. La configuración explícita del runtime por proveedor/modelo sigue
siendo vinculante. Ejecute `openclaw doctor --fix` para reparar referencias heredadas obsoletas de modelos de Codex,
referencias `codex-cli/*` o anclajes antiguos de sesiones del runtime que no se establecieron mediante
una configuración explícita del runtime.
</Note>

## Cobertura de funcionalidades de OpenClaw

| Capacidad de OpenAI       | Superficie de OpenClaw                                                                        | Estado                                                                  |
| ------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Chat / Responses          | proveedor de modelos `openai/<model>`                                                       | Sí                                                                      |
| Modelos de suscripción de Codex | `openai/<model>` con OAuth de OpenAI                                                   | Sí                                                                      |
| Referencias de modelos heredadas de Codex | referencias de modelos antiguas de Codex, `codex-cli/<model>`                     | Reparadas por doctor a `openai/<model>`                               |
| Infraestructura de app-server de Codex | ruta HTTPS compatible con Codex con runtime sin configurar/`auto`, o `agentRuntime.id: codex` explícito | Sí |
| Búsqueda web del lado del servidor | herramienta nativa de OpenAI Responses                                               | Sí, cuando la búsqueda web está habilitada y no se ha fijado otro proveedor |
| Imágenes                  | `image_generate`                                                                            | Sí                                                                      |
| Vídeos                    | `video_generate`                                                                            | Sí                                                                      |
| Texto a voz               | `tts.provider: "openai"` / `tts`                                                       | Sí                                                                      |
| Voz a texto por lotes     | `tools.media.audio` / comprensión de contenido multimedia                                      | Sí                                                                      |
| Voz a texto en streaming  | Voice Call `streaming.provider: "openai"`                                                                 | Sí                                                                      |
| Voz en tiempo real        | Voice Call `realtime.provider: "openai"` / Control UI Talk `talk.realtime.provider: "openai"`                            | Sí (clave de API de OpenAI Platform)                                    |
| Embeddings                | proveedor de embeddings de memoria                                                            | Sí                                                                      |

<Note>
La voz en tiempo real de OpenAI pasa por la **API Realtime de OpenAI
Platform** pública y requiere una clave de API de Platform. En cambio, los
tokens OAuth de Codex autentican el backend de ChatGPT Codex; no son
intercambiables con las claves de API de Platform para los endpoints públicos
de Realtime.

Si la autenticación mediante clave de API indica que falta facturación, añada
créditos de Platform en
[platform.openai.com/account/billing](https://platform.openai.com/account/billing)
para la organización que respalda sus credenciales de tiempo real cuando use
autenticación mediante clave de API. La voz en tiempo real acepta el perfil de
autenticación mediante clave de API `openai` creado por
`openclaw onboard --auth-choice openai-api-key`, una clave de API de Platform establecida mediante
`talk.realtime.providers.openai.apiKey` para Control UI Talk, o
`plugins.entries.voice-call.config.realtime.providers.openai.apiKey` para Voice
Call, o la variable de entorno `OPENAI_API_KEY`.

En Control UI Video Talk, OpenAI WebRTC recibe contexto de la cámara bajo
demanda: cuando el modelo llama a `describe_view`, el navegador envía un
único JPEG de tamaño limitado por el canal de datos en tiempo real. OpenClaw no
adjunta una pista de cámara continua a la sesión de OpenAI.
</Note>

## Embeddings de memoria

OpenClaw puede usar OpenAI, o un endpoint de embeddings compatible con OpenAI,
para la indexación y los embeddings de consulta de `memory_search`:

```json5
{
  memory: {
    search: {
      provider: "openai",
      model: "text-embedding-3-small",
    },
  },
}
```

Para endpoints compatibles con OpenAI que requieran etiquetas de embeddings
asimétricas, establezca `queryInputType` y `documentInputType` en
`memory.search`. OpenClaw las reenvía como campos de solicitud
`input_type` específicos del proveedor: los embeddings de consulta usan
`queryInputType`; los fragmentos de memoria indexados y la indexación por
lotes usan `documentInputType`. Consulte la
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

        También puede proporcionar la clave directamente:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Compruebe que el modelo esté disponible">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Resumen de rutas

    | Referencia del modelo | Política de runtime o datos de la ruta                         | Ruta                      | Autenticación                     |
    | --------------------- | ------------------------------------------------------------- | ------------------------- | --------------------------------- |
    | `openai/gpt-5.6` | sin configurar/`auto`, ruta nativa HTTPS oficial exacta, sin sustitución de solicitud | Se puede seleccionar Codex | Perfil de autenticación mediante clave de API ordenado |
    | `openai/gpt-5.6` | proveedor/modelo `agentRuntime.id: "openclaw"`                  | runtime integrado de OpenClaw | Perfil mediante clave de API `openai` seleccionado |
    | `openai/gpt-5.5` | proveedor/modelo `agentRuntime.id` explícito                    | runtime del agente seleccionado | Perfil mediante clave de API de OpenAI seleccionado |
    | `openai/*`       | Completions creadas, personalizadas o con sustitución de solicitud | runtime integrado de OpenClaw | El tipo de credencial no cambia |
    | `openai/*`       | endpoint HTTP oficial en texto sin formato            | Rechazada                 | La credencial no se envía         |

    <Note>
    Con el runtime sin configurar o establecido en `auto`, solo
    una ruta nativa HTTPS oficial exacta que cumpla los requisitos puede
    seleccionar implícitamente la infraestructura de app-server de Codex. Para
    la autenticación mediante clave de API en un modelo de agente, cree un
    perfil de autenticación mediante clave de API `openai` y ordénelo
    con `auth.order.openai`; `OPENAI_API_KEY` sigue siendo la alternativa
    directa para superficies de la API de OpenAI que no sean de agente.
    Ejecute `openclaw doctor --fix` para migrar entradas antiguas del orden de
    autenticación heredado de Codex.
    </Note>

    ### Ejemplo de configuración

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/gpt-5.6" } } },
    }
    ```

    El id de API directa sin sufijo `gpt-5.6` se resuelve al nivel
    Sol. Si esta organización de API no ofrece GPT-5.6, establezca
    explícitamente el modelo principal en `openai/gpt-5.5`.

    Para probar el modelo Instant actual de ChatGPT desde la API de OpenAI,
    establezca el modelo en `openai/chat-latest`:

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` es un alias dinámico. En su lugar, la configuración
    nueva mediante clave de API de OpenAI usa `openai/gpt-5.6`, cuyo id de
    API directa sin sufijo se resuelve a Sol. Los modelos principales
    explícitos existentes, incluido `openai/gpt-5.5`, permanecen sin cambios.
    El alias `chat-latest` solo acepta la verbosidad de texto
    `medium`; OpenClaw fuerza cualquier otra verbosidad solicitada a
    `medium` para este modelo.

    <Warning>
    OpenClaw **no** ofrece `gpt-5.3-codex-spark` en la ruta directa mediante clave
    de API de OpenAI. Solo está disponible mediante entradas del catálogo de
    suscripción de Codex cuando la cuenta con la que se ha iniciado sesión lo
    ofrece.
    </Warning>

  </Tab>

  <Tab title="Suscripción de Codex">
    **Ideal para:** usar una suscripción de ChatGPT/Codex con ejecución nativa
    mediante el app-server de Codex en lugar de una clave de API independiente.
    Codex cloud requiere iniciar sesión en ChatGPT.

    <Steps>
      <Step title="Ejecute OAuth de Codex">
        ```bash
        openclaw onboard --auth-choice openai
        ```

        También puede ejecutar OAuth directamente:

        ```bash
        openclaw models auth login --provider openai
        ```

        Para configuraciones sin interfaz gráfica o incompatibles con
        callbacks, añada `--device-code` para iniciar sesión mediante un
        flujo de código de dispositivo de ChatGPT en lugar del callback del
        navegador local:

        ```bash
        openclaw models auth login --provider openai --device-code
        ```
      </Step>
      <Step title="Use la ruta canónica del modelo de OpenAI">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.6-sol
        ```

        No se requiere ninguna configuración de runtime para esta ruta nativa
        HTTPS oficial exacta. Puede seleccionar automáticamente el runtime del
        app-server de Codex, y OpenClaw instala o repara el plugin de Codex
        incluido cuando se elige ese runtime.
      </Step>
      <Step title="Compruebe que la autenticación de Codex esté disponible">
        ```bash
        openclaw models list --provider openai
        ```

        Después de que el Gateway esté en ejecución, envíe
        `/codex status` o `/codex models` en el chat para comprobar el
        runtime nativo del app-server.
      </Step>
    </Steps>

    ### Resumen de rutas

    | Referencia del modelo    | Política de runtime o datos de la ruta                         | Ruta                                                     | Autenticación                                      |
    | ------------------------ | ------------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------- |
    | `openai/gpt-5.6-sol`     | sin configurar/`auto`, ruta nativa HTTPS oficial exacta, sin sustitución de solicitud | Se puede seleccionar Codex                               | Inicio de sesión de Codex o un perfil de autenticación `openai` ordenado |
    | `openai/gpt-5.6-terra`   | sin configurar/`auto`, ruta nativa HTTPS oficial exacta, sin sustitución de solicitud | Se puede seleccionar Codex                               | Inicio de sesión de Codex cuando el catálogo ofrece Terra |
    | `openai/gpt-5.6-luna`    | sin configurar/`auto`, ruta nativa HTTPS oficial exacta, sin sustitución de solicitud | Se puede seleccionar Codex                               | Inicio de sesión de Codex cuando el catálogo ofrece Luna |
    | `openai/gpt-5.6-sol`     | proveedor/modelo `agentRuntime.id: "openclaw"`                  | runtime integrado de OpenClaw, transporte interno de autenticación de Codex | Perfil OAuth `openai` seleccionado |
    | `openai/gpt-5.5`         | proveedor/modelo `agentRuntime.id` explícito                    | runtime del agente seleccionado                          | Perfil de autenticación de OpenAI seleccionado     |
    | `openai/*`               | Completions creadas, personalizadas o con sustitución de solicitud | runtime integrado de OpenClaw                            | El requisito de credenciales sigue dependiendo de la ruta |
    | `openai/*`               | endpoint HTTP oficial en texto sin formato            | Rechazada                                                | La credencial no se envía                          |
    | Referencia heredada de GPT-5.5 de Codex | reparada por doctor                                    | Reescrita como `openai/gpt-5.5`                        | Perfil OAuth de OpenAI migrado                     |
    | `codex-cli/gpt-5.5`      | reparada por doctor                                            | Reescrita como `openai/gpt-5.5`                        | Autenticación del app-server de Codex              |

    <Warning>
    La configuración nueva respaldada por suscripción usa exactamente `openai/gpt-5.6-sol`; el
    catálogo nativo de Codex también puede exponer referencias exactas de Terra o Luna. Si la
    cuenta no expone GPT-5.6, seleccione `openai/gpt-5.5` explícitamente. Las referencias
    anteriores de Codex GPT son rutas heredadas de OpenClaw, no la ruta del entorno de ejecución
    nativo de Codex; ejecute `openclaw doctor --fix` para migrarlas sin actualizar una
    selección explícita existente de GPT-5.5. `gpt-5.3-codex-spark` sigue estando limitado
    a las cuentas cuyo catálogo de suscripción de Codex lo anuncia; las referencias directas
    mediante clave de API de OpenAI y Azure siguen ocultas para este modelo.
    </Warning>

    <Note>
    La configuración nueva debe colocar el orden de autenticación del agente de OpenAI en `auth.order.openai`;
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

    Con una clave de API de respaldo, mantenga el modelo seleccionado en `openai/*` y coloque
    el orden de autenticación en `openai`. OpenClaw prueba primero la suscripción y después
    la clave de API, sin abandonar el entorno de Codex:

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
    La incorporación ya no importa material de OAuth desde `~/.codex`. Inicie sesión con
    OAuth en el navegador (opción predeterminada) o con el flujo de código de dispositivo anterior; OpenClaw gestiona
    las credenciales resultantes en su propio almacén de autenticación de agentes.
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

    Si una configuración anterior todavía contiene referencias heredadas de Codex GPT o una
    fijación obsoleta de sesión del entorno de OpenAI sin una configuración explícita del entorno, repárela:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    Si `models auth list --provider openai` no muestra ningún perfil utilizable, inicie sesión
    de nuevo:

    ```bash
    openclaw models auth login --provider openai
    openclaw models status --probe --probe-provider openai
    ```

    Use `--profile-id` para varios inicios de sesión OAuth de Codex en el mismo agente y
    contrólelos mediante el orden de autenticación o `/model ...@<profileId>`:

    ```bash
    openclaw models auth login --provider openai --profile-id openai:ritsuko
    openclaw models auth login --provider openai --profile-id openai:lain
    ```

    Ejecute `openclaw doctor --fix` para migrar los identificadores de perfil y las entradas de orden
    anteriores con el prefijo heredado OpenAI Codex antes de depender del orden de perfiles.

    ### Indicador de estado

    `/status` en el chat muestra qué entorno de modelo está activo para la sesión
    actual. El entorno de servidor de aplicaciones de Codex incluido aparece como
    `Runtime: OpenAI Codex` cuando lo selecciona una ruta implícita apta o una política
    explícita de entorno de proveedor/modelo.

    ### Advertencia de doctor

    Si quedan referencias heredadas de modelos Codex o fijaciones obsoletas del entorno de OpenAI
    en la configuración o el estado de la sesión, `openclaw doctor --fix` las reescribe como `openai/*` con
    el entorno de Codex, salvo que OpenClaw esté configurado explícitamente.

    ### Límite de la ventana de contexto

    OpenClaw trata los metadatos del modelo y el límite de contexto del entorno como valores
    independientes. Para `openai/gpt-5.5` mediante el catálogo OAuth de Codex:

    - `contextWindow` nativo: `400000`
    - Límite predeterminado de `contextTokens` del entorno: `272000`

    En la práctica, el límite predeterminado más pequeño ofrece mejores características de latencia
    y calidad. Sustitúyalo mediante `contextTokens`:

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
    para limitar el presupuesto de contexto del entorno. La ruta directa mediante clave de API de OpenAI
    informa de un `contextWindow` nativo mayor (`1000000`) para `gpt-5.5`; las dos
    rutas se registran por separado porque los catálogos ascendentes difieren.
    </Note>

    ### Recuperación del catálogo

    OpenClaw utiliza los metadatos del catálogo ascendente de Codex para `gpt-5.5` cuando están
    presentes. Si la detección en vivo de Codex omite la fila `gpt-5.5` mientras la cuenta
    está autenticada, OpenClaw sintetiza esa fila de modelo OAuth para que las ejecuciones de Cron,
    subagentes y modelos predeterminados configurados no fallen con
    `Unknown model`.

  </Tab>
</Tabs>

## Autenticación del servidor de aplicaciones nativo de Codex

El entorno del servidor de aplicaciones nativo de Codex utiliza referencias de modelo `openai/*` cuando una ruta
HTTPS oficial exacta y apta lo selecciona implícitamente, o cuando el
`agentRuntime.id: "codex"` del proveedor/modelo lo selecciona explícitamente. Su autenticación sigue
basándose en la cuenta. OpenClaw selecciona la autenticación en este orden:

1. Perfiles de autenticación de OpenAI ordenados para el agente, preferiblemente en
   `auth.order.openai`. Ejecute `openclaw doctor --fix` para migrar los identificadores anteriores de perfiles
   de autenticación heredados de Codex y el orden de autenticación.
2. La cuenta existente del servidor de aplicaciones, como un inicio de sesión local de ChatGPT
   en la CLI de Codex. Para el directorio de inicio aislado predeterminado del agente, OpenClaw conecta esa cuenta
   nativa de la CLI con el servidor de aplicaciones mediante su RPC de inicio de sesión; no comparte la
   configuración, los plugins ni el almacén de hilos de la CLI.
3. Solo para inicios locales del servidor de aplicaciones mediante stdio y únicamente cuando el servidor
   de aplicaciones no informa de ninguna cuenta: `CODEX_API_KEY` y después `OPENAI_API_KEY`.

Un inicio de sesión local con una suscripción de ChatGPT/Codex no se sustituye solo porque el
proceso del Gateway también tenga `OPENAI_API_KEY` para modelos directos de OpenAI o
embeddings. La alternativa de clave de API mediante variable de entorno solo se aplica a la ruta local
stdio sin cuenta; nunca se envía a través de conexiones WebSocket con el servidor de aplicaciones. Cuando se
selecciona un perfil de Codex basado en suscripción, OpenClaw también excluye
`CODEX_API_KEY` y `OPENAI_API_KEY` del proceso secundario del servidor de aplicaciones stdio
y envía las credenciales seleccionadas mediante el RPC de inicio de sesión del servidor de aplicaciones.

Cuando ese perfil de suscripción está bloqueado por un límite de uso de Codex, OpenClaw
marca el perfil como bloqueado hasta la hora de restablecimiento anunciada por Codex y permite que el orden
de autenticación pase al siguiente perfil `openai:*`, sin cambiar el modelo seleccionado
ni abandonar el entorno de Codex. Una vez pasada la hora de restablecimiento, el
perfil de suscripción vuelve a ser apto.

## Generación de imágenes

El plugin `openai` incluido registra la generación de imágenes mediante la
herramienta `image_generate`. Admite la generación de imágenes tanto con una clave de API de OpenAI
como con OAuth de Codex mediante la misma referencia de modelo `openai/gpt-image-2`.

| Capacidad                  | Clave de API de OpenAI                         | OAuth de Codex                                  |
| -------------------------- | ---------------------------------------------- | ----------------------------------------------- |
| Referencia del modelo      | `openai/gpt-image-2`                             | `openai/gpt-image-2`                              |
| Autenticación              | `OPENAI_API_KEY`                             | Inicio de sesión OAuth de OpenAI Codex           |
| Transporte                 | API de imágenes de OpenAI                      | Backend de Responses de Codex                    |
| Máximo de imágenes por solicitud | 4                                        | 4                                               |
| Modo de edición            | Habilitado (hasta 5 imágenes de referencia)    | Habilitado (hasta 5 imágenes de referencia)      |
| Sustituciones de tamaño    | Compatibles, incluidos tamaños 2K/4K           | Compatibles, incluidos tamaños 2K/4K             |
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

`gpt-image-2` es el valor predeterminado para la generación de imágenes a partir de texto y la edición
de imágenes de OpenAI. `gpt-image-1.5`, `gpt-image-1` y `gpt-image-1-mini` siguen siendo utilizables
como sustituciones explícitas del modelo. Use `openai/gpt-image-1.5` para obtener
salidas PNG/WebP con fondo transparente; la API `gpt-image-2` actual rechaza
`background: "transparent"`.

Para una solicitud con fondo transparente, invoque `image_generate` con
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` o `"webp"`, y
`background: "transparent"`; la opción anterior del proveedor `openai.background`
sigue siendo aceptada. OpenClaw también protege las rutas públicas de OpenAI y OAuth de OpenAI Codex
reescribiendo las solicitudes transparentes predeterminadas `openai/gpt-image-2` como
`gpt-image-1.5`; Azure y los endpoints personalizados compatibles con OpenAI conservan sus
nombres de despliegue/modelo configurados.

La misma configuración está disponible para ejecuciones de la CLI sin interfaz:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "Un adhesivo sencillo con un círculo rojo sobre un fondo transparente" \
  --json
```

Use las mismas opciones `--output-format` y `--background` con
`openclaw infer image edit` al partir de un archivo de entrada.
`--openai-background` sigue disponible como alias específico de OpenAI. Use
`--quality low|medium|high|auto` para controlar la calidad y el coste de las imágenes de OpenAI.
Use `--openai-moderation low|auto` para transmitir la indicación de moderación de OpenAI desde
`image generate` o `image edit`.

Para instalaciones OAuth de ChatGPT/Codex, mantenga la misma referencia `openai/gpt-image-2`. Cuando
se configura un perfil OAuth `openai`, OpenClaw resuelve el token de acceso OAuth
almacenado y envía las solicitudes de imágenes mediante el backend de Responses de Codex; no
prueba primero `OPENAI_API_KEY` ni recurre silenciosamente a una clave de API.
Configure `models.providers.openai` explícitamente con una clave de API, una URL base
personalizada o un endpoint de Azure cuando se prefiera la ruta directa de la API de imágenes de OpenAI.
Si ese endpoint personalizado de imágenes está en una dirección privada/de LAN de confianza,
configure también `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw
mantiene bloqueados los endpoints privados/internos de imágenes compatibles con OpenAI salvo que esté
presente esta habilitación explícita.

Generar:

```
/tool image_generate model=openai/gpt-image-2 prompt="Un póster de lanzamiento refinado para OpenClaw en macOS" size=3840x2160 count=1
```

Generar un PNG transparente:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="Un adhesivo sencillo con un círculo rojo sobre un fondo transparente" outputFormat=png background=transparent
```

Editar:

```
/tool image_generate model=openai/gpt-image-2 prompt="Conserva la forma del objeto y cambia el material a vidrio translúcido" image=/path/to/reference.png size=1024x1536
```

## Generación de vídeo

El plugin `openai` incluido registra la generación de vídeo mediante la
herramienta `video_generate`.

| Capacidad              | Valor                                                                                                      |
| ---------------------- | ---------------------------------------------------------------------------------------------------------- |
| Modelo predeterminado  | `openai/sora-2`                                                                                         |
| Modos                  | Texto a vídeo, imagen a vídeo, edición de un único vídeo                                                    |
| Entradas de referencia | 1 imagen o 1 vídeo                                                                                         |
| Sustituciones de tamaño | Compatibles para texto a vídeo e imagen a vídeo                                                           |
| Relación de aspecto    | Se convierte al tamaño compatible más cercano, no se reenvía sin modificar                                 |
| Otras sustituciones    | `resolution`, `audio` y `watermark` no son compatibles y se descartan con una advertencia de la herramienta |

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
`supportsResolution`. La capa de normalización compartida de OpenClaw convierte un
`aspectRatio` solicitado en el `size` de OpenAI equivalente más cercano antes de que la
solicitud llegue al proveedor, por lo que las solicitudes de relación de aspecto suelen seguir funcionando.
`resolution` no tiene alternativa de tamaño y se descarta, lo que se comunica al llamador como
`Ignored unsupported overrides for openai/<model>: resolution=<value>`.
</Note>

## Contribución al prompt de GPT-5

OpenClaw añade una contribución compartida al prompt de GPT-5 para los modelos de la familia GPT-5 en
el proveedor `openai` (incluidas las referencias heredadas de Codex anteriores a la reparación que se normalizan
a `openai/*`). Otros proveedores que también ofrecen identificadores de modelos de la familia GPT-5, como
OpenRouter o las rutas de opencode, no reciben esta superposición; se controla mediante el
identificador de proveedor `openai`, no solo mediante el identificador de modelo. Los modelos GPT-4.x anteriores nunca
la reciben.

El entorno nativo del servidor de aplicaciones de Codex no recibe el contrato de comportamiento de personalidad y
disciplina de herramientas ni la superposición de estilo de interacción cordial mediante
instrucciones para desarrolladores; Codex nativo conserva el comportamiento base, del modelo y
de la documentación del proyecto propiedad de Codex, y OpenClaw desactiva la personalidad integrada de Codex para
los hilos nativos, de modo que los archivos de personalidad del espacio de trabajo del agente sigan siendo la autoridad.
OpenClaw aporta únicamente contexto de ejecución a los hilos nativos de Codex: entrega por
canal, herramientas dinámicas de OpenClaw, delegación ACP, contexto del espacio de trabajo y
Skills de OpenClaw. El texto de orientación de Heartbeat de esta misma contribución es la
única excepción: los turnos de Heartbeat de Codex nativo sí lo reciben, inyectado como
instrucciones específicas de colaboración en lugar de mediante el enlace compartido de
contribución al prompt.

La contribución de GPT-5 añade un contrato de comportamiento etiquetado para la persistencia de la
personalidad, la seguridad de ejecución, la disciplina de herramientas, el formato de salida, las comprobaciones de
finalización y la verificación en los prompts coincidentes ensamblados por OpenClaw. El comportamiento de respuesta
específico del canal y de mensajes silenciosos permanece en el prompt del sistema compartido de OpenClaw
y en la política de entrega saliente. La capa de estilo de interacción cordial es
independiente y configurable.

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
Los valores no distinguen entre mayúsculas y minúsculas durante la ejecución, por lo que `"Off"` y `"off"` desactivan la
capa de estilo cordial.
</Tip>

<Note>
El valor heredado `plugins.entries.openai.config.personality` aún se lee como
alternativa de compatibilidad cuando la opción compartida
`agents.defaults.promptOverlays.gpt5.personality` no está establecida.
</Note>

## Voz y habla

<AccordionGroup>
  <Accordion title="Síntesis de voz (TTS)">
    El plugin incluido `openai` registra la síntesis de voz para la
    superficie `tts`.

    | Opción        | Ruta de configuración                                      | Valor predeterminado                  |
    | ------------- | --------------------------------------------------------- | ----------------------------------- |
    | Modelo        | `tts.providers.openai.model`                  | `gpt-4o-mini-tts`                |
    | Voz           | `tts.providers.openai.speakerVoice`           | `coral`                          |
    | Velocidad     | `tts.providers.openai.speed`                  | (sin establecer)                   |
    | Instrucciones | `tts.providers.openai.instructions`           | (sin establecer, solo `gpt-4o-mini-tts`)  |
    | Formato       | `tts.providers.openai.responseFormat`         | `opus` para notas de voz, `mp3` para archivos |
    | Clave de API  | `tts.providers.openai.apiKey`                 | Usa `OPENAI_API_KEY` como alternativa   |
    | URL base      | `tts.providers.openai.baseUrl`                | `https://api.openai.com/v1`      |
    | Cuerpo adicional | `tts.providers.openai.extraBody` / `extra_body` | (sin establecer)                |

    Modelos disponibles: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Voces disponibles:
    `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`,
    `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` se combina con el JSON de solicitud `/audio/speech` después de los
    campos generados por OpenClaw, por lo que debe usarse para endpoints compatibles con OpenAI que requieran
    claves adicionales como `lang`. Las claves de prototipo se ignoran.

    ```json5
    {
      tts: {
        providers: {
          openai: { model: "gpt-4o-mini-tts", speakerVoice: "coral" },
        },
      },
    }
    ```

    <Note>
    Establezca `OPENAI_TTS_BASE_URL` para sustituir la URL base de TTS sin afectar
    al endpoint de la API de chat. Tanto TTS de OpenAI como la voz en tiempo real se configuran
    mediante una clave de API de OpenAI Platform; las instalaciones que solo usan OAuth pueden seguir utilizando
    modelos de chat respaldados por Codex, pero no la respuesta de voz en directo de OpenAI.
    </Note>

  </Accordion>

  <Accordion title="Conversión de voz a texto">
    El plugin incluido `openai` registra la conversión de voz a texto por lotes mediante
    la superficie de transcripción de comprensión multimedia de OpenClaw.

    - Modelo predeterminado: `gpt-4o-transcribe`
    - Endpoint: REST de OpenAI `/v1/audio/transcriptions`
    - Ruta de entrada: carga de archivo de audio multipart
    - Se utiliza siempre que la transcripción de audio entrante lee `tools.media.audio`,
      incluidos los segmentos de canales de voz de Discord y los archivos de audio adjuntos de canales

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

    Las indicaciones de idioma y prompt se reenvían a OpenAI cuando las proporciona la
    configuración multimedia de audio compartida o la solicitud de transcripción de cada llamada.

  </Accordion>

  <Accordion title="Transcripción en tiempo real">
    El plugin incluido `openai` registra la transcripción en tiempo real para el
    plugin Voice Call.

    | Opción               | Ruta de configuración                                                   | Valor predeterminado |
    | ----------------- | ----------------------------------------------------------------------- | --------- |
    | Modelo               | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Idioma               | `...openai.language`                                                 | (sin establecer) |
    | Prompt               | `...openai.prompt`                                                   | (sin establecer) |
    | Duración del silencio | `...openai.silenceDurationMs`                                        | `800`   |
    | Umbral de VAD        | `...openai.vadThreshold`                                             | `0.5`   |
    | Autenticación        | `...openai.apiKey`, `OPENAI_API_KEY` o perfil de clave de API `openai`    | Se requiere una clave de API de Platform |

    <Note>
    Utiliza una conexión WebSocket a `wss://api.openai.com/v1/realtime` con
    audio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Para un perfil de clave de API `openai`,
    el Gateway genera un secreto efímero de cliente para la transcripción en tiempo real
    antes de abrir el WebSocket. Este proveedor de transmisión se utiliza para la ruta de
    transcripción en tiempo real de Voice Call; actualmente Discord graba segmentos cortos
    y utiliza en su lugar la ruta de transcripción por lotes `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Voz en tiempo real">
    El plugin incluido `openai` registra la voz en tiempo real para el plugin
    Voice Call.

    | Opción                                  | Ruta de configuración                                                       | Valor predeterminado      |
    | --------------------------------------- | ---------------------------------------------------------------------------- | ---------------------- |
    | Modelo                                  | `plugins.entries.voice-call.config.realtime.providers.openai.model`     | `gpt-realtime-2.1`  |
    | Voz                                     | `...openai.voice`                                                       | `alloy`             |
    | Temperatura (puente de implementación de Azure) | `...openai.temperature`                                                 | `0.8`               |
    | Umbral de VAD                           | `...openai.vadThreshold`                                                | `0.5`                |
    | Duración del silencio                   | `...openai.silenceDurationMs`                                           | `500`                |
    | Relleno de prefijo                      | `...openai.prefixPaddingMs`                                             | `300`                |
    | Esfuerzo de razonamiento                | `...openai.reasoningEffort`                                             | (sin establecer)       |
    | Autenticación                           | Perfil de clave de API `openai`, `...openai.apiKey` o `OPENAI_API_KEY` | Se requiere una clave de API de OpenAI Platform |

    Voces integradas en tiempo real disponibles para `gpt-realtime-2.1`: `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`.
    OpenAI recomienda `marin` y `cedar` para obtener la mejor calidad en tiempo real. Este
    conjunto es distinto de las voces de texto a voz anteriores; una voz exclusiva de TTS
    como `fable`, `nova` o `onyx` no es válida para las sesiones en tiempo real.
    Establezca explícitamente el modelo en `gpt-realtime-2.1-mini` si prefiere la
    variante Realtime 2.1 más pequeña y económica.

    <Note>
    **GPT-Live (próximamente).** Los modelos dúplex completo `gpt-live-1` y
    `gpt-live-1-mini` de OpenAI sustituyeron el modo de voz de ChatGPT en julio de 2026; la
    API para desarrolladores se está desplegando para organizaciones con acceso anticipado. OpenClaw
    reconoce la familia de modelos, pero todavía no la ejecuta: las sesiones de GPT-Live
    solo usan WebRTC, gestionan sus propios turnos (sin VAD) y delegan el trabajo del agente
    mediante un protocolo de eventos de transferencia que los transportes en tiempo real de OpenClaw
    aún no implementan. Configurar un modelo `gpt-live-*` produce un fallo seguro con
    orientación tanto sobre el puente WebSocket como sobre las sesiones del navegador Talk, en lugar de
    conectar silenciosamente el audio sin acceso al agente. El acceso a la API también está restringido
    por organización de OpenAI durante el acceso anticipado. Mantenga `gpt-realtime-2.1` (el
    valor predeterminado) hasta que se incorpore la compatibilidad con GPT-Live.
    </Note>

    <Note>
    Los puentes de backend en tiempo real de OpenAI utilizan el formato de sesión
    WebSocket de Realtime con disponibilidad general, que no acepta `session.temperature`. Las
    implementaciones de Azure OpenAI siguen disponibles mediante `azureEndpoint` y `azureDeployment`, y
    conservan el formato de sesión compatible con la implementación (incluido `temperature`).
    Admite llamadas bidireccionales a herramientas y audio G.711 u-law.
    </Note>

    <Note>
    La voz en tiempo real se selecciona al crear la sesión. OpenAI permite cambiar
    posteriormente la mayoría de los campos de la sesión, pero la voz no puede
    cambiarse después de que el modelo haya emitido audio en esa sesión. Actualmente,
    OpenClaw expone como cadenas los identificadores de voz integrados de Realtime.
    </Note>

    <Note>
    Talk de la interfaz de control utiliza sesiones en tiempo real de OpenAI en el
    navegador, con un secreto de cliente efímero emitido por el Gateway y un
    intercambio SDP de WebRTC directo desde el navegador con la API Realtime de
    OpenAI. El Gateway emite ese secreto de cliente con la credencial
    `openai` seleccionada. Las claves configuradas, los perfiles de clave de
    API y `OPENAI_API_KEY` tienen prioridad; un perfil OAuth
    `openai` o un inicio de sesión externo de Codex se usa como alternativa.
    Los puentes WebSocket en tiempo real del relé del Gateway y del backend de
    llamadas de voz utilizan el mismo orden de credenciales para los endpoints
    nativos de OpenAI. La verificación en vivo para mantenedores está disponible con
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    los segmentos de OpenAI verifican tanto el puente WebSocket del backend como el
    intercambio SDP de WebRTC del navegador sin registrar secretos.
    Pase `--openai-only` para ejecutar esos dos segmentos sin credenciales de Google.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoints de Azure OpenAI

El proveedor `openai` incluido puede usar como destino un recurso de Azure
OpenAI para generar imágenes mediante la sustitución de la URL base. En la ruta de
generación de imágenes, OpenClaw detecta los nombres de host de Azure en
`models.providers.openai.baseUrl` y cambia automáticamente al formato de solicitud de Azure.

<Note>
La voz en tiempo real utiliza una ruta de configuración independiente
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
y no se ve afectada por `models.providers.openai.baseUrl`. Consulte el acordeón **Voz en
tiempo real** de [Voz y habla](#voice-and-speech) para conocer su configuración
de Azure.
</Note>

Use Azure OpenAI cuando:

- Ya disponga de una suscripción, cuota o acuerdo empresarial de Azure OpenAI
- Necesite la residencia regional de datos o los controles de cumplimiento que proporciona Azure
- Quiera mantener el tráfico dentro de una tenencia de Azure existente

### Configuración

Para generar imágenes con Azure mediante el proveedor `openai` incluido,
dirija `models.providers.openai.baseUrl` a su recurso de Azure y establezca `apiKey`
en la clave de Azure OpenAI (no una clave de OpenAI Platform):

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

Para las solicitudes de generación de imágenes en un host de Azure reconocido,
OpenClaw:

- Envía el encabezado `api-key` en lugar de `Authorization: Bearer`
- Utiliza rutas específicas de la implementación (`/openai/deployments/{deployment}/...`)
- Añade `?api-version=...` a cada solicitud
- Utiliza un tiempo de espera predeterminado de 600s para las llamadas de generación de imágenes de Azure.
  Los valores `timeoutMs` de cada llamada siguen sustituyendo este valor predeterminado.

Otras URL base (OpenAI público y proxies compatibles con OpenAI) conservan el
formato estándar de solicitud de imágenes de OpenAI.

<Note>
El enrutamiento de Azure para la ruta de generación de imágenes del proveedor
`openai` requiere OpenClaw 2026.4.22 o posterior. Las versiones anteriores
tratan cualquier `openai.baseUrl` personalizado como el endpoint público de OpenAI
y fallan con las implementaciones de imágenes de Azure.
</Note>

### Versión de la API

Establezca `AZURE_OPENAI_API_VERSION` para fijar una versión preliminar o de disponibilidad
general específica de Azure para la ruta de generación de imágenes de Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

El valor predeterminado es `2024-12-01-preview` cuando la variable no está definida.

### Los nombres de los modelos son nombres de implementación

Azure OpenAI vincula los modelos a implementaciones. Para las solicitudes de
generación de imágenes de Azure enrutadas mediante el proveedor
`openai` incluido, el campo `model` de OpenClaw debe ser el
**nombre de la implementación de Azure** configurado en el portal de Azure, no el
identificador del modelo público de OpenAI.

Si crea una implementación denominada `gpt-image-2-prod` que sirve
`gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="Un cartel sencillo" size=1024x1024 count=1
```

La misma regla sobre el nombre de implementación se aplica a cualquier llamada
de generación de imágenes enrutada mediante el proveedor `openai`
incluido.

### Disponibilidad regional

Actualmente, la generación de imágenes de Azure solo está disponible en un
subconjunto de regiones (por ejemplo, `eastus2`, `swedencentral`,
`polandcentral`, `westus3`, `uaenorth`). Consulte la lista
actual de regiones de Microsoft antes de crear una implementación y confirme
que el modelo específico se ofrece en su región.

### Diferencias entre parámetros

Azure OpenAI y OpenAI público no siempre aceptan los mismos parámetros de imagen.
Azure puede rechazar opciones permitidas por OpenAI público (por ejemplo,
determinados valores de `background` en `gpt-image-2`) o exponerlas
solo en versiones específicas del modelo. Estas diferencias proceden de Azure y
del modelo subyacente, no de OpenClaw. Si una solicitud de Azure falla con un
error de validación, consulte en el portal de Azure el conjunto de parámetros
admitidos por su implementación y versión de la API específicas.

<Note>
Azure OpenAI utiliza el transporte nativo y el comportamiento de compatibilidad,
pero no recibe los encabezados de atribución ocultos de OpenClaw; consulte el
acordeón **Rutas nativas frente a rutas compatibles con OpenAI** de
[Configuración avanzada](#advanced-configuration).

Para el tráfico de chat o Responses en Azure (aparte de la generación de
imágenes), utilice el flujo de incorporación o una configuración específica del
proveedor de Azure; `openai.baseUrl` por sí solo no adopta el formato de
API/autenticación de Azure. Existe un proveedor `azure-openai-responses/*` independiente;
consulte el acordeón de Compaction del lado del servidor más adelante.
</Note>

## Configuración avanzada

Los siguientes ejemplos de `params` por modelo definen la solicitud
del proveedor integrado de OpenClaw. Configurarlos constituye un comportamiento
de solicitud definido explícitamente, por lo que una ruta `auto` que
de otro modo sería apta permanece en OpenClaw en lugar de seleccionar Codex
implícitamente. El entorno nativo app-server de Codex administra su propio
transporte y configuración de solicitudes; `agentRuntime.id: "codex"` explícito falla de
forma cerrada cuando la ruta efectiva no está declarada como compatible con Codex.

<AccordionGroup>
  <Accordion title="Transporte (WebSocket frente a SSE)">
    OpenClaw utiliza primero WebSocket, con SSE como alternativa (`"auto"`), para `openai/*`.

    En el modo `"auto"`, OpenClaw:
    - Reintenta una vez tras un fallo temprano de WebSocket antes de recurrir a SSE
    - Tras un fallo, marca WebSocket como degradado durante 60 segundos y utiliza SSE
      durante el periodo de espera
    - Adjunta encabezados estables de identidad de sesión y turno para los reintentos y
      las reconexiones
    - Normaliza los contadores de uso (`input_tokens` / `prompt_tokens`) entre
      las variantes de transporte

    | Valor                | Comportamiento                          |
    | ---------------------- | ------------------------------------ |
    | `"auto"` (predeterminado)   | WebSocket primero, SSE como alternativa     |
    | `"sse"`              | Fuerza únicamente SSE                    |
    | `"websocket"`        | Fuerza únicamente WebSocket              |

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
    - [Respuestas de la API en streaming (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Modo rápido">
    OpenClaw expone un conmutador compartido de modo rápido para `openai/*`:

    - **Chat/interfaz de usuario:** `/fast status|auto|on|off`
    - **Configuración:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Cuando está habilitado, OpenClaw asigna el modo rápido al procesamiento
    prioritario de OpenAI (`service_tier = "priority"`). Se conservan los valores existentes
    de `service_tier`, y el modo rápido no modifica `reasoning` ni
    `text.verbosity`. `fastMode: "auto"` inicia rápidamente las nuevas llamadas al
    modelo hasta el límite automático; después, inicia las llamadas posteriores de
    reintento, alternativa, resultado de herramienta o continuación sin el modo rápido.
    El límite predeterminado es de 60 segundos; establezca `params.fastAutoOnSeconds` en el
    modelo activo para cambiarlo.

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
    Las sustituciones de la sesión tienen prioridad sobre la configuración. Al
    borrar la sustitución de la sesión en la interfaz Sessions, la sesión vuelve
    al valor predeterminado configurado.
    </Note>

  </Accordion>

  <Accordion title="Procesamiento prioritario (service_tier)">
    La API de OpenAI expone el procesamiento prioritario mediante
    `service_tier`. Configúrelo por modelo en OpenClaw:

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
    Para los modelos Responses directos de OpenAI (`openai/*` en
    `api.openai.com`), el contenedor de flujo de OpenClaw del Plugin de OpenAI
    habilita automáticamente la Compaction del lado del servidor:

    - Fuerza `store: true` (salvo que la compatibilidad del modelo establezca `supportsStore: false`)
    - Inyecta `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Valor predeterminado de `compact_threshold`: 70% de `contextWindow` (o `80000` cuando
      no está disponible)

    Esto se aplica a la ruta de ejecución integrada de OpenClaw y a los hooks del
    proveedor de OpenAI utilizados por las ejecuciones integradas. El entorno
    nativo app-server de Codex administra su propio contexto mediante Codex y no
    se ve afectado por esta configuración.

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
    Los modelos Responses directos de OpenAI siguen forzando
    `store: true`, salvo que la compatibilidad establezca `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Modo GPT agentivo estricto">
    Para los modelos de la familia GPT-5 del proveedor `openai`
    ejecutados mediante el entorno integrado de OpenClaw, OpenClaw ya utiliza de
    forma predeterminada un contrato de ejecución más estricto denominado
    `strict-agentic`. Se activa automáticamente siempre que el proveedor resuelto
    sea `openai` y el identificador del modelo coincida con la familia
    GPT-5, salvo que la configuración lo desactive explícitamente:

    ```json5
    {
      agents: {
        defaults: {
          embeddedAgent: { executionContract: "default" },
        },
      },
    }
    ```

    Establecer `"strict-agentic"` explícitamente no tiene ningún efecto en una vía compatible (ya
    es el valor predeterminado) y es inerte en pares de proveedor/modelo no compatibles.

    Con `strict-agentic` activo, OpenClaw:
    - Activa automáticamente `update_plan` para trabajos sustanciales
    - Reintenta los turnos estructuralmente vacíos o que solo contienen razonamiento con una continuación
      que proporciona una respuesta visible
    - Usa eventos explícitos de planificación del arnés cuando el arnés seleccionado los
      proporciona

    OpenClaw no clasifica el texto del asistente para decidir si un turno es un
    plan, una actualización de progreso o una respuesta final.

    <Note>
    Este contrato reside por completo en el ejecutor de agentes integrado de OpenClaw. No se
    aplica al arnés nativo del servidor de aplicaciones de Codex, que gestiona su propio
    comportamiento de turnos y planes; la selección del arnés importa más que la
    configuración del contrato de ejecución para las ejecuciones nativas de Codex.
    </Note>

  </Accordion>

  <Accordion title="Rutas nativas frente a compatibles con OpenAI">
    OpenClaw trata los endpoints directos de OpenAI, Codex y Azure OpenAI
    de forma diferente a los proxies genéricos `/v1` compatibles con OpenAI:

    **Rutas nativas** (`openai/*`, Azure OpenAI):
    - Mantienen `reasoning: { effort: "none" }` solo para los modelos que admiten el
      esfuerzo `none` de OpenAI
    - Omiten el razonamiento deshabilitado para los modelos o proxies que rechazan
      `reasoning.effort: "none"`
    - Usan de forma predeterminada el modo estricto para los esquemas de herramientas
    - Adjuntan encabezados de atribución ocultos solo en hosts nativos verificados (Azure
      OpenAI no recibe estos encabezados, aunque sea una ruta nativa)
    - Mantienen la adaptación de solicitudes exclusiva de OpenAI (`service_tier`, `store`,
      compatibilidad de razonamiento, indicaciones de caché de prompts)

    **Rutas de proxy/compatibles:**
    - Usan un comportamiento de compatibilidad menos estricto
    - Eliminan `store` de Completions de las cargas útiles `openai-completions` no nativas
    - Aceptan JSON avanzado de transferencia directa `params.extra_body`/`params.extraBody`
      para proxies de Completions compatibles con OpenAI
    - Aceptan `params.chat_template_kwargs` para proxies de Completions compatibles con OpenAI,
      como vLLM
    - No fuerzan esquemas de herramientas estrictos ni encabezados exclusivos de rutas nativas

  </Accordion>
</AccordionGroup>

## Relacionado

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
