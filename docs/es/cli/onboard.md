---
read_when:
    - Quieres establecer la inferencia y luego finalizar la configuración con Crestodian
summary: Referencia de la CLI para `openclaw onboard` (incorporación interactiva)
title: Incorporación
x-i18n:
    generated_at: "2026-07-12T14:22:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6e9dad7efda492e0d9ef01ef08a1fd8c81272a0d9b3aa3b945917b6878159a06
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Configuración guiada que establece primero la inferencia: detecta el acceso existente a IA,
requiere una finalización en vivo, conserva únicamente la ruta que funciona y, a continuación, inicia
Crestodian para configurar el resto. `openclaw setup` es el mismo punto de entrada;
`openclaw setup --baseline` solo escribe la configuración y el espacio de trabajo básicos.

<CardGroup cols={2}>
  <Card title="Centro de incorporación de la CLI" href="/es/start/wizard" icon="rocket">
    Guía paso a paso del flujo interactivo de la CLI.
  </Card>
  <Card title="Descripción general de la incorporación" href="/es/start/onboarding-overview" icon="map">
    Cómo se integra la incorporación de OpenClaw.
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
openclaw onboard --classic
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --flow import
openclaw onboard --import-from hermes --import-source ~/.hermes
openclaw onboard --skip-bootstrap
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

- `--classic`: abre el asistente completo paso a paso. No se puede combinar con
  `--non-interactive`; omita `--classic` para la configuración automatizada.
- `--flow quickstart`: abre el asistente clásico con el mínimo de indicaciones y
  genera automáticamente un token del Gateway.
- `--flow manual` (alias `advanced`): abre el asistente clásico con todas las indicaciones
  para el puerto, la vinculación y la autenticación.
- `--flow import`: ejecuta un proveedor de migración detectado (por ejemplo, Hermes mediante `--import-from hermes`), muestra una vista previa del plan y lo aplica tras la confirmación. La importación solo se ejecuta en una configuración nueva de OpenClaw; si ya existe algún estado, primero restablezca la configuración, las credenciales, las sesiones y el espacio de trabajo. Use [`openclaw migrate`](/es/cli/migrate) para obtener planes de ejecución de prueba, el modo de sobrescritura, informes y asignaciones exactas.
- `--modern` es un alias de compatibilidad para el asistente de configuración conversacional
  Crestodian. Utiliza la misma comprobación de inferencia en vivo que `openclaw crestodian` y
  solo acepta `--workspace`, `--accept-risk`,
  `--non-interactive` y `--json`. Las demás opciones de configuración se rechazan en lugar de
  ignorarse silenciosamente.

## Flujo guiado

`openclaw onboard` sin opciones inicia el flujo guiado. Muestra el aviso de seguridad,
detecta el acceso a IA ya disponible mediante modelos configurados, variables de entorno
de claves de API y CLI locales compatibles y, a continuación, prueba el candidato
recomendado con una finalización real. Si ese candidato falla, la incorporación muestra
el motivo y prueba automáticamente el siguiente candidato utilizable.

Si se agota la detección automática, elija otro candidato detectado o introduzca
una clave de API del proveedor en una solicitud enmascarada. Una clave manual se prueba mediante la misma
ruta de finalización en vivo. La incorporación guiada
no ofrece Crestodian ni una salida sin IA antes de que un candidato supere la prueba. OpenClaw
conserva únicamente la ruta del modelo verificada y su credencial después de que la prueba
se complete correctamente; un candidato fallido no reemplaza el modelo configurado ni guarda la
credencial que se intentó utilizar. La configuración del espacio de trabajo y del Gateway permanece sin cambios hasta que
se inicia Crestodian.

En el modo guiado, `--workspace <dir>` proporciona el espacio de trabajo propuesto para Crestodian
y el contexto de inferencia aislado. No se conserva hasta que se aprueba la
propuesta de configuración de Crestodian. La incorporación clásica y la no interactiva conservan su
espacio de trabajo mediante su flujo de configuración normal.

Una vez superada la comprobación de inferencia, la incorporación guiada inicia inmediatamente Crestodian con
el modelo verificado. Crestodian puede configurar entonces el espacio de trabajo, el Gateway,
los canales, los agentes, los plugins y otras funciones opcionales. Dentro de Crestodian, use
`open channel wizard for <channel>` para delegar la recopilación de credenciales del canal en un
asistente de terminal con entrada enmascarada. Para cambiar el proveedor del modelo o su autenticación,
salga de Crestodian y ejecute `openclaw onboard`; Crestodian no abre los flujos
guiados ni clásicos de proveedores.

En una instalación configurada, volver a ejecutar `openclaw onboard` verifica primero el
modelo predeterminado actual, por lo que el mismo flujo funciona como una comprobación y una reparación.
Si esa comprobación falla, el modelo configurado nunca se reemplaza automáticamente:
la incorporación se detiene y pregunta cómo continuar. La comprobación se ejecuta fuera del
espacio de trabajo, por lo que un modelo proporcionado por un plugin del espacio de trabajo puede fallar aquí aunque siga
funcionando en el agente.
Use `openclaw onboard --classic` para la autenticación específica del proveedor, los canales, las Skills,
la configuración remota del Gateway, las importaciones o los controles completos del Gateway. Para la
configuración y reparación conversacional no relacionadas con la inferencia, ejecute `openclaw crestodian`; `openclaw onboard
--modern` es un alias de compatibilidad que utiliza la misma comprobación de inferencia. El asistente clásico
puede verificar opcionalmente el modelo predeterminado mediante una finalización en vivo, pero
Crestodian no se iniciará hasta que supere su propia comprobación de inferencia en vivo.

En una terminal interactiva, `openclaw` sin argumentos (sin subcomando) dirige el flujo según el estado
de la configuración:

- Si falta el archivo de configuración activo o no contiene ajustes definidos (está vacío o
  solo contiene metadatos), se inicia la incorporación guiada.
- Si el archivo de configuración existe, pero no supera la validación, se inicia la ruta de
  incorporación clásica con indicaciones de `openclaw doctor`. Crestodian necesita que la
  inferencia funcione y no se utiliza para reparar este estado previo a la inferencia.
- Si el archivo de configuración es válido, se abre la TUI normal del agente. Un
  Gateway configurado y accesible con un agente y un modelo abre directamente esa interfaz sin
  incorporación ni Crestodian. En una instalación configurada, acceda a Crestodian con
  `/crestodian` dentro de la TUI o con `openclaw crestodian`.

Se acepta `ws://` en texto sin formato para direcciones de bucle invertido, literales de IP privadas, `.local` y URL del Gateway de Tailnet `*.ts.net`. Para otros nombres DNS privados de confianza, establezca `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` en el entorno del proceso de incorporación.

## Restablecimiento

```bash
openclaw onboard --reset
openclaw onboard --reset --reset-scope full
```

`--reset` borra el estado antes de ejecutar la configuración. `--reset-scope` controla el alcance: `config` (solo la configuración), `config+creds+sessions` (valor predeterminado cuando se pasa `--reset` sin un alcance) o `full` (también restablece el espacio de trabajo). El espacio de trabajo solo se restablece con `--reset-scope full`.

## Configuración regional

La incorporación interactiva utiliza la configuración regional del asistente de la CLI para el texto fijo de configuración. Orden de resolución:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. Inglés como alternativa

Las configuraciones regionales compatibles del asistente son `en`, `zh-CN` y `zh-TW`. Los valores de configuración regional pueden utilizar guiones bajos o formatos con sufijos POSIX, como `zh_CN.UTF-8`. Los nombres de productos, comandos, claves de configuración, URL, identificadores de proveedores, identificadores de modelos y etiquetas de plugins y canales se mantienen sin cambios.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

## Configuración no interactiva

`--non-interactive` requiere `--accept-risk` (reconoce que los agentes son potentes y que el acceso completo al sistema conlleva riesgos). El valor predeterminado de `--mode` es `local`.

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

`--custom-api-key` es opcional; si se omite, la incorporación comprueba `CUSTOM_API_KEY` en el entorno. OpenClaw marca automáticamente como compatibles con imágenes los identificadores habituales de modelos de visión (GPT-4o/4.1/5.x, Claude 3/4, Gemini, Qwen-VL, LLaVA, Pixtral y similares). Pase `--custom-image-input` para identificadores personalizados de visión desconocidos o `--custom-text-input` para forzar metadatos de solo texto. Use `--custom-compatibility openai-responses` para endpoints compatibles con OpenAI que admiten `/v1/responses`, pero no `/v1/chat/completions`; los valores válidos son `openai` (predeterminado), `openai-responses` y `anthropic`.

LM Studio también dispone de una opción de clave específica del proveedor:

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

El valor predeterminado de `--custom-base-url` es `http://127.0.0.1:11434`. `--custom-model-id` es opcional; si se omite, la incorporación utiliza los valores predeterminados sugeridos por Ollama. Los identificadores de modelos en la nube, como `kimi-k2.5:cloud`, también funcionan aquí.

Almacene las claves del proveedor como referencias en lugar de texto sin formato:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Con `--secret-input-mode ref`, la incorporación escribe referencias respaldadas por variables de entorno en lugar de valores de clave en texto sin formato: para los proveedores respaldados por perfiles de autenticación, se escribe `keyRef: { source: "env", provider: "default", id: <envVar> }`; para los proveedores personalizados, se escribe `models.providers.<id>.apiKey` de la misma forma (por ejemplo, `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`). Contrato: establezca la variable de entorno del proveedor en el entorno del proceso de incorporación (por ejemplo, `OPENAI_API_KEY`) y no pase además una opción de clave en línea, salvo que esa variable de entorno esté definida; un valor de opción sin la variable de entorno correspondiente produce un error inmediato con indicaciones.

### Autenticación del Gateway (no interactiva)

- `--gateway-auth token --gateway-token <token>` almacena un token en texto sin formato. `token` es el modo de autenticación predeterminado.
- `--gateway-auth token --gateway-token-ref-env <name>` almacena `gateway.auth.token` como una SecretRef de entorno. Requiere una variable de entorno no vacía con ese nombre en el entorno del proceso de incorporación.
- `--gateway-token` y `--gateway-token-ref-env` son mutuamente excluyentes.
- Con `--install-daemon`: un `gateway.auth.token` administrado mediante SecretRef se valida, pero no se conserva como texto sin formato resuelto en los metadatos del entorno del servicio supervisor; si la referencia no se puede resolver, la instalación se detiene de forma segura con indicaciones para corregirlo. Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados y `gateway.auth.mode` no está definido, la instalación se bloquea hasta que el modo se establezca explícitamente.
- La incorporación local escribe `gateway.mode="local"` en la configuración. Si posteriormente falta `gateway.mode` en un archivo de configuración, esto indica que la configuración está dañada o que una edición manual está incompleta, no un atajo válido para el modo local.
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

- A menos que se pase `--skip-health`, la incorporación espera a que haya un Gateway local accesible antes de finalizar correctamente.
- `--install-daemon` inicia primero la ruta de instalación del Gateway administrado. Sin esta opción, ya debe haber un Gateway local en ejecución (por ejemplo, `openclaw gateway run`).
- `--skip-health` omite la espera si solo se desean escrituras de configuración, espacio de trabajo e inicialización en la automatización.
- `--skip-bootstrap` establece `agents.defaults.skipBootstrap: true` y omite la creación de `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` y `BOOTSTRAP.md`.
- En Windows nativo, `--install-daemon` intenta primero usar las tareas programadas y recurre a un elemento de inicio de sesión por usuario en la carpeta Inicio si se deniega la creación de la tarea.

### Modo de referencia interactivo

- Elija **Usar referencia de secreto** cuando se solicite y, a continuación, **Variable de entorno** o un proveedor de secretos configurado (`file` o `exec`).
- La incorporación ejecuta una validación preliminar rápida antes de guardar la referencia y permite volver a intentarlo si falla.

### Opciones de endpoint de Z.AI

<Note>
`--auth-choice zai-api-key` detecta automáticamente el mejor endpoint y modelo de Z.AI para su clave: los endpoints de Coding Plan prefieren `zai/glm-5.2` (con respaldo en `glm-5.1` si no está disponible); los endpoints de la API general usan `zai/glm-5.1` de forma predeterminada. Para forzar un endpoint de Coding Plan, seleccione directamente `zai-coding-global` o `zai-coding-cn`.
</Note>

```bash
# Selección de endpoint sin indicaciones
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

## Indicadores adicionales para el modo no interactivo

Autenticación de modelos basada en tokens (utilizada con `--auth-choice token`):

| Indicador                       | Descripción                                                                                                                        |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `--token-provider <id>`         | Id. del proveedor de tokens que emite el token                                                                                     |
| `--token <token>`               | Valor del token para la autenticación del modelo                                                                                   |
| `--token-profile-id <id>`       | Id. del perfil de autenticación (valor predeterminado: `<provider>:manual`; algunos flujos administrados por el proveedor usan su propio valor predeterminado, como `anthropic:default`) |
| `--token-expires-in <duration>` | Duración opcional hasta que caduque el token (p. ej., `365d`, `12h`)                                                               |

Cloudflare AI Gateway: `--cloudflare-ai-gateway-account-id <id>`, `--cloudflare-ai-gateway-gateway-id <id>`.

Control de la instalación del daemon: `--no-install-daemon` / `--skip-daemon` (alias; omiten la instalación del servicio Gateway), `--daemon-runtime <node|bun>`.

Skills: `--node-manager <npm|pnpm|bun>` (valor predeterminado: `npm`), `--skip-skills`.

Configuración de la interfaz de usuario y los hooks: `--skip-ui` (omite las solicitudes de Control UI/TUI), `--skip-hooks` (omite la configuración de Webhooks/hooks), `--skip-channels`, `--skip-search`.

Salida: `--suppress-gateway-token-output` suprime la salida del Gateway o de la interfaz de usuario que contiene tokens (indicaciones sobre tokens, URL de inicio de sesión automático con el token incrustado e inicio automático de Control UI); resulta útil en terminales compartidos y en CI.

<Note>
`--json` no implica el modo no interactivo en la incorporación guiada o clásica.
Con `--modern`, JSON ofrece una vista general única de Crestodian y finaliza después de ese
único resultado. Use `--non-interactive` para otros scripts.
</Note>

## Filtrado previo de proveedores

Cuando una opción de autenticación implica un proveedor preferido, la incorporación filtra previamente los selectores del modelo predeterminado y de la lista de permitidos para mostrar los modelos de ese proveedor. El filtro también incluye otros proveedores administrados por el mismo Plugin, lo que abarca variantes de planes de programación como `volcengine`/`volcengine-plan` y `byteplus`/`byteplus-plan`. Si el filtro del proveedor preferido no devuelve ningún modelo cargado, la incorporación recurre al catálogo sin filtrar en lugar de dejar vacío el selector.

## Preguntas de seguimiento sobre la búsqueda web

Algunos proveedores de búsqueda web activan preguntas de seguimiento específicas del proveedor durante la incorporación:

- **Grok** puede ofrecer la configuración opcional de `x_search` con la misma autenticación de xAI y la selección de un modelo de `x_search`.
- **Kimi** puede solicitar la región de la API de Moonshot (`api.moonshot.ai` frente a `api.moonshot.cn`) y el modelo predeterminado de búsqueda web de Kimi.

## Otros comportamientos

- Comportamiento del ámbito de mensajes directos en la incorporación local: [referencia de configuración de la CLI](/es/start/wizard-cli-reference#outputs-and-internals).
- Primera conversación más rápida: `openclaw dashboard` (Control UI, sin configuración de canales).
- Proveedor personalizado: conecte cualquier endpoint compatible con OpenAI o Anthropic, incluidos los proveedores alojados que no figuren en la lista. Use la compatibilidad **Desconocida** para detectarla automáticamente mediante una prueba en vivo.
- Si se detecta el estado de Hermes, la incorporación ofrece un flujo de migración (consulte `--flow import` más arriba).

## Comandos de seguimiento habituales

Use `openclaw configure` más adelante para realizar cambios específicos que no sean de inferencia y `openclaw
channels add` para configurar únicamente canales. Para cambiar el proveedor de modelos o la ruta de autenticación,
ejecute `openclaw onboard` en su lugar.

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```
