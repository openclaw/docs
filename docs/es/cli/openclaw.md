---
read_when:
    - Ha finalizado la configuración de inferencia y desea que OpenClaw configure el resto
    - Necesita inspeccionar o reparar OpenClaw con el agente de configuración local
    - Se está diseñando o habilitando el modo de rescate del canal de mensajes
summary: Referencia de la CLI y modelo de seguridad del asistente de configuración y reparación de OpenClaw basado en inferencia
title: Agente de configuración de OpenClaw
x-i18n:
    generated_at: "2026-07-16T11:35:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4cf52eeaf14dd2e2bc388c69a1566d4956d42d27cd28cd74b3f1fbee5a2b2e5f
    source_path: cli/openclaw.md
    workflow: 16
---

# `openclaw setup`

OpenClaw incluye un agente del sistema integrado —se presenta como "OpenClaw"— para la configuración, reparación y parametrización locales (anteriormente denominado Crestodian). Solo se inicia después de que el modelo predeterminado efectivo complete una interacción real.
Las instalaciones nuevas establecen primero la inferencia; las configuraciones con formato incorrecto permanecen en la ruta clásica de diagnóstico.

## Cuándo se inicia

Al ejecutar `openclaw` sin ningún subcomando, el enrutamiento depende del estado de la configuración:

- Falta la configuración o existe sin ajustes definidos (vacía o solo con las claves `$schema`/`meta`): inicia la incorporación guiada con verificación de IA en vivo.
- La configuración existe, pero no supera la validación: inicia la incorporación clásica, que informa de los problemas y remite a `openclaw doctor`.
- La configuración existe y es válida: abre la TUI normal del agente. Un Gateway configurado y accesible cuyo agente predeterminado tenga un modelo accede directamente a esa interfaz
  sin pasar por la incorporación ni por OpenClaw. Use `/openclaw` dentro de la TUI o ejecute
  `openclaw setup` directamente para acceder a OpenClaw más adelante.

Al ejecutar `openclaw setup`, primero se prueba en vivo el modelo predeterminado configurado. Si la interacción se completa correctamente, se inicia OpenClaw. Si se produce un fallo interactivo, se abre la configuración guiada de inferencia y se transfiere el control a OpenClaw después de que un candidato supere la prueba. Las solicitudes de una sola ejecución, JSON y otras solicitudes no interactivas fallan con instrucciones para ejecutar `openclaw onboard` cuando la inferencia no está disponible. `openclaw --help` y `openclaw --version` conservan sus rutas rápidas habituales.

La ejecución no interactiva de `openclaw` sin argumentos (sin TTY) termina con un mensaje breve en lugar de mostrar la ayuda raíz: remite a la incorporación no interactiva en una instalación nueva o no válida, o a `openclaw agent --local ...` cuando la configuración es válida.

`openclaw onboard --modern` sigue siendo un alias de compatibilidad para OpenClaw, pero utiliza la misma comprobación de inferencia: si la inferencia funciona, abre el chat; los fallos interactivos inician la configuración guiada de inferencia, y los fallos no interactivos terminan con indicaciones para la incorporación. `openclaw onboard --classic` abre el asistente completo paso a paso.

## Qué muestra OpenClaw

OpenClaw interactivo abre el mismo entorno de TUI que `openclaw tui`, con un backend de chat de OpenClaw. El saludo inicial incluye:

- la validez de la configuración y el agente predeterminado
- el modelo verificado que utiliza OpenClaw
- la accesibilidad del Gateway desde la primera comprobación de inicio
- la siguiente acción de depuración recomendada

No muestra secretos ni carga comandos CLI de plugins solo para iniciarse.

Use `status` para consultar el inventario detallado: ruta de configuración, rutas de la documentación y del código fuente, comprobaciones de la CLI local, presencia de claves o tokens, agentes, modelo y detalles del Gateway.

OpenClaw utiliza el mismo descubrimiento de referencias que los agentes normales: en un checkout de Git remite a `docs/` local y al árbol de código fuente; en una instalación de npm utiliza la documentación incluida y enlaza a [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), con la recomendación de consultar el código fuente cuando la documentación no sea suficiente.

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
diagnóstico
validar configuración
configurar
configurar espacio de trabajo ~/Projects/work
establecer configuración gateway.port 19001
establecer referencia de configuración gateway.auth.token env OPENCLAW_GATEWAY_TOKEN
estado del gateway
reiniciar gateway
agentes
crear agente work espacio de trabajo ~/Projects/work
modelos
configurar proveedor de modelos
establecer modelo predeterminado openai/gpt-5.6
canales
información del canal slack
conectar slack
abrir asistente de canal para slack
listar plugins
buscar plugins de slack
instalar plugin clawhub:openclaw-codex-app-server
hablar con el agente work
hablar con el agente de ~/Projects/work
auditoría
salir
```

## Operaciones y aprobación

OpenClaw utiliza operaciones tipadas en lugar de editar la configuración de manera ad hoc.

Las operaciones de solo lectura se ejecutan inmediatamente: mostrar el resumen, enumerar agentes, enumerar plugins instalados, buscar plugins de ClawHub, mostrar el estado del modelo o backend, ejecutar comprobaciones de estado/salud, comprobar la accesibilidad del Gateway, ejecutar el diagnóstico sin correcciones interactivas, validar la configuración y mostrar la ruta del registro de auditoría.

El inicio de la configuración guiada de canales (`connect telegram`) también se ejecuta inmediatamente. Su asistente recopila respuestas explícitas y gestiona las escrituras resultantes.

Las operaciones persistentes requieren aprobación mediante la conversación (o `--yes` para un comando directo): escribir la configuración, `config set`, `config set-ref`, inicializar la configuración o incorporación, cambiar el modelo predeterminado, iniciar/detener/reiniciar el Gateway, crear agentes e instalar plugins.

Las reparaciones de diagnóstico no están disponibles dentro de OpenClaw porque pueden reescribir el proveedor, la autenticación o la ruta de inferencia del agente predeterminado que sustenta la sesión. Salga de OpenClaw y ejecute `openclaw doctor --fix` en un terminal. `doctor` de solo lectura sigue estando disponible dentro de OpenClaw.

Los agentes nuevos heredan la ruta de inferencia predeterminada verificada en vivo. Los identificadores de agente `openclaw` y `crestodian` están reservados para el agente del sistema y no se pueden crear como agentes normales. El identificador retirado sigue bloqueado para impedir que una configuración antigua lo reclame.

`config set` y `config set-ref` no pueden cambiar el estado de la ruta de inferencia,
incluidas las credenciales del proveedor de inferencia, `auth.*` de nivel superior, los catálogos de modelos,
los backends de CLI, las rutas de modelos predeterminadas o por agente, los parámetros o herramientas de agentes, ni
`tools.*` raíz. También se rechazan las escrituras directas en `env.*`, `secrets.*`, `plugins.*` y `$include`
porque pueden sustituir la resolución de credenciales o la activación de proveedores. La autenticación del Gateway y de los canales sigue siendo una superficie de configuración normal. Use los flujos de trabajo tipados de plugins y canales, y
`set default model <provider/model>` para una ruta ya
configurada; se prueba la ruta en vivo antes de guardarla. Para configurar o
reparar el acceso del proveedor o de autenticación, salga de OpenClaw y ejecute `openclaw onboard`.

La desinstalación de plugins se rechaza dentro de OpenClaw porque eliminar un
plugin de proveedor podría desactivar la ruta de inferencia que sustenta la sesión. Salga de OpenClaw
y ejecute `openclaw plugins uninstall <id>` desde un terminal.

La aprobación se expresa con sus propias palabras: las respuestas inequívocas ("sí", "claro", "adelante", "ahora no") se resuelven mediante una lista cerrada y determinista. Cuando la ruta configurada admite una llamada de finalización independiente, otras respuestas pueden clasificarse utilizando únicamente su mensaje y la propuesta pendiente, nunca mediante el propio modelo de conversación, que no puede autoaprobarse. Las respuestas no clasificadas o ambiguas mantienen pendiente la propuesta y la conversación vuelve a solicitar confirmación.

Las escrituras aplicadas se registran en `~/.openclaw/audit/system-agent.jsonl`. El descubrimiento no se audita; solo se auditan las operaciones aplicadas y las escrituras.

La configuración de canales puede ejecutarse como una conversación alojada hasta que se necesita un secreto. La
TUI local de OpenClaw no acepta respuestas confidenciales del asistente porque la entrada del
chat del terminal es visible. Ofrece `open channel wizard` inmediatamente y transfiere
el canal seleccionado al asistente de terminal con entrada oculta; también se puede ejecutar
`openclaw channels add --channel <channel>` más adelante.

### Cambio a la configuración de canales con entrada oculta

El chat local puede transferir el control al asistente de canales con entrada oculta:

```text
abrir asistente de canal para slack
información del canal slack
```

`open channel wizard for <channel>` abre la configuración de canales con entrada oculta después de que se cierre la
TUI del chat. Use primero `channel info <channel>` para consultar la etiqueta del canal, el estado de configuración,
el resumen de requisitos previos y el enlace a la documentación.

OpenClaw nunca cambia el acceso del proveedor o de autenticación desde su propia sesión: la
sesión ya depende de esa ruta de inferencia. Para configurar o
reparar el proveedor de modelos, `configure model provider` devuelve indicaciones para salir o iniciar la incorporación sin
iniciar un asistente ni escribir la configuración. Salga de OpenClaw y ejecute `openclaw
onboard`; la incorporación prepara las credenciales y guarda únicamente una ruta que
complete una interacción real en vivo. Vuelva a iniciar OpenClaw después de que la incorporación finalice correctamente.

## Inicialización de la configuración

`setup` configura el estado restante del espacio de trabajo y del Gateway después de que la incorporación guiada ya haya establecido la inferencia. Solo escribe mediante operaciones de configuración tipadas y solicita primero la aprobación.

```text
configurar
configurar espacio de trabajo ~/Projects/work
```

`setup` conserva el modelo efectivo verificado. No configura ni
sustituye la inferencia.

Si falta la inferencia o falla su comprobación en vivo, salga de OpenClaw y ejecute `openclaw onboard`. La incorporación guiada detecta los modelos configurados, las claves de API y las CLI locales autenticadas, solicita una respuesta real a cada candidato y conserva únicamente una ruta que supere la prueba. OpenClaw se inicia inmediatamente después de ese límite y puede configurar entonces el espacio de trabajo, el Gateway, los canales, los agentes, los plugins y otras funciones opcionales.

La aplicación de macOS omite por completo esta secuencia cuando accede a un Gateway configurado
cuyo agente predeterminado ya tiene un modelo configurado; abre la interfaz normal del
agente.
Para un Gateway nuevo o incompleto, la aplicación gestiona la secuencia de inferencia mediante
los métodos `openclaw.setup.detect` y `openclaw.setup.activate` del Gateway:
la detección enumera todos los backends candidatos que encuentra; la activación prueba en vivo un
candidato (una finalización real de "responder con OK") y solo conserva el modelo,
la credencial y el estado del proveedor o entorno de ejecución necesarios para esa ruta después de que la prueba se complete correctamente. Los valores predeterminados del espacio de trabajo y del Gateway quedan a cargo de OpenClaw. Un candidato que falla
nunca modifica la configuración; la aplicación recorre automáticamente la secuencia y finalmente
ofrece un paso manual de clave o token, rellenado a partir de los plugins de proveedores de
inferencia de texto activos del Gateway. El proveedor seleccionado es responsable de su modelo
inicial y su configuración, y la credencial se verifica de la misma manera antes de guardarse.

La supervisión de Codex y otras funciones opcionales de plugins quedan fuera de esta
transacción de activación de inferencia. Configúrelas únicamente después de que la inferencia
funcione y OpenClaw se haya iniciado; las políticas de plugins existentes y las exclusiones
explícitas de supervisión permanecen intactas durante la configuración de la inferencia.

## Conversación con IA

La conversación libre de OpenClaw interactivo se ejecuta mediante el mismo bucle de agente que los agentes normales de OpenClaw, restringido a una única herramienta de autoridad de nivel cero de OpenClaw, `openclaw`, que encapsula las operaciones tipadas. Las acciones de lectura se ejecutan libremente; las mutaciones requieren aprobación mediante la conversación para esa operación exacta (consulte Operaciones y aprobación), y cada escritura aplicada se audita y se vuelve a validar. La sesión del agente persiste, por lo que OpenClaw dispone de memoria real entre múltiples interacciones. Si la ruta de inferencia verificada deja de funcionar posteriormente, vuelva a `openclaw onboard` y repárela antes de continuar.

El host no analiza las solicitudes en lenguaje natural para convertirlas en operaciones. Los mensajes de formato libre,
incluido el texto que parece un comando y preguntas como "¿por qué se detuvo mi
gateway?", se envían a la IA, que puede asignar la solicitud a una operación tipada
mediante la herramienta `openclaw`.

Cuando hay una mutación pendiente, solo las frases inequívocas de aprobación o rechazo de una
lista cerrada se resuelven sin inferencia. El consentimiento ambiguo se envía a una
llamada de finalización configurada por separado y, de lo contrario, se rechaza de forma segura. Los campos estructurados
del asistente y la navegación exacta del host son controles de la interfaz de usuario, no análisis de operaciones
en lenguaje natural. Una excepción relativa a la protección de secretos es especialmente importante: un
`config set` exacto en una ruta confidencial (tokens, claves o contraseñas) nunca llega
a un modelo. El host crea una propuesta censurada y el valor se oculta en el
historial visible para la IA. Se recomienda `config set-ref <path> env <ENV_VAR>` para los secretos.

El modo de recuperación mediante canales de mensajes nunca utiliza el planificador asistido por el modelo. La recuperación remota permanece determinista para impedir que una ruta normal de agente averiada o comprometida se utilice como editor de configuración.

### Modelo de confianza del entorno de pruebas de la CLI

Los entornos de ejecución integrados y el arnés del servidor de aplicaciones de Codex aplican directamente la
restricción de nivel cero: la ejecución lleva una lista de herramientas permitidas de OpenClaw que contiene únicamente
la herramienta `openclaw`. Para Codex, OpenClaw también deshabilita los entornos, la ejecución
nativa, los múltiples agentes, los objetivos, las aplicaciones/plugins, las Skills/MCP, la búsqueda web y las
superficies `request_user_input` para esa ejecución. Codex sigue inyectando su utilidad nativa inerte `update_plan`;
puede actualizar la lista de comprobación temporal del modelo, pero no puede escribir archivos
ni la configuración de OpenClaw. Los arneses de CLI no utilizan la lista de permitidos de OpenClaw,
por lo que OpenClaw solo admite backends cuyo propio contrato de selección de herramientas pueda demostrar
la misma restricción:

- Los backends seleccionables, incluido Claude Code, se inician con una selección vacía de herramientas
  nativas y una herramienta MCP, `openclaw`. La configuración MCP generada de Claude se
  aplica con `--strict-mcp-config`, por lo que no se carga ningún otro servidor MCP.
- Los backends que declaran no tener herramientas nativas reciben el mismo servidor MCP
  dedicado de OpenClaw.
- Los backends con herramientas nativas siempre activas o desconocidas se cierran de forma segura antes de la inferencia;
  no pueden alojar una sesión de OpenClaw.

Solo las sesiones de OpenClaw obtienen el servidor MCP de openclaw; las ejecuciones normales del agente
nunca ven esta herramienta. Por tanto, los backends de CLI seleccionables o sin herramientas nativas y los modelos
con clave de API aplican el bucle literal de una sola herramienta. Los modelos del servidor de aplicaciones de Codex aplican
una única herramienta de autoridad de OpenClaw más la utilidad nativa inerte de planificación. En los
tres casos, las escrituras de configuración permanecen limitadas al contrato de aprobación auditado
de OpenClaw.

Gemini CLI sigue disponible para los agentes normales, pero no puede aplicar la
comprobación sin herramientas exigida por la puerta de inferencia, por lo que no puede alojar OpenClaw.

## Cambiar a un agente

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

El modo de rescate de mensajes es el punto de entrada de OpenClaw para los canales de mensajes: utilícelo cuando el agente normal no funcione, pero un canal de confianza (por ejemplo, WhatsApp) aún reciba comandos.

Se trata de un controlador determinista de comandos de emergencia, no del agente
conversacional de OpenClaw. No inicia una configuración nueva ni relaja la puerta de
inferencia para el chat de OpenClaw.

Comando compatible: `/openclaw <request>`. El rescate solo acepta la gramática exacta del comando escrito: el lenguaje natural se rechaza con una indicación, nunca se interpreta como una operación y nunca se consulta ningún modelo.

```text
Usted, en un MD de propietario de confianza: /openclaw status
OpenClaw: Modo de rescate de OpenClaw. Gateway accesible: no. Configuración válida: no.
Usted: /openclaw restart gateway
OpenClaw: Plan: reiniciar el Gateway. Responda /openclaw yes para aplicarlo.
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

- Se deshabilita cuando el aislamiento está activo para el agente o la sesión; OpenClaw rechaza el rescate remoto e indica que se use la reparación mediante la CLI local.
- El estado efectivo predeterminado es `auto`: permite el rescate remoto únicamente durante una operación YOLO de confianza, donde el entorno de ejecución ya tiene autoridad local sin aislamiento (`tools.exec.security` se resuelve como `full` y `tools.exec.ask` se resuelve como `off`, con el modo de aislamiento `off`).
- Requiere una identidad de propietario explícita; no se permiten reglas de remitentes comodín, políticas de grupos abiertos, Webhooks sin autenticar ni canales anónimos.
- De forma predeterminada, solo se permiten MD del propietario; el rescate en grupos o canales requiere una activación explícita.
- La búsqueda y la lista de plugins son de solo lectura. La instalación de plugins siempre es exclusivamente local (se bloquea en el rescate, aunque esté habilitada de otro modo) porque descarga código ejecutable. La desinstalación de plugins se rechaza tanto en OpenClaw local como en el rescate; ejecute `openclaw plugins uninstall <id>` desde un terminal.
- El rescate remoto no puede abrir la TUI local ni cambiar a una sesión interactiva del agente; utilice `openclaw` local para transferir el control al agente.
- Las escrituras persistentes siguen requiriendo aprobación, incluso en el modo de rescate.
- Las aprobaciones pendientes son de un solo uso. Cualquier comando de rescate más reciente para la misma cuenta, canal y remitente revoca el plan anterior; una ejecución fallida también consume la aprobación, por lo que debe volver a enviar el comando para reintentarlo.
- Todas las operaciones de rescate aplicadas se auditan. El rescate mediante canales de mensajes registra metadatos del canal, la cuenta, el remitente y la dirección de origen; las operaciones que modifican la configuración también registran los hashes de configuración anteriores y posteriores.
- Los secretos nunca se muestran. La inspección de SecretRef informa de la disponibilidad, no de los valores.
- Si el Gateway está activo, el rescate prefiere las operaciones tipadas del Gateway; si está inactivo, el rescate utiliza únicamente la superficie mínima de reparación local que no depende del bucle normal del agente.

Estructura de la configuración:

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

- `enabled`: `"auto"` (valor predeterminado) permite el rescate únicamente cuando el entorno de ejecución efectivo es YOLO y el aislamiento está desactivado; `false` nunca permite el rescate mediante canales de mensajes; `true` permite explícitamente el rescate cuando se cumplen las comprobaciones del propietario y del canal (sigue sujeto al rechazo por aislamiento).
- `ownerDmOnly`: restringe el rescate a los mensajes directos del propietario. Valor predeterminado: `true`.
- `pendingTtlMinutes`: cuánto tiempo permanece abierta una escritura de rescate pendiente para la aprobación `/openclaw yes` antes de caducar. Valor predeterminado: `15`.

`openclaw doctor --fix` migra el bloque de configuración heredado `crestodian` a
`systemAgent`. El entorno de ejecución solo lee el bloque canónico.

El rescate remoto está cubierto por la vía de Docker:

```bash
pnpm test:docker:system-agent-rescue
```

Una prueba rápida opcional de la superficie de comandos del canal en vivo comprueba `/openclaw status` junto con un recorrido completo de aprobación persistente mediante el controlador de rescate:

```bash
pnpm test:live:system-agent-rescue-channel
```

La configuración de una sola ejecución empaquetada y protegida por inferencia está cubierta por:

```bash
pnpm test:docker:system-agent-first-run
```

Esa vía de la CLI empaquetada comienza con un directorio de estado vacío y demuestra que OpenClaw
se cierra de forma segura sin inferencia. Después prueba y activa un Claude falso mediante
el módulo de activación empaquetado. Solo entonces una solicitud imprecisa llega al
planificador y se resuelve como una configuración tipada, seguida de comandos de una sola ejecución que crean un
agente adicional, configuran Discord mediante la habilitación de un plugin más un
SecretRef de token, validan la configuración y comprueban el registro de auditoría. Esta vía aporta
pruebas complementarias de la puerta y las operaciones; no ejercita la incorporación interactiva ni la
conversación del agente, las herramientas y las aprobaciones de OpenClaw. El siguiente escenario de QA Lab redirige
a la misma vía de Docker:

```bash
pnpm openclaw qa suite --scenario system-agent-ring-zero-setup
```

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Doctor](/es/cli/doctor)
- [TUI](/es/cli/tui)
- [Aislamiento](/es/cli/sandbox)
- [Seguridad](/es/cli/security)
