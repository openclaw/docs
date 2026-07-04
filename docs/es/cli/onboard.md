---
read_when:
    - Quieres una configuración guiada para Gateway, espacio de trabajo, autenticación, canales y Skills
summary: Referencia de CLI para `openclaw onboard` (incorporación interactiva)
title: Incorporación
x-i18n:
    generated_at: "2026-07-04T20:24:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 99362cdca49929f7d05c2bf7bd8b0a55811b7ad6c618be90effb8869cd2ad839
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Incorporación guiada completa para configurar un Gateway local o remoto. Úsalo cuando quieras que OpenClaw guíe en un solo flujo la autenticación del modelo, el espacio de trabajo, el Gateway, los canales, las Skills y el estado.

## Guías relacionadas

<CardGroup cols={2}>
  <Card title="Centro de incorporación de la CLI" href="/es/start/wizard" icon="rocket">
    Recorrido del flujo interactivo de la CLI.
  </Card>
  <Card title="Descripción general de la incorporación" href="/es/start/onboarding-overview" icon="map">
    Cómo encaja la incorporación de OpenClaw.
  </Card>
  <Card title="Referencia de configuración de la CLI" href="/es/start/wizard-cli-reference" icon="book">
    Salidas, detalles internos y comportamiento por paso.
  </Card>
  <Card title="Automatización de la CLI" href="/es/start/wizard-cli-automation" icon="terminal">
    Marcas no interactivas y configuraciones con scripts.
  </Card>
  <Card title="Incorporación de la app de macOS" href="/es/start/onboarding" icon="apple">
    Flujo de incorporación para la app de la barra de menús de macOS.
  </Card>
</CardGroup>

## Ejemplos

```bash
openclaw onboard
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --flow import
openclaw onboard --import-from hermes --import-source ~/.hermes
openclaw onboard --skip-bootstrap
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

`--flow import` usa proveedores de migración propiedad del plugin, como Hermes. Solo se ejecuta sobre una configuración nueva de OpenClaw; si ya existen archivos de configuración, credenciales, sesiones o memoria/identidad del espacio de trabajo, restablece la configuración o elige una configuración nueva antes de importar.

`--modern` inicia la vista previa de incorporación conversacional de Crestodian. Sin
`--modern`, `openclaw onboard` mantiene el flujo de incorporación clásico.

En una terminal interactiva, `openclaw` sin argumentos (sin subcomando) enruta según el estado de la configuración:

- Si falta el archivo de configuración activo o no tiene ajustes escritos por el usuario (vacío o solo con metadatos), inicia este flujo de incorporación clásico.
- Si el archivo de configuración existe pero no pasa la validación, inicia
  [Crestodian](/es/cli/crestodian) para repararlo.
- Si el archivo de configuración es válido, abre la TUI normal del agente, ya sea localmente o conectada a un Gateway configurado alcanzable. En una instalación configurada, accede a Crestodian con `/crestodian` dentro de la TUI o `openclaw crestodian`.

Se acepta `ws://` en texto sin formato para URLs de Gateway de loopback, literales de IP privada, `.local` y Tailnet `*.ts.net`. Para otros nombres privados de DNS de confianza, establece `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` en el entorno del proceso de incorporación.

## Configuración regional

La incorporación interactiva usa la configuración regional del asistente de la CLI para los textos fijos de configuración. El orden de resolución es:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. Alternativa en inglés

Las configuraciones regionales compatibles del asistente son `en`, `zh-CN` y `zh-TW`. Los valores de configuración regional pueden usar guion bajo o sufijos POSIX, como `zh_CN.UTF-8`. Los nombres de producto, nombres de comandos, claves de configuración, URLs, IDs de proveedor, IDs de modelo y etiquetas de plugin/canal permanecen literales.

Ejemplo:

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

Proveedor personalizado no interactivo:

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

`--custom-api-key` es opcional en modo no interactivo. Si se omite, la incorporación comprueba `CUSTOM_API_KEY`.
OpenClaw marca automáticamente como compatibles con imágenes los IDs de modelos de visión comunes. Pasa `--custom-image-input` para IDs de visión personalizados desconocidos, o `--custom-text-input` para forzar metadatos solo de texto.
Usa `--custom-compatibility openai-responses` para endpoints compatibles con OpenAI que admiten `/v1/responses` pero no `/v1/chat/completions`.

LM Studio también admite una marca de clave específica del proveedor en modo no interactivo:

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

`--custom-base-url` usa `http://127.0.0.1:11434` de forma predeterminada. `--custom-model-id` es opcional; si se omite, la incorporación usa los valores predeterminados sugeridos por Ollama. Los IDs de modelos en la nube como `kimi-k2.5:cloud` también funcionan aquí.

Almacena claves de proveedor como referencias en lugar de texto sin formato:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Con `--secret-input-mode ref`, la incorporación escribe referencias respaldadas por variables de entorno en lugar de valores de clave en texto sin formato.
Para proveedores respaldados por perfiles de autenticación, esto escribe entradas `keyRef`; para proveedores personalizados, escribe `models.providers.<id>.apiKey` como una referencia de entorno (por ejemplo, `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Contrato del modo no interactivo `ref`:

- Establece la variable de entorno del proveedor en el entorno del proceso de incorporación (por ejemplo, `OPENAI_API_KEY`).
- No pases marcas de clave en línea (por ejemplo, `--openai-api-key`) a menos que esa variable de entorno también esté establecida.
- Si se pasa una marca de clave en línea sin la variable de entorno requerida, la incorporación falla de inmediato con orientación.

Opciones de token de Gateway en modo no interactivo:

- `--gateway-auth token --gateway-token <token>` almacena un token en texto sin formato.
- `--gateway-auth token --gateway-token-ref-env <name>` almacena `gateway.auth.token` como un SecretRef de entorno.
- `--gateway-token` y `--gateway-token-ref-env` son mutuamente excluyentes.
- `--gateway-token-ref-env` requiere una variable de entorno no vacía en el entorno del proceso de incorporación.
- Con `--install-daemon`, cuando la autenticación con token requiere un token, los tokens de Gateway gestionados con SecretRef se validan, pero no se persisten como texto sin formato resuelto en los metadatos del entorno del servicio supervisor.
- Con `--install-daemon`, si el modo de token requiere un token y el SecretRef de token configurado no se puede resolver, la incorporación falla de forma cerrada con orientación de remediación.
- Con `--install-daemon`, si `gateway.auth.token` y `gateway.auth.password` están configurados y `gateway.auth.mode` no está definido, la incorporación bloquea la instalación hasta que el modo se establezca explícitamente.
- La incorporación local escribe `gateway.mode="local"` en la configuración. Si a un archivo de configuración posterior le falta `gateway.mode`, trátalo como daño de configuración o una edición manual incompleta, no como un acceso directo válido de modo local.
- La incorporación local instala los plugins descargables seleccionados cuando la ruta de configuración elegida los requiere.
- La incorporación remota solo escribe información de conexión para el Gateway remoto y no instala paquetes de plugins locales.
- `--allow-unconfigured` es una vía de escape separada del runtime del Gateway. No significa que la incorporación pueda omitir `gateway.mode`.

Ejemplo:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

Estado del Gateway local no interactivo:

- A menos que pases `--skip-health`, la incorporación espera a que haya un Gateway local alcanzable antes de salir correctamente.
- `--install-daemon` inicia primero la ruta de instalación del Gateway gestionado. Sin ella, ya debes tener un Gateway local en ejecución, por ejemplo `openclaw gateway run`.
- Si en automatización solo quieres escrituras de configuración/espacio de trabajo/bootstrap, usa `--skip-health`.
- Si gestionas los archivos del espacio de trabajo por tu cuenta, pasa `--skip-bootstrap` para establecer `agents.defaults.skipBootstrap: true` y omitir la creación de `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` y `BOOTSTRAP.md`.
- En Windows nativo, `--install-daemon` intenta primero con Tareas programadas y recurre a un elemento de inicio de sesión en la carpeta de Inicio por usuario si se deniega la creación de la tarea.

Comportamiento de incorporación interactiva con modo de referencia:

- Elige **Usar referencia de secreto** cuando se te solicite.
- Luego elige una de estas opciones:
  - Variable de entorno
  - Proveedor de secretos configurado (`file` o `exec`)
- La incorporación realiza una validación previa rápida antes de guardar la referencia.
  - Si la validación falla, la incorporación muestra el error y te permite volver a intentarlo.

### Opciones de endpoint de Z.AI no interactivas

<Note>
`--auth-choice zai-api-key` detecta automáticamente el mejor endpoint y modelo de Z.AI para
tu clave. Los endpoints de Coding Plan prefieren `zai/glm-5.2`; los endpoints de API general usan
`zai/glm-5.1`. Para forzar un endpoint de Coding Plan, elige `zai-coding-global` o
`zai-coding-cn`.
</Note>

```bash
# Promptless endpoint selection
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Other Z.AI endpoint choices:
# --auth-choice zai-coding-cn
# --auth-choice zai-global
# --auth-choice zai-cn
```

Ejemplo no interactivo de Mistral:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

## Marcas no interactivas adicionales

Autenticación de modelo basada en token (no interactiva; se usa con `--auth-choice token`):

- `--token-provider <id>` — ID del proveedor de token. Identifica qué proveedor emite el token.
- `--token <token>` — Valor del token para la autenticación del modelo.
- `--token-profile-id <id>` — ID del perfil de autenticación. El almacenamiento genérico de tokens usa `<provider>:manual` de forma predeterminada; los flujos de configuración propiedad del proveedor pueden usar su propio valor predeterminado, como `anthropic:default`.
- `--token-expires-in <duration>` — Duración opcional de vencimiento del token (por ejemplo, `365d`, `12h`).

Cloudflare AI Gateway (no interactivo):

- `--cloudflare-ai-gateway-account-id <id>` — ID de cuenta de Cloudflare para enrutar mediante Cloudflare AI Gateway.
- `--cloudflare-ai-gateway-gateway-id <id>` — ID de Cloudflare AI Gateway.

Control de instalación del daemon:

- `--no-install-daemon` — Omite explícitamente la instalación del servicio de Gateway.
- `--skip-daemon` — Alias de `--no-install-daemon`.

Control de configuración de UI y hooks:

- `--skip-ui` — Omite los avisos de Control UI / TUI durante la incorporación.
- `--skip-hooks` — Omite los avisos de configuración de webhook / hook durante la incorporación.

Supresión de salida:

- `--suppress-gateway-token-output` — Suprime la salida de Gateway/UI que contiene tokens (sugerencias de token, URL de inicio de sesión automático con token incrustado e inicio automático de Control UI). Útil en entornos de terminal compartida y CI.

## Notas de flujo

<AccordionGroup>
  <Accordion title="Tipos de flujo">
    - `quickstart`: avisos mínimos, genera automáticamente un token de Gateway.
    - `manual`: avisos completos para puerto, enlace y autenticación (alias de `advanced`).
    - `import`: ejecuta un proveedor de migración detectado, muestra una vista previa del plan y luego lo aplica tras la confirmación.

  </Accordion>
  <Accordion title="Prefiltrado de proveedores">
    Cuando una opción de autenticación implica un proveedor preferido, la incorporación prefiltra los selectores de modelo predeterminado y lista de permitidos a ese proveedor. Para Volcengine y BytePlus, esto también coincide con las variantes de Coding Plan (`volcengine-plan/*`, `byteplus-plan/*`).

    Si el filtro de proveedor preferido todavía no produce modelos cargados, la incorporación vuelve al catálogo sin filtrar en lugar de dejar el selector vacío.

  </Accordion>
  <Accordion title="Seguimientos de búsqueda web">
    Algunos proveedores de búsqueda web activan avisos de seguimiento específicos del proveedor:

    - **Grok** puede ofrecer una configuración opcional de `x_search` con el mismo perfil de OAuth de xAI o clave de API y una opción de modelo `x_search`.
    - **Kimi** puede pedir la región de la API de Moonshot (`api.moonshot.ai` frente a `api.moonshot.cn`) y el modelo predeterminado de búsqueda web de Kimi.

  </Accordion>
  <Accordion title="Otros comportamientos">
    - Comportamiento de alcance de DM en la incorporación local: [Referencia de configuración de la CLI](/es/start/wizard-cli-reference#outputs-and-internals).
    - Primer chat más rápido: `openclaw dashboard` (Control UI, sin configuración de canal).
    - Proveedor personalizado: conecta cualquier endpoint compatible con OpenAI o Anthropic, incluidos proveedores alojados que no aparecen en la lista. Usa Unknown para la detección automática.
    - Si se detecta estado de Hermes, la incorporación ofrece un flujo de migración. Usa [Migrar](/es/cli/migrate) para planes de simulación, modo de sobrescritura, informes y asignaciones exactas.

  </Accordion>
</AccordionGroup>

## Comandos comunes de seguimiento

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

Usa `openclaw setup` como el mismo punto de entrada guiado para la incorporación. Usa `openclaw setup --baseline` cuando solo necesites la configuración o el espacio de trabajo base, `openclaw configure` más adelante para cambios específicos y `openclaw channels add` para configurar solo canales.

<Note>
`--json` no implica modo no interactivo. Usa `--non-interactive` para scripts.
</Note>
