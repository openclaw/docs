---
read_when:
    - Está implementando o revisando una fase del rediseño de la incorporación.
summary: Plan de implementación para el rediseño de la incorporación de custodios (documento vivo)
title: Rediseño de la incorporación
x-i18n:
    generated_at: "2026-07-22T10:49:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f892991583d0b77a670e9bf7aa5a0c74af3b3eac9e7b0448706486254eb7e2a0
    source_path: start/onboarding-redesign.md
    workflow: 16
---

# Plan de implementación del rediseño de la incorporación

> **Documento vivo.** Esta página realiza un seguimiento del rediseño de la incorporación del custodio
> a nivel de implementación y se actualiza a medida que se completa cada fase. Cuando se
> integre la última fase, esta página se reescribirá como guía de incorporación para el usuario
> y se incorporará a la navegación de la documentación. Hasta entonces, se mantiene intencionadamente fuera de `docs.json`.

## Objetivo principal

Un usuario sin conocimientos técnicos escribe `openclaw onboard` (o abre la aplicación) y recibe
la bienvenida de una única presencia conversacional: OpenClaw, el custodio del sistema ("custodio" es
solo el nombre interno; el usuario siempre ve "OpenClaw"), que encuentra su IA,
lo configura todo con valores predeterminados anunciados en lugar de preguntas, hace eclosionar a su
agente como un momento visible de creación de identidad y permanece accesible para siempre como
cuidador del sistema. Magia de forma predeterminada, un único límite de consentimiento y ningún callejón sin salida.

Principios de diseño (ya decididos, no reabrir el debate a la ligera):

- **Los valores predeterminados anunciados con una opción sencilla para deshacerlos** sustituyen a las preguntas bloqueantes. El único
  requisito estricto es que la inferencia funcione; todo lo demás es una oferta.
- **La pregunta cero es el límite de consentimiento**: "Acceso completo" (recomendado) significa
  que la detección es silenciosa y automática; "Preguntar primero" supedita cada detección —el
  análisis de IA, el análisis de aplicaciones y el análisis de fuentes de memoria por igual— a un
  único sí explícito, con una ruta completamente manual que nunca realiza análisis.
- **La conversación como interfaz de usuario con inteligencia progresiva**: la superficie del custodio
  existe antes de que funcione cualquier IA (diálogo mediante scripts), pasa a estar respaldada por un modelo
  en cuanto se verifica una ruta y lo indica de forma visible. Nunca finge inteligencia:
  la entrada de texto libre antes de verificar una ruta recibe un amable "primero voy a
  poner mi cerebro en funcionamiento".
- **La eclosión es una ceremonia**: el mismo hilo, cambio de avatar, el agente se asigna
  un nombre y elige su propio rostro. El custodio explica la jerarquía una vez: "pregúntame
  por el sistema o simplemente pregunta a tu agente; él me lo transmite".
- **La confianza se divide en niveles según la fuente**: las entradas del catálogo oficial pueden estar preseleccionadas;
  las Skills de terceros de ClawHub nunca están preseleccionadas, independientemente de la
  clasificación del modelo, y sus etiquetas indican que instalan el código del editor.
- **Las instalaciones configuradas son sagradas**: volver a ejecutar la incorporación es un proceso de
  verificación. Nunca vuelve a aplicar la configuración ni reinicia el servicio Gateway.
- **El terminal es la alternativa, no una pregunta**: se prefiere el panel de control del navegador
  cuando hay un Gateway accesible; nunca se pregunta "¿terminal o navegador?".
- **Los modelos débiles reciben una superficie reducida** (`localModelLean` automático), explicada con
  palabras sencillas, nunca en términos de herramientas, modo de código o ventanas de contexto.

## Flujo publicado actualmente (después de las fases 1-3)

`openclaw onboard` en una instalación nueva de macOS, ruta ideal: cuatro pulsaciones de Intro en total:

1. Nota de seguridad → una pulsación de Intro para confirmarla (se conserva; nunca se vuelve a preguntar).
2. **Pregunta cero**: "¿Cómo debo configurar todo?" — Acceso completo (recomendado)
   o Preguntar primero. Se conserva como `wizard.accessMode`; las nuevas ejecuciones usan de forma predeterminada la
   opción guardada. La opción protegida + "configurar manualmente" llega al selector de proveedores sin
   realizar ningún análisis y también omite el análisis de fuentes de memoria.
3. **Representación de la detección**: detecta las CLI de programación, las claves del entorno y los entornos de ejecución locales;
   hace un comentario cuando encuentra agentes de programación; prueba en vivo los candidatos en orden y
   recopila discretamente los fallos en una única línea de resumen (los detalles están tras "Ver otras
   opciones"). La primera ruta funcional se anuncia como valor predeterminado, con una
   ruta de una sola tecla al selector completo; explorar y omitir conserva la
   ruta funcional.
4. Oferta de importación de memoria (Claude Code / Codex / Hermes), omitida cuando se
   rechazó la detección.
5. Solo instalaciones nuevas: el plan de configuración estándar se aplica automáticamente
   (espacio de trabajo, servicio Gateway y sesiones: el mismo plan que ejecuta el "sí"
   conversacional). Las instalaciones configuradas muestran "ya está configurado" y nunca modifican el
   servicio.
6. **Recomendaciones de aplicaciones**: el modelo verificado relaciona las aplicaciones instaladas
   con los catálogos oficiales + ClawHub; los plugins de canales oficiales aparecen
   preseleccionados y las Skills de terceros son opcionales e incluyen una etiqueta de advertencia. Se puede omitir;
   interruptor de desactivación `wizard.appRecommendations`.
7. **Eclosión**: cuando hay un Gateway accesible, la transferencia al navegador abre (GUI) o
   muestra (sin interfaz gráfica/SSH) la URL del panel de control y espera a que la interfaz de control
   se conecte: "Panel de control conectado; se continuará en el navegador". De lo contrario, o
   con `--tui`, se abre la TUI del terminal con el mensaje de eclosión inicial
   ya insertado y el agente se presenta.

La incorporación mediante un Gateway remoto conserva su transferencia conversacional heredada
(`handoffMode: "chat"`); la configuración debe aplicarse en el Gateway remoto.

## Fases

| #   | Fase                                                                                                                                                      | Superficie            | Estado                                                                                                                            |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Recomendaciones de plugins de aplicaciones instaladas (análisis, candidatos, comparador de IA, paso del asistente, comando de Node `device.apps`)         | CLI clásica + guiada  | integrado ([#109668](https://github.com/openclaw/openclaw/pull/109668))                                                           |
| 2   | Estructura principal del custodio en la CLI (pregunta cero, representación de la detección, aplicación automática + eclosión)                             | CLI guiada            | integrado ([`a83ed13204f1`](https://github.com/openclaw/openclaw/commit/a83ed13204f118adf1009e5ac88d5afe1905b86c))                |
| 3   | Transferencia prioritaria al navegador (detección de sesiones GUI, espera de conexión del panel de control, TUI como alternativa)                        | CLI → web             | integrado ([#110054](https://github.com/openclaw/openclaw/pull/110054))                                                           |
| 4   | Superficie web del custodio (tarjetas de opciones, campo `question` tipado en `openclaw.chat`, réplica de pasos del asistente, transferencia inicial) | Interfaz de control   | integrado ([#110141](https://github.com/openclaw/openclaw/pull/110141), [#110242](https://github.com/openclaw/openclaw/pull/110242)) |
| 5   | Eclosión e inicialización (almacén de recomendaciones con semántica de una sola vez, secuencia de nacimiento con asignación de nombre propia, transferencia automática a la eclosión tras una configuración nueva; escala de avatares aplazada) | inicialización del agente | integrado ([#110173](https://github.com/openclaw/openclaw/pull/110173), [#110331](https://github.com/openclaw/openclaw/pull/110331)) |
| 6   | Presencia del custodio PR1 (entrada fijada en la barra lateral, Preguntar a OpenClaw en Configuración, saludo del cuidador con la interfaz normal; los comentarios de eventos y la invocación desde canales quedan para PR2) | web + canales         | integrado ([#110269](https://github.com/openclaw/openclaw/pull/110269))                                                           |
| 7   | Resiliencia (custodio accesible con una configuración dañada, recuperación parcial de superficies, reparación automática)                              | Gateway               | seguimiento                                                                                                                       |

## Notas de implementación por fase

### Fase 1 — recomendaciones de aplicaciones (PR #109668)

- Analizador: `src/infra/installed-apps.ts` (enumeración de macOS sin TCC; sigue
  los paquetes `.app` enlazados simbólicamente).
- Candidatos: catálogos oficiales + búsqueda en ClawHub, presupuesto total de 20s, degradación
  sin conexión controlada a candidatos solo del catálogo. Las entradas del catálogo son manifiestos de paquetes
  sin un `id` de nivel superior; los candidatos se indexan mediante el id de Plugin
  resuelto (se han realizado pruebas de regresión con los catálogos incluidos reales; indexarlos una vez mediante
  `entry.id` contrajo todo el catálogo y eliminó todas las recomendaciones
  oficiales).
- Comparador de IA: una finalización en la ruta verificada
  (`src/system-agent/setup-app-recommendations.ts`); sin mapa seleccionado de identificadores de paquetes:
  el modelo rechaza las coincidencias de nombres fortuitas. La salida está limitada por el
  presupuesto `maxTokens` propio del modelo resuelto (la capa de transmisión lo aplica cuando no se
  proporciona ningún límite explícito).
- **Protección de la cadena de suministro**: el texto de las fichas de ClawHub está controlado por el editor y
  llega al prompt del comparador, por lo que una ficha puede promocionarse como
  "recomendada". Solo las entradas del catálogo oficial pueden estar preseleccionadas; las Skills de ClawHub
  siempre requieren una selección explícita y llevan la etiqueta "Skill de ClawHub de
  terceros; instala el código de su editor".
- Comando de Node `device.apps` (host de Node en TS, paridad con el sobre de Android), uso compartido
  desactivado de forma predeterminada; interruptor de desactivación del Gateway `wizard.appRecommendations`.
- La entrega reside en el asistente clásico y en el flujo guiado del custodio
  (`src/wizard/setup.app-recommendations.ts`); redirigirla a la parte final de la
  inicialización sigue correspondiendo a la fase 5 (el servicio ya acepta una fuente de inventario
  inyectable). La semántica de una sola vez (ofrecer solo hasta que se acepte, análisis almacenado) también se incorpora
  con el almacén de la fase 5; actualmente, una nueva ejecución vuelve a ofrecerla.
- También se corrigió: los prompts `completeSetupInference` personalizados ya no heredan el
  límite de salida de 32 tokens de la sonda de verificación (`SETUP_INFERENCE_TEST_MAX_TOKENS`
  se aplica únicamente a la sonda "responde OK").

### Fase 2 — estructura principal del custodio en la CLI (PR #109841)

- Reestructuración del flujo en `src/commands/onboard-guided.ts`; la incorporación mediante un Gateway remoto
  conserva su transferencia heredada al chat mediante `handoffMode: "chat"`.
- La pregunta cero conserva `wizard.accessMode` ("full" | "guarded"); las nuevas ejecuciones
  usan de forma predeterminada la opción guardada (aceptar el valor predeterminado nunca puede
  reducir silenciosamente el nivel de protegido a completo). La opción protegida + manual utiliza
  `listManualSetupInferenceOptions` (solo configuración/manifiestos, sin sondeo) y
  omite el análisis de fuentes de memoria.
- Detección: recopilación silenciosa de fallos (una sola línea de resumen; detalles tras
  "Ver otras opciones"), comentario sobre agentes de programación y valor predeterminado de ruta anunciado. Los recuentos de
  sesiones del comentario se aplazan (por ahora solo son cualitativos) hasta que exista una interfaz económica
  para contar sesiones.
- Instalaciones nuevas: `applySystemAgentSetup` (el "sí" conversacional
  determinista), seguido de la eclosión mediante `launchTuiCli` con el mensaje de inicialización ya insertado.
  Instalaciones configuradas (configuración de modelo o Gateway preexistente; las marcas de tiempo
  del asistente no demuestran nada, ya que se comparten con la configuración/reparación):
  solo verificación; no se aplica nada ni se reinicia el servicio Gateway. Si la aplicación falla,
  se recurre al chat conversacional.

### Fase 3 — transferencia prioritaria al navegador (PR #110054, integrado)

- `src/commands/onboard-browser-handoff.ts` se encarga exclusivamente de detectar la sesión gráfica
  (`SSH_CONNECTION`/`SSH_TTY`; `DISPLAY`/`WAYLAND_DISPLAY` en Linux)
  y de la espera de 60 segundos para la GUI / 300 segundos para SSH. Actualmente, la incorporación guiada
  habilita el traspaso solo en macOS; `--tui` y otras plataformas mantienen la
  salida al terminal. La habilitación en Linux/Windows queda como trabajo posterior.
- Los enlaces del panel usan los mismos auxiliares `resolveAdvertisedControlUiLinks`,
  `resolveLocalControlUiProbeLinks` y `buildOnboardingControlUiUrl`
  que la finalización clásica. Para abrir el navegador se usa el auxiliar compartido `openUrl`.
- La disponibilidad consulta el RPC `system-presence` existente como un **cliente de bucle invertido
  en modo CLI que presenta el secreto compartido configurado**: la ruta de confianza que usa cada
  comando `openclaw`. Un cliente de la interfaz de control con autenticación compartida sin procesar
  se rechaza con «se requiere la identidad del dispositivo» en los Gateway con SecretRef. La comprobación preliminar
  de accesibilidad resuelve el mismo destino (y secreto) que el bucle de espera, por lo que la
  comprobación y la espera nunca pueden discrepar sobre la autenticación. El traspaso solo se completa
  cuando una fila de presencia `openclaw-control-ui`/`webchat` conectada es nueva
  respecto a la referencia anterior al inicio (un panel que ya estuviera abierto no puede
  completarlo).
- `gateway.controlUi.enabled: false` interrumpe el proceso antes de que se muestre cualquier URL.
- Comprobado de extremo a extremo con un Gateway aislado que usa la misma configuración: impresión de la URL → conexión
  real del navegador → «Panel conectado; se continuará en el navegador» → sin
  salida al terminal. Un bloqueo anterior por «token no coincidente» era un artefacto
  del arnés de pruebas; véase la guía de pruebas más adelante.

### Fase 4 — superficie del custodio web (fusionada: #110141, #110242)

- Página `/custodian` sobre `openclaw.chat` con el componente de tarjetas de opciones
  (2-4 tarjetas, como máximo una recomendada, siempre se puede omitir); interfaz de incorporación mediante
  `?onboarding=1`; la finalización de la primera ejecución de la configuración del modelo hace el traspaso hacia ella.
- Las preguntas estructuradas son un campo aditivo tipado `question` en
  `SystemAgentChatResult` (texto `reply` por opción; la prosa siempre se presenta por separado
  para la aplicación de macOS/TUI). Productores: ambas variantes de bienvenida de la incorporación y
  los pasos de selección/confirmación del asistente alojado con 2-4 opciones cerradas; los asistentes
  reales de los canales se representan como tarjetas. Se eliminó la solución provisional con marcadores de cadenas de PR1.
- La propiedad de la sesión se limita a la URL del Gateway + todas las credenciales presentadas
  (token, contraseña, token de arranque, token de dispositivo almacenado; persiste durante
  caídas transitorias del saludo); los turnos de usuario fallidos nunca pueden reproducirse; la entrada
  sensible se envía literalmente y se oculta en la transcripción.

### Fase 5 — salida y arranque (fusionada: #110173, #110331)

- El custodio crea un agente sin nombre (llamada a herramienta); el arranque del agente comienza
  poniéndose un nombre. PR1 incluye la ceremonia limitada a tres pasos (nombre → frase del alma
  → pregunta sobre Skills) y aplaza para un trabajo posterior la secuencia de avatar autodibujado/generación de imágenes
  (candidatos generados por el modelo → marcas predefinidas → conservar el logotipo). Mismo
  hilo, cambio de avatar; la marca de la garra queda reservada para el custodio. La
  identidad acordada se conserva dos veces: en `IDENTITY.md`/`SOUL.md` (lo que lee el agente)
  y mediante `openclaw agents set-identity` (lo que muestran los canales y la interfaz
  de usuario).
- Las recomendaciones (servicio de la fase 1, análisis almacenado con semántica de una sola vez) aparecen como
  el último paso del arranque antes de eliminar el archivo de arranque: «¿conjunto mínimo
  o máxima comodidad?». El arranque lee la oferta almacenada mediante
  `openclaw onboard recommendations --json` (solo identificadores opacos de instalación) y
  confirma su recepción después de gestionar la elección, para no volver a preguntar. Los botones de
  conexión de canales incluyen guías de configuración específicas para cada canal; el agente recopila
  las credenciales mediante una conversación y transmite las escrituras de configuración al custodio
  («consultando a OpenClaw…» es la expresión canónica).
- El autoaprendizaje se pregunta, no se anuncia, y también sirve como consentimiento para el taller
  de Skills; se describen las comprobaciones de confianza de la versión, análisis, verificación e integridad
  de ClawHub, además de la advertencia sobre el código del editor; nunca se insinúa que todas las versiones estén firmadas.
- Se incorporó la salida automática: la aplicación de la configuración de una instalación nueva anuncia la salida y
  realiza el traspaso (TUI del terminal / `open-agent` para clientes del Gateway); la página web
  llega al chat del agente con el borrador «¡Despierta, amigo!» rellenado previamente. El
  traspaso solo se activa tras una verificación limpia posterior a la escritura. Ofrecer una opción
  cuando no quedan agentes después de eliminarlos (en lugar de hacerlo automáticamente) sigue pendiente como mejora.

### Fase 6 — presencia del custodio (PR1 fusionada: #110269; los comentarios/la invocación corresponden a PR2)

- Incluido en PR1: entrada «OpenClaw» fijada de forma predeterminada en la barra lateral (perfiles nuevos;
  los usuarios existentes conservan los elementos fijados que guardaron y acceden a ella mediante personalizar/More), «Preguntar
  a OpenClaw» como primera entrada de Settings y visitas a `/custodian` con la interfaz
  normal que solicitan el saludo del cuidador (sin variante de bienvenida de incorporación), con
  Exit setup mostrado solo en el modo de incorporación. Un panel acoplado en línea de Settings
  requiere extraer la vista de conversación compartida (trabajo posterior).
- Comentarios reactivos a eventos con medidas preventivas contra Clippy: solo ante cambios importantes o
  fallidos, como máximo una vez por visita a Settings salvo que se solicite. La misma
  interfaz de eventos permite que el custodio sea posteriormente la voz para la autenticación degradada o los
  canales averiados.
- Canales: invisible en el uso cotidiano (el agente retransmite); accesible mediante una
  invocación explícita y ante eventos de caída del agente en el mismo hilo, con su propio nombre y
  avatar de garra cuando la plataforma lo permita.
- Si se detecta un modelo débil durante la configuración: se establece automáticamente `localModelLean`, y el custodio
  lo explica con palabras sencillas y ofrece una actualización.
- El custodio conoce su apodo interno («algunos me llaman el
  custodio; OpenClaw está bien») y siempre se refiere al agente por su nombre.

### Fase 7 — resiliencia (requiere una decisión del responsable antes de implementarse)

El planteamiento original —«el custodio debe ser accesible por muy dañada que esté
la configuración»— entra en conflicto con la política de seguridad del repositorio: la guía raíz
indica que el Gateway **rechaza el inicio** cuando la configuración es estructuralmente inválida,
y solo los fallos del propietario de SecretRef degradan las capacidades a
configuradas como no disponibles. Servir cualquier superficie desde una configuración inválida constituye un cambio de política,
no un detalle de implementación. Hay dos alcances; debe elegirse uno:

- **Opción A (recomendada, conforme con la política): reparación automática desde la CLI.** Cuando el inicio
  de un Gateway o la CLI falla debido a una configuración inválida con una forma conocida, la CLI ofrece
  ejecutar `openclaw doctor --fix` (o lo ejecuta con consentimiento), vuelve a intentarlo una vez e
  informa con claridad. El comportamiento del Gateway no cambia; el custodio sigue siendo accesible
  mediante la ruta degradada existente de SecretRef y el terminal.
- **Opción B (requiere la aprobación explícita del responsable + revisión de seguridad): modo de superficie
  mínima del Gateway.** Ante una configuración estructuralmente inválida, inicia una superficie restringida
  que solo sirve la conversación con el custodio y las acciones de reparación. Esto
  reescribe el contrato de inicio con cierre seguro y debe definir su propia estrategia de
  protección de entrada antes de escribir código.

Trabajos posteriores restantes de las fases 4-6 (registrados, sin programar): secuencia de avatar/generación de imágenes
para la salida; representación en la aplicación de macOS del campo tipado `question`; un
panel acoplado en línea de Settings para el custodio (requiere extraer la vista de conversación
compartida); comentarios reactivos a eventos e invocación desde el canal/recuperación tras la caída del agente
(PR2 de la fase 6); `localModelLean` automático para modelos débiles; si los
elementos fijados guardados en la barra lateral por los usuarios existentes deben adoptar la entrada OpenClaw.

## Guía de pruebas y entrega (fruto de la experiencia; léase antes de las fases 4-6)

- **`OPENCLAW_STATE_DIR` no aísla el servicio del Gateway.** La
  etiqueta de LaunchAgent (`ai.openclaw.gateway`) es global para la máquina: una prueba de incorporación
  de una instalación nueva con un directorio de estado aislado REESCRIBIRÁ y REINICIARÁ el servicio real
  de la máquina (los scripts envoltorio se instalan dentro del directorio aislado; el siguiente
  inicio del servicio falla cuando se limpia ese directorio). Después de cualquier prueba de instalación nueva,
  restáurelo con `openclaw gateway install --force && openclaw gateway
restart` desde el entorno real y verifique el plist. Trabajo posterior del producto:
  etiquetas de servicio limitadas al directorio de estado o detección de un servicio ajeno durante la incorporación.
- **Arnés seguro de extremo a extremo**: prepare previamente la configuración aislada con una sección `gateway`
  (para que la incorporación siga la ruta de instalación configurada y nunca toque
  el servicio) y ejecute `openclaw gateway run` como un proceso normal en primer plano en
  un puerto libre con un token sin formato. Ese arnés comprobó el bucle de la fase 3,
  incluida una conexión real del navegador.
- **Las rutas de autenticación difieren según la identidad del cliente, no solo las credenciales.** Las lecturas de presencia y
  otras lecturas del operador usan un cliente de bucle invertido en modo CLI con credenciales de la
  misma configuración. Los Gateway con autenticación por token requieren el secreto compartido; los Gateway
  con SecretRef/sin autenticación pueden recurrir a la autenticación de bucle invertido de confianza sin token. Un cliente de navegador
  identificado como interfaz de control necesita la identidad del dispositivo o la concesión de bucle invertido
  de contexto seguro. Una sonda que se autentica contra un Gateway que sirve una configuración
  DIFERENTE (véase el problema de LaunchAgent) falla con «token no coincidente»; ese
  artefacto bloqueó brevemente la fase 3.
- **Sondas de finalización**: `runSetupInferenceTest` limita la sonda de verificación a
  32 tokens de salida; las instrucciones personalizadas eluden el límite y quedan restringidas por el
  propio `maxTokens` del modelo. Los modelos de razonamiento consumen primero ese presupuesto con razonamiento
  oculto; un turno sin texto suele significar que el presupuesto se agotó allí.
- **La entrega del agente necesita CI alojada en el encabezado exacto.** Es posible que el flujo de trabajo pesado `CI`
  no se ponga en cola para los envíos cuando la organización está bajo carga; la alternativa del responsable es
  ejecutar una puerta de lanzamiento en la rama del PR:

  ```bash
  gh workflow run ci.yml --ref <branch> -f target_ref=<head-sha> -f release_gate=true -f pull_request_number=<pr>
  ```

  La ejecución debe realizarse sobre la
  referencia de la rama para que `head_sha` coincida, y el título pasa a ser
  `CI release gate <sha>`, que `scripts/verify-pr-hosted-gates.mjs`
  acepta. Después, `scripts/pr` prepara/fusiona como de costumbre.

- **Comprobaciones que la CI aplica además de las pruebas específicas**: mapa de documentación
  (`pnpm docs:map:gen` después de añadir cualquier página de documentación), oxlint (`no-map-spread`,
  `max-lines`; divida los archivos, nunca suprima), `check:test-types`, código
  muerto de knip (exporte solo lo que consume producción; dirija las pruebas a través de API públicas)
  y el clasificador de fragmentos de pruebas en vivo
  (`test/scripts/test-live-shard.test.ts` debe incluir cualquier `*.live.test.ts` nuevo).

## Registro de decisiones

- Análisis mágico con interruptor de desactivación, no consentimiento previo (fase 1; la salida persistente
  informa del uso del modelo y de ClawHub antes de analizar, y la nota de resultados lo repite).
- Vertical completa, incluido el comando `device.apps` del Node (fase 1).
- Las Skills de terceros de ClawHub nunca aparecen preseleccionadas y se indica que
  instalan el código del editor; las entradas oficiales pueden aparecer premarcadas
  (fase 1, postura de seguridad implementada).
- Dos tarjetas de acceso, no tres; el consentimiento se adelanta a la elección (fase 2).
- Salida automática con anuncio, no un botón de bloqueo (fases 2/5).
- El navegador primero: la salida al terminal es la alternativa, nunca una pregunta de «¿terminal o
  navegador?» (fase 3).
- El custodio obtiene presencia en los canales (invocación + recuperación), no solo en la web/CLI
  (fase 6).
- La salida se produce en el mismo hilo con un cambio de avatar; tras finalizar, la
  aplicación pasa a la interfaz de usuario normal (fase 5).
- La superficie de configuración conserva el nombre "Settings"; el custodio reside allí
  (y en la barra lateral) en lugar de sustituirla (fase 6).
- Las tarjetas de opciones están restringidas: 2-4 opciones, exactamente una recomendada, siempre
  se pueden omitir; el mismo componente sirve para la incorporación y para la herramienta de preguntas
  del agente (fase 4).
- «Consultando a OpenClaw…» es la expresión canónica de delegación; las almas pueden añadir matices,
  pero la narración de la herramienta se mantiene sencilla (fase 5).
- El texto visible para el usuario nunca dice «modo de código», «herramientas» ni «ventana de contexto» al
  explicar el recorte para modelos débiles (fase 6).

## Carencias conocidas y seguimientos

- La etiqueta LaunchAgent no está limitada al directorio de estado (problema de pruebas indicado anteriormente; también es una
  carencia real del producto para varias instancias).
- Semántica de ejecución única de las recomendaciones y análisis almacenado (fase 5); las repeticiones
  actualmente vuelven a ofrecerlas.
- La transferencia al navegador solo está disponible en macOS; la habilitación en Linux/Windows está pendiente.
- La observación sobre el número de sesiones es cualitativa; los recuentos necesitan una interfaz sencilla y de bajo coste para contar sesiones.
- La transferencia al navegador lleva al panel normal; el enlace profundo al custodio
  en modo de incorporación llegará con la fase 4.
