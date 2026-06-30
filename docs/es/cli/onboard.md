---
read_when:
    - Quieres una configuración guiada para Gateway, espacio de trabajo, autenticación, canales y Skills
summary: Referencia de CLI para `openclaw onboard` (incorporación interactiva)
title: Incorporar
x-i18n:
    generated_at: "2026-06-30T22:05:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e0a3c2dea3f8116bb3282d5fb160cf34d9a6f0eefcc072abcff2287d5801184
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Incorporación guiada completa para la configuración local o remota de Gateway. Usa esto cuando quieras que OpenClaw recorra la autenticación del modelo, el espacio de trabajo, el gateway, los canales, las Skills y el estado en un solo flujo.

## Guías relacionadas

<CardGroup cols={2}>
  <Card title="Centro de incorporación de CLI" href="/es/start/wizard" icon="rocket">
    Recorrido del flujo interactivo de CLI.
  </Card>
  <Card title="Resumen de incorporación" href="/es/start/onboarding-overview" icon="map">
    Cómo encaja la incorporación de OpenClaw.
  </Card>
  <Card title="Referencia de configuración de CLI" href="/es/start/wizard-cli-reference" icon="book">
    Salidas, detalles internos y comportamiento por paso.
  </Card>
  <Card title="Automatización de CLI" href="/es/start/wizard-cli-automation" icon="terminal">
    Flags no interactivas y configuraciones con scripts.
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

`--flow import` usa proveedores de migración propiedad del plugin, como Hermes. Solo se ejecuta contra una configuración nueva de OpenClaw; si hay archivos existentes de configuración, credenciales, sesiones o memoria/identidad del espacio de trabajo, restablece o elige una configuración nueva antes de importar.

`--modern` inicia la vista previa de incorporación conversacional de Crestodian. Sin
`--modern`, `openclaw onboard` mantiene el flujo de incorporación clásico.

En una instalación nueva donde falta el archivo de configuración activo o no tiene
ajustes definidos por el usuario (vacío o solo metadatos), `openclaw` sin argumentos también inicia el flujo
de incorporación clásico. Una vez que un archivo de configuración tiene ajustes definidos por el usuario, `openclaw` sin argumentos
abre Crestodian en su lugar.

`ws://` en texto plano se acepta para loopback, literales de IP privadas, `.local` y
URL de Gateway de Tailnet `*.ts.net`. Para otros nombres DNS privados de confianza, define
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` en el entorno del proceso de incorporación.

## Idioma

La incorporación interactiva usa el idioma del asistente de CLI para el texto fijo de configuración. El orden
de resolución es:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. Repliegue a inglés

Los idiomas compatibles del asistente son `en`, `zh-CN` y `zh-TW`. Los valores de idioma pueden usar
guion bajo o formas con sufijo POSIX como `zh_CN.UTF-8`. Los nombres de producto, nombres de comando,
claves de configuración, URL, ID de proveedores, ID de modelos y etiquetas de plugin/canal
permanecen literales.

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
OpenClaw marca automáticamente como compatibles con imágenes los ID comunes de modelos de visión. Pasa `--custom-image-input` para ID de visión personalizados desconocidos, o `--custom-text-input` para forzar metadatos solo de texto.
Usa `--custom-compatibility openai-responses` para endpoints compatibles con OpenAI que admiten `/v1/responses` pero no `/v1/chat/completions`.

LM Studio también admite una flag de clave específica del proveedor en modo no interactivo:

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

`--custom-base-url` usa `http://127.0.0.1:11434` de forma predeterminada. `--custom-model-id` es opcional; si se omite, la incorporación usa los valores predeterminados sugeridos por Ollama. Los ID de modelos en la nube como `kimi-k2.5:cloud` también funcionan aquí.

Almacena las claves de proveedor como refs en lugar de texto plano:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Con `--secret-input-mode ref`, la incorporación escribe refs respaldadas por env en lugar de valores de clave en texto plano.
Para proveedores respaldados por perfil de autenticación, esto escribe entradas `keyRef`; para proveedores personalizados, esto escribe `models.providers.<id>.apiKey` como una ref de env (por ejemplo `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Contrato del modo no interactivo `ref`:

- Define la variable env del proveedor en el entorno del proceso de incorporación (por ejemplo, `OPENAI_API_KEY`).
- No pases flags de clave en línea (por ejemplo, `--openai-api-key`) salvo que esa variable env también esté definida.
- Si se pasa una flag de clave en línea sin la variable env requerida, la incorporación falla rápido con orientación.

Opciones de token de Gateway en modo no interactivo:

- `--gateway-auth token --gateway-token <token>` almacena un token en texto plano.
- `--gateway-auth token --gateway-token-ref-env <name>` almacena `gateway.auth.token` como un SecretRef de env.
- `--gateway-token` y `--gateway-token-ref-env` son mutuamente excluyentes.
- `--gateway-token-ref-env` requiere una variable env no vacía en el entorno del proceso de incorporación.
- Con `--install-daemon`, cuando la autenticación por token requiere un token, los tokens de gateway gestionados por SecretRef se validan pero no se persisten como texto plano resuelto en los metadatos del entorno del servicio supervisor.
- Con `--install-daemon`, si el modo de token requiere un token y el SecretRef de token configurado no se puede resolver, la incorporación falla de forma cerrada con orientación de corrección.
- Con `--install-daemon`, si tanto `gateway.auth.token` como `gateway.auth.password` están configurados y `gateway.auth.mode` no está definido, la incorporación bloquea la instalación hasta que el modo se defina explícitamente.
- La incorporación local escribe `gateway.mode="local"` en la configuración. Si a un archivo de configuración posterior le falta `gateway.mode`, trátalo como daño de configuración o una edición manual incompleta, no como un atajo válido de modo local.
- La incorporación local instala los plugins descargables seleccionados cuando la ruta de configuración elegida los requiere.
- La incorporación remota solo escribe información de conexión para el Gateway remoto y no instala paquetes de plugins locales.
- `--allow-unconfigured` es una vía de escape independiente del runtime del gateway. No significa que la incorporación pueda omitir `gateway.mode`.

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

Estado del gateway local no interactivo:

- Salvo que pases `--skip-health`, la incorporación espera a que se pueda acceder a un gateway local antes de salir correctamente.
- `--install-daemon` inicia primero la ruta de instalación del gateway gestionado. Sin ello, ya debes tener un gateway local en ejecución, por ejemplo `openclaw gateway run`.
- Si solo quieres escrituras de configuración/espacio de trabajo/bootstrap en automatización, usa `--skip-health`.
- Si gestionas tú mismo los archivos del espacio de trabajo, pasa `--skip-bootstrap` para definir `agents.defaults.skipBootstrap: true` y omitir la creación de `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` y `BOOTSTRAP.md`.
- En Windows nativo, `--install-daemon` prueba primero las tareas programadas y recurre a un elemento de inicio de sesión en la carpeta Inicio por usuario si se deniega la creación de la tarea.

Comportamiento de la incorporación interactiva con modo de referencia:

- Elige **Usar referencia secreta** cuando se te solicite.
- Luego elige una de estas opciones:
  - Variable de entorno
  - Proveedor de secretos configurado (`file` o `exec`)
- La incorporación realiza una validación preliminar rápida antes de guardar la ref.
  - Si la validación falla, la incorporación muestra el error y te permite reintentarlo.

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

## Notas del flujo

<AccordionGroup>
  <Accordion title="Tipos de flujo">
    - `quickstart`: prompts mínimos, genera automáticamente un token de gateway.
    - `manual`: prompts completos para puerto, enlace y autenticación (alias de `advanced`).
    - `import`: ejecuta un proveedor de migración detectado, muestra una vista previa del plan y luego lo aplica tras confirmación.

  </Accordion>
  <Accordion title="Prefiltrado de proveedores">
    Cuando una opción de autenticación implica un proveedor preferido, la incorporación prefiltra los selectores de modelo predeterminado y lista de permitidos a ese proveedor. Para Volcengine y BytePlus, esto también coincide con las variantes de coding-plan (`volcengine-plan/*`, `byteplus-plan/*`).

    Si el filtro de proveedor preferido aún no produce modelos cargados, la incorporación recurre al catálogo sin filtrar en lugar de dejar el selector vacío.

  </Accordion>
  <Accordion title="Seguimientos de búsqueda web">
    Algunos proveedores de búsqueda web activan prompts de seguimiento específicos del proveedor:

    - **Grok** puede ofrecer una configuración opcional de `x_search` con el mismo perfil OAuth de xAI o clave de API y una opción de modelo `x_search`.
    - **Kimi** puede pedir la región de la API de Moonshot (`api.moonshot.ai` frente a `api.moonshot.cn`) y el modelo predeterminado de búsqueda web de Kimi.

  </Accordion>
  <Accordion title="Otros comportamientos">
    - Comportamiento del alcance de DM en la incorporación local: [referencia de configuración de CLI](/es/start/wizard-cli-reference#outputs-and-internals).
    - Primer chat más rápido: `openclaw dashboard` (Control UI, sin configuración de canal).
    - Proveedor personalizado: conecta cualquier endpoint compatible con OpenAI o Anthropic, incluidos proveedores alojados no listados. Usa Unknown para detectar automáticamente.
    - Si se detecta estado de Hermes, la incorporación ofrece un flujo de migración. Usa [Migrar](/es/cli/migrate) para planes de dry-run, modo de sobrescritura, informes y asignaciones exactas.

  </Accordion>
</AccordionGroup>

## Comandos comunes de seguimiento

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

Usa `openclaw setup` como el mismo punto de entrada de incorporación guiada. Usa `openclaw setup --baseline` cuando solo necesites la configuración/espacio de trabajo base, `openclaw configure` más tarde para cambios específicos y `openclaw channels add` para configuración solo de canales.

<Note>
`--json` no implica modo no interactivo. Usa `--non-interactive` para scripts.
</Note>
