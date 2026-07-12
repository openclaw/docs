---
read_when:
    - Has terminado de configurar la inferencia y quieres que Crestodian configure el resto
    - Necesitas inspeccionar o reparar OpenClaw con el agente de configuración local.
    - Estás diseñando o habilitando el modo de rescate del canal de mensajería.
summary: Referencia de la CLI y modelo de seguridad del asistente de configuración y reparación de Crestodian basado en inferencia
title: Crestodian
x-i18n:
    generated_at: "2026-07-11T22:58:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: af4861a48fb26159cb8e0c29d08ab5c3776283eb5392dcbe08c9a28d01f4abf5
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian conversacional es el agente local de configuración, reparación y
ajustes de OpenClaw. Solo se inicia después de que el modelo predeterminado
efectivo completa una interacción real. Las instalaciones nuevas establecen
primero la inferencia; las configuraciones con formato incorrecto permanecen
en la ruta clásica de doctor.

## Cuándo se inicia

Al ejecutar `openclaw` sin subcomandos, la ruta se determina según el estado de la configuración:

- Si falta la configuración o existe sin ajustes definidos (vacía o solo con las claves `$schema`/`meta`): inicia la incorporación guiada con verificación de IA en vivo.
- Si la configuración existe, pero no supera la validación: inicia la incorporación clásica, que informa de los problemas y dirige a `openclaw doctor`.
- Si la configuración existe y es válida: abre la TUI normal del agente. Un
  Gateway configurado y accesible cuyo agente predeterminado tenga un modelo
  abre directamente esa interfaz sin incorporación ni Crestodian. Usa
  `/crestodian` dentro de la TUI o ejecuta `openclaw crestodian` directamente
  para acceder a Crestodian más adelante.

Al ejecutar `openclaw crestodian`, primero se prueba en vivo el modelo predeterminado configurado. Una interacción satisfactoria inicia Crestodian. Un error interactivo abre la configuración guiada de inferencia y transfiere el control a Crestodian después de que una opción candidata supere la prueba. Las solicitudes de una sola ejecución, JSON y otras solicitudes no interactivas fallan con instrucciones para ejecutar `openclaw onboard` cuando la inferencia no está disponible. `openclaw --help` y `openclaw --version` mantienen sus rutas rápidas habituales.

La ejecución no interactiva de `openclaw` sin subcomandos (sin TTY) finaliza con un mensaje breve en lugar de mostrar la ayuda raíz: remite a la incorporación no interactiva en una instalación nueva o no válida, o a `openclaw agent --local ...` cuando la configuración es válida.

`openclaw onboard --modern` sigue siendo un alias de compatibilidad para Crestodian, pero utiliza la misma puerta de inferencia: si la inferencia funciona, abre el chat; los errores interactivos inician la configuración guiada de inferencia; y los errores no interactivos finalizan con indicaciones para la incorporación. `openclaw onboard --classic` abre el asistente completo paso a paso.

## Qué muestra Crestodian

Crestodian interactivo abre el mismo entorno de TUI que `openclaw tui`, con un backend de chat de Crestodian. El saludo inicial abarca:

- la validez de la configuración y el agente predeterminado
- el modelo verificado que utiliza Crestodian
- la accesibilidad del Gateway según la primera comprobación de inicio
- la siguiente acción de depuración recomendada

No vuelca secretos ni carga comandos de CLI de plugins solo para iniciarse.

Usa `status` para obtener el inventario detallado: ruta de configuración, rutas de documentación/código fuente, comprobaciones locales de la CLI, presencia de claves o tokens, agentes, modelo y detalles del Gateway.

Crestodian utiliza el mismo descubrimiento de referencias que los agentes normales: en una copia de Git apunta a `docs/` local y al árbol del código fuente; en una instalación de npm utiliza la documentación incluida y enlaza a [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), con la recomendación de consultar el código fuente cuando la documentación no sea suficiente.

## Ejemplos

```bash
openclaw
openclaw crestodian
openclaw crestodian --json
openclaw crestodian --message "models"
openclaw crestodian --message "validate config"
openclaw crestodian --message "setup workspace ~/Projects/work" --yes
openclaw crestodian --message "set default model openai/gpt-5.6" --yes
openclaw onboard --modern
```

Dentro de la TUI de Crestodian:

```text
status
health
doctor
validate config
setup
setup workspace ~/Projects/work
config set gateway.port 19001
config set-ref gateway.auth.token env OPENCLAW_GATEWAY_TOKEN
gateway status
restart gateway
agents
create agent work workspace ~/Projects/work
models
configure model provider
set default model openai/gpt-5.6
channels
channel info slack
connect slack
open channel wizard for slack
plugins list
plugins search slack
plugin install clawhub:openclaw-codex-app-server
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## Operaciones y aprobación

Crestodian utiliza operaciones tipadas en lugar de editar la configuración de manera improvisada.

Las operaciones de solo lectura se ejecutan inmediatamente: mostrar el resumen, enumerar agentes, enumerar plugins instalados, buscar plugins de ClawHub, mostrar el estado del modelo/backend, ejecutar comprobaciones de estado y funcionamiento, comprobar la accesibilidad del Gateway, ejecutar doctor sin correcciones interactivas, validar la configuración y mostrar la ruta del registro de auditoría.

El inicio de la configuración guiada de un canal (`connect telegram`) también se ejecuta inmediatamente. Su asistente recopila respuestas explícitas y se encarga de las escrituras resultantes.

Las operaciones persistentes requieren aprobación conversacional (o `--yes` para un comando directo): escribir la configuración, `config set`, `config set-ref`, inicializar la configuración/incorporación, cambiar el modelo predeterminado, iniciar/detener/reiniciar el Gateway, crear agentes e instalar plugins.

Las reparaciones de doctor no están disponibles dentro de Crestodian porque pueden reescribir el proveedor, la autenticación o la ruta de inferencia del agente predeterminado que sostiene la sesión. Sal de Crestodian y ejecuta `openclaw doctor --fix` en una terminal. La operación `doctor` de solo lectura sigue estando disponible dentro de Crestodian.

Los agentes nuevos heredan la ruta de inferencia predeterminada verificada en vivo. El identificador de agente `crestodian` está reservado para el custodio virtual privilegiado y no se puede crear como agente normal.

`config set` y `config set-ref` no pueden cambiar el estado de la ruta de
inferencia, incluidas las credenciales del proveedor de inferencia, `auth.*`
de nivel superior, los catálogos de modelos, los backends de CLI, las rutas
de modelos predeterminadas o por agente, los parámetros/herramientas de los
agentes ni `tools.*` de raíz. También se rechazan las escrituras directas en
`env.*`, `secrets.*`, `plugins.*` y `$include` porque pueden sustituir la
resolución de credenciales o la activación del proveedor. La autenticación del
Gateway y de los canales sigue siendo una superficie normal de configuración.
Usa los flujos tipados de plugins/canales y
`set default model <provider/model>` para una ruta ya configurada; la ruta se
prueba en vivo antes de guardarla. Para configurar o reparar el acceso al
proveedor o a la autenticación, sal de Crestodian y ejecuta `openclaw onboard`.

La desinstalación de plugins se rechaza dentro de Crestodian porque eliminar un
plugin de proveedor podría deshabilitar la ruta de inferencia que sostiene la
sesión. Sal de Crestodian y ejecuta `openclaw plugins uninstall <id>` desde una
terminal.

La aprobación se expresa con tus propias palabras: las respuestas inequívocas ("sí", "claro", "adelante", "ahora no") se resuelven a partir de una lista cerrada y determinista. Cuando la ruta configurada admite una llamada de finalización independiente, las demás respuestas pueden clasificarse utilizando únicamente tu mensaje y la propuesta pendiente; nunca mediante el propio modelo de conversación, que no puede autoaprobarse. Las respuestas sin clasificar o ambiguas mantienen la propuesta pendiente y la conversación vuelve a preguntar.

Las escrituras aplicadas se registran en `~/.openclaw/audit/crestodian.jsonl`. El descubrimiento no se audita; solo se auditan las operaciones y escrituras aplicadas.

La configuración de canales puede ejecutarse como una conversación alojada
hasta que llegue a un secreto. La TUI local de Crestodian no acepta respuestas
confidenciales del asistente porque la entrada del chat de terminal es visible.
Ofrece `open channel wizard` inmediatamente y transfiere el canal seleccionado
al asistente enmascarado de la terminal; también puedes ejecutar
`openclaw channels add --channel <channel>` más adelante.

### Cambio a la configuración enmascarada de canales

El chat local puede transferir el control al asistente enmascarado de canales:

```text
open channel wizard for slack
channel info slack
```

`open channel wizard for <channel>` abre la configuración enmascarada del canal
después de que se cierre la TUI del chat. Usa `channel info <channel>` primero
para consultar la etiqueta del canal, el estado de configuración, el resumen
de requisitos previos y el enlace a la documentación.

Crestodian nunca cambia el acceso al proveedor o a la autenticación desde su
propia sesión: la sesión ya depende de esa ruta de inferencia. Para configurar
o reparar el proveedor del modelo, `configure model provider` devuelve
indicaciones para salir y realizar la incorporación, sin iniciar un asistente
ni escribir la configuración. Sal de Crestodian y ejecuta `openclaw onboard`;
la incorporación prepara las credenciales y guarda únicamente una ruta que
complete una interacción real en vivo. Vuelve a iniciar Crestodian después de
que la incorporación se complete correctamente.

## Inicialización de la configuración

`setup` configura el espacio de trabajo y el estado restante del Gateway después de que la incorporación guiada ya haya establecido la inferencia. Solo escribe mediante operaciones de configuración tipadas y solicita aprobación primero.

```text
setup
setup workspace ~/Projects/work
```

`setup` conserva el modelo efectivo verificado. No configura ni sustituye la
inferencia.

Si falta la inferencia o falla su comprobación en vivo, sal de Crestodian y ejecuta `openclaw onboard`. La incorporación guiada detecta modelos configurados, claves de API y CLI locales autenticadas, solicita una respuesta real a cada opción candidata y conserva únicamente una ruta que supere la prueba. Crestodian se inicia inmediatamente después de ese límite y puede configurar el espacio de trabajo, el Gateway, los canales, los agentes, los plugins y otras funciones opcionales.

La aplicación de macOS omite por completo esta secuencia cuando llega a un
Gateway configurado cuyo agente predeterminado ya tiene un modelo configurado;
abre la interfaz normal del agente.
Para un Gateway nuevo o incompleto, la aplicación ejecuta la secuencia de
inferencia mediante los métodos del Gateway `crestodian.setup.detect` y
`crestodian.setup.activate`: la detección enumera todos los backends candidatos
que encuentra; la activación prueba en vivo un candidato (una finalización real
que debe "reply with OK") y solo conserva el modelo, las credenciales y el
estado del proveedor/entorno de ejecución necesarios para esa ruta después de
que la prueba se supera. Los valores predeterminados del espacio de trabajo y
del Gateway quedan para Crestodian. Un candidato que falla nunca cambia la
configuración; la aplicación desciende automáticamente por la secuencia y,
finalmente, ofrece un paso manual para introducir una clave o token, rellenado
a partir de los plugins proveedores de inferencia de texto activos del Gateway.
El proveedor seleccionado es responsable de su modelo inicial y de su
configuración, y la credencial se verifica de la misma forma antes de guardarla.

La supervisión de Codex y otras funciones opcionales de plugins quedan fuera de
esta transacción de activación de inferencia. Configúralas únicamente después de
que la inferencia funcione y Crestodian se haya iniciado; las políticas de
plugins existentes y las exclusiones explícitas de supervisión permanecen
intactas durante la configuración de la inferencia.

## Conversación con IA

La conversación libre de Crestodian interactivo se ejecuta mediante el mismo bucle de agente que los agentes normales de OpenClaw, restringido a una única herramienta de autoridad de nivel cero de OpenClaw, `crestodian`, que encapsula las operaciones tipadas. Las acciones de lectura se ejecutan libremente, las modificaciones requieren tu aprobación conversacional para esa operación exacta (consulta Operaciones y aprobación), y cada escritura aplicada se audita y vuelve a validar. La sesión del agente persiste, por lo que Crestodian tiene memoria real de varios turnos. Si la ruta de inferencia verificada deja de funcionar posteriormente, vuelve a `openclaw onboard` y repárala antes de continuar.

El host no convierte las solicitudes en lenguaje natural en operaciones. Los
mensajes de formato libre —incluido texto con aspecto de comando y preguntas
como "¿por qué se detuvo mi gateway?"— se envían a la IA, que puede asignar la
solicitud a una operación tipada mediante la herramienta `crestodian`.

Cuando hay una modificación pendiente, solo las frases inequívocas de
aprobación o rechazo de una lista cerrada se resuelven sin inferencia. El
consentimiento ambiguo se envía a una llamada de finalización configurada por
separado y, de no ser posible, falla de forma segura. Los campos estructurados
de los asistentes y la navegación exacta del host son controles de la interfaz,
no análisis de operaciones expresadas en lenguaje natural. Una excepción de
higiene de secretos es especialmente importante: un `config set` exacto sobre
una ruta confidencial (tokens, claves, contraseñas) nunca llega a un modelo. El
host crea una propuesta censurada y el valor se enmascara en el historial
visible para la IA. Para los secretos, se recomienda
`config set-ref <path> env <ENV_VAR>`.

El modo de rescate mediante canales de mensajes nunca utiliza el planificador asistido por el modelo. El rescate remoto sigue siendo determinista para que una ruta normal de agente averiada o comprometida no pueda utilizarse como editor de configuración.

### Modelo de confianza del entorno de CLI

Los entornos de ejecución integrados y el entorno del servidor de aplicaciones
de Codex aplican directamente la restricción de nivel cero: la ejecución
incluye una lista de herramientas permitidas de OpenClaw que contiene
únicamente la herramienta `crestodian`. Para Codex, OpenClaw también deshabilita
los entornos, la ejecución nativa, el uso de múltiples agentes, los objetivos,
las superficies de aplicaciones/plugins, Skills/MCP, búsqueda web y
`request_user_input` para esa ejecución. Codex sigue inyectando su utilidad
nativa inerte `update_plan`; esta puede actualizar la lista de comprobación
temporal del modelo, pero no puede escribir archivos ni modificar la
configuración de OpenClaw. Los entornos de CLI no consumen la lista de elementos
permitidos de OpenClaw, por lo que Crestodian solo admite backends cuyo propio
contrato de selección de herramientas pueda demostrar la misma restricción:

- Los backends seleccionables, incluido Claude Code, se inician con una selección vacía de herramientas nativas y una herramienta MCP, `crestodian`. La configuración MCP generada por Claude se aplica con `--strict-mcp-config`, por lo que no se carga ningún otro servidor MCP.
- Los backends que declaran no tener herramientas nativas reciben el mismo servidor MCP dedicado de Crestodian.
- Los backends con herramientas nativas siempre activas o desconocidas deniegan la operación antes de la inferencia; no pueden alojar una sesión de Crestodian.

Solo las sesiones de Crestodian obtienen el servidor MCP de crestodian; las ejecuciones normales del agente nunca ven esta herramienta. Por lo tanto, los backends de CLI seleccionables o sin herramientas nativas y los modelos con clave de API imponen el bucle literal de una sola herramienta. Los modelos del servidor de aplicaciones de Codex imponen una sola herramienta de autoridad de OpenClaw junto con la utilidad nativa inerte de planificación. En los tres casos, las escrituras de configuración permanecen confinadas al contrato auditado de aprobación de Crestodian.

Gemini CLI sigue disponible para los agentes normales, pero no puede imponer la prueba sin herramientas exigida por la barrera de inferencia, por lo que no puede alojar Crestodian.

## Cambiar a un agente

Usa un selector en lenguaje natural para salir de Crestodian y abrir la TUI normal:

```text
hablar con el agente
hablar con el agente de trabajo
cambiar al agente principal
```

`openclaw tui`, `openclaw chat` y `openclaw terminal` abren directamente la TUI normal del agente; no inician Crestodian. Después de cambiar a la TUI normal, `/crestodian` regresa a Crestodian, opcionalmente con una solicitud adicional:

```text
/crestodian
/crestodian restart gateway
```

## Modo de rescate de mensajes

El modo de rescate de mensajes es el punto de entrada de Crestodian desde canales de mensajes: úsalo cuando tu agente normal no funcione, pero un canal de confianza (por ejemplo, WhatsApp) aún reciba comandos.

Este es un controlador determinista de comandos de emergencia, no el agente conversacional Crestodian. No inicia una configuración nueva ni relaja la barrera de inferencia para el chat de Crestodian.

Comando compatible: `/crestodian <request>`. El rescate solo acepta la gramática exacta del comando escrito: el lenguaje natural se rechaza con una sugerencia, nunca se interpreta de forma tentativa como una operación y jamás se consulta a un modelo.

```text
Tú, en un mensaje directo de propietario de confianza: /crestodian status
OpenClaw: Modo de rescate de Crestodian. Gateway accesible: no. Configuración válida: no.
Tú: /crestodian restart gateway
OpenClaw: Plan: reiniciar el Gateway. Responde /crestodian yes para aplicar.
Tú: /crestodian yes
OpenClaw: Aplicado. Entrada de auditoría registrada.
```

La creación de agentes también puede ponerse en cola localmente o mediante el rescate:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.6-sol
/crestodian create agent work workspace ~/Projects/work
```

La creación de agentes solo puede especificar el modelo predeterminado actual verificado en vivo. Omite el modelo para heredar esa ruta.

El rescate remoto es una superficie administrativa y debe tratarse como una reparación remota de configuración, no como un chat normal.

Contrato de seguridad para el rescate remoto:

- Se desactiva cuando el aislamiento está activo para el agente o la sesión; Crestodian rechaza el rescate remoto e indica que se use la reparación mediante la CLI local.
- El estado efectivo predeterminado es `auto`: permite el rescate remoto únicamente en una operación YOLO de confianza, donde el entorno de ejecución ya dispone de autoridad local sin aislamiento (`tools.exec.security` se resuelve como `full` y `tools.exec.ask` como `off`, con el modo de aislamiento en `off`).
- Requiere una identidad explícita del propietario; no se permiten reglas de remitente comodín, políticas de grupo abiertas, webhooks sin autenticar ni canales anónimos.
- De forma predeterminada, solo se permiten mensajes directos del propietario; el rescate en grupos o canales requiere activación explícita.
- La búsqueda y el listado de plugins son de solo lectura. La instalación de plugins siempre es exclusivamente local (se bloquea en el rescate, incluso si está habilitada de otro modo) porque descarga código ejecutable. La desinstalación de plugins se rechaza tanto en Crestodian local como en el rescate; ejecuta `openclaw plugins uninstall <id>` desde un terminal.
- El rescate remoto no puede abrir la TUI local ni cambiar a una sesión interactiva de agente; usa `openclaw` localmente para transferir el control al agente.
- Las escrituras persistentes siguen requiriendo aprobación, incluso en el modo de rescate.
- Cada operación de rescate aplicada queda auditada. El rescate mediante canales de mensajes registra el canal, la cuenta, el remitente y los metadatos de la dirección de origen; las operaciones que modifican la configuración también registran los hashes de configuración anteriores y posteriores.
- Los secretos nunca se muestran. La inspección de SecretRef informa de su disponibilidad, no de sus valores.
- Si el Gateway está activo, el rescate prioriza las operaciones tipadas del Gateway; si está inactivo, el rescate utiliza únicamente la superficie mínima de reparación local que no depende del bucle normal del agente.

Estructura de configuración:

```jsonc
{
  "crestodian": {
    "rescue": {
      "enabled": "auto",
      "ownerDmOnly": true,
      "pendingTtlMinutes": 15,
    },
  },
}
```

- `enabled`: `"auto"` (valor predeterminado) permite el rescate únicamente cuando el entorno de ejecución efectivo está en modo YOLO y el aislamiento está desactivado; `false` nunca permite el rescate mediante canales de mensajes; `true` permite explícitamente el rescate cuando se superan las comprobaciones del propietario y del canal (sigue sujeto a la denegación por aislamiento).
- `ownerDmOnly`: restringe el rescate a los mensajes directos del propietario. Valor predeterminado: `true`.
- `pendingTtlMinutes`: tiempo durante el cual una escritura de rescate pendiente permanece abierta para su aprobación mediante `/crestodian yes` antes de caducar. Valor predeterminado: `15`.

El rescate remoto está cubierto por la vía de Docker:

```bash
pnpm test:docker:crestodian-rescue
```

Una prueba de humo opcional de la superficie de comandos de un canal en vivo comprueba `/crestodian status`, además de un ciclo completo de aprobación persistente mediante el controlador de rescate:

```bash
pnpm test:live:crestodian-rescue-channel
```

La configuración empaquetada de una sola ejecución protegida por inferencia está cubierta por:

```bash
pnpm test:docker:crestodian-first-run
```

Esa vía de la CLI empaquetada comienza con un directorio de estado vacío y demuestra que Crestodian deniega la operación sin inferencia. Luego prueba y activa una instancia simulada de Claude mediante el módulo de activación empaquetado. Solo después una solicitud aproximada llega al planificador y se resuelve como una configuración tipada, seguida de comandos de una sola ejecución que crean un agente adicional, configuran Discord mediante la activación de un plugin y un SecretRef de token, validan la configuración y comprueban el registro de auditoría. Esta vía aporta pruebas de la barrera y de las operaciones; no ejercita la incorporación interactiva ni la conversación de agente, herramienta y aprobación de Crestodian. El siguiente escenario de QA Lab redirige a la misma vía de Docker:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Doctor](/es/cli/doctor)
- [TUI](/es/cli/tui)
- [Aislamiento](/es/cli/sandbox)
- [Seguridad](/es/cli/security)
