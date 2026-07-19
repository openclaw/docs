---
read_when:
    - Has finalizado la configuración de inferencia y quieres que OpenClaw configure el resto
    - Necesita inspeccionar o reparar OpenClaw con el agente de configuración local
    - Está diseñando o habilitando el modo de rescate del canal de mensajes
summary: Referencia de la CLI y modelo de seguridad para el asistente de configuración y reparación de OpenClaw basado en inferencia
title: Agente de configuración de OpenClaw
x-i18n:
    generated_at: "2026-07-19T13:34:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 32643eb24cd010c1018908f78d901ebdcac9ef13f7c639e48a5ba7be5913a1d5
    source_path: cli/openclaw.md
    workflow: 16
---

# `openclaw setup`

OpenClaw incluye un agente del sistema integrado —se presenta como «OpenClaw»— para
la configuración, reparación y parametrización locales (anteriormente denominado Crestodian). Solo se inicia después de que el modelo predeterminado efectivo complete un turno real.
Las instalaciones nuevas establecen primero la inferencia; una configuración con formato incorrecto permanece en la
ruta clásica de doctor.

## Cuándo se inicia

La ejecución de `openclaw` sin subcomandos se encamina según el estado de la configuración:

- Falta la configuración o existe sin ajustes definidos (vacía o solo con claves `$schema`/`meta`): inicia la incorporación guiada con verificación de IA en vivo.
- La configuración existe, pero no supera la validación: inicia la incorporación clásica, que informa de los problemas e indica que se use `openclaw doctor`.
- La configuración existe y es válida: abre la TUI normal del agente. Un Gateway accesible
  y configurado cuyo agente predeterminado tenga un modelo accede directamente a esa interfaz
  sin incorporación ni OpenClaw. Use `/openclaw` dentro de la TUI o ejecute
  `openclaw setup` directamente para acceder a OpenClaw más adelante.

La ejecución de `openclaw setup` primero prueba en vivo el modelo predeterminado configurado. Un turno satisfactorio inicia OpenClaw. Un fallo interactivo abre la configuración guiada de la inferencia y transfiere el control a OpenClaw después de que un candidato supere la prueba. Las solicitudes de ejecución única, JSON y otras no interactivas fallan con instrucciones para ejecutar `openclaw onboard` cuando la inferencia no está disponible. `openclaw --help` y `openclaw --version` mantienen sus rutas rápidas normales.

La ejecución no interactiva de `openclaw` sin argumentos (sin TTY) finaliza con un mensaje breve en lugar de imprimir la ayuda raíz: remite a la incorporación no interactiva en una instalación nueva o no válida, o a `openclaw agent --local ...` cuando la configuración es válida.

`openclaw onboard --modern` continúa siendo un alias de compatibilidad para OpenClaw, pero usa la misma puerta de inferencia: si la inferencia funciona, abre el chat; los fallos interactivos inician la configuración guiada de la inferencia y los fallos no interactivos finalizan con instrucciones de incorporación. `openclaw onboard --classic` abre el asistente completo paso a paso.

## Qué muestra OpenClaw

OpenClaw interactivo abre el mismo entorno de TUI que `openclaw tui`, con un backend de chat de OpenClaw. El saludo inicial abarca:

- la validez de la configuración y el agente predeterminado
- el modelo verificado que usa OpenClaw
- la accesibilidad del Gateway desde la primera comprobación de inicio
- la siguiente acción de depuración recomendada

No vuelca secretos ni carga comandos de la CLI de plugins solo para iniciarse.

Use `status` para consultar el inventario detallado: ruta de configuración, rutas de documentación/código fuente, comprobaciones locales de la CLI, presencia de claves/tokens, agentes, modelo y detalles del Gateway.

OpenClaw usa el mismo descubrimiento de referencias que los agentes normales: en un checkout de Git señala al `docs/` local y al árbol de código fuente; en una instalación de npm usa la documentación incluida y enlaza a [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), con la recomendación de consultar el código fuente cuando la documentación no sea suficiente.

## Ejemplos

```bash
openclaw
openclaw setup
openclaw setup --json
openclaw setup --message "models"
openclaw setup --message "validate config"
openclaw setup --message "setup workspace ~/Projects/work" --yes
openclaw setup --message "set default model openai/gpt-5.6" --yes
openclaw onboard --modern
```

Dentro de la TUI de OpenClaw:

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

OpenClaw usa operaciones tipadas en lugar de editar la configuración de forma ad hoc.

Las operaciones de solo lectura se ejecutan inmediatamente: mostrar el resumen, enumerar los agentes, enumerar los plugins instalados, buscar plugins de ClawHub, mostrar el estado del modelo/backend, ejecutar comprobaciones de estado/salud, comprobar la accesibilidad del Gateway, ejecutar doctor sin correcciones interactivas, validar la configuración y mostrar la ruta del registro de auditoría.

El inicio de la configuración guiada de canales (`connect telegram`) también se ejecuta inmediatamente. Su asistente recopila respuestas explícitas y se encarga de las escrituras resultantes.

Las operaciones persistentes requieren aprobación conversacional (o `--yes` para un comando directo): escribir la configuración, `config set`, `config set-ref`, iniciar la configuración/incorporación, cambiar el modelo predeterminado, iniciar/detener/reiniciar el Gateway, crear agentes e instalar plugins.

Las reparaciones de doctor no están disponibles dentro de OpenClaw porque pueden reescribir el proveedor, la autenticación o la ruta de inferencia del agente predeterminado que sustenta la sesión. Salga de OpenClaw y ejecute `openclaw doctor --fix` en una terminal. `doctor` de solo lectura sigue estando disponible dentro de OpenClaw.

Los agentes nuevos heredan la ruta de inferencia predeterminada verificada en vivo. Los identificadores de agente `openclaw` y `crestodian` están reservados para el agente del sistema y no se pueden crear como agentes normales. El identificador retirado continúa bloqueado para impedir que una configuración antigua lo reclame.

`config set` y `config set-ref` pueden cambiar cualquier ajuste que pueda cambiar un usuario,
con una breve lista de denegación de uso exclusivamente humano: `$include`, `auth.*`, `env.*`, `models.*`
y `secrets.*` continúan rechazándose porque contienen material de credenciales,
inclusión de configuraciones alternativas o las definiciones de proveedores/catálogos que alimentan
el encaminamiento de inferencia. El propio encaminamiento de inferencia también está protegido: se
rechazan las rutas del modelo predeterminado (campos de modelo/parámetros/runtime de `agents.defaults`)
y los campos de encaminamiento del agente que respalde la ruta predeterminada activa, así como los campos
de identidad/topología del agente (`id`, `agentDir`, `default`). Los campos de encaminamiento de
otros agentes siguen siendo modificables con aprobación. La autenticación del Gateway y de los canales sigue siendo
una superficie normal de configuración. Use `set default model <provider/model>` para una
ruta ya configurada; prueba la ruta en vivo antes de guardarla. Para
configurar o reparar el acceso al proveedor/autenticación, salga de OpenClaw y ejecute
`openclaw onboard`.

Las escrituras de `plugins.entries.<id>.*` (activación/desactivación/configuración de plugins instalados)
están permitidas, salvo que ese plugin respalde la ruta de inferencia activa. Las
fuentes de instalación y la política de carga de plugins mantienen su límite de confianza en el flujo de trabajo
tipado de instalación de plugins. La desinstalación del plugin que respalda la ruta
se rechaza por el mismo motivo; salga de OpenClaw y ejecute
`openclaw plugins uninstall <id>` desde una terminal.

La aprobación se da con palabras propias: las respuestas inequívocas («sí», «de acuerdo», «adelante», «ahora no») se resuelven a partir de una lista cerrada y determinista. Cuando la ruta configurada admite una llamada de finalización independiente, las demás respuestas pueden clasificarse usando únicamente el mensaje y la propuesta pendiente, nunca mediante el propio modelo de conversación, que no puede aprobarse a sí mismo. Las respuestas no clasificadas o ambiguas mantienen la propuesta pendiente y la conversación vuelve a preguntar.

### Historial de cambios

La página Ask OpenClaw puede mostrar operaciones recientes aplicadas por el agente del sistema, migraciones de Doctor, escrituras de configuración desde Settings y la CLI, y modificaciones manuales de
`openclaw.json`. El diario de configuración detecta las modificaciones externas mientras el Gateway
está observando, durante una escritura propia de OpenClaw o en el siguiente inicio después de una
modificación sin conexión.

El historial se almacena en la tabla `diagnostic_events` de la base de datos compartida
`~/.openclaw/state/openclaw.sqlite`, bajo los ámbitos `system-agent-audit`
y `config-audit`. Cada ámbito conserva sus 50,000 registros más recientes.
No se incluyen las operaciones de descubrimiento ni las de solo lectura. Los secretos nunca aparecen en
el historial de cambios; los registros del diario de configuración contienen las rutas modificadas en lugar de los valores
de configuración, y la comparación de valores usa huellas digitales protegidas.

La configuración de canales puede ejecutarse como una conversación alojada hasta que llegue a un secreto. La
TUI local de OpenClaw no acepta respuestas confidenciales del asistente porque la entrada del chat de la
terminal es visible. Ofrece `open channel wizard` inmediatamente, trasladando
el canal seleccionado al asistente enmascarado de la terminal; también se puede ejecutar
`openclaw channels add --channel <channel>` más adelante.

### Cambio a la configuración enmascarada de canales

El chat local puede transferir el control al asistente enmascarado de canales:

```text
open channel wizard for slack
channel info slack
```

`open channel wizard for <channel>` abre la configuración enmascarada del canal después de que se cierre la
TUI del chat. Use primero `channel info <channel>` para consultar la etiqueta del canal, el estado de
configuración, el resumen de requisitos previos y el enlace a la documentación.

OpenClaw nunca cambia el acceso al proveedor/autenticación desde su propia sesión: la
sesión ya depende de esa ruta de inferencia. Para configurar o
reparar el proveedor del modelo, `configure model provider` devuelve instrucciones para salir/iniciar la incorporación sin
iniciar un asistente ni escribir la configuración. Salga de OpenClaw y ejecute `openclaw
onboard`; la incorporación prepara las credenciales y solo guarda una ruta que
complete un turno real en vivo. Vuelva a iniciar OpenClaw después de que la incorporación finalice correctamente.

## Inicio de la configuración

`setup` configura el espacio de trabajo y el estado del Gateway restantes después de que la incorporación guiada ya haya establecido la inferencia. Solo escribe mediante operaciones de configuración tipadas y solicita aprobación previamente.

```text
setup
setup workspace ~/Projects/work
```

`setup` conserva el modelo efectivo verificado. No configura ni
sustituye la inferencia.

Si falta la inferencia o falla su comprobación en vivo, salga de OpenClaw y ejecute `openclaw onboard`. La incorporación guiada detecta modelos configurados, claves de API y CLI locales autenticadas, solicita a cada candidato una respuesta real y conserva únicamente una ruta que supere la prueba. OpenClaw se inicia inmediatamente después de ese límite y puede configurar entonces el espacio de trabajo, el Gateway, los canales, los agentes, los plugins y otras funciones opcionales.

La aplicación para macOS omite por completo esta secuencia cuando llega a un Gateway configurado
cuyo agente predeterminado ya tiene un modelo configurado; abre la interfaz normal del
agente.
Para un Gateway nuevo o incompleto, la aplicación ejecuta la secuencia de inferencia mediante
los métodos de Gateway `openclaw.setup.detect` y `openclaw.setup.activate`:
detect enumera cada backend candidato que encuentra; activate prueba en vivo un
candidato (una finalización real con «reply with OK») y solo conserva el modelo,
la credencial y el estado del proveedor/runtime necesarios para esa ruta después de superar la prueba. Los valores predeterminados del espacio de trabajo y del Gateway quedan para OpenClaw. Un candidato que falla
nunca cambia la configuración; la aplicación recorre automáticamente la secuencia y finalmente
ofrece un paso manual de clave/token rellenado a partir de los plugins de proveedor
de inferencia de texto activos del Gateway. El proveedor seleccionado controla su modelo
inicial y su configuración, y la credencial se verifica del mismo modo antes de guardarse.

La supervisión de Codex y otras funciones opcionales de plugins permanecen fuera de esta
transacción de activación de la inferencia. Configúrelas únicamente después de que la inferencia
funcione y OpenClaw se haya iniciado; la política existente de plugins y las
exclusiones explícitas de supervisión permanecen intactas durante la configuración de la inferencia.

## Conversación con IA

La conversación libre del OpenClaw interactivo se ejecuta mediante el mismo bucle de agente que los agentes normales de OpenClaw, restringido a una herramienta de autoridad de nivel cero de OpenClaw, `openclaw`, que encapsula las operaciones tipadas. Las acciones de lectura se ejecutan libremente, las mutaciones requieren aprobación conversacional para esa operación exacta (consulte Operaciones y aprobación), y cada escritura aplicada se audita y vuelve a validar. La sesión del agente persiste, por lo que OpenClaw dispone de memoria real entre varios turnos. Si la ruta de inferencia verificada deja de funcionar posteriormente, vuelva a `openclaw onboard` y repárela antes de continuar.

El host no analiza las solicitudes en lenguaje natural para convertirlas en operaciones. Los mensajes
libres —incluido el texto con apariencia de comando y preguntas como «¿por qué se detuvo mi
Gateway?»— se envían a la IA, que puede asignar la solicitud a una operación tipada
mediante la herramienta `openclaw`.

Cuando hay una mutación pendiente, solo se resuelven sin inferencia las frases inequívocas de aprobación o rechazo incluidas en una
lista cerrada. El consentimiento ambiguo se envía a una
llamada de finalización configurada por separado y, de lo contrario, se rechaza de forma segura. Los campos estructurados
del asistente y la navegación exacta del host son controles de la interfaz de usuario, no análisis de operaciones expresadas en lenguaje
natural. Hay una excepción de higiene de secretos especialmente importante: un
`config set` exacto en una ruta sensible (tokens, claves, contraseñas) nunca llega
a un modelo. El host crea una propuesta censurada y el valor se enmascara en el
historial visible para la IA. Se recomienda `config set-ref <path> env <ENV_VAR>` para los secretos.

El modo de recuperación mediante canales de mensajes nunca usa el planificador asistido por el modelo. La recuperación remota sigue siendo determinista para impedir que una ruta normal del agente averiada o comprometida se use como editor de configuración.

### Modelo de confianza del arnés de la CLI

Los entornos de ejecución integrados y el arnés del servidor de aplicaciones de Codex aplican directamente la
restricción de nivel cero: la ejecución lleva una lista de herramientas permitidas de OpenClaw que contiene únicamente
la herramienta `openclaw`. Para Codex, OpenClaw también deshabilita los entornos, la ejecución
nativa, los múltiples agentes, los objetivos, las aplicaciones/plugins, las Skills/MCP, la búsqueda
web y las superficies `request_user_input` para esa ejecución. Codex sigue inyectando su utilidad nativa inerte `update_plan`;
esta puede actualizar la lista de comprobación temporal del modelo, pero no puede escribir archivos
ni modificar la configuración de OpenClaw. Los arneses de la CLI no consumen la lista de elementos permitidos de OpenClaw,
por lo que OpenClaw solo admite backends cuyo propio contrato de selección de herramientas pueda demostrar
la misma restricción:

- Los backends seleccionables, incluido Claude Code, se inician con una selección de herramientas
  nativas vacía y una herramienta MCP, `openclaw`. La configuración de MCP generada por Claude se
  aplica con `--strict-mcp-config`, por lo que no se cargan otros servidores MCP.
- Los backends que declaran no tener herramientas nativas reciben el mismo servidor MCP
  dedicado de OpenClaw.
- Los backends con herramientas nativas siempre activas o desconocidas se rechazan de forma segura antes de la inferencia;
  no pueden alojar una sesión de OpenClaw.

Solo las sesiones de OpenClaw reciben el servidor MCP de openclaw; las ejecuciones normales del agente
nunca ven esta herramienta. Por tanto, los backends seleccionables o sin herramientas nativas de la CLI y los modelos
con clave de API aplican el bucle literal de una sola herramienta. Los modelos del servidor de aplicaciones de Codex aplican
una única herramienta de autoridad de OpenClaw más la utilidad nativa inerte de planificación. En los
tres casos, las escrituras de configuración quedan limitadas al contrato auditado de aprobación
de OpenClaw.

Gemini CLI sigue disponible para los agentes normales, pero no puede aplicar la
prueba sin herramientas exigida por la puerta de inferencia, por lo que no puede alojar OpenClaw.

## Cambiar a un agente

Use un selector en lenguaje natural para salir de OpenClaw y abrir la TUI normal:

```text
hablar con el agente
hablar con el agente de trabajo
cambiar al agente principal
```

`openclaw tui`, `openclaw chat` y `openclaw terminal` abren directamente la TUI normal del agente; no inician OpenClaw. Tras cambiar a la TUI normal, `/openclaw` vuelve a OpenClaw, opcionalmente con una solicitud de seguimiento:

```text
/openclaw
/openclaw restart gateway
```

## Modo de recuperación mediante mensajes

El modo de recuperación mediante mensajes es el punto de entrada de canales de mensajes para OpenClaw: úselo cuando el agente normal no funcione, pero un canal de confianza (por ejemplo, WhatsApp) siga recibiendo comandos.

Este es un controlador determinista de comandos de emergencia, no el agente conversacional
de OpenClaw. No inicializa una configuración nueva ni relaja la puerta de inferencia
para el chat de OpenClaw.

Comando compatible: `/openclaw <request>`. La recuperación solo acepta la gramática exacta de comandos escritos: el lenguaje natural se rechaza con una indicación, nunca se interpreta mediante conjeturas como una operación y jamás se consulta ningún modelo.

```text
Usted, en un mensaje directo de confianza del propietario: /openclaw status
OpenClaw: Modo de recuperación de OpenClaw. Gateway accesible: no. Configuración válida: no.
Usted: /openclaw restart gateway
OpenClaw: Plan: reiniciar el Gateway. Responda /openclaw yes para aplicarlo.
Usted: /openclaw yes
OpenClaw: Aplicado. Entrada de auditoría escrita.
```

La creación de agentes también puede ponerse en cola localmente o mediante la recuperación:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.6-sol
/openclaw create agent work workspace ~/Projects/work
```

La creación de agentes solo puede indicar el modelo predeterminado actual verificado en vivo. Omita el
modelo para heredar esa ruta.

La recuperación remota es una superficie administrativa y debe tratarse como una reparación remota de la configuración, no como un chat normal.

Contrato de seguridad para la recuperación remota:

- Se deshabilita cuando el aislamiento está activo para el agente o la sesión; OpenClaw rechaza la recuperación remota e indica que se use la reparación mediante la CLI local.
- El estado efectivo predeterminado es `auto`: permitir la recuperación remota únicamente durante operaciones YOLO de confianza, cuando el entorno de ejecución ya tiene autoridad local sin aislamiento (`tools.exec.security` se resuelve como `full` y `tools.exec.ask` se resuelve como `off`, con el modo de aislamiento `off`).
- Requiere una identidad explícita del propietario; no se permiten reglas de remitentes comodín, políticas de grupo abiertas, webhooks sin autenticar ni canales anónimos.
- De forma predeterminada, solo se permiten mensajes directos del propietario; la recuperación en grupos o canales requiere habilitación explícita.
- La búsqueda y la enumeración de plugins son de solo lectura. La instalación de plugins siempre es exclusivamente local (está bloqueada en la recuperación, aunque esté habilitada en otros contextos) porque descarga código ejecutable. La desinstalación de plugins se rechaza tanto en OpenClaw local como en la recuperación; ejecute `openclaw plugins uninstall <id>` desde un terminal.
- La recuperación remota no puede abrir la TUI local ni cambiar a una sesión interactiva del agente; use `openclaw` local para transferir el control al agente.
- Las escrituras persistentes siguen requiriendo aprobación, incluso en el modo de recuperación.
- Las aprobaciones pendientes son de un solo uso. Cualquier comando de recuperación más reciente para la misma cuenta, canal y remitente revoca el plan anterior; una ejecución fallida también consume la aprobación, por lo que debe reenviar el comando para volver a intentarlo.
- Cada operación de recuperación aplicada se audita. La recuperación mediante canales de mensajes registra metadatos del canal, la cuenta, el remitente y la dirección de origen; las operaciones que modifican la configuración también registran los hashes de la configuración anteriores y posteriores.
- Los secretos nunca se reproducen. La inspección de SecretRef informa sobre la disponibilidad, no sobre los valores.
- Si el Gateway está activo, la recuperación prefiere las operaciones tipadas del Gateway; si está inactivo, la recuperación usa únicamente la superficie mínima de reparación local que no depende del bucle normal del agente.

Estructura de configuración:

```jsonc
{
  "systemAgent": {
    "rescue": {
      "enabled": "auto",
      "ownerDmOnly": true,
      "pendingTtlMinutes": 15,
    },
  },
}
```

- `enabled`: `"auto"` (valor predeterminado) permite la recuperación únicamente cuando el entorno de ejecución efectivo es YOLO y el aislamiento está desactivado; `false` nunca permite la recuperación mediante canales de mensajes; `true` permite explícitamente la recuperación cuando se superan las comprobaciones del propietario y del canal (sigue sujeta al rechazo por aislamiento).
- `ownerDmOnly`: restringe la recuperación a los mensajes directos del propietario. Valor predeterminado: `true`.
- `pendingTtlMinutes`: tiempo durante el cual una escritura de recuperación pendiente permanece abierta para la aprobación `/openclaw yes` antes de caducar. Valor predeterminado: `15`.

`openclaw doctor --fix` migra el bloque de configuración heredado `crestodian` a
`systemAgent`. El entorno de ejecución solo lee el bloque canónico.

La recuperación remota está cubierta por el carril de Docker:

```bash
pnpm test:docker:system-agent-rescue
```

Una prueba de humo opcional de la superficie de comandos del canal en vivo comprueba `/openclaw status` junto con un recorrido completo de aprobación persistente mediante el controlador de recuperación:

```bash
pnpm test:live:system-agent-rescue-channel
```

La configuración empaquetada de una sola ejecución, protegida por la puerta de inferencia, está cubierta por:

```bash
pnpm test:docker:system-agent-first-run
```

Ese carril de la CLI empaquetada se inicia con un directorio de estado vacío y demuestra que OpenClaw
se rechaza de forma segura sin inferencia. Después prueba y activa un Claude simulado mediante
el módulo de activación empaquetado. Solo entonces una solicitud imprecisa llega al
planificador y se resuelve como una configuración tipada, seguida de comandos de una sola ejecución que crean un
agente adicional, configuran Discord mediante la habilitación de un plugin junto con un
SecretRef de token, validan la configuración y comprueban el registro de auditoría. Este carril aporta
pruebas de la puerta y las operaciones; no prueba la incorporación interactiva ni la
conversación de agente, herramienta y aprobación de OpenClaw. El siguiente escenario de QA Lab redirige
al mismo carril de Docker:

```bash
pnpm openclaw qa suite --scenario system-agent-ring-zero-setup
```

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Doctor](/es/cli/doctor)
- [TUI](/es/cli/tui)
- [Aislamiento](/es/cli/sandbox)
- [Seguridad](/es/cli/security)
