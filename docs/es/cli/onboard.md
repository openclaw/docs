---
read_when:
    - Desea una configuración guiada para Gateway, espacio de trabajo, autenticación, canales y Skills
summary: Referencia de CLI para `openclaw onboard` (incorporación interactiva)
title: Incorporación
x-i18n:
    generated_at: "2026-04-30T05:35:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 583310458b2e2bc8ddc1513112c960520d972716be0c33e4177d0db30e896504
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Incorporación interactiva para configurar un Gateway local o remoto.

## Guías relacionadas

<CardGroup cols={2}>
  <Card title="Centro de incorporación de la CLI" href="/es/start/wizard" icon="rocket">
    Tutorial del flujo interactivo de la CLI.
  </Card>
  <Card title="Resumen de incorporación" href="/es/start/onboarding-overview" icon="map">
    Cómo encaja la incorporación de OpenClaw.
  </Card>
  <Card title="Referencia de configuración de la CLI" href="/es/start/wizard-cli-reference" icon="book">
    Salidas, detalles internos y comportamiento por paso.
  </Card>
  <Card title="Automatización de la CLI" href="/es/start/wizard-cli-automation" icon="terminal">
    Flags no interactivos y configuraciones con scripts.
  </Card>
  <Card title="Incorporación de la app para macOS" href="/es/start/onboarding" icon="apple">
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

`--flow import` usa proveedores de migración propiedad de plugins, como Hermes. Solo se ejecuta contra una instalación nueva de OpenClaw; si ya existen archivos de configuración, credenciales, sesiones o memoria/identidad del espacio de trabajo, restablece o elige una instalación nueva antes de importar.

`--modern` inicia la vista previa de incorporación conversacional de Crestodian. Sin
`--modern`, `openclaw onboard` mantiene el flujo de incorporación clásico.

Para destinos `ws://` de red privada en texto plano (solo redes de confianza), establece
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` en el entorno del proceso de incorporación.
No hay equivalente en `openclaw.json` para esta ruptura de emergencia del transporte
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

LM Studio también admite un flag de clave específico del proveedor en modo no interactivo:

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

`--custom-base-url` tiene como valor predeterminado `http://127.0.0.1:11434`. `--custom-model-id` es opcional; si se omite, la incorporación usa los valores predeterminados sugeridos por Ollama. Los ID de modelos en la nube como `kimi-k2.5:cloud` también funcionan aquí.

Almacena claves de proveedor como refs en lugar de texto plano:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Con `--secret-input-mode ref`, la incorporación escribe refs respaldadas por variables de entorno en lugar de valores de clave en texto plano.
Para proveedores respaldados por perfiles de autenticación, esto escribe entradas `keyRef`; para proveedores personalizados, escribe `models.providers.<id>.apiKey` como una ref de variable de entorno (por ejemplo `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Contrato del modo `ref` no interactivo:

- Establece la variable de entorno del proveedor en el entorno del proceso de incorporación (por ejemplo `OPENAI_API_KEY`).
- No pases flags de clave inline (por ejemplo `--openai-api-key`) a menos que esa variable de entorno también esté establecida.
- Si se pasa un flag de clave inline sin la variable de entorno requerida, la incorporación falla rápido con orientación.

Opciones de token de Gateway en modo no interactivo:

- `--gateway-auth token --gateway-token <token>` almacena un token en texto plano.
- `--gateway-auth token --gateway-token-ref-env <name>` almacena `gateway.auth.token` como una SecretRef de variable de entorno.
- `--gateway-token` y `--gateway-token-ref-env` son mutuamente excluyentes.
- `--gateway-token-ref-env` requiere una variable de entorno no vacía en el entorno del proceso de incorporación.
- Con `--install-daemon`, cuando la autenticación por token requiere un token, los tokens de Gateway administrados por SecretRef se validan, pero no se conservan como texto plano resuelto en los metadatos del entorno del servicio supervisor.
- Con `--install-daemon`, si el modo token requiere un token y la SecretRef del token configurado no se puede resolver, la incorporación falla de forma cerrada con orientación para corregirlo.
- Con `--install-daemon`, si `gateway.auth.token` y `gateway.auth.password` están configurados y `gateway.auth.mode` no está establecido, la incorporación bloquea la instalación hasta que el modo se establezca explícitamente.
- La incorporación local escribe `gateway.mode="local"` en la configuración. Si a un archivo de configuración posterior le falta `gateway.mode`, trátalo como daño de configuración o como una edición manual incompleta, no como un atajo válido de modo local.
- `--allow-unconfigured` es una vía de escape independiente en tiempo de ejecución del Gateway. No significa que la incorporación pueda omitir `gateway.mode`.

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

Salud del Gateway local no interactivo:

- A menos que pases `--skip-health`, la incorporación espera a que haya un Gateway local accesible antes de salir correctamente.
- `--install-daemon` inicia primero la ruta de instalación del Gateway administrado. Sin él, ya debes tener un Gateway local en ejecución, por ejemplo `openclaw gateway run`.
- Si solo quieres escrituras de configuración/espacio de trabajo/bootstrap en automatización, usa `--skip-health`.
- Si administras los archivos del espacio de trabajo por tu cuenta, pasa `--skip-bootstrap` para establecer `agents.defaults.skipBootstrap: true` y omitir la creación de `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` y `BOOTSTRAP.md`.
- En Windows nativo, `--install-daemon` intenta primero con Tareas programadas y recurre a un elemento de inicio de sesión en la carpeta Inicio por usuario si se deniega la creación de tareas.

Comportamiento de la incorporación interactiva con modo de referencia:

- Elige **Usar referencia secreta** cuando se te solicite.
- Luego elige una de estas opciones:
  - Variable de entorno
  - Proveedor de secretos configurado (`file` o `exec`)
- La incorporación realiza una validación previa rápida antes de guardar la ref.
  - Si la validación falla, la incorporación muestra el error y te permite reintentarlo.

### Opciones de endpoint de Z.AI no interactivo

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

## Notas del flujo

<AccordionGroup>
  <Accordion title="Tipos de flujo">
    - `quickstart`: prompts mínimos, genera automáticamente un token de gateway.
    - `manual`: prompts completos para puerto, enlace y autenticación (alias de `advanced`).
    - `import`: ejecuta un proveedor de migración detectado, muestra una vista previa del plan y luego lo aplica tras la confirmación.

  </Accordion>
  <Accordion title="Prefiltrado de proveedores">
    Cuando una opción de autenticación implica un proveedor preferido, la incorporación prefiltra los selectores de modelo predeterminado y allowlist a ese proveedor. Para Volcengine y BytePlus, esto también coincide con las variantes de plan de codificación (`volcengine-plan/*`, `byteplus-plan/*`).

    Si el filtro de proveedor preferido aún no produce modelos cargados, la incorporación vuelve al catálogo sin filtrar en lugar de dejar vacío el selector.

  </Accordion>
  <Accordion title="Seguimientos de búsqueda web">
    Algunos proveedores de búsqueda web activan prompts de seguimiento específicos del proveedor:

    - **Grok** puede ofrecer una configuración opcional de `x_search` con la misma `XAI_API_KEY` y una opción de modelo `x_search`.
    - **Kimi** puede preguntar por la región de la API de Moonshot (`api.moonshot.ai` frente a `api.moonshot.cn`) y el modelo predeterminado de búsqueda web de Kimi.

  </Accordion>
  <Accordion title="Otros comportamientos">
    - Comportamiento del alcance de DM de la incorporación local: [Referencia de configuración de la CLI](/es/start/wizard-cli-reference#outputs-and-internals).
    - Primer chat más rápido: `openclaw dashboard` (Control UI, sin configuración de canal).
    - Proveedor personalizado: conecta cualquier endpoint compatible con OpenAI o Anthropic, incluidos proveedores alojados que no aparecen en la lista. Usa Desconocido para detectar automáticamente.
    - Si se detecta estado de Hermes, la incorporación ofrece un flujo de migración. Usa [Migrar](/es/cli/migrate) para planes de ensayo, modo de sobrescritura, informes y asignaciones exactas.

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
