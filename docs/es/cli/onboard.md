---
read_when:
    - Quieres establecer la inferencia y luego finalizar la configuración con Crestodian
summary: Referencia de la CLI para `openclaw onboard` (incorporación interactiva)
title: Incorporar
x-i18n:
    generated_at: "2026-07-11T23:00:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e9dad7efda492e0d9ef01ef08a1fd8c81272a0d9b3aa3b945917b6878159a06
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Configuración guiada que establece primero la inferencia: detecta el acceso existente a la IA,
requiere una finalización real, conserva únicamente la ruta que funciona y, después, inicia
Crestodian para configurar el resto. `openclaw setup` es el mismo punto de entrada;
`openclaw setup --baseline` solo escribe la configuración y el espacio de trabajo de referencia.

<CardGroup cols={2}>
  <Card title="Centro de incorporación de la CLI" href="/es/start/wizard" icon="rocket">
    Recorrido por el flujo interactivo de la CLI.
  </Card>
  <Card title="Descripción general de la incorporación" href="/es/start/onboarding-overview" icon="map">
    Cómo se integran las distintas partes de la incorporación de OpenClaw.
  </Card>
  <Card title="Referencia de configuración de la CLI" href="/es/start/wizard-cli-reference" icon="book">
    Resultados, funcionamiento interno y comportamiento de cada paso.
  </Card>
  <Card title="Automatización de la CLI" href="/es/start/wizard-cli-automation" icon="terminal">
    Opciones no interactivas y configuraciones mediante scripts.
  </Card>
  <Card title="Incorporación en la aplicación para macOS" href="/es/start/onboarding" icon="apple">
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
  `--non-interactive`; omite `--classic` para la configuración automatizada.
- `--flow quickstart`: abre el asistente clásico con las mínimas indicaciones y
  genera automáticamente un token del Gateway.
- `--flow manual` (alias `advanced`): abre el asistente clásico con todas las indicaciones
  para el puerto, la vinculación y la autenticación.
- `--flow import`: ejecuta un proveedor de migración detectado (por ejemplo, Hermes mediante `--import-from hermes`), muestra una vista previa del plan y, después, lo aplica tras la confirmación. La importación solo se ejecuta sobre una configuración nueva de OpenClaw; si ya existen, restablece primero la configuración, las credenciales, las sesiones y el estado del espacio de trabajo. Usa [`openclaw migrate`](/es/cli/migrate) para obtener planes de simulación, el modo de sobrescritura, informes y asignaciones exactas.
- `--modern` es un alias de compatibilidad para el asistente de configuración
  conversacional Crestodian. Usa la misma comprobación de inferencia real que `openclaw crestodian` y
  solo acepta `--workspace`, `--accept-risk`,
  `--non-interactive` y `--json`. Las demás opciones de configuración se rechazan en lugar de
  ignorarse silenciosamente.

## Flujo guiado

`openclaw onboard` sin opciones inicia el flujo guiado. Muestra el aviso de seguridad,
detecta el acceso a la IA que ya esté disponible mediante modelos configurados, variables
de entorno con claves de API y CLI locales compatibles, y después prueba el
candidato recomendado con una finalización real. Si ese candidato falla, la incorporación muestra
el motivo y prueba automáticamente el siguiente candidato utilizable.

Si se agotan las opciones de detección automática, elige otro candidato detectado o introduce
una clave de API del proveedor en una solicitud enmascarada. Las claves introducidas manualmente se prueban mediante la misma
ruta de finalización real. La incorporación guiada
no ofrece Crestodian ni una salida que omita la IA antes de que algún candidato supere la prueba. OpenClaw
conserva únicamente la ruta del modelo verificado y sus credenciales después de que la prueba
finaliza correctamente; un candidato fallido no sustituye el modelo configurado ni guarda las
credenciales que se intentaron usar. La configuración del espacio de trabajo y del Gateway no cambia hasta
que se inicia Crestodian.

En el modo guiado, `--workspace <dir>` proporciona el espacio de trabajo propuesto por Crestodian
y el contexto de inferencia aislado. No se conserva hasta que apruebas la
propuesta de configuración de Crestodian. La incorporación clásica y la no interactiva conservan su
espacio de trabajo mediante sus flujos de configuración habituales.

Una vez superada la prueba de inferencia, la incorporación guiada inicia inmediatamente Crestodian con
el modelo verificado. Crestodian puede configurar entonces el espacio de trabajo, el Gateway,
los canales, los agentes, los plugins y otras funciones opcionales. Dentro de Crestodian, usa
`open channel wizard for <channel>` para delegar la recopilación de credenciales del canal en un
asistente de terminal enmascarado. Para cambiar el proveedor del modelo o su autenticación,
sal de Crestodian y ejecuta `openclaw onboard`; Crestodian no abre los flujos
guiados ni clásicos de proveedores.

En una instalación configurada, volver a ejecutar `openclaw onboard` verifica primero el
modelo predeterminado actual, por lo que el mismo flujo funciona como un proceso de verificación y reparación.
Si esa comprobación falla, el modelo configurado nunca se sustituye automáticamente:
la incorporación se detiene y pregunta cómo continuar. La comprobación se ejecuta fuera de tu
espacio de trabajo, por lo que un modelo proporcionado por un plugin del espacio de trabajo puede fallar aquí y seguir
funcionando en el agente.
Usa `openclaw onboard --classic` para la autenticación específica del proveedor, los canales, las Skills,
la configuración remota del Gateway, las importaciones o los controles completos del Gateway. Para la configuración y
reparación conversacionales no relacionadas con la inferencia, ejecuta `openclaw crestodian`; `openclaw onboard
--modern` es un alias de compatibilidad que pasa por la misma comprobación de inferencia. El asistente
clásico puede verificar opcionalmente el modelo predeterminado con una finalización real, pero
Crestodian no se iniciará hasta que supere su propia comprobación de inferencia real.

En una terminal interactiva, `openclaw` sin subcomando dirige el flujo según el estado de la
configuración:

- Si falta el archivo de configuración activo o no contiene ajustes definidos (está vacío o
  contiene solo metadatos), inicia la incorporación guiada.
- Si el archivo de configuración existe, pero no supera la validación, inicia la ruta de
  incorporación clásica con las indicaciones de `openclaw doctor`. Crestodian necesita que la
  inferencia funcione y no se utiliza para reparar este estado previo a la inferencia.
- Si el archivo de configuración es válido, abre la TUI normal del agente. Un Gateway
  configurado y accesible con un agente y un modelo lleva directamente a esa interfaz sin
  pasar por la incorporación ni Crestodian. En una instalación configurada, accede a Crestodian con
  `/crestodian` dentro de la TUI o mediante `openclaw crestodian`.

Se acepta `ws://` en texto sin formato para local loopback, direcciones IP privadas literales, `.local` y direcciones URL de Gateway de Tailnet `*.ts.net`. Para otros nombres DNS privados de confianza, establece `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` en el entorno del proceso de incorporación.

## Restablecimiento

```bash
openclaw onboard --reset
openclaw onboard --reset --reset-scope full
```

`--reset` borra el estado antes de ejecutar la configuración. `--reset-scope` controla cuánto se borra: `config` (solo la configuración), `config+creds+sessions` (valor predeterminado cuando se pasa `--reset` sin un ámbito) o `full` (también restablece el espacio de trabajo). El espacio de trabajo solo se restablece con `--reset-scope full`.

## Configuración regional

La incorporación interactiva usa la configuración regional del asistente de la CLI para los textos fijos de configuración. Orden de resolución:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. Inglés como alternativa

Las configuraciones regionales compatibles con el asistente son `en`, `zh-CN` y `zh-TW`. Los valores de configuración regional pueden usar guiones bajos o sufijos POSIX, como `zh_CN.UTF-8`. Los nombres de productos, nombres de comandos, claves de configuración, direcciones URL, identificadores de proveedores, identificadores de modelos y etiquetas de plugins o canales se mantienen literales.

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

`--custom-api-key` es opcional; si se omite, la incorporación busca `CUSTOM_API_KEY` en el entorno. OpenClaw marca automáticamente como compatibles con imágenes los identificadores habituales de modelos de visión (GPT-4o/4.1/5.x, Claude 3/4, Gemini, Qwen-VL, LLaVA, Pixtral y similares). Pasa `--custom-image-input` para identificadores personalizados desconocidos de modelos de visión, o `--custom-text-input` para forzar metadatos de solo texto. Usa `--custom-compatibility openai-responses` para puntos de conexión compatibles con OpenAI que admitan `/v1/responses`, pero no `/v1/chat/completions`; los valores válidos son `openai` (predeterminado), `openai-responses` y `anthropic`.

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

El valor predeterminado de `--custom-base-url` es `http://127.0.0.1:11434`. `--custom-model-id` es opcional; si se omite, la incorporación usa los valores predeterminados sugeridos por Ollama. Los identificadores de modelos en la nube, como `kimi-k2.5:cloud`, también funcionan aquí.

Almacena las claves de proveedores como referencias en lugar de texto sin formato:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Con `--secret-input-mode ref`, la incorporación escribe referencias respaldadas por variables de entorno en lugar de valores de claves en texto sin formato: para los proveedores respaldados por perfiles de autenticación, escribe `keyRef: { source: "env", provider: "default", id: <envVar> }`; para los proveedores personalizados, escribe `models.providers.<id>.apiKey` de la misma forma (por ejemplo, `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`). Contrato: establece la variable de entorno del proveedor en el entorno del proceso de incorporación (por ejemplo, `OPENAI_API_KEY`) y no pases también una opción de clave insertada directamente, a menos que esa variable de entorno esté definida; un valor de opción sin la variable de entorno correspondiente falla de inmediato y muestra indicaciones.

### Autenticación del Gateway (no interactiva)

- `--gateway-auth token --gateway-token <token>` almacena un token en texto sin formato. `token` es el modo de autenticación predeterminado.
- `--gateway-auth token --gateway-token-ref-env <name>` almacena `gateway.auth.token` como una SecretRef de entorno. Requiere una variable de entorno no vacía con ese nombre en el entorno del proceso de incorporación.
- `--gateway-token` y `--gateway-token-ref-env` son mutuamente excluyentes.
- Con `--install-daemon`: un `gateway.auth.token` administrado mediante SecretRef se valida, pero no se conserva como texto sin formato resuelto en los metadatos del entorno de servicio del supervisor; si la referencia no se puede resolver, la instalación se cierra de forma segura y muestra instrucciones para corregirlo. Si se configuran tanto `gateway.auth.token` como `gateway.auth.password` y no se establece `gateway.auth.mode`, la instalación se bloquea hasta que se establezca el modo explícitamente.
- La incorporación local escribe `gateway.mode="local"` en la configuración. Que posteriormente falte `gateway.mode` en un archivo de configuración indica que la configuración está dañada o que se realizó una edición manual incompleta, no un atajo válido para el modo local.
- La incorporación local instala los plugins descargables que requiera la ruta de configuración elegida (por ejemplo, un plugin de tiempo de ejecución de Codex o Copilot para esas opciones de autenticación). La incorporación remota solo escribe la información de conexión del Gateway remoto; nunca instala paquetes de plugins locales.
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

### Estado del gateway local

- A menos que pases `--skip-health`, la incorporación espera a que haya un gateway local accesible antes de finalizar correctamente.
- `--install-daemon` inicia primero la ruta de instalación del gateway administrado. Sin esta opción, ya debe estar ejecutándose un gateway local (por ejemplo, `openclaw gateway run`).
- `--skip-health` omite la espera si solo quieres escribir la configuración, el espacio de trabajo y el arranque inicial mediante automatización.
- `--skip-bootstrap` establece `agents.defaults.skipBootstrap: true` y omite la creación de `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` y `BOOTSTRAP.md`.
- En Windows nativo, `--install-daemon` intenta usar primero las tareas programadas y, si se deniega su creación, recurre a un elemento de inicio de sesión por usuario en la carpeta de inicio.

### Modo de referencia interactivo

- Elige **Usar una referencia de secreto** cuando se te solicite y, después, **Variable de entorno** o un proveedor de secretos configurado (`file` o `exec`).
- La incorporación ejecuta una validación preliminar rápida antes de guardar la referencia y permite volver a intentarlo en caso de error.

### Opciones de punto de conexión de Z.AI

<Note>
`--auth-choice zai-api-key` detecta automáticamente el endpoint y el modelo de Z.AI más adecuados para tu clave: los endpoints de Coding Plan prefieren `zai/glm-5.2` (con `glm-5.1` como alternativa si no está disponible); los endpoints de la API general usan `zai/glm-5.1` de forma predeterminada. Para forzar un endpoint de Coding Plan, elige directamente `zai-coding-global` o `zai-coding-cn`.
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

## Indicadores no interactivos adicionales

Autenticación de modelos basada en tokens (se usa con `--auth-choice token`):

| Indicador                       | Descripción                                                                                                                        |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `--token-provider <id>`         | Identificador del proveedor que emite el token                                                                                     |
| `--token <token>`               | Valor del token para la autenticación del modelo                                                                                   |
| `--token-profile-id <id>`       | Identificador del perfil de autenticación (valor predeterminado: `<provider>:manual`; algunos flujos gestionados por el proveedor usan su propio valor predeterminado, como `anthropic:default`) |
| `--token-expires-in <duration>` | Duración opcional hasta el vencimiento del token (p. ej., `365d`, `12h`)                                                           |

Cloudflare AI Gateway: `--cloudflare-ai-gateway-account-id <id>`, `--cloudflare-ai-gateway-gateway-id <id>`.

Control de instalación del daemon: `--no-install-daemon` / `--skip-daemon` (alias; omiten la instalación del servicio Gateway), `--daemon-runtime <node|bun>`.

Skills: `--node-manager <npm|pnpm|bun>` (valor predeterminado: `npm`), `--skip-skills`.

Configuración de la interfaz de usuario y los hooks: `--skip-ui` (omite las solicitudes de Control UI/TUI), `--skip-hooks` (omite la configuración de Webhooks/hooks), `--skip-channels`, `--skip-search`.

Salida: `--suppress-gateway-token-output` suprime la salida del Gateway y de la interfaz de usuario que contiene tokens (indicaciones sobre tokens, URL de inicio de sesión automático con el token incorporado e inicio automático de Control UI); resulta útil en terminales compartidos y en CI.

<Note>
`--json` no implica el modo no interactivo en la incorporación guiada ni en la clásica.
Con `--modern`, JSON ofrece una vista general única de Crestodian y finaliza después
de ese único resultado. Usa `--non-interactive` para otros scripts.
</Note>

## Filtrado previo de proveedores

Cuando una opción de autenticación implica un proveedor preferido, la incorporación filtra previamente los selectores del modelo predeterminado y de la lista de permitidos para mostrar los modelos de ese proveedor. El filtro también incluye otros proveedores gestionados por el mismo Plugin, lo que abarca variantes de planes de programación como `volcengine`/`volcengine-plan` y `byteplus`/`byteplus-plan`. Si el filtro del proveedor preferido no produce ningún modelo cargado, la incorporación vuelve al catálogo sin filtrar en lugar de dejar vacío el selector.

## Preguntas de seguimiento sobre la búsqueda web

Algunos proveedores de búsqueda web activan preguntas de seguimiento específicas del proveedor durante la incorporación:

- **Grok** puede ofrecer la configuración opcional de `x_search` con la misma autenticación de xAI y una opción de modelo para `x_search`.
- **Kimi** puede solicitar la región de la API de Moonshot (`api.moonshot.ai` o `api.moonshot.cn`) y el modelo predeterminado de búsqueda web de Kimi.

## Otros comportamientos

- Comportamiento del ámbito de mensajes directos durante la incorporación local: [referencia de configuración de la CLI](/es/start/wizard-cli-reference#outputs-and-internals).
- Primer chat más rápido: `openclaw dashboard` (Control UI, sin configurar canales).
- Proveedor personalizado: conecta cualquier endpoint compatible con OpenAI o Anthropic, incluidos proveedores alojados que no aparecen en la lista. Usa la compatibilidad **Desconocida** para realizar la detección automática mediante una prueba en vivo.
- Si se detecta el estado de Hermes, la incorporación ofrece un flujo de migración (consulta `--flow import` más arriba).

## Comandos de seguimiento habituales

Usa `openclaw configure` más adelante para realizar cambios específicos no relacionados con la inferencia y `openclaw
channels add` para configurar únicamente canales. Para cambiar el proveedor de modelos o la ruta de autenticación,
ejecuta `openclaw onboard` en su lugar.

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```
