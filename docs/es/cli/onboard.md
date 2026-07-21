---
read_when:
    - Se desea establecer la inferencia y, a continuación, finalizar la configuración con OpenClaw
summary: Referencia de la CLI para `openclaw onboard` (incorporación interactiva)
title: Incorporación
x-i18n:
    generated_at: "2026-07-21T08:57:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 778fc7bc688ec5fd1304f2107306a92188cfdbb61f6e83e3935d03dd40224119
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Configuración guiada que establece primero la inferencia: detecta el acceso existente a IA,
requiere una finalización en vivo, conserva únicamente la ruta que funciona y, a continuación, inicia
OpenClaw para configurar el resto. `openclaw setup` accede a este flujo en sistemas
nuevos o siempre que haya una opción de incorporación; los sistemas configurados usan
`openclaw setup` sin argumentos para el chat con el agente del sistema. `openclaw setup --baseline` solo
escribe la configuración y el espacio de trabajo de referencia.

<CardGroup cols={2}>
  <Card title="Centro de incorporación de la CLI" href="/es/start/wizard" icon="rocket">
    Guía detallada del flujo interactivo de la CLI.
  </Card>
  <Card title="Descripción general de la incorporación" href="/es/start/onboarding-overview" icon="map">
    Cómo encajan entre sí los componentes de incorporación de OpenClaw.
  </Card>
  <Card title="Referencia de configuración de la CLI" href="/es/start/wizard-cli-reference" icon="book">
    Resultados, funcionamiento interno y comportamiento de cada paso.
  </Card>
  <Card title="Automatización de la CLI" href="/es/start/wizard-cli-automation" icon="terminal">
    Opciones no interactivas y configuraciones mediante scripts.
  </Card>
  <Card title="Incorporación de la aplicación para macOS" href="/es/start/onboarding" icon="apple">
    Flujo de incorporación para la aplicación de la barra de menús de macOS.
  </Card>
</CardGroup>

## Ejemplos

```bash
openclaw onboard
openclaw onboard --tui
openclaw onboard --classic
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --flow import
openclaw onboard --import-from hermes --import-source ~/.hermes
openclaw onboard --skip-bootstrap
openclaw onboard recommendations --json
openclaw onboard recommendations acknowledge
openclaw onboard recommendations acknowledge --retry "<failed-id>"
openclaw onboard recommendations refresh
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

`openclaw onboard recommendations` lee las coincidencias pendientes de recomendaciones de aplicaciones
almacenadas durante la incorporación. Añada `--json` para obtener la lista legible por máquinas que utiliza
la inicialización de la primera ejecución. El comando no vuelve a analizar las aplicaciones instaladas ni llama a un
modelo. Su salida contiene únicamente los identificadores de instalación validados, el origen y el nivel;
omite intencionadamente el texto no fiable del marketplace, los motivos del modelo y las etiquetas de aplicaciones
locales. Una vez respondida la oferta de recomendaciones, el comando devuelve
una lista vacía y las futuras ejecuciones de incorporación omiten el paso por completo.
`openclaw onboard recommendations refresh` borra la oferta almacenada para que la siguiente
ejecución de incorporación vuelva a analizar las aplicaciones instaladas y cree una nueva oferta.

Los espacios de trabajo nuevos posponen la elección de recomendaciones hasta la conversación de inicialización.
Una vez que esa conversación gestiona las elecciones de la persona usuaria,
`openclaw onboard recommendations acknowledge` marca la oferta almacenada como respondida.
La confirmación es idempotente. Si falla una instalación elegida, proporcione cada
identificador opaco fallido mediante `--retry <id...>`; las coincidencias correctas y rechazadas se consumen,
mientras que las fallidas permanecen pendientes para una ejecución posterior de la incorporación. Los identificadores
desconocidos producen un error sin modificar la oferta almacenada. Tras una instalación interrumpida de una
Skill de ClawHub, un destino existente solo se considera correcto cuando
`openclaw skills verify "@owner/slug"` se ejecuta correctamente para el mismo
identificador de recomendación calificado por el editor y su salida JSON indica
`openclaw.resolution.source: "installed"`. La verificación del registro por sí sola no
demuestra una instalación local. De lo contrario, mantenga ese identificador pendiente con `--retry` y no
sobrescriba la Skill existente.

- `--classic`: abre el asistente completo paso a paso. No se puede combinar con
  `--non-interactive`; omita `--classic` para la configuración automatizada.
- `--flow quickstart`: abre el asistente clásico con un número mínimo de solicitudes y
  genera automáticamente un token del Gateway.
- `--flow manual` (alias `advanced`): abre el asistente clásico con todas las solicitudes
  de puerto, enlace y autenticación.
- `--flow import`: ejecuta un proveedor de migración detectado (por ejemplo, Hermes mediante `--import-from hermes`), muestra una vista previa del plan y lo aplica tras la confirmación. Cuando una importación interactiva proporciona un modelo predeterminado, la incorporación exige que esa ruta complete correctamente una finalización en vivo antes de omitir la configuración del proveedor; una ruta importada que falle vuelve a la configuración del proveedor. La importación solo se ejecuta sobre una configuración nueva de OpenClaw; primero restablezca la configuración, las credenciales, las sesiones y el estado del espacio de trabajo si ya existe alguno. Use [`openclaw migrate`](/es/cli/migrate) para planes de simulación, el modo de sobrescritura, informes y asignaciones exactas.
- `--remote-url` y `--remote-token`: rellenan previamente el paso del Gateway remoto del asistente clásico y reemplazan los valores remotos almacenados durante esta ejecución. Cambiar la URL no reutiliza las credenciales almacenadas, salvo que también se proporcione un token. El token permanece oculto en las solicitudes y sigue la opción existente del asistente de almacenarlo como texto sin formato o como SecretRef.
- `--tailscale-reset-on-exit` y `--no-tailscale-reset-on-exit`: controlan explícitamente si la configuración de Tailscale Serve o Funnel se restablece cuando el Gateway termina. Omitir ambos conserva el ajuste actual durante las nuevas ejecuciones no interactivas.
- `--modern` es un alias de compatibilidad para el asistente de configuración
  conversacional de OpenClaw. Usa la misma barrera de inferencia en vivo que `openclaw setup` y
  solo acepta `--workspace`, `--accept-risk`,
  `--non-interactive` y `--json`. Las demás opciones de configuración se rechazan en lugar de
  ignorarse silenciosamente.

## Flujo guiado

`openclaw onboard` sin opciones inicia el flujo guiado. Muestra el aviso de seguridad
y, a continuación, plantea una pregunta inicial: **acceso completo** (recomendado: la configuración busca
automáticamente aplicaciones de IA, claves y entornos de ejecución locales) o **preguntar primero** (la configuración
pide permiso una vez antes de buscar o permite configurar manualmente). La
elección se conserva como `wizard.accessMode`. Cuando se permite la detección, la incorporación
detecta el acceso a IA ya disponible mediante modelos configurados, variables de entorno
de claves de API y CLI locales compatibles; después, prueba el candidato recomendado
con una finalización real. Si un candidato falla, la incorporación prueba discretamente
el siguiente que pueda utilizarse y resume en una sola línea todo lo que no respondió;
la ruta que funciona se anuncia con una opción de una sola tecla para ver todas las demás.

Si se agota la detección automática, el selector de proveedores muestra primero OpenAI,
Anthropic, xAI (Grok), Google y OpenRouter. Elija **Más…** para ver todos los
demás proveedores compatibles, agrupados por proveedor; las regiones, los planes y los métodos de autenticación
aparecen después en un segundo menú. Los inicios de sesión compatibles mediante navegador o dispositivo y los métodos
con clave de API o token ocultos usan la misma ruta de finalización en vivo. OpenClaw conserva
únicamente la ruta del modelo verificada y su credencial una vez que la prueba se completa correctamente;
un candidato fallido no reemplaza el modelo configurado ni guarda la
credencial utilizada en el intento. Elija **Omitir por ahora** para salir sin iniciar OpenClaw y
vuelva a ejecutar `openclaw onboard` cuando esté listo. La configuración del espacio de trabajo y del Gateway permanece
sin cambios hasta que OpenClaw se inicia.

En el modo guiado, `--workspace <dir>` proporciona el espacio de trabajo propuesto por OpenClaw
y el contexto de inferencia aislado. No se conserva hasta que se aprueba la
propuesta de configuración de OpenClaw. La incorporación clásica y la no interactiva conservan su
espacio de trabajo mediante su flujo de configuración habitual. En una nueva ejecución con una lista de agentes
existente, la incorporación conserva el espacio de trabajo configurado de la flota: el asistente
clásico muestra ambas rutas y exige confirmación explícita antes de moverlo,
mientras que la configuración no interactiva muestra una advertencia y conserva el valor actual.

Una vez superada la inferencia, la incorporación busca memorias de herramientas de IA locales
compatibles: la memoria automática de Claude Code, las memorias consolidadas de Codex y los archivos de memoria
de Hermes. Cuando encuentra alguna, una página ofrece copiarlas al espacio de trabajo del agente,
en `memory/imports/`, para su recuperación indexada. No se importa nada sin
confirmación, se omiten los archivos importados previamente y siempre se pueden importar
más adelante desde la [página de importación de memoria](/es/web/control-ui) de la interfaz de control, que ofrece
el mismo alcance limitado a la memoria. (Una ejecución completa de [`openclaw migrate`](/es/cli/migrate) es
más amplia: también puede importar configuración, Skills y credenciales). El asistente
clásico muestra la misma página después de preparar el espacio de trabajo.

Una vez superada la inferencia (y tras la oferta de importación de memoria), la incorporación guiada
aplica automáticamente la configuración estándar —espacio de trabajo, Gateway y sesiones,
el mismo plan que aplicaría el chat conversacional `openclaw setup` al responder «sí»— y,
a continuación, ofrece recomendaciones de plugins y Skills a partir de las aplicaciones instaladas; los nombres de las aplicaciones
se cotejan mediante el modelo configurado y la búsqueda de ClawHub, y el paso puede
desactivarse con [`wizard.appRecommendations`](/es/gateway/configuration-reference#wizard).
En una sesión de escritorio de macOS, Linux o Windows, abre después el
panel autenticado de la interfaz de control y espera hasta 60 segundos a que el cliente del navegador
se conecte. En Linux sin interfaz gráfica o mediante SSH, muestra una URL destacada y fácil de copiar y pegar
del panel, incluido un comando de reenvío de puertos SSH para un Gateway de bucle invertido,
y espera hasta cinco minutos. Una conexión correcta continúa en el navegador;
un Gateway inaccesible o un tiempo de espera agotado vuelve a la misma salida al terminal
que antes. Proporcione `--tui` para omitir la transferencia al navegador y forzar esa salida al terminal.
Si falla la aplicación de la configuración, la incorporación vuelve al chat conversacional de OpenClaw
para finalizar de forma interactiva. Los canales, agentes,
plugins y otras funciones opcionales siguen correspondiendo al chat de OpenClaw: ejecute
`openclaw` y use `open channel wizard for <channel>` para delegar la
recopilación de credenciales del canal en un asistente de terminal con datos ocultos. Para cambiar el proveedor
del modelo o su autenticación, salga de OpenClaw y ejecute `openclaw onboard`;
OpenClaw no abre los flujos guiados ni clásicos de proveedores.

En una instalación configurada, volver a ejecutar `openclaw onboard` verifica primero el
modelo predeterminado actual, por lo que el mismo flujo funciona como una fase de verificación y reparación:
no vuelve a aplicar la configuración, reinstala ni reinicia el servicio del Gateway.
Si esa comprobación falla, el modelo configurado nunca se reemplaza automáticamente:
la incorporación se detiene y pregunta cómo continuar. La comprobación se ejecuta fuera del
espacio de trabajo, por lo que un modelo proporcionado por un plugin del espacio de trabajo puede fallar aquí aunque siga
funcionando en el agente.
Use `openclaw onboard --classic` para la autenticación específica del proveedor, los canales, las Skills,
la configuración de un Gateway remoto, las importaciones o los controles completos del Gateway. Para la
configuración y reparación conversacionales sin inferencia, ejecute `openclaw setup`; `openclaw onboard
--modern` es un alias de compatibilidad que usa la misma barrera de inferencia. El asistente
clásico puede verificar opcionalmente el modelo predeterminado con una finalización en vivo, pero
OpenClaw no se iniciará hasta que su propia comprobación de inferencia en vivo se complete correctamente.

En un terminal interactivo, `openclaw` sin argumentos (sin subcomando) dirige el flujo según el estado de la
configuración:

- Si el archivo de configuración activo no existe o no contiene ajustes definidos (está vacío o
  solo contiene metadatos), inicia la incorporación guiada.
- Si el archivo de configuración existe, pero no supera la validación, inicia la ruta de
  incorporación clásica con las indicaciones de `openclaw doctor`. OpenClaw necesita una
  inferencia funcional y no se utiliza para reparar este estado previo a la inferencia.
- Si el archivo de configuración es válido, abre la TUI normal del agente. Un Gateway
  configurado y accesible con un agente y un modelo accede directamente a esa interfaz sin
  incorporación ni OpenClaw. En una instalación configurada, acceda a OpenClaw con
  `/openclaw` desde la TUI o con `openclaw setup`.

Se acepta `ws://` en texto sin formato para el bucle invertido, los literales de IP privada, `.local` y las URL del Gateway de Tailnet `*.ts.net`. Para otros nombres DNS privados de confianza, defina `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` en el entorno del proceso de incorporación.

## Restablecimiento

```bash
openclaw onboard --reset
openclaw onboard --reset --reset-scope full
```

`--reset` borra el estado antes de ejecutar la configuración. `--reset-scope` controla la cantidad: `config` (solo la configuración), `config+creds+sessions` (valor predeterminado cuando se proporciona `--reset` sin un alcance) o `full` (también restablece el espacio de trabajo). El espacio de trabajo solo se restablece con `--reset-scope full`.

## Configuración regional

La incorporación interactiva usa la configuración regional del asistente de la CLI para el texto fijo de configuración. Usa el primer valor no vacío en este orden:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. Alternativa en inglés

Las configuraciones regionales compatibles con el asistente son `en`, `zh-CN` y `zh-TW`. Los valores de configuración regional pueden usar guiones bajos o formas con sufijos POSIX, como `zh_CN.UTF-8`. Los nombres de productos, nombres de comandos, claves de configuración, URL, identificadores de proveedores, identificadores de modelos y etiquetas de plugins/canales se mantienen literales.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
OPENCLAW_LOCALE=en openclaw onboard # Anulación explícita para usar inglés
```

## Configuración no interactiva

`--non-interactive` requiere `--accept-risk` (confirma que los agentes son potentes y que el acceso completo al sistema conlleva riesgos). `--mode` usa `local` de forma predeterminada.

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai \
  --custom-image-input
```

`--custom-api-key` es opcional; si se omite, la incorporación busca `CUSTOM_API_KEY` en el entorno. OpenClaw marca automáticamente como compatibles con imágenes los identificadores habituales de modelos de visión (GPT-4o/4.1/5.x, Claude 3/4, Gemini, Qwen-VL, LLaVA, Pixtral y similares). Pase `--custom-image-input` para identificadores personalizados desconocidos de modelos de visión o `--custom-text-input` para forzar metadatos de solo texto. Use `--custom-compatibility openai-responses` para endpoints compatibles con OpenAI que admitan `/v1/responses`, pero no `/v1/chat/completions`; los valores válidos son `openai` (predeterminado), `openai-responses` y `anthropic`.

LM Studio también tiene una opción de clave específica del proveedor:

```bash
openclaw onboard --non-interactive \
  --auth-choice lmstudio \
  --custom-base-url "http://localhost:1234/v1" \
  --custom-model-id "qwen/qwen3.5-9b" \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --accept-risk
```

Ollama no interactivo:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url` usa `http://127.0.0.1:11434` de forma predeterminada. `--custom-model-id` es opcional; si se omite, la incorporación usa los valores predeterminados sugeridos por Ollama. Los identificadores de modelos en la nube, como `kimi-k2.5:cloud`, también funcionan aquí.

Almacene las claves de proveedores como referencias en lugar de texto sin formato:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Con `--secret-input-mode ref`, la incorporación escribe referencias respaldadas por variables de entorno en lugar de valores de claves en texto sin formato: para los proveedores respaldados por perfiles de autenticación, escribe `keyRef: { source: "env", provider: "default", id: <envVar> }`; para los proveedores personalizados, escribe `models.providers.<id>.apiKey` del mismo modo (por ejemplo, `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`). Contrato: defina la variable de entorno del proveedor en el entorno del proceso de incorporación (por ejemplo, `OPENAI_API_KEY`) y no pase también una opción de clave en línea a menos que dicha variable esté definida; proporcionar un valor mediante la opción sin la variable de entorno correspondiente provoca un fallo inmediato con instrucciones.

### Autenticación del Gateway (no interactiva)

- `--gateway-auth token --gateway-token <token>` almacena un token en texto sin formato. `token` es el modo de autenticación predeterminado.
- `--gateway-auth token --gateway-token-ref-env <name>` almacena `gateway.auth.token` como un SecretRef de entorno. Requiere que exista una variable de entorno no vacía con ese nombre en el entorno del proceso de incorporación.
- `--gateway-token` y `--gateway-token-ref-env` son mutuamente excluyentes.
- Con `--install-daemon`: un `gateway.auth.token` administrado mediante SecretRef se valida, pero no se conserva como texto sin formato resuelto en los metadatos del entorno del servicio supervisor; si la referencia no se puede resolver, la instalación se cierra de forma segura e incluye instrucciones para corregir el problema. Si se configuran tanto `gateway.auth.token` como `gateway.auth.password` y `gateway.auth.mode` no está definido, la instalación se bloquea hasta que el modo se defina explícitamente.
- La incorporación local escribe `gateway.mode="local"` en la configuración. Si posteriormente falta `gateway.mode` en un archivo de configuración, esto indica que la configuración está dañada o que se realizó una edición manual incompleta, no un atajo válido para el modo local.
- La incorporación local instala los plugins descargables que requiere la ruta de configuración elegida (por ejemplo, un plugin de entorno de ejecución de Codex o Copilot para esas opciones de autenticación). La incorporación remota solo escribe la información de conexión del Gateway remoto; nunca instala paquetes de plugins locales.
- `--allow-unconfigured` es una vía de escape independiente de `openclaw gateway run`; no permite que la incorporación omita `gateway.mode`.

```bash
export OPENAI_API_KEY="your-provider-key"
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

### Estado del Gateway local

- A menos que pase `--skip-health`, la incorporación espera a que haya un Gateway local accesible antes de finalizar correctamente.
- `--install-daemon` inicia primero la ruta de instalación del Gateway administrado. Sin esta opción, ya debe estar ejecutándose un Gateway local (por ejemplo, `openclaw gateway run`).
- `--skip-health` omite la espera si solo se desean realizar escrituras de configuración, espacio de trabajo y arranque en una automatización.
- `--skip-bootstrap` establece `agents.defaults.skipBootstrap: true` y omite la creación de `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` y `BOOTSTRAP.md`.
- En Windows nativo, `--install-daemon` intenta usar primero las tareas programadas y, si se deniega la creación de la tarea, recurre a un elemento de inicio de sesión por usuario en la carpeta de inicio.

### Modo de referencia interactivo

- Elija **Use secret reference** cuando se solicite y, después, **Environment variable** o un proveedor de secretos configurado (`file` o `exec`).
- La incorporación ejecuta una validación preliminar rápida antes de guardar la referencia y permite volver a intentarlo en caso de fallo.

### Opciones de endpoint de Z.AI

<Note>
`--auth-choice zai-api-key` detecta automáticamente el mejor endpoint y modelo de Z.AI para la clave: los endpoints de Coding Plan prefieren `zai/glm-5.2` (con `glm-5.1` como alternativa si no está disponible); los endpoints de API generales usan `zai/glm-5.1` de forma predeterminada. Para forzar un endpoint de Coding Plan, seleccione directamente `zai-coding-global` o `zai-coding-cn`.
</Note>

```bash
# Selección del endpoint sin solicitudes interactivas
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Otras opciones de endpoint de Z.AI: zai-coding-cn, zai-global, zai-cn
```

Mistral:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

## Opciones no interactivas adicionales

Autenticación de modelos basada en tokens (utilizada con `--auth-choice token`):

| Opción                          | Descripción                                                                                                                         |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `--token-provider <id>`         | Identificador del proveedor de tokens que emite el token                                                                            |
| `--token <token>`               | Valor del token para la autenticación del modelo                                                                                     |
| `--token-profile-id <id>`       | Identificador del perfil de autenticación (valor predeterminado: `<provider>:manual`; algunos flujos propiedad del proveedor usan su propio valor predeterminado, como `anthropic:default`) |
| `--token-expires-in <duration>` | Duración opcional hasta la caducidad del token (p. ej., `365d`, `12h`)                                      |

Gateway de IA de Cloudflare: `--cloudflare-ai-gateway-account-id <id>`, `--cloudflare-ai-gateway-gateway-id <id>`.

Control de instalación del daemon: `--no-install-daemon` / `--skip-daemon` (alias; omiten la instalación del servicio del Gateway), `--daemon-runtime <node>`.

Skills: `--node-manager <npm|pnpm|bun>` (valor predeterminado: `npm`), `--skip-skills`.

Configuración de la interfaz y los hooks: `--skip-ui` (omite las solicitudes de Control UI/TUI), `--skip-hooks` (omite la configuración de webhooks/hooks), `--skip-channels`, `--skip-search`.

Salida: `--suppress-gateway-token-output` suprime la salida del Gateway y de la interfaz que contiene tokens (indicaciones sobre tokens, URL de inicio de sesión automático con un token insertado e inicio automático de Control UI); resulta útil en terminales compartidos y en CI.

<Note>
`--json` no implica el modo no interactivo en la incorporación guiada o clásica.
Con `--modern`, JSON proporciona una descripción general de OpenClaw en una sola ejecución y finaliza después de ese
único resultado. Use `--non-interactive` para otros scripts.
</Note>

## Filtrado previo de proveedores

Cuando una opción de autenticación implica un proveedor preferido, la incorporación filtra previamente los selectores de modelo predeterminado y lista de permitidos para mostrar los modelos de ese proveedor. El filtro también coincide con otros proveedores propiedad del mismo plugin, lo que abarca variantes de planes de programación como `volcengine`/`volcengine-plan` y `byteplus`/`byteplus-plan`. Si el filtro del proveedor preferido no produce ningún modelo cargado, la incorporación recurre al catálogo sin filtrar en lugar de dejar vacío el selector.

## Preguntas de seguimiento sobre la búsqueda web

Algunos proveedores de búsqueda web activan preguntas de seguimiento específicas del proveedor durante la incorporación:

- **Grok** puede ofrecer la configuración opcional de `x_search` con la misma autenticación de xAI y una opción de modelo `x_search`.
- **Kimi** puede solicitar la región de la API de Moonshot (`api.moonshot.ai` frente a `api.moonshot.cn`) y el modelo predeterminado de búsqueda web de Kimi.

## Otros comportamientos

- Comportamiento del ámbito de mensajes directos en la incorporación local: [referencia de configuración de la CLI](/es/start/wizard-cli-reference#outputs-and-internals).
- Primera conversación más rápida: `openclaw dashboard` (Control UI, sin configuración de canales).
- Proveedor personalizado: conecte cualquier endpoint compatible con OpenAI o Anthropic, incluidos proveedores alojados que no figuren en la lista. Use la compatibilidad **Unknown** para realizar una detección automática mediante una prueba en vivo.
- Si se detecta el estado de Hermes, la incorporación ofrece un flujo de migración (consulte `--flow import` anteriormente).

## Comandos de seguimiento habituales

Use `openclaw configure` posteriormente para realizar cambios específicos sin inferencias y `openclaw
channels add` para configurar únicamente los canales. Para cambiar el proveedor del modelo o la ruta de autenticación,
ejecute `openclaw onboard` en su lugar.

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```
