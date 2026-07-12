---
read_when:
    - Quieres usar el entorno oficial de app-server de Codex
    - Necesitas ejemplos de configuración del entorno de Codex
    - Quiere que las implementaciones exclusivas de Codex fallen en lugar de recurrir a OpenClaw
summary: Ejecuta turnos del agente integrado de OpenClaw mediante el arnés oficial del servidor de aplicaciones de Codex
title: Entorno de Codex
x-i18n:
    generated_at: "2026-07-12T14:41:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 5f6705dad9fa3bbe45c2f4eaf079ecb861b7911142bda1301c4d64a1f21a8ec5
    source_path: plugins/codex-harness.md
    workflow: 16
---

El plugin oficial `codex` ejecuta de forma integrada los turnos del agente de OpenAI mediante Codex
app-server en lugar del entorno integrado de OpenClaw. Codex controla la
sesión de agente de bajo nivel: reanudación nativa de hilos, continuación nativa de herramientas,
Compaction nativa y ejecución de app-server. OpenClaw sigue controlando los canales
de chat, los archivos de sesión, la selección de modelos, las herramientas dinámicas de OpenClaw, las aprobaciones,
la entrega de contenido multimedia y el reflejo visible de la transcripción.

Use referencias canónicas de modelos de OpenAI, como `openai/gpt-5.6-sol`. No configure
referencias GPT heredadas de Codex; defina el orden de autenticación del agente de OpenAI en `auth.order.openai`.
Los identificadores heredados de perfiles de autenticación de Codex y las entradas heredadas del orden de autenticación de Codex se
reparan mediante `openclaw doctor --fix`.

Cuando la política de proveedor/modelo del entorno de ejecución no está definida o es `auto`, el prefijo `openai/*` por sí solo
nunca selecciona este entorno. OpenAI solo puede seleccionar Codex implícitamente para una
ruta oficial HTTPS exacta de Platform Responses o ChatGPT Responses sin una
anulación de solicitud definida. Consulte
[Entorno de ejecución de agente implícito de OpenAI](/es/providers/openai#implicit-agent-runtime).
Si Codex controla la autenticación antes de que se conozca el enrutamiento entre Platform y ChatGPT, OpenClaw
sigue exigiendo que todas las rutas candidatas declaren compatibilidad con Codex. El control
nativo de la autenticación por sí solo nunca omite esa comprobación de ruta.

Cuando no hay ningún entorno aislado de OpenClaw activo, OpenClaw inicia los hilos de Codex app-server
con el modo de código nativo de Codex habilitado (el modo exclusivamente de código permanece desactivado de forma predeterminada), por lo que
las capacidades nativas de espacio de trabajo y código siguen disponibles junto con las herramientas
dinámicas de OpenClaw enrutadas mediante el puente `item/tool/call` de app-server. Un
entorno aislado de OpenClaw activo o una política de herramientas restringida deshabilita por completo el modo de código nativo,
a menos que se habilite explícitamente la ruta experimental del servidor de ejecución del entorno aislado.

Con el valor predeterminado `tools.exec.host: "auto"` y sin ningún entorno aislado de OpenClaw activo,
Codex también recibe las herramientas `node_exec` y `node_process` para ejecutar comandos en Nodes
emparejados. El shell nativo permanece en el host y el espacio de trabajo de Codex app-server
(local al Gateway en la implementación stdio predeterminada); `node_exec` selecciona un Node por
nombre o identificador y mantiene vigente la política de aprobación de Nodes de OpenClaw.

Esta función nativa de Codex es independiente del
[modo de código de OpenClaw](/es/reference/code-mode), un entorno de ejecución QuickJS-WASI opcional
para ejecuciones genéricas de OpenClaw con una estructura de entrada `exec` diferente. Para conocer la
separación general entre modelo, proveedor y entorno de ejecución, comience por
[Entornos de ejecución de agentes](/es/concepts/agent-runtimes): `openai/gpt-5.6-sol` es la referencia
del modelo, `codex` es el entorno de ejecución y Telegram, Discord, Slack u otro
canal es la superficie de comunicación.

## Requisitos

- El plugin oficial `@openclaw/codex` instalado. Incluya `codex` en
  `plugins.allow` si la configuración utiliza una lista de permitidos.
- Codex app-server `0.143.0` o posterior. El plugin administra de forma predeterminada
  un binario compatible, por lo que un comando `codex` en `PATH` no afecta al inicio
  normal.
- Autenticación de Codex mediante `openclaw models auth login --provider openai`, una
  cuenta de app-server ya presente en el directorio principal de Codex del agente o un
  perfil explícito de autenticación con clave de API de Codex.

Para obtener información sobre la precedencia de autenticación, el aislamiento del entorno, los comandos personalizados de app-server,
el descubrimiento de modelos y la lista completa de campos de configuración, consulte
[Referencia del entorno Codex](/es/plugins/codex-harness-reference).

## Inicio rápido

Instale el plugin oficial y, a continuación, inicie sesión con OAuth de Codex:

```bash
openclaw plugins install @openclaw/codex
openclaw models auth login --provider openai
```

Habilite el plugin `codex` y seleccione un modelo de agente de OpenAI:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

Si la configuración utiliza `plugins.allow`, añada también `codex`:

```json5
{
  plugins: {
    allow: ["codex"],
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Reinicie el Gateway después de cambiar la configuración del plugin. Si un chat ya tiene una
sesión, ejecute primero `/new` o `/reset` para que el siguiente turno determine el entorno
a partir de la configuración actual.

## Compartir hilos con Codex Desktop y la CLI

El valor predeterminado `appServer.homeScope: "agent"` aísla cada agente de OpenClaw del
estado nativo de Codex del operador. Para permitir que un propietario inspeccione y administre los
mismos hilos nativos que se muestran en Codex Desktop y la CLI de Codex, habilite explícitamente el
directorio principal de Codex del usuario:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            homeScope: "user",
          },
        },
      },
    },
  },
}
```

El modo de directorio personal del usuario admite un proceso stdio administrado local o el transporte
compartido mediante socket Unix. Usa `$CODEX_HOME` cuando está definido y `~/.codex` en caso contrario, incluidos
la autenticación nativa de Codex, la configuración, los plugins y el almacén de hilos de ese directorio personal. OpenClaw
no inyecta un perfil de autenticación de OpenClaw en este servidor de aplicaciones.

Los turnos del propietario obtienen la herramienta `codex_threads`: permite enumerar, buscar, leer, bifurcar, renombrar,
archivar y restaurar hilos nativos. Bifurque un hilo para continuarlo en
OpenClaw; la bifurcación se adjunta a la sesión actual de OpenClaw y permanece
visible para otros clientes nativos de Codex. El archivado requiere una
confirmación explícita de que el hilo está cerrado en otro lugar. Cuando la supervisión también está
habilitada, los campos de transcripción y las mutaciones requieren la activación correspondiente de
`supervision.allowRawTranscripts` o `supervision.allowWriteControls`.

No reanude ni escriba simultáneamente en el mismo hilo mediante servidores de aplicaciones stdio administrados
independientes. Codex coordina los escritores activos dentro de un servidor de aplicaciones, no
entre procesos separados. La bifurcación es la vía segura de coexistencia para las sesiones stdio ordinarias
del directorio personal del usuario.

`appServer.homeScope: "user"` por sí solo no habilita el catálogo de la flota. Use
`supervision.enabled: true` cuando quiera que las sesiones nativas aparezcan en la
barra lateral de OpenClaw. La supervisión usa una conexión de supervisión independiente; sin
una configuración de conexión `appServer` explícita, esa conexión usa de forma predeterminada stdio administrado
del directorio personal del usuario, mientras que el arnés ordinario permanece limitado al agente. La configuración
explícita de `appServer` se respeta en ambas rutas. Establezca `homeScope: "user"`
explícitamente, como se muestra arriba, cuando el arnés ordinario también deba compartir el estado nativo.

## Supervisar sesiones de Codex

El mismo plugin `codex` puede enumerar sesiones de Codex no archivadas del equipo del Gateway
y de los nodos emparejados que hayan dado su consentimiento. Una sesión almacenada o inactiva local del Gateway puede
crear un Chat bloqueado al modelo que refleja su historial persistente y acotado de mensajes del usuario y del asistente.
Su vinculación privada usa la conexión de supervisión para la instantánea nativa,
la rama canónica y los turnos posteriores, mientras las sesiones ordinarias de Codex permanecen
limitadas al agente. El primer inicio canónico usa exactamente el modelo y el proveedor que
Codex devuelve para la bifurcación de la instantánea. Las reanudaciones posteriores dejan la selección a la
configuración nativa de Codex; el modelo externo de OpenClaw y la cadena de respaldo nunca lo
sustituyen. Las filas almacenadas e inactivas pueden archivarse después de confirmar explícitamente
que no hay ningún otro ejecutor. Las fuentes activas no pueden crear una rama ni archivarse; un Chat
supervisado existente sí puede abrirse. Las sesiones de nodos emparejados permanecen limitadas a metadatos.

Consulte [Supervisar sesiones de Codex](/plugins/codex-supervision) para conocer la configuración, las reglas de bifurcación,
los límites de los nodos emparejados, la exposición de metadatos y la solución de problemas.

## Configuración

| Necesidad                                            | Configuración                                                                                     | Ubicación                                |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------- |
| Habilitar el arnés                                  | `plugins.entries.codex.enabled: true`                                                            | Configuración de OpenClaw                |
| Mostrar sesiones de Codex no archivadas             | `plugins.entries.codex.config.supervision.enabled: true`                                         | Configuración del plugin Codex           |
| Conservar la instalación de un plugin incluido en la lista de permitidos | Incluya `codex` en `plugins.allow`                                                    | Configuración de OpenClaw                |
| Permitir que los turnos aptos de OpenAI usen Codex implícitamente | Ruta oficial HTTPS exacta de Responses/ChatGPT, sin anulación creada en la solicitud, entorno de ejecución sin definir/`auto` | Configuración del proveedor/modelo de OpenAI |
| Iniciar sesión con OAuth de ChatGPT/Codex            | `openclaw models auth login --provider openai`                                                   | Perfil de autenticación de la CLI        |
| Añadir un respaldo mediante clave de API para las ejecuciones de Codex | Perfil de clave de API `openai:*` enumerado después de la autenticación de suscripción en `auth.order.openai` | Perfil de autenticación de la CLI + configuración de OpenClaw |
| Fallar de forma cerrada cuando Codex no esté disponible | `agentRuntime.id: "codex"` del proveedor o modelo                                             | Configuración del modelo/proveedor de OpenClaw |
| Usar tráfico directo de la API de OpenAI             | `agentRuntime.id: "openclaw"` del proveedor o modelo con autenticación normal de OpenAI          | Configuración del modelo/proveedor de OpenClaw |
| Ajustar el comportamiento del servidor de aplicaciones | `plugins.entries.codex.config.appServer.*`                                                     | Configuración del plugin Codex           |
| Habilitar aplicaciones de plugins nativos de Codex  | `plugins.entries.codex.config.codexPlugins.*`                                                    | Configuración del plugin Codex           |
| Habilitar Computer Use de Codex                      | `plugins.entries.codex.config.computerUse.*`                                                     | Configuración del plugin Codex           |

Prefiera `auth.order.openai` para ordenar primero la suscripción y después el respaldo mediante clave de API.
Los identificadores de perfiles de autenticación heredados de Codex y el orden de autenticación heredado de Codex son
estado heredado exclusivo de doctor; no escriba nuevas referencias GPT heredadas de Codex.

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Para una ruta efectiva compatible con Codex, los dos perfiles anteriores siguen siendo candidatos
para la misma ejecución de Codex. El orden de los perfiles elige las credenciales, no el entorno de ejecución.
Cambiar el orden de autenticación no hace que una ruta personalizada, de Completions, HTTP o
anulada por la solicitud sea compatible con Codex.

### Compaction

No establezca `compaction.model` ni `compaction.provider` en agentes respaldados por
Codex. Codex realiza la compactación mediante el estado nativo de los hilos de su servidor de aplicaciones, por lo que
OpenClaw ignora esas anulaciones locales del resumidor durante la ejecución, y
`openclaw doctor --fix` las elimina cuando el agente usa Codex.

Lossless sigue siendo compatible como motor de contexto para el ensamblaje, la ingesta y
el mantenimiento en torno a los turnos de Codex, configurado mediante
`plugins.slots.contextEngine: "lossless-claw"` y
`plugins.entries.lossless-claw.config.summaryModel`, no mediante
`agents.defaults.compaction.provider`. `openclaw doctor --fix` migra la
forma antigua `compaction.provider: "lossless-claw"` a la ranura del motor de contexto
Lossless cuando Codex es el entorno de ejecución activo, pero Codex nativo sigue
siendo responsable de la compactación. El arnés nativo del servidor de aplicaciones admite motores de contexto
que necesitan ensamblaje previo al prompt; los backends genéricos de la CLI, incluido `codex-cli`,
no proporcionan esa capacidad del host.

Para los agentes respaldados por Codex, `/compact` inicia la compactación nativa del servidor de aplicaciones
de Codex en el hilo vinculado. OpenClaw no espera a que finalice,
no impone un tiempo de espera de OpenClaw, no reinicia el servidor de aplicaciones compartido ni recurre a un
motor de contexto o a un resumidor público de OpenAI. Si falta la vinculación del hilo nativo
de Codex o está obsoleta, el comando falla de forma cerrada en lugar de cambiar
silenciosamente de backend de compactación.

El resto de esta página trata la forma de despliegue, el enrutamiento con fallo cerrado, la política de aprobación
del guardián, los plugins nativos de Codex y Computer Use. Para consultar las listas completas de opciones,
los valores predeterminados, las enumeraciones, la detección, el aislamiento del entorno, los tiempos de espera y
los campos de transporte del servidor de aplicaciones, consulte
[Referencia del arnés de Codex](/es/plugins/codex-harness-reference).

## Verificar el entorno de ejecución de Codex

Use `/status` en el chat donde espera que se use Codex. Un turno de agente de OpenAI
respaldado por Codex muestra:

```text
Entorno de ejecución: OpenAI Codex
```

A continuación, compruebe el estado del servidor de aplicaciones de Codex:

```text
/codex status
/codex models
```

`/codex status` informa sobre la conectividad con el servidor de la aplicación, la cuenta, los límites de uso, los servidores MCP y las Skills. `/codex models` enumera el catálogo activo del servidor de la aplicación Codex para el arnés y la cuenta. Si el resultado de `/status` resulta inesperado, consulte [Solución de problemas](#troubleshooting).

## Enrutamiento y selección de modelos

Mantenga separadas las referencias de proveedor y la política del entorno de ejecución:

- Use `openai/gpt-*` para la selección canónica de modelos de OpenAI. El prefijo por sí solo nunca selecciona Codex.
- Cuando el entorno de ejecución no está definido o es `auto`, solo una ruta oficial HTTPS exacta de Platform Responses o ChatGPT Responses, sin una sobrescritura de solicitud creada por el usuario, puede seleccionar Codex implícitamente.
- No use referencias GPT heredadas de Codex en la configuración; ejecute `openclaw doctor --fix` para reparar las referencias heredadas y las asignaciones obsoletas de rutas de sesión.
- `agentRuntime.id: "codex"` convierte Codex en un requisito con cierre ante fallos para una ruta compatible. No hace compatible una ruta efectiva incompatible.
- `agentRuntime.id: "openclaw"` hace que un proveedor o modelo use el entorno de ejecución integrado de OpenClaw cuando esto sea intencional.
- `/codex ...` controla desde el chat las conversaciones nativas del servidor de la aplicación Codex.
- ACP/acpx es una ruta de arnés externo independiente. Úsela solo cuando el usuario solicite ACP/acpx o un adaptador de arnés externo.

| Intención del usuario                                      | Uso                                                                                                   |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Adjuntar el chat actual                                    | `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]`                    |
| Reanudar un hilo existente de Codex                        | `/codex resume <thread-id>`                                                                           |
| Enumerar o filtrar hilos de Codex                          | `/codex threads [filter]`                                                                             |
| Enumerar Plugins nativos de Codex                          | `/codex plugins list`                                                                                 |
| Habilitar o deshabilitar un Plugin nativo de Codex configurado | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                   |
| Reanudar una sesión almacenada de la CLI de Codex como un turno de Node emparejado | `/codex sessions --host <node> [filter]`, luego `/codex resume <session-id> --host <node> --bind here` |
| Ver sesiones de Codex no archivadas entre equipos          | Habilite la supervisión de Codex y abra **Sesiones de Codex**                                         |
| Cambiar el modelo, el modo rápido o los permisos del hilo vinculado | `/codex model <model>`, `/codex fast [on\|off\|status]`, `/codex permissions [default\|yolo\|status]` |
| Detener u orientar el turno activo                         | `/codex stop`, `/codex steer <text>`                                                                  |
| Desvincular la vinculación actual                          | `/codex detach` (alias `/codex unbind`)                                                               |
| Enviar únicamente comentarios sobre Codex                  | `/codex diagnostics [note]`                                                                           |
| Iniciar una tarea ACP/acpx                                 | Comandos de sesión de ACP/acpx, no `/codex`                                                           |

| Caso de uso                                      | Configuración                                                                                               | Verificación                             | Notas                                              |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------- | -------------------------------------------------- |
| Ruta de OpenAI apta con entorno de ejecución nativo de Codex | Ruta oficial HTTPS exacta de Responses/ChatGPT sin sobrescritura de solicitud creada por el usuario, más el Plugin `codex` habilitado | `/status` muestra `Runtime: OpenAI Codex` | Ruta implícita cuando el entorno de ejecución no está definido o es `auto` |
| Cerrar ante fallos si Codex no está disponible   | `agentRuntime.id: "codex"` del proveedor o modelo                                                           | El turno falla en lugar de recurrir al entorno integrado | Úselo para implementaciones exclusivas de Codex |
| Tráfico directo con clave de API de OpenAI mediante OpenClaw | `agentRuntime.id: "openclaw"` del proveedor o modelo y autenticación normal de OpenAI                     | `/status` muestra el entorno de ejecución de OpenClaw | Úselo solo cuando OpenClaw sea intencional |
| Configuración heredada                          | Referencias GPT heredadas de Codex                                                                           | `openclaw doctor --fix` las reescribe    | No escriba configuraciones nuevas de este modo     |
| Adaptador ACP/acpx de Codex                     | ACP `sessions_spawn({ runtime: "acp" })`                                                                     | Estado de la tarea o sesión ACP          | Independiente del arnés nativo de Codex            |

`agents.defaults.imageModel` sigue la misma división de prefijos. Use `openai/gpt-*` para la ruta normal de OpenAI y `codex/gpt-*` solo cuando la comprensión de imágenes deba ejecutarse mediante un turno limitado del servidor de la aplicación Codex. Doctor reescribe las referencias GPT heredadas de Codex como `openai/gpt-*`.

## Patrones de implementación

### Implementación básica de Codex

Use la configuración de inicio rápido para un modelo de OpenAI cuya ruta HTTPS oficial efectiva sea apta para seleccionar Codex implícitamente:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

### Implementación con varios proveedores

Mantenga Claude como agente predeterminado y añada un agente Codex con nombre:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-6",
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.6-sol",
      },
    ],
  },
}
```

El agente `main` usa su ruta de proveedor normal. El agente `codex` usa el servidor de la aplicación Codex mientras su ruta efectiva de OpenAI siga siendo compatible; añada `agentRuntime.id: "codex"` explícitamente en el ámbito del modelo cuando deba ser un requisito con cierre ante fallos.

### Implementación de Codex con cierre ante fallos

Una ruta oficial HTTPS exacta y apta de OpenAI puede resolverse como Codex cuando el Plugin incluido está disponible. Añada una política explícita del entorno de ejecución para establecer una regla escrita de cierre ante fallos:

```json5
{
  models: {
    providers: {
      openai: {
        agentRuntime: {
          id: "codex",
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.6-sol",
    },
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Cuando se fuerza Codex, OpenClaw falla de forma anticipada si la ruta efectiva no está declarada como compatible con Codex, el Plugin está deshabilitado, el servidor de la aplicación es demasiado antiguo o no puede iniciarse.

## Política del servidor de la aplicación

De forma predeterminada, el Plugin inicia localmente el binario administrado de Codex de OpenClaw con transporte stdio. Defina `appServer.command` solo para ejecutar intencionalmente un ejecutable diferente. Use el transporte WebSocket únicamente cuando ya haya un servidor de la aplicación ejecutándose en otra ubicación:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
          },
        },
      },
    },
  },
}
```

Las sesiones locales del servidor de la aplicación mediante stdio adoptan de forma predeterminada la postura de operador local de confianza: `approvalPolicy: "never"`, `approvalsReviewer: "user"` y `sandbox: "danger-full-access"`. Si los requisitos locales de Codex no permiten esa postura YOLO implícita, OpenClaw selecciona en su lugar permisos guardian permitidos. Cuando hay un entorno aislado de OpenClaw activo para la sesión, OpenClaw deshabilita para ese turno el Code Mode nativo de Codex, los servidores MCP del usuario y la ejecución de Plugins respaldados por aplicaciones, en lugar de depender del aislamiento del lado del host de Codex. En su lugar, el acceso al shell se realiza mediante herramientas dinámicas respaldadas por el entorno aislado de OpenClaw, como `sandbox_exec` y `sandbox_process`, cuando están disponibles las herramientas normales de ejecución y procesos.

Use el modo de ejecución normalizado de OpenClaw para que Codex realice una revisión automática nativa antes de permitir escapes del entorno aislado o permisos adicionales:

```json5
{
  tools: {
    exec: {
      mode: "auto",
    },
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Para las sesiones del servidor de la aplicación Codex, `tools.exec.mode: "auto"` se asigna a aprobaciones revisadas por Codex Guardian: normalmente `approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` y `sandbox: "workspace-write"` cuando los requisitos locales permiten esos valores. En `tools.exec.mode: "auto"`, OpenClaw no conserva las sobrescrituras heredadas y no seguras de Codex `approvalPolicy: "never"` ni `sandbox: "danger-full-access"`; use `tools.exec.mode: "full"` para adoptar intencionalmente una postura de Codex sin aprobaciones. El ajuste preestablecido heredado `plugins.entries.codex.config.appServer.mode: "guardian"` sigue funcionando, pero `tools.exec.mode: "auto"` es la superficie normalizada de OpenClaw.

Para consultar la comparación entre modos con las aprobaciones de ejecución del host y los permisos de ACPX, consulte [Modos de permisos](/es/tools/permission-modes). Para conocer todos los campos del servidor de la aplicación, el orden de autenticación, el aislamiento del entorno y el comportamiento de los tiempos de espera, consulte la [Referencia del arnés de Codex](/es/plugins/codex-harness-reference).

## Comandos y diagnósticos

El Plugin `codex` registra `/codex` como comando de barra en cualquier canal que admita comandos de texto de OpenClaw.

La ejecución y el control nativos requieren un propietario o un cliente del Gateway con `operator.admin`: vincular o reanudar hilos, enviar o detener turnos, cambiar el modelo, el modo rápido o el estado de permisos, compactar o revisar y desvincular una vinculación. Los demás remitentes autorizados conservan los comandos de solo lectura para consultar el estado, la ayuda, la cuenta, los modelos, los hilos, los servidores MCP, las Skills y las vinculaciones.

Formas habituales:

- `/codex status` comprueba la conectividad con el servidor de la aplicación, los modelos, la cuenta, los límites de uso, los servidores MCP y las Skills.
- `/codex models` enumera los modelos activos del servidor de la aplicación Codex.
- `/codex threads [filter]` enumera los hilos recientes del servidor de la aplicación Codex.
- `/codex resume <thread-id>` adjunta la sesión actual de OpenClaw a un hilo existente de Codex.
- `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]`
  adjunta el chat actual.
- `/codex detach` (o `/codex unbind`) desvincula la vinculación actual.
- `/codex binding` describe la vinculación actual.
- `/codex stop` detiene el turno activo; `/codex steer <text>` lo orienta.
- `/codex model <model>`, `/codex fast [on|off|status]` y
  `/codex permissions [default|yolo|status]` cambian el estado de cada conversación.
- `/codex compact` solicita al servidor de la aplicación Codex que compacte el hilo adjunto.
- `/codex review` inicia la revisión nativa de Codex para el hilo adjunto.
- `/codex diagnostics [note]` solicita confirmación antes de enviar comentarios sobre Codex para el hilo adjunto.
- `/codex account` muestra el estado de la cuenta y de los límites de uso.
- `/codex mcp` enumera el estado de los servidores MCP del servidor de la aplicación Codex.
- `/codex skills` enumera las Skills del servidor de la aplicación Codex.
- `/codex plugins list`, `/codex plugins enable <name>` y
  `/codex plugins disable <name>` administran los Plugins nativos configurados de Codex.
- `/codex computer-use [status|install]` administra Codex Computer Use.
- `/codex help` enumera el árbol completo de comandos.

Para la mayoría de los informes de soporte, comienza con `/diagnostics [note]` en la
conversación donde ocurrió el error. Esto crea un informe de diagnóstico del
Gateway y, para las sesiones del entorno de Codex, solicita aprobación para enviar el
paquete de comentarios de Codex pertinente. Consulta
[Exportación de diagnósticos](/es/gateway/diagnostics) para conocer el modelo de privacidad y el
comportamiento en chats grupales. Usa `/codex diagnostics [note]` solo cuando quieras
específicamente cargar los comentarios de Codex para el hilo adjunto actualmente sin
el paquete de diagnóstico completo del Gateway.

### Inspeccionar hilos de Codex localmente

A menudo, la forma más rápida de inspeccionar una ejecución defectuosa de Codex es abrir
directamente el hilo nativo de Codex:

```bash
codex resume <thread-id>
```

Obtén el identificador del hilo en la respuesta completada de `/diagnostics`, `/codex binding`
o `/codex threads [filter]`.

Para conocer la mecánica de carga y los límites de diagnóstico a nivel de ejecución, consulta
[Entorno de ejecución de Codex](/es/plugins/codex-harness-runtime#codex-feedback-upload).

### Orden de autenticación

En el directorio de inicio predeterminado por agente, la autenticación se selecciona en este orden:

1. Perfiles de autenticación de OpenAI ordenados para el agente, preferiblemente en
   `auth.order.openai`. Ejecuta `openclaw doctor --fix` para migrar los identificadores de perfiles
   de autenticación heredados de Codex y el orden de autenticación heredado de Codex.
2. La cuenta existente del servidor de aplicaciones en el directorio de inicio de Codex de ese agente.
3. Solo para inicios locales del servidor de aplicaciones mediante stdio, `CODEX_API_KEY` y después
   `OPENAI_API_KEY`, cuando no hay ninguna cuenta del servidor de aplicaciones y la autenticación de
   OpenAI sigue siendo obligatoria.

Cuando OpenClaw detecta un perfil de autenticación de Codex basado en una suscripción de ChatGPT,
elimina `CODEX_API_KEY` y `OPENAI_API_KEY` del proceso secundario de Codex
iniciado. Esto mantiene disponibles las claves de API a nivel del Gateway para incrustaciones o
modelos directos de OpenAI sin que los turnos nativos del servidor de aplicaciones de Codex se
facturen accidentalmente mediante la API. Los perfiles explícitos de clave de API de Codex y el
uso alternativo local de claves de entorno mediante stdio utilizan el inicio de sesión del servidor
de aplicaciones en lugar del entorno heredado del proceso secundario. Las conexiones WebSocket
del servidor de aplicaciones no reciben el uso alternativo de claves de API del entorno del Gateway;
usa un perfil de autenticación explícito o la cuenta propia del servidor de aplicaciones remoto.

Si un perfil de suscripción alcanza un límite de uso de Codex, OpenClaw registra la
hora de restablecimiento cuando Codex proporciona una e intenta usar el siguiente perfil de
autenticación ordenado para la misma ejecución de Codex. Cuando pasa la hora de restablecimiento,
el perfil de suscripción vuelve a ser apto sin cambiar el modelo
`openai/gpt-*` seleccionado ni el entorno de ejecución de Codex.

Cuando se configuran plugins nativos de Codex, OpenClaw instala o actualiza
esos plugins mediante el servidor de aplicaciones conectado antes de exponer las aplicaciones
propiedad de los plugins al hilo de Codex. `app/list` sigue siendo la fuente de referencia para los
identificadores, la accesibilidad y los metadatos de las aplicaciones, pero OpenClaw controla la
decisión de habilitación por hilo: si la política permite una aplicación accesible de la lista, OpenClaw
envía `thread/start.config.apps[appId].enabled = true` aunque `app/list`
indique actualmente que esa aplicación está deshabilitada. Esta ruta no simula la instalación de
aplicaciones para identificadores desconocidos; OpenClaw solo activa plugins del marketplace
mediante `plugin/install` y después actualiza el inventario.

### Aislamiento del entorno

Para los inicios locales del servidor de aplicaciones mediante stdio, OpenClaw establece `CODEX_HOME`
en un directorio por agente para que la configuración, los archivos de autenticación y cuenta, la caché
y los datos de plugins, y el estado nativo de los hilos de Codex no lean ni escriban de forma predeterminada
en el directorio `~/.codex` personal del operador. OpenClaw conserva el valor normal de `HOME`
del proceso; los subprocesos ejecutados por Codex aún pueden encontrar la configuración y los tokens
del directorio de inicio del usuario, y Codex puede detectar entradas compartidas de
`$HOME/.agents/skills` y `$HOME/.agents/plugins/marketplace.json`. Con
`appServer.homeScope: "user"`, OpenClaw utiliza en su lugar el directorio de inicio nativo de Codex
del usuario y su cuenta existente sin inyectar un perfil de autenticación de OpenClaw.

Si una implementación necesita aislamiento adicional del entorno, añade esas
variables a `appServer.clearEnv`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            clearEnv: ["CODEX_API_KEY", "OPENAI_API_KEY"],
          },
        },
      },
    },
  },
}
```

`appServer.clearEnv` solo afecta al proceso secundario del servidor de aplicaciones de Codex
iniciado. OpenClaw elimina `CODEX_HOME` y `HOME` de esta lista durante
la normalización del inicio local: `CODEX_HOME` continúa apuntando al ámbito seleccionado
del agente o usuario, y `HOME` sigue heredándose para que los subprocesos puedan utilizar
el estado normal del directorio de inicio del usuario.

### Herramientas dinámicas y búsqueda web

Las herramientas dinámicas de Codex utilizan de forma predeterminada la carga `searchable`. OpenClaw no
expone herramientas dinámicas que duplican las operaciones nativas de Codex en el espacio de trabajo:
`read`, `write`, `edit`, `apply_patch`, `exec`, `process`, `update_plan`,
`tool_call`, `tool_describe`, `tool_search` y `tool_search_code`. La mayoría
de las herramientas de integración restantes de OpenClaw, como mensajería, contenido multimedia, cron,
navegador, nodos, gateway y `heartbeat_respond`, están disponibles mediante
la búsqueda de herramientas de Codex en el espacio de nombres `openclaw`, lo que mantiene más
reducido el contexto inicial del modelo.

Las herramientas marcadas como `catalogMode: "direct-only"`, incluida la herramienta `computer`
de OpenClaw, utilizan en su lugar el espacio de nombres `openclaw_direct`. Codex trata ese espacio de nombres
como `DirectModelOnly`, por lo que esas herramientas permanecen visibles directamente para el modelo en los hilos
normales y exclusivos del modo de código, en lugar de atravesar llamadas anidadas de `tools.*` del modo de código.

La búsqueda web utiliza de forma predeterminada la herramienta alojada `web_search` de Codex cuando la búsqueda está
habilitada y no se ha seleccionado ningún proveedor administrado. La búsqueda alojada nativa y
la herramienta dinámica `web_search` administrada por OpenClaw son mutuamente excluyentes para que
la búsqueda administrada no pueda eludir las restricciones de dominios nativas. OpenClaw utiliza la
herramienta administrada cuando la búsqueda alojada no está disponible, se deshabilita explícitamente o
se sustituye por un proveedor administrado seleccionado. OpenClaw mantiene deshabilitada la extensión
independiente `web.run` de Codex porque el tráfico de producción del servidor de aplicaciones rechaza
su espacio de nombres `web` definido por el usuario. `tools.web.search.enabled: false`
deshabilita ambas rutas, al igual que las ejecuciones solo con LLM que tienen las herramientas deshabilitadas. Codex
trata `"cached"` como una preferencia y la resuelve como acceso externo en vivo para
los turnos sin restricciones del servidor de aplicaciones. El uso alternativo administrado automático se cierra de
forma segura cuando se establecen `allowedDomains` nativos para impedir que se eluda la lista de permitidos.
Los cambios persistentes de la política efectiva de búsqueda rotan el hilo de Codex vinculado
antes del siguiente turno; las restricciones transitorias por turno utilizan un hilo restringido temporal
y conservan la vinculación existente para reanudarla posteriormente.

Las respuestas de origen de `sessions_yield` y exclusivas de herramientas de mensajería permanecen directas porque
son contratos de control de turnos. `sessions_spawn` sigue siendo detectable mediante búsqueda para que
el `spawn_agent` nativo de Codex continúe siendo la superficie principal de subagentes de Codex,
mientras que la delegación explícita de OpenClaw o ACP sigue estando disponible mediante el
espacio de nombres de herramientas dinámicas `openclaw`. Las instrucciones de colaboración de Heartbeat
indican a Codex que busque `heartbeat_respond` antes de finalizar un turno de Heartbeat
cuando la herramienta aún no esté cargada.

Establece `codexDynamicToolsLoading: "direct"` solo cuando te conectes a un servidor de aplicaciones
de Codex personalizado que no pueda buscar herramientas dinámicas diferidas o cuando
depures la carga útil completa de herramientas.

### Campos de configuración

Campos compatibles de nivel superior del plugin de Codex:

| Campo                      | Valor predeterminado | Significado                                                                                              |
| -------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"`       | Usa `"direct"` para colocar las herramientas dinámicas de OpenClaw directamente en el contexto inicial de herramientas de Codex. |
| `codexDynamicToolsExclude` | `[]`                 | Nombres adicionales de herramientas dinámicas de OpenClaw que deben omitirse en los turnos del servidor de aplicaciones de Codex. |
| `codexPlugins`             | deshabilitado        | Compatibilidad nativa con plugins y aplicaciones de Codex para plugins seleccionados migrados e instalados desde el código fuente. |
| `supervision`              | deshabilitado        | Catálogo de sesiones nativas no archivadas, continuación de ramas locales y política de herramientas del agente. |

Campos compatibles de `appServer`:

| Campo                                         | Valor predeterminado                                    | Significado                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` inicia Codex; el valor explícito `"unix"` se conecta al socket de control local; `"websocket"` se conecta a `url`.                                                                                                                                                                                                                                                                                |
| `homeScope`                                   | `"agent"`                                              | `"agent"` aísla el estado ordinario del arnés para cada agente de OpenClaw. `"user"` es una habilitación explícita que comparte el `$CODEX_HOME` nativo o `~/.codex`, usa la autenticación nativa y habilita la administración de hilos exclusiva del propietario. El ámbito de usuario admite transporte stdio local o Unix. Para la conexión de supervisión independiente, un valor no establecido se resuelve como `"user"` para stdio o Unix y como `"agent"` para WebSocket.     |
| `command`                                     | binario de Codex administrado                          | Ejecutable para el transporte stdio. Déjelo sin establecer para usar el binario administrado; establézcalo solo para una sobrescritura explícita.                                                                                                                                                                                                                                                                                    |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumentos para el transporte stdio.                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | no establecido                                         | URL del App Server WebSocket o URL `unix://`. Una ruta Unix explícita vacía selecciona el socket de control canónico del directorio personal del usuario.                                                                                                                                                                                                                                                                          |
| `authToken`                                   | no establecido                                         | Token de portador para el transporte WebSocket. Acepta una cadena literal o SecretInput, como `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | Encabezados WebSocket adicionales. Los valores de los encabezados aceptan cadenas literales o valores SecretInput, por ejemplo, `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | Nombres adicionales de variables de entorno que se eliminan del proceso app-server stdio iniciado después de que OpenClaw construye su entorno heredado. OpenClaw conserva el `CODEX_HOME` seleccionado y el `HOME` heredado para las ejecuciones locales.                                                                                                                                                                           |
| `codeModeOnly`                                | `false`                                                | Habilita exclusivamente la superficie de herramientas del modo de código de Codex. Las herramientas dinámicas ordinarias de OpenClaw siguen disponibles mediante llamadas anidadas `tools.*`; las herramientas `openclaw_direct` permanecen visibles directamente para el modelo.                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | no establecido                                         | Raíz remota del espacio de trabajo del app-server de Codex. Cuando se establece, OpenClaw infiere la raíz local del espacio de trabajo a partir del espacio de trabajo resuelto de OpenClaw, conserva el sufijo del cwd actual bajo esta raíz remota y envía a Codex únicamente el cwd final del app-server. Si el cwd se encuentra fuera de la raíz resuelta del espacio de trabajo de OpenClaw, OpenClaw aplica un cierre seguro en lugar de enviar una ruta local del Gateway al app-server remoto. |
| `requestTimeoutMs`                            | `60000`                                                | Tiempo de espera para las llamadas del plano de control del app-server.                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Ventana de inactividad después de que Codex acepta un turno o después de una solicitud del app-server limitada al turno, mientras OpenClaw espera `turn/completed`.                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Protección de inactividad de finalización y progreso utilizada después de una transferencia a una herramienta, la finalización de una herramienta nativa, el progreso sin procesar del asistente posterior a una herramienta, la finalización del razonamiento sin procesar o el progreso del razonamiento mientras OpenClaw espera `turn/completed`. Use este valor para cargas de trabajo de confianza o intensivas en las que la síntesis posterior a una herramienta pueda permanecer legítimamente inactiva durante más tiempo que el presupuesto final de publicación del asistente.                                |
| `mode`                                        | `"yolo"`, salvo que los requisitos locales de Codex no permitan YOLO | Ajuste predefinido para la ejecución YOLO o revisada por el guardián. Los requisitos de stdio local que omitan `danger-full-access`, la aprobación `never` o el revisor `user` hacen que el valor predeterminado implícito sea el guardián.                                                                                                                                                                                                           |
| `approvalPolicy`                              | `"never"` o una política de aprobación del guardián permitida       | Política de aprobación nativa de Codex enviada al inicio, la reanudación o el turno del hilo. Los valores predeterminados del guardián prefieren `"on-request"` cuando está permitido.                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` o un sandbox del guardián permitido  | Modo de sandbox nativo de Codex enviado al inicio o la reanudación del hilo. Los valores predeterminados del guardián prefieren `"workspace-write"` cuando está permitido; de lo contrario, `"read-only"`. Cuando un sandbox de OpenClaw está activo, los turnos `danger-full-access` usan `workspace-write` de Codex con acceso a la red derivado de la configuración de salida del sandbox de OpenClaw.                                                                                     |
| `approvalsReviewer`                           | `"user"` o un revisor del guardián permitido               | Use `"auto_review"` para permitir que Codex revise las solicitudes de aprobación nativas cuando esté permitido; de lo contrario, use `guardian_subagent` o `user`. `guardian_subagent` sigue siendo un alias heredado.                                                                                                                                                                                                                              |
| `serviceTier`                                 | no establecido                                         | Nivel de servicio opcional del app-server de Codex. `"priority"` habilita el enrutamiento en modo rápido, `"flex"` solicita procesamiento flexible, `null` elimina la sobrescritura y el valor heredado `"fast"` se acepta como `"priority"`.                                                                                                                                                                                                 |
| `networkProxy`                                | deshabilitado                                          | Habilita la red mediante perfiles de permisos de Codex para los comandos del app-server. OpenClaw define la configuración `permissions.<profile>.network` seleccionada y la selecciona mediante `default_permissions` en lugar de enviar `sandbox`.                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | Habilitación preliminar que registra un entorno de Codex respaldado por el sandbox de OpenClaw en el app-server de Codex compatible, para que la ejecución nativa de Codex pueda realizarse dentro del sandbox activo de OpenClaw.                                                                                                                                                                                                            |

`appServer.networkProxy` es explícito porque cambia el contrato del sandbox
de Codex. Cuando está habilitado, OpenClaw también establece `features.network_proxy.enabled`
y `default_permissions` en la configuración del hilo de Codex para que el perfil de
permisos generado pueda iniciar la red administrada por Codex. De forma predeterminada, OpenClaw
genera un nombre de perfil `openclaw-network-<fingerprint>` resistente a colisiones
a partir del contenido del perfil; use `profileName` solo cuando se requiera un nombre
local estable.

```json5
{
  plugins: {
    entries: {
      codex: {
        config: {
          appServer: {
            sandbox: "workspace-write",
            networkProxy: {
              enabled: true,
              domains: {
                "api.openai.com": "allow",
                "blocked.example.com": "deny",
              },
              unixSockets: {
                "/tmp/proxy.sock": "allow",
                "/tmp/blocked.sock": "none",
              },
              allowUpstreamProxy: true,
              proxyUrl: "http://127.0.0.1:3128",
            },
          },
        },
      },
    },
  },
}
```

Si el entorno de ejecución normal de app-server fuera `danger-full-access`, habilitar
`networkProxy` usa un acceso al sistema de archivos al estilo del espacio de trabajo para el
perfil de permisos generado: la aplicación de red administrada por Codex usa
redes en entorno aislado, por lo que un perfil de acceso completo no protegería el tráfico saliente.
Las entradas de dominio usan `allow` o `deny`; las entradas de sockets Unix usan los
valores `allow` o `none` de Codex.

### Tiempos de espera de llamadas dinámicas a herramientas

Las llamadas dinámicas a herramientas propiedad de OpenClaw tienen límites independientes de
`appServer.requestTimeoutMs`: las solicitudes `item/tool/call` de Codex usan de forma predeterminada
un mecanismo de vigilancia de OpenClaw de 90 segundos. Un argumento positivo `timeoutMs`
por llamada amplía o reduce el límite de esa herramienta específica, con un máximo de 600000 ms.
La herramienta `image_generate` usa `agents.defaults.imageGenerationModel.timeoutMs`
cuando la llamada a la herramienta no proporciona su propio tiempo de espera; de lo contrario,
usa un valor predeterminado de generación de imágenes de 120 segundos. La herramienta `image`
de comprensión multimedia usa `tools.media.image.timeoutSeconds` o su valor multimedia
predeterminado de 60 segundos; para la comprensión de imágenes, ese tiempo de espera se aplica
a la propia solicitud y no se reduce por el trabajo de preparación anterior. Al agotarse el tiempo
de espera, OpenClaw cancela la señal de la herramienta cuando se admite y devuelve a Codex una
respuesta fallida de herramienta dinámica para que el turno pueda continuar, en lugar de dejar
la sesión en `processing`. Este mecanismo de vigilancia es el límite externo dinámico de
`item/tool/call`; los tiempos de espera de solicitudes específicos del proveedor se ejecutan
dentro de esa llamada y conservan su propia semántica de tiempo de espera.

Después de que Codex acepta un turno y después de que OpenClaw responde a una solicitud
de app-server limitada al turno, el arnés espera que Codex avance en el turno actual y finalmente
termine el turno nativo con `turn/completed`. Si app-server permanece inactivo durante
`appServer.turnCompletionIdleTimeoutMs`, OpenClaw intenta interrumpir el turno de Codex,
registra un tiempo de espera de diagnóstico y libera el carril de sesión de OpenClaw para que
los mensajes de chat posteriores no queden en cola detrás de un turno nativo obsoleto. La mayoría
de las notificaciones no terminales del mismo turno desactivan ese breve mecanismo de vigilancia
porque Codex ha demostrado que el turno sigue activo.

Las transferencias de herramientas usan un límite de inactividad posterior a la herramienta más largo:
después de que OpenClaw devuelve una respuesta `item/tool/call`, después de que terminan elementos
de herramientas nativas como `commandExecution`, después de completarse salidas sin procesar
`custom_tool_call_output` y después de completarse el progreso sin procesar posterior a la herramienta
del asistente, el razonamiento sin procesar o el progreso del razonamiento. La protección usa
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` cuando está configurado y, de lo contrario,
usa cinco minutos de forma predeterminada; ese mismo límite también amplía el mecanismo de vigilancia
del progreso durante el intervalo silencioso de síntesis antes de que Codex emita el siguiente evento
del turno actual. Las notificaciones globales de app-server, como las actualizaciones de límites de uso,
no reinician el progreso de inactividad del turno. Las finalizaciones de razonamiento, las finalizaciones
de `agentMessage` de comentario y el progreso sin procesar de razonamiento o del asistente anterior a
la herramienta pueden ir seguidos de una respuesta final automática, por lo que usan la protección
de respuesta posterior al progreso en lugar de liberar inmediatamente el carril de sesión.

Solo los elementos `agentMessage` finales, completados y que no sean de comentario, y las finalizaciones
sin procesar del asistente anteriores a la herramienta activan la liberación por salida del asistente:
si Codex permanece después inactivo sin `turn/completed`, OpenClaw intenta interrumpir el turno nativo
y libera el carril de sesión. Si otra supervisión del turno gana esa carrera de liberación, OpenClaw
aun así acepta el elemento final completado del asistente cuando ya no queda activa ninguna solicitud
nativa, elemento ni finalización de herramienta dinámica, la liberación por salida del asistente aún
pertenece al último elemento completado y no existe una finalización posterior de otro elemento.
Esto permite conservar la respuesta final después de terminar el trabajo de las herramientas sin
reproducir el turno. Los deltas parciales del asistente, las respuestas anteriores obsoletas y las
finalizaciones posteriores vacías no cumplen los requisitos.

Los fallos reproducibles de app-server mediante stdio, incluidos los tiempos de espera por inactividad
de finalización del turno sin evidencia del asistente, de herramientas, de elementos activos ni de efectos
secundarios, se reintentan una vez en un nuevo intento de app-server. Los tiempos de espera no seguros
aun así retiran el cliente de app-server bloqueado y liberan el carril de sesión de OpenClaw; además,
eliminan la vinculación obsoleta del hilo nativo en lugar de reproducirla automáticamente. Los tiempos
de espera del mecanismo de vigilancia de finalización muestran texto de tiempo de espera específico
de Codex: los casos reproducibles indican que la respuesta puede estar incompleta, mientras que los
casos no seguros indican al usuario que verifique el estado actual antes de volver a intentarlo. Los
diagnósticos públicos de tiempo de espera incluyen campos estructurales como el último método de
notificación de app-server, el id/tipo/rol del elemento de respuesta sin procesar del asistente, los
recuentos de solicitudes y elementos activos y el estado de supervisión activado; cuando la última
notificación es un elemento de respuesta sin procesar del asistente, también incluyen una vista previa
limitada del texto del asistente. No incluyen el contenido sin procesar del prompt ni de las herramientas.

### Sustituciones de variables de entorno para pruebas locales

- `OPENCLAW_CODEX_APP_SERVER_BIN` omite el binario administrado cuando
  `appServer.command` no está definido.
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

Se eliminó `OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`. Use
`plugins.entries.codex.config.appServer.mode: "guardian"` en su lugar, o
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` para una prueba local puntual. Se
prefiere la configuración para implementaciones reproducibles porque mantiene el
comportamiento del plugin en el mismo archivo revisado que el resto de la configuración del arnés de Codex.

## Plugins nativos de Codex

La compatibilidad con plugins nativos de Codex usa las capacidades de aplicaciones y plugins
propias de app-server de Codex en el mismo hilo de Codex que el turno del arnés de OpenClaw.
OpenClaw no convierte los plugins de Codex en herramientas dinámicas sintéticas
`codex_plugin_*` de OpenClaw.

`codexPlugins` solo afecta a las sesiones que seleccionan el arnés nativo de Codex.
No afecta a las ejecuciones del arnés integrado, las ejecuciones normales del proveedor OpenAI,
las vinculaciones de conversaciones ACP ni otros arneses.

Configuración mínima migrada:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
              },
            },
          },
        },
      },
    },
  },
}
```

La configuración de aplicaciones del hilo se calcula cuando OpenClaw establece una sesión
del arnés de Codex o reemplaza una vinculación obsoleta del hilo de Codex; no se vuelve a
calcular en cada turno. Después de cambiar `codexPlugins`, use `/new`, `/reset` o reinicie
el Gateway para que las futuras sesiones del arnés de Codex comiencen con el conjunto
actualizado de aplicaciones.

Para conocer la idoneidad para la migración, el inventario de aplicaciones, la política de
acciones destructivas, las solicitudes de información y los diagnósticos de plugins nativos,
consulte [Plugins nativos de Codex](/es/plugins/codex-native-plugins).

El acceso a aplicaciones y plugins del lado de OpenAI está controlado por la cuenta de Codex
con sesión iniciada y, para los espacios de trabajo Business y Enterprise/Edu, por los controles
de aplicaciones del espacio de trabajo. Consulte
[Uso de Codex con su plan de ChatGPT](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
para obtener una descripción general de OpenAI sobre los controles de cuenta y espacio de trabajo.

## Uso del equipo

El uso del equipo tiene su propia guía de configuración:
[Uso del equipo con Codex](/es/plugins/codex-computer-use).

Versión breve: OpenClaw no incluye la aplicación de control del escritorio ni ejecuta por sí
mismo acciones en el escritorio. Prepara app-server de Codex, verifica que el servidor MCP
`computer-use` esté disponible y deja que Codex gestione las llamadas a herramientas MCP
nativas durante los turnos en modo Codex.

## Límites del entorno de ejecución

El arnés de Codex solo cambia el ejecutor de agentes integrado de bajo nivel.

- Se admiten las herramientas dinámicas de OpenClaw. Codex solicita a OpenClaw que ejecute
  esas herramientas, por lo que OpenClaw permanece en la ruta de ejecución.
- El shell, los parches, MCP y las herramientas de aplicaciones nativas de Codex son gestionados
  por Codex. OpenClaw puede observar o bloquear determinados eventos nativos mediante el relé
  compatible, pero no reescribe los argumentos de herramientas nativas.
- Codex gestiona la Compaction nativa. OpenClaw mantiene una copia del expediente para el
  historial del canal, la búsqueda, `/new`, `/reset` y futuros cambios de modelo o arnés, pero
  no reemplaza la Compaction de Codex con un resumidor de OpenClaw o del motor de contexto.
- La generación multimedia, la comprensión multimedia, TTS, las aprobaciones y la salida de
  herramientas de mensajería siguen pasando por la configuración correspondiente de
  proveedor/modelo de OpenClaw.
- `tool_result_persist` se aplica a los resultados de herramientas propiedad de OpenClaw en
  el expediente, no a los registros de resultados de herramientas nativas de Codex.

Para obtener información sobre las capas de hooks, las superficies V1 compatibles, la gestión
de permisos nativos, el direccionamiento de colas, los mecanismos de carga de comentarios de
Codex y los detalles de Compaction, consulte
[Entorno de ejecución del arnés de Codex](/es/plugins/codex-harness-runtime).

## Solución de problemas

**Codex no aparece como proveedor normal de `/model`:** es lo esperado en configuraciones
nuevas. Seleccione un modelo `openai/gpt-*`, habilite
`plugins.entries.codex.enabled` y compruebe si `plugins.allow` excluye
`codex`.

**OpenClaw usa el arnés integrado en lugar de Codex:** confirme que la ruta efectiva
sea una ruta oficial HTTPS exacta de Platform Responses o ChatGPT Responses, que no
tenga ninguna sustitución de solicitud definida por el autor y que el plugin de Codex
esté instalado y habilitado. El prefijo `openai/gpt-*` por sí solo no es suficiente. Para
obtener una comprobación estricta durante las pruebas, establezca `agentRuntime.id: "codex"`
en el proveedor o modelo; Codex forzado falla en lugar de recurrir a una alternativa cuando
la ruta o el arnés son incompatibles.

**El entorno de ejecución OpenAI Codex recurre a la ruta de clave de API:** recopile un fragmento
censurado del Gateway que muestre el modelo, el entorno de ejecución, el proveedor seleccionado
y el fallo. Pida a los colaboradores afectados que ejecuten este comando de solo lectura en su
host de OpenClaw:

```bash
(
  pattern='openai/gpt-5\.[45]|openai[-]codex|agentRuntime(\.id)?|harnessRuntime|Runtime: OpenAI Codex|legacy OpenAI Codex prefix|resolveSelectedOpenAIRuntimeProvider|candidateProvider[": ]+openai|status[": ]+401|Incorrect API key|No API key|api-key path|API-key path|OAuth'

  if ls /tmp/openclaw/openclaw-*.log >/dev/null 2>&1; then
    grep -E -i -n "$pattern" /tmp/openclaw/openclaw-*.log 2>/dev/null || true
  else
    journalctl --user -u openclaw-gateway --since today --no-pager 2>/dev/null \
      | grep -E -i "$pattern" || true
  fi
) | sed -E \
    -e 's/(Authorization: Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(api[_ -]?key[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/(OPENAI_API_KEY[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/sk-[A-Za-z0-9_-]{12,}/sk-[REDACTED]/g' \
    -e 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/[EMAIL-REDACTED]/g' \
  | tail -200
```

Los fragmentos útiles suelen incluir `openai/gpt-5.6-sol` o `openai/gpt-5.6-luna`,
`Runtime: OpenAI Codex`, `agentRuntime.id` o `harnessRuntime`,
`candidateProvider: "openai"` y un resultado `401`, `Incorrect API key` o
`No API key`. Una ejecución corregida debería mostrar la ruta OAuth de OpenAI
en lugar de un simple fallo de clave de API de OpenAI.

**Permanece la configuración de referencias de modelos heredados de Codex:** ejecute
`openclaw doctor --fix`. Doctor reescribe las referencias de modelos heredados como
`openai/*`, elimina las fijaciones obsoletas del entorno de ejecución de la sesión y del
agente completo y conserva las sustituciones existentes de perfiles de autenticación.

**App-server es rechazado:** use app-server de Codex `0.143.0` o una versión posterior.
Las versiones preliminares de la misma versión o con sufijo de compilación, como
`0.143.0-alpha.2` o `0.143.0+custom`, se rechazan porque OpenClaw comprueba el
mínimo de protocolo estable `0.143.0`.

**`/codex status` no puede conectarse:** compruebe que el plugin `codex`
esté habilitado, que `plugins.allow` lo incluya cuando se configure una lista de
permitidos y que cualquier `appServer.command`, `url`, `authToken` o
encabezado personalizado sea válido.

**El descubrimiento de modelos es lento:** reduzca
`plugins.entries.codex.config.discovery.timeoutMs` o deshabilite el descubrimiento.
Consulte [Referencia del arnés de Codex](/es/plugins/codex-harness-reference#model-discovery).

**El transporte WebSocket falla inmediatamente:** compruebe `appServer.url`,
`authToken`, los encabezados y que el app-server remoto use la misma versión
del protocolo app-server de Codex.

**Las herramientas nativas de shell o parche están bloqueadas con `Native hook relay
unavailable`:** el hilo de Codex sigue intentando usar un id de retransmisión de hooks nativos
que OpenClaw ya no tiene registrado. Se trata de un problema de transporte de hooks
nativos de Codex, no de un fallo del backend ACP, del proveedor, de GitHub ni de los comandos
de shell. Inicie una sesión nueva en el chat afectado con `/new` o `/reset`
y vuelva a intentar un comando que no cause cambios. Si funciona una vez, pero la siguiente llamada
a una herramienta nativa vuelve a fallar, considere `/new` solo una solución temporal: copie el
prompt en una sesión nueva después de reiniciar el servidor de aplicaciones de Codex o el
Gateway de OpenClaw, para que se descarten los hilos antiguos y se vuelvan a crear los registros
de hooks nativos.

**Un modelo que no es de Codex usa el entorno integrado:** es lo esperado, salvo que la política de ejecución
del proveedor o del modelo lo dirija a otro entorno. Las referencias simples de proveedores que no son de OpenAI
permanecen en la ruta normal de su proveedor en el modo `auto`.

**Computer Use está instalado, pero las herramientas no se ejecutan:** compruebe
`/codex computer-use status` desde una sesión nueva. Si una herramienta informa
`Native hook relay unavailable`, use el procedimiento de recuperación de la retransmisión de hooks nativos descrito anteriormente.
Consulte [Computer Use de Codex](/es/plugins/codex-computer-use#troubleshooting).

## Contenido relacionado

- [Referencia del entorno de Codex](/es/plugins/codex-harness-reference)
- [Ejecución del entorno de Codex](/es/plugins/codex-harness-runtime)
- [Supervisión de Codex](/plugins/codex-supervision)
- [Plugins nativos de Codex](/es/plugins/codex-native-plugins)
- [Computer Use de Codex](/es/plugins/codex-computer-use)
- [Entornos de ejecución de agentes](/es/concepts/agent-runtimes)
- [Proveedores de modelos](/es/concepts/model-providers)
- [Proveedor de OpenAI](/es/providers/openai)
- [Ayuda de OpenAI Codex](https://help.openai.com/en/collections/14937394-codex)
- [Plugins de entornos de agentes](/es/plugins/sdk-agent-harness)
- [Hooks de Plugin](/es/plugins/hooks)
- [Exportación de diagnósticos](/es/gateway/diagnostics)
- [Estado](/es/cli/status)
- [Pruebas](/es/help/testing-live#live-codex-app-server-harness-smoke)
