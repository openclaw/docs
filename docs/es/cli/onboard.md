---
read_when:
    - Quieres una configuración guiada para Gateway, espacio de trabajo, autenticación, canales y Skills
summary: Referencia de CLI para `openclaw onboard` (incorporación interactiva)
title: Incorporar
x-i18n:
    generated_at: "2026-05-02T05:22:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 79fd15da17beb5e66da760bcf490a15340d42af0730c19f04d41908995da8ffb
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Incorporación interactiva para configurar un Gateway local o remoto.

## Guías relacionadas

<CardGroup cols={2}>
  <Card title="Centro de incorporación de la CLI" href="/es/start/wizard" icon="rocket">
    Recorrido del flujo interactivo de la CLI.
  </Card>
  <Card title="Resumen de incorporación" href="/es/start/onboarding-overview" icon="map">
    Cómo encaja la incorporación de OpenClaw.
  </Card>
  <Card title="Referencia de configuración de la CLI" href="/es/start/wizard-cli-reference" icon="book">
    Salidas, componentes internos y comportamiento por paso.
  </Card>
  <Card title="Automatización de la CLI" href="/es/start/wizard-cli-automation" icon="terminal">
    Opciones no interactivas y configuraciones mediante scripts.
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

`--flow import` usa proveedores de migración propiedad del Plugin, como Hermes. Solo se ejecuta contra una configuración nueva de OpenClaw; si hay archivos de configuración, credenciales, sesiones o memoria/identidad del espacio de trabajo existentes, restablece o elige una configuración nueva antes de importar.

`--modern` inicia la vista previa de incorporación conversacional de Crestodian. Sin
`--modern`, `openclaw onboard` mantiene el flujo de incorporación clásico.

Para destinos `ws://` en redes privadas de texto sin cifrar (solo redes de confianza), define
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` en el entorno del proceso de incorporación.
No hay equivalente de `openclaw.json` para esta medida de emergencia del transporte
del lado del cliente.

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
OpenClaw marca automáticamente los ID de modelos de visión comunes como compatibles con imágenes. Pasa `--custom-image-input` para ID de visión personalizados desconocidos, o `--custom-text-input` para forzar metadatos solo de texto.

LM Studio también admite una opción de clave específica del proveedor en modo no interactivo:

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

`--custom-base-url` usa `http://127.0.0.1:11434` de forma predeterminada. `--custom-model-id` es opcional; si se omite, la incorporación usa los valores predeterminados sugeridos por Ollama. Los ID de modelos en la nube, como `kimi-k2.5:cloud`, también funcionan aquí.

Almacena las claves de proveedor como referencias en lugar de texto sin cifrar:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Con `--secret-input-mode ref`, la incorporación escribe referencias respaldadas por variables de entorno en lugar de valores de clave en texto sin cifrar.
Para proveedores respaldados por perfiles de autenticación, esto escribe entradas `keyRef`; para proveedores personalizados, esto escribe `models.providers.<id>.apiKey` como una referencia de variable de entorno (por ejemplo `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Contrato del modo no interactivo `ref`:

- Define la variable de entorno del proveedor en el entorno del proceso de incorporación (por ejemplo `OPENAI_API_KEY`).
- No pases opciones de clave en línea (por ejemplo `--openai-api-key`) a menos que esa variable de entorno también esté definida.
- Si se pasa una opción de clave en línea sin la variable de entorno requerida, la incorporación falla de inmediato con orientación.

Opciones de token de Gateway en modo no interactivo:

- `--gateway-auth token --gateway-token <token>` almacena un token en texto sin cifrar.
- `--gateway-auth token --gateway-token-ref-env <name>` almacena `gateway.auth.token` como una SecretRef de variable de entorno.
- `--gateway-token` y `--gateway-token-ref-env` son mutuamente excluyentes.
- `--gateway-token-ref-env` requiere una variable de entorno no vacía en el entorno del proceso de incorporación.
- Con `--install-daemon`, cuando la autenticación por token requiere un token, los tokens de Gateway gestionados por SecretRef se validan pero no se persisten como texto sin cifrar resuelto en los metadatos del entorno del servicio supervisor.
- Con `--install-daemon`, si el modo de token requiere un token y la SecretRef de token configurada no se puede resolver, la incorporación falla de forma cerrada con orientación de corrección.
- Con `--install-daemon`, si tanto `gateway.auth.token` como `gateway.auth.password` están configurados y `gateway.auth.mode` no está definido, la incorporación bloquea la instalación hasta que el modo se defina explícitamente.
- La incorporación local escribe `gateway.mode="local"` en la configuración. Si a un archivo de configuración posterior le falta `gateway.mode`, trátalo como daño de configuración o una edición manual incompleta, no como un atajo válido de modo local.
- La incorporación local instala los plugins descargables seleccionados cuando la ruta de configuración elegida los requiere.
- La incorporación remota solo escribe la información de conexión para el Gateway remoto y no instala paquetes de plugins locales.
- `--allow-unconfigured` es una vía de escape independiente en tiempo de ejecución del gateway. No significa que la incorporación pueda omitir `gateway.mode`.

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

- A menos que pases `--skip-health`, la incorporación espera a que haya un gateway local accesible antes de finalizar correctamente.
- `--install-daemon` inicia primero la ruta de instalación del gateway gestionado. Sin ello, ya debes tener un gateway local en ejecución, por ejemplo `openclaw gateway run`.
- Si solo quieres escrituras de configuración/espacio de trabajo/bootstrap en automatización, usa `--skip-health`.
- Si gestionas tú mismo los archivos del espacio de trabajo, pasa `--skip-bootstrap` para definir `agents.defaults.skipBootstrap: true` y omitir la creación de `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` y `BOOTSTRAP.md`.
- En Windows nativo, `--install-daemon` intenta primero usar Tareas programadas y recurre a un elemento de inicio de sesión en la carpeta de Inicio por usuario si se deniega la creación de la tarea.

Comportamiento de la incorporación interactiva con modo de referencia:

- Elige **Usar referencia secreta** cuando se solicite.
- Luego elige una de estas opciones:
  - Variable de entorno
  - Proveedor de secretos configurado (`file` o `exec`)
- La incorporación realiza una validación preliminar rápida antes de guardar la referencia.
  - Si la validación falla, la incorporación muestra el error y te permite reintentarlo.

### Opciones de endpoint Z.AI no interactivas

<Note>
`--auth-choice zai-api-key` detecta automáticamente el mejor endpoint de Z.AI para tu clave (prefiere la API general con `zai/glm-5.1`). Si quieres específicamente los endpoints del GLM Coding Plan, elige `zai-coding-global` o `zai-coding-cn`.
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

## Notas de flujo

<AccordionGroup>
  <Accordion title="Tipos de flujo">
    - `quickstart`: indicaciones mínimas, genera automáticamente un token de gateway.
    - `manual`: indicaciones completas para puerto, enlace y autenticación (alias de `advanced`).
    - `import`: ejecuta un proveedor de migración detectado, muestra una vista previa del plan y luego lo aplica tras la confirmación.

  </Accordion>
  <Accordion title="Prefiltrado de proveedores">
    Cuando una opción de autenticación implica un proveedor preferido, la incorporación prefiltra los selectores de modelo predeterminado y lista de permitidos a ese proveedor. Para Volcengine y BytePlus, esto también coincide con las variantes de plan de codificación (`volcengine-plan/*`, `byteplus-plan/*`).

    Si el filtro de proveedor preferido aún no produce modelos cargados, la incorporación recurre al catálogo sin filtrar en lugar de dejar el selector vacío.

  </Accordion>
  <Accordion title="Seguimientos de búsqueda web">
    Algunos proveedores de búsqueda web activan indicaciones de seguimiento específicas del proveedor:

    - **Grok** puede ofrecer una configuración opcional de `x_search` con la misma `XAI_API_KEY` y una opción de modelo `x_search`.
    - **Kimi** puede pedir la región de la API de Moonshot (`api.moonshot.ai` frente a `api.moonshot.cn`) y el modelo predeterminado de búsqueda web de Kimi.

  </Accordion>
  <Accordion title="Otros comportamientos">
    - Comportamiento del alcance de DM en la incorporación local: [Referencia de configuración de la CLI](/es/start/wizard-cli-reference#outputs-and-internals).
    - Primer chat más rápido: `openclaw dashboard` (Control UI, sin configuración de canal).
    - Proveedor personalizado: conecta cualquier endpoint compatible con OpenAI o Anthropic, incluidos proveedores alojados que no aparezcan en la lista. Usa Unknown para detección automática.
    - Si se detecta estado de Hermes, la incorporación ofrece un flujo de migración. Usa [Migrate](/es/cli/migrate) para planes de simulacro, modo de sobrescritura, informes y mapeos exactos.

  </Accordion>
</AccordionGroup>

## Comandos comunes de seguimiento

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` no implica modo no interactivo. Usa `--non-interactive` para scripts.
</Note>
