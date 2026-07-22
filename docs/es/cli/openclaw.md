---
read_when:
    - Has finalizado la configuración de la inferencia y quieres que OpenClaw configure el resto
    - Necesita inspeccionar o reparar OpenClaw con el agente de configuración local
    - Está diseñando o habilitando el modo de rescate del canal de mensajes
summary: Referencia de la CLI y modelo de seguridad del asistente de configuración y reparación de OpenClaw basado en inferencia
title: Agente de configuración de OpenClaw
x-i18n:
    generated_at: "2026-07-22T10:29:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9578d1493ff514ea6dd07dae995bf83443e9e17f2c2134bc801faa45254615bf
    source_path: cli/openclaw.md
    workflow: 16
---

# `openclaw setup`

OpenClaw incluye un agente de sistema integrado —que se presenta como «OpenClaw»— para
la configuración, reparación y puesta a punto locales (anteriormente denominado Crestodian). Solo se inicia después de que el modelo predeterminado efectivo complete un turno real.
Las instalaciones nuevas establecen primero la inferencia; las configuraciones con formato incorrecto permanecen en la
ruta clásica de Doctor.

## Cuándo se inicia

Ejecutar `openclaw` sin un subcomando dirige el flujo según el estado de la configuración:

- Falta la configuración o existe sin ajustes definidos (vacía o solo con las claves `$schema`/`meta`): inicia la incorporación guiada con verificación mediante IA en vivo.
- La configuración existe, pero no supera la validación: inicia la incorporación clásica, que informa de los problemas y remite a `openclaw doctor`.
- La configuración existe y es válida: abre la TUI normal del agente. Un Gateway accesible
  y configurado cuyo agente predeterminado tenga un modelo accede directamente a esa interfaz
  sin incorporación ni OpenClaw. Use `/openclaw` dentro de la TUI o ejecute
  `openclaw setup` directamente para acceder a OpenClaw más adelante.

Ejecutar `openclaw setup` primero prueba en vivo el modelo predeterminado configurado. Un turno satisfactorio inicia OpenClaw. Un fallo interactivo abre la configuración guiada de inferencia y transfiere el control a OpenClaw cuando una opción candidata supera la prueba. Las solicitudes de una sola ejecución, JSON y otras solicitudes no interactivas fallan con instrucciones para ejecutar `openclaw onboard` cuando la inferencia no está disponible. `openclaw --help` y `openclaw --version` conservan sus rutas rápidas normales.

La ejecución no interactiva de `openclaw` sin argumentos (sin TTY) termina con un mensaje breve en lugar de mostrar la ayuda raíz: remite a la incorporación no interactiva en una instalación nueva o no válida, o a `openclaw agent --local ...` cuando la configuración es válida.

`openclaw onboard --modern` sigue siendo un alias de compatibilidad de OpenClaw, pero utiliza la misma puerta de inferencia: si la inferencia funciona, abre el chat; los fallos interactivos inician la configuración guiada de inferencia y los fallos no interactivos terminan con indicaciones para la incorporación. `openclaw onboard --classic` abre el asistente completo paso a paso.

## Qué muestra OpenClaw

OpenClaw interactivo abre el mismo entorno de TUI que `openclaw tui`, con un backend de chat de OpenClaw. El saludo inicial abarca:

- la validez de la configuración y el agente predeterminado
- el modelo verificado que utiliza OpenClaw
- la accesibilidad del Gateway desde la primera comprobación de inicio
- la siguiente acción de depuración recomendada

No vuelca secretos ni carga comandos de CLI de plugins solo para iniciarse.

Use `status` para consultar el inventario detallado: ruta de configuración, rutas de documentación y código fuente, comprobaciones locales de la CLI, presencia de claves o tokens, agentes, modelo y detalles del Gateway.

OpenClaw utiliza el mismo descubrimiento de referencias que los agentes habituales: en un checkout de Git, señala la documentación local `docs/` y el árbol de código fuente; en una instalación de npm, utiliza la documentación incluida y enlaza a [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), con la recomendación de consultar el código fuente cuando la documentación no sea suficiente.

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
estado
salud
doctor
validar configuración
configuración
configurar espacio de trabajo ~/Projects/work
configuración establecer gateway.port 19001
configuración establecer referencia gateway.auth.token env OPENCLAW_GATEWAY_TOKEN
estado del gateway
reiniciar gateway
agentes
crear agente work espacio de trabajo ~/Projects/work
modelos
configurar proveedor del modelo
establecer modelo predeterminado openai/gpt-5.6
canales
información del canal slack
conectar slack
abrir asistente de canal para slack
listar plugins
buscar plugins slack
instalar plugin clawhub:openclaw-codex-app-server
hablar con el agente work
hablar con el agente de ~/Projects/work
auditar
salir
```

## Operaciones y aprobación

OpenClaw utiliza operaciones tipadas en lugar de editar la configuración de forma específica para cada caso.

Las operaciones de solo lectura se ejecutan inmediatamente: mostrar el resumen, enumerar agentes, enumerar los plugins instalados, buscar plugins en ClawHub, mostrar el estado del modelo/backend, ejecutar comprobaciones de estado/salud, comprobar la accesibilidad del Gateway, ejecutar Doctor sin correcciones interactivas, validar la configuración y mostrar la ruta del registro de auditoría.

El inicio de la configuración guiada de canales (`connect telegram`) también se ejecuta inmediatamente. Su asistente recopila respuestas explícitas y se encarga de las escrituras resultantes.

Las operaciones persistentes requieren aprobación conversacional (o `--yes` para un comando directo): escribir la configuración, `config set`, `config set-ref`, el arranque de configuración/incorporación, cambiar el modelo predeterminado, iniciar/detener/reiniciar el Gateway, crear agentes e instalar plugins.

Las reparaciones de Doctor no están disponibles dentro de OpenClaw porque pueden reescribir el proveedor, la autenticación o la ruta de inferencia del agente predeterminado que sostiene la sesión. Salga de OpenClaw y ejecute `openclaw doctor --fix` en un terminal. La operación de solo lectura `doctor` continúa disponible dentro de OpenClaw.

Los agentes nuevos heredan la ruta de inferencia predeterminada verificada en vivo. Los identificadores de agente `openclaw` y `crestodian` están reservados para el agente de sistema y no se pueden crear como agentes normales. El identificador retirado continúa bloqueado para impedir que una configuración antigua lo reclame.

`config set` y `config set-ref` pueden cambiar cualquier ajuste que pueda cambiar un usuario,
con una breve lista de denegación reservada exclusivamente para personas: `$include`, `auth.*`, `env.*`, `models.*`
y `secrets.*` continúan rechazándose porque contienen material de credenciales,
inclusión de configuraciones alternativas o las definiciones de proveedores/catálogos que alimentan
el enrutamiento de inferencia. El propio enrutamiento de inferencia también está protegido: se
rechazan las rutas del modelo predeterminado (campos de modelo/parámetros/entorno de ejecución de `agents.defaults`) y los campos de enrutamiento
del agente que respalda la ruta predeterminada activa, al igual que los campos de
identidad/topología del agente (`id`, `agentDir`, `default`). Los campos de enrutamiento de
otros agentes siguen siendo modificables previa aprobación. La autenticación del Gateway y de los canales sigue siendo
una superficie de configuración normal. Use `set default model <provider/model>` para una
ruta ya configurada; la prueba en vivo antes de guardarla. Para
configurar o reparar el acceso al proveedor o la autenticación, salga de OpenClaw y ejecute
`openclaw onboard`.

Las escrituras de `plugins.entries.<id>.*` (activación/desactivación/configuración de plugins instalados)
están permitidas salvo que ese plugin respalde la ruta de inferencia activa. Las
fuentes de instalación y la política de carga de plugins mantienen su límite de confianza en el flujo de trabajo
tipado de instalación de plugins. La desinstalación del plugin que respalda la ruta se
rechaza por el mismo motivo; salga de OpenClaw y ejecute
`openclaw plugins uninstall <id>` desde un terminal.

La aprobación se expresa con palabras propias: las respuestas inequívocas («sí», «claro», «adelante», «ahora no») se resuelven a partir de una lista cerrada y determinista. Cuando la ruta configurada admite una llamada de finalización independiente, las demás respuestas pueden clasificarse usando únicamente el mensaje y la propuesta pendiente, nunca mediante el propio modelo de conversación, que no puede autoaprobarse. Las respuestas no clasificadas o ambiguas mantienen pendiente la propuesta y la conversación vuelve a preguntar.

### Historial de cambios

La página Ask OpenClaw puede mostrar las operaciones recientes aplicadas por el agente de sistema, las migraciones de Doctor, las escrituras de configuración realizadas desde Ajustes y la CLI, y las ediciones manuales de
`openclaw.json`. El diario de configuración detecta las ediciones externas mientras el Gateway
está supervisando, durante una escritura propiedad de OpenClaw o en el siguiente inicio después de una
edición sin conexión.

El historial se almacena en la tabla `diagnostic_events` de la base de datos
compartida `~/.openclaw/state/openclaw.sqlite`, bajo los ámbitos `system-agent-audit`
y `config-audit`. Cada ámbito conserva sus 50,000 registros más recientes.
Las operaciones de descubrimiento y solo lectura no se incluyen. Los secretos nunca aparecen en
el historial de cambios; los registros del diario de configuración contienen las rutas modificadas en lugar de los valores de
configuración, y la comparación de valores utiliza huellas digitales protegidas.

La configuración de canales puede ejecutarse como una conversación alojada hasta que llega a un secreto. La
TUI local de OpenClaw no acepta respuestas sensibles del asistente porque la entrada del
chat del terminal es visible. Ofrece `open channel wizard` inmediatamente, trasladando
el canal seleccionado al asistente de terminal con entrada enmascarada; también se puede ejecutar
`openclaw channels add --channel <channel>` más adelante.

### Cambio a la configuración enmascarada de canales

El chat local puede transferir el control al asistente de canales con entrada enmascarada:

```text
abrir asistente de canal para slack
información del canal slack
```

`open channel wizard for <channel>` abre la configuración de canales con entrada enmascarada después de que se cierre la
TUI del chat. Use primero `channel info <channel>` para consultar la etiqueta del canal, el estado de
configuración, el resumen de requisitos previos y el enlace a la documentación.

OpenClaw nunca cambia el acceso al proveedor o la autenticación desde su propia sesión: la
sesión ya depende de esa ruta de inferencia. Para configurar o
reparar el proveedor del modelo, `configure model provider` devuelve indicaciones para salir y ejecutar la incorporación sin
iniciar un asistente ni escribir la configuración. Salga de OpenClaw y ejecute `openclaw
onboard`; la incorporación prepara las credenciales y guarda únicamente una ruta que
complete un turno real en vivo. Vuelva a iniciar OpenClaw cuando la incorporación finalice correctamente.

## Arranque de la configuración

`setup` configura el resto del estado del espacio de trabajo y del Gateway después de que la incorporación guiada ya haya establecido la inferencia. Solo escribe mediante operaciones de configuración tipadas y solicita aprobación previamente.

```text
configuración
configurar espacio de trabajo ~/Projects/work
```

`setup` conserva el modelo efectivo verificado. No configura ni
sustituye la inferencia.

Si falta la inferencia o falla su comprobación en vivo, salga de OpenClaw y ejecute `openclaw onboard`. La incorporación guiada prueba primero el modelo configurado y, después, las CLI de suscripción autenticadas, las claves de API y las demás CLI compatibles; solicita una respuesta real a cada opción candidata y solo conserva una ruta que supere la prueba. OpenClaw se inicia inmediatamente después de ese límite y puede configurar entonces el espacio de trabajo, el Gateway, los canales, los agentes, los plugins y otras funciones opcionales.

La aplicación de macOS omite por completo esta secuencia cuando llega a un Gateway configurado
cuyo agente predeterminado ya tiene un modelo configurado; abre la interfaz normal del agente.
Para un Gateway nuevo o incompleto, la aplicación controla la secuencia de inferencia mediante
los métodos del Gateway `openclaw.setup.detect` y `openclaw.setup.activate`:
la detección enumera todos los backends candidatos que encuentra; la activación prueba en vivo una
opción candidata (una finalización real que debe «responder con OK») y solo conserva el modelo,
la credencial y el estado del proveedor/entorno de ejecución necesarios para esa ruta después de que la prueba sea satisfactoria. Los valores predeterminados del espacio de trabajo y del Gateway quedan para OpenClaw. Una opción candidata fallida
nunca cambia la configuración; la aplicación recorre automáticamente la secuencia y finalmente
ofrece un paso manual de clave/token rellenado a partir de los plugins de proveedores de
inferencia de texto activos del Gateway. El proveedor seleccionado controla su modelo
inicial y su configuración, y la credencial se verifica del mismo modo antes de guardarse.

La supervisión de Codex y otras funciones opcionales de plugins permanecen fuera de esta
transacción de activación de inferencia. Configúrelas únicamente después de que la inferencia
funcione y OpenClaw se haya iniciado; la política de plugins existente y las exclusiones explícitas
de supervisión permanecen intactas durante la configuración de la inferencia.

## Conversación mediante IA

La conversación libre de OpenClaw interactivo se ejecuta mediante el mismo bucle de agente que los agentes normales de OpenClaw y está restringida a una única herramienta de autoridad de nivel cero de OpenClaw, `openclaw`, que encapsula las operaciones tipadas. Las acciones de lectura se ejecutan libremente; las modificaciones requieren aprobación conversacional para esa operación exacta (consulte Operaciones y aprobación), y cada escritura aplicada se audita y vuelve a validar. La sesión del agente persiste, por lo que OpenClaw dispone de memoria real entre varios turnos. Si la ruta de inferencia verificada deja de funcionar posteriormente, vuelva a `openclaw onboard` y repárela antes de continuar.

El host no convierte las solicitudes en lenguaje natural en operaciones. Los mensajes de
formato libre —incluidos los textos que parecen comandos y preguntas como «¿por qué se detuvo mi
gateway?»— se envían a la IA, que puede asignar la solicitud a una operación tipada
mediante la herramienta `openclaw`.

Cuando hay una mutación pendiente, solo se resuelven sin inferencia las frases inequívocas de aprobación o rechazo incluidas en una
lista cerrada. El consentimiento ambiguo se envía a una
llamada de finalización configurada por separado y, en caso contrario, se rechaza de forma segura. Los campos estructurados
del asistente y la navegación exacta por el host son controles de la interfaz de usuario, no análisis de operaciones en lenguaje
natural. Una excepción de higiene de secretos es especialmente importante: un
`config set` exacto en una ruta confidencial (tokens, claves, contraseñas) nunca llega
a un modelo. El host crea una propuesta redactada y el valor se enmascara en el
historial visible para la IA. Se recomienda `config set-ref <path> env <ENV_VAR>` para los secretos.

El modo de rescate del canal de mensajes nunca utiliza el planificador asistido por el modelo. El rescate remoto se mantiene determinista para que una ruta normal del agente, averiada o comprometida, no pueda utilizarse como editor de configuración.

### Modelo de confianza del arnés de la CLI

Los entornos de ejecución integrados y el arnés del servidor de aplicaciones de Codex aplican directamente la
restricción de nivel cero: la ejecución lleva una lista de herramientas permitidas de OpenClaw que contiene únicamente
la herramienta `openclaw`. Para Codex, OpenClaw también desactiva los entornos, la ejecución
nativa, la funcionalidad multiagente, los objetivos, las aplicaciones/plugins, las Skills/MCP, la búsqueda web y las
superficies `request_user_input` para esa ejecución. Codex sigue inyectando su utilidad nativa inerte `update_plan`;
esta puede actualizar la lista de comprobación temporal del modelo, pero no puede escribir archivos
ni modificar la configuración de OpenClaw. Los arneses de la CLI no consumen la lista de permitidos de OpenClaw,
por lo que OpenClaw solo admite backends cuyo propio contrato de selección de herramientas pueda demostrar
la misma restricción:

- Los backends seleccionables, incluido Claude Code, se inician con una selección vacía de herramientas
  nativas y una herramienta MCP, `openclaw`. La configuración MCP generada por Claude se
  aplica con `--strict-mcp-config`, por lo que no se carga ningún otro servidor MCP.
- Los backends que declaran no tener herramientas nativas reciben el mismo servidor MCP
  dedicado de OpenClaw.
- Los backends con herramientas nativas siempre activas o desconocidas se rechazan de forma segura antes de la inferencia;
  no pueden alojar una sesión de OpenClaw.

Solo las sesiones de OpenClaw reciben el servidor MCP de openclaw; las ejecuciones normales del agente
nunca ven esta herramienta. Por tanto, los backends de CLI seleccionables o sin herramientas nativas y los modelos
con clave de API aplican el bucle literal de una sola herramienta. Los modelos del servidor de aplicaciones de Codex aplican
una única herramienta de autoridad de OpenClaw más la utilidad nativa inerte de planificación. En los
tres casos, las escrituras de configuración permanecen limitadas al contrato auditado de aprobación
de OpenClaw.

Gemini CLI sigue estando disponible para los agentes normales, pero no puede aplicar la
sonda sin herramientas exigida por la barrera de inferencia, por lo que no puede alojar OpenClaw.

## Cambio a un agente

Utilice un selector en lenguaje natural para salir de OpenClaw y abrir la TUI normal:

```text
hablar con el agente
hablar con el agente de trabajo
cambiar al agente principal
```

`openclaw tui`, `openclaw chat` y `openclaw terminal` abren directamente la TUI normal del agente; no inician OpenClaw. Después de cambiar a la TUI normal, `/openclaw` vuelve a OpenClaw, opcionalmente con una solicitud de seguimiento:

```text
/openclaw
/openclaw reiniciar gateway
```

## Modo de rescate de mensajes

El modo de rescate de mensajes es el punto de entrada de OpenClaw mediante el canal de mensajes: utilícelo cuando el agente normal no funcione, pero un canal de confianza (por ejemplo, WhatsApp) siga recibiendo comandos.

Se trata de un controlador determinista de comandos de emergencia, no del agente
conversacional de OpenClaw. No inicializa una configuración nueva ni relaja la barrera de
inferencia para el chat de OpenClaw.

Comando compatible: `/openclaw <request>`. El rescate solo acepta la gramática exacta de comandos escritos: el lenguaje natural se rechaza con una indicación, nunca se interpreta por conjetura como una operación y nunca se consulta ningún modelo.

```text
Usted, en un MD de propietario de confianza: /openclaw status
OpenClaw: Modo de rescate de OpenClaw. Gateway accesible: no. Configuración válida: no.
Usted: /openclaw restart gateway
OpenClaw: Plan: reiniciar el Gateway. Responda /openclaw yes para aplicar.
Usted: /openclaw yes
OpenClaw: Aplicado. Entrada de auditoría escrita.
```

La creación de agentes también puede ponerse en cola localmente o mediante el rescate:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.6-sol
/openclaw create agent work workspace ~/Projects/work
```

La creación de agentes solo puede especificar el modelo predeterminado actual verificado en vivo. Omita el
modelo para heredar esa ruta.

El rescate remoto es una superficie de administración y debe tratarse como una reparación remota de la configuración, no como un chat normal.

Contrato de seguridad para el rescate remoto:

- Se desactiva cuando el aislamiento está activo para el agente o la sesión; OpenClaw rechaza el rescate remoto y remite a la reparación mediante la CLI local.
- El estado efectivo predeterminado es `auto`: se permite el rescate remoto únicamente en una operación YOLO de confianza, donde el entorno de ejecución ya dispone de autoridad local sin aislamiento (`tools.exec.security` se resuelve como `full` y `tools.exec.ask` se resuelve como `off`, con el modo de aislamiento `off`).
- Requiere una identidad explícita del propietario; no se permiten reglas de remitente comodín, políticas de grupo abiertas, Webhooks sin autenticar ni canales anónimos.
- El rescate se limita a los MD del propietario.
- La búsqueda y la enumeración de plugins son de solo lectura. La instalación de plugins siempre es exclusivamente local (está bloqueada en el rescate, incluso cuando está habilitada de otro modo) porque descarga código ejecutable. La desinstalación de plugins se rechaza tanto en OpenClaw local como en el rescate; ejecute `openclaw plugins uninstall <id>` desde un terminal.
- El rescate remoto no puede abrir la TUI local ni cambiar a una sesión interactiva del agente; utilice `openclaw` localmente para transferir el control al agente.
- Las escrituras persistentes siguen requiriendo aprobación, incluso en el modo de rescate.
- Las aprobaciones pendientes solo pueden utilizarse una vez. Cualquier comando de rescate más reciente para la misma cuenta, canal y remitente revoca el plan anterior; una ejecución fallida también consume la aprobación, por lo que se debe volver a enviar el comando para reintentarlo.
- Se audita cada operación de rescate aplicada. El rescate mediante el canal de mensajes registra los metadatos del canal, la cuenta, el remitente y la dirección de origen; las operaciones que modifican la configuración también registran los hashes de configuración anteriores y posteriores.
- Los secretos nunca se muestran. La inspección de SecretRef informa de su disponibilidad, no de sus valores.
- Si el Gateway está activo, el rescate da prioridad a las operaciones tipadas del Gateway; si está inactivo, el rescate solo utiliza la superficie mínima de reparación local que no depende del bucle normal del agente.

La política de rescate está integrada: solo está disponible cuando el entorno de ejecución efectivo es
YOLO, el aislamiento está desactivado y la solicitud es un MD del propietario. Las aprobaciones de escritura pendientes
caducan después de 15 minutos. `openclaw doctor --fix` elimina los bloques de configuración retirados
`systemAgent` y `crestodian`.

El rescate remoto está cubierto por la fase de Docker:

```bash
pnpm test:docker:system-agent-rescue
```

Una prueba rápida opcional en vivo de la superficie de comandos del canal comprueba `/openclaw status`, además de un ciclo completo de aprobación persistente mediante el controlador de rescate:

```bash
pnpm test:live:system-agent-rescue-channel
```

La configuración empaquetada de una sola ejecución protegida por la barrera de inferencia está cubierta por:

```bash
pnpm test:docker:system-agent-first-run
```

Esa fase de la CLI empaquetada comienza con un directorio de estado vacío y demuestra que OpenClaw
se rechaza de forma segura sin inferencia. A continuación, prueba y activa un Claude simulado mediante
el módulo de activación empaquetado. Solo entonces una solicitud aproximada llega al
planificador y se resuelve como una configuración tipada, seguida de comandos de una sola ejecución que crean un
agente adicional, configuran Discord mediante la habilitación de un plugin más un
SecretRef de token, validan la configuración y comprueban el registro de auditoría. Esta fase aporta
evidencia sobre la barrera y las operaciones; no ejecuta la incorporación interactiva ni la
conversación entre el agente de OpenClaw, las herramientas y las aprobaciones. El escenario de QA Lab que aparece a continuación redirige
a la misma fase de Docker:

```bash
pnpm openclaw qa suite --scenario system-agent-ring-zero-setup
```

## Contenido relacionado

- [Referencia de la CLI](/es/cli)
- [Doctor](/es/cli/doctor)
- [TUI](/es/cli/tui)
- [Aislamiento](/es/cli/sandbox)
- [Seguridad](/es/cli/security)
