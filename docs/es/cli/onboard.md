---
read_when:
    - Quieres una configuración guiada para Gateway, el espacio de trabajo, la autenticación, los canales y Skills
summary: Referencia de CLI para `openclaw onboard` (incorporación interactiva)
title: Incorporación
x-i18n:
    generated_at: "2026-05-11T20:27:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 510b2bbb688605ce1bf30918e4982e783963e7d43be65f9c23cffac11248ffd2
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Onboarding guiado completo para configurar un Gateway local o remoto. Usa esto cuando quieras que OpenClaw te guíe por la autenticación del modelo, el espacio de trabajo, el gateway, los canales, las Skills y el estado en un solo flujo.

## Guías relacionadas

<CardGroup cols={2}>
  <Card title="Centro de onboarding de CLI" href="/es/start/wizard" icon="rocket">
    Recorrido del flujo interactivo de CLI.
  </Card>
  <Card title="Resumen de onboarding" href="/es/start/onboarding-overview" icon="map">
    Cómo encaja el onboarding de OpenClaw.
  </Card>
  <Card title="Referencia de configuración de CLI" href="/es/start/wizard-cli-reference" icon="book">
    Salidas, aspectos internos y comportamiento por paso.
  </Card>
  <Card title="Automatización de CLI" href="/es/start/wizard-cli-automation" icon="terminal">
    Flags no interactivos y configuraciones con scripts.
  </Card>
  <Card title="Onboarding de la app de macOS" href="/es/start/onboarding" icon="apple">
    Flujo de onboarding para la app de barra de menús de macOS.
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

`--flow import` usa proveedores de migración propiedad del Plugin, como Hermes. Solo se ejecuta sobre una configuración nueva de OpenClaw; si ya hay configuración, credenciales, sesiones o archivos de memoria/identidad del espacio de trabajo, restablece o elige una configuración nueva antes de importar.

`--modern` inicia la vista previa de onboarding conversacional de Crestodian. Sin
`--modern`, `openclaw onboard` mantiene el flujo clásico de onboarding.

Para destinos `ws://` de texto sin formato en redes privadas (solo redes de confianza), define
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` en el entorno del proceso de onboarding.
No hay un equivalente en `openclaw.json` para esta vía de emergencia del transporte
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

`--custom-api-key` es opcional en modo no interactivo. Si se omite, el onboarding comprueba `CUSTOM_API_KEY`.
OpenClaw marca automáticamente los IDs comunes de modelos de visión como compatibles con imágenes. Pasa `--custom-image-input` para IDs de visión personalizados desconocidos, o `--custom-text-input` para forzar metadatos solo de texto.

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

`--custom-base-url` usa `http://127.0.0.1:11434` de forma predeterminada. `--custom-model-id` es opcional; si se omite, el onboarding usa los valores predeterminados sugeridos por Ollama. Los IDs de modelos en la nube como `kimi-k2.5:cloud` también funcionan aquí.

Almacenar claves de proveedor como referencias en lugar de texto sin formato:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Con `--secret-input-mode ref`, el onboarding escribe referencias respaldadas por variables de entorno en lugar de valores de clave en texto sin formato.
Para proveedores respaldados por perfiles de autenticación, esto escribe entradas `keyRef`; para proveedores personalizados, esto escribe `models.providers.<id>.apiKey` como una referencia de entorno (por ejemplo, `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Contrato del modo `ref` no interactivo:

- Define la variable de entorno del proveedor en el entorno del proceso de onboarding (por ejemplo, `OPENAI_API_KEY`).
- No pases flags de clave en línea (por ejemplo, `--openai-api-key`) a menos que esa variable de entorno también esté definida.
- Si se pasa un flag de clave en línea sin la variable de entorno requerida, el onboarding falla de inmediato con orientación.

Opciones de token de Gateway en modo no interactivo:

- `--gateway-auth token --gateway-token <token>` almacena un token en texto sin formato.
- `--gateway-auth token --gateway-token-ref-env <name>` almacena `gateway.auth.token` como SecretRef de entorno.
- `--gateway-token` y `--gateway-token-ref-env` son mutuamente excluyentes.
- `--gateway-token-ref-env` requiere una variable de entorno no vacía en el entorno del proceso de onboarding.
- Con `--install-daemon`, cuando la autenticación con token requiere un token, los tokens de Gateway gestionados por SecretRef se validan, pero no se persisten como texto sin formato resuelto en los metadatos del entorno del servicio supervisor.
- Con `--install-daemon`, si el modo de token requiere un token y la SecretRef del token configurado no se puede resolver, el onboarding falla cerrado con orientación para remediarlo.
- Con `--install-daemon`, si tanto `gateway.auth.token` como `gateway.auth.password` están configurados y `gateway.auth.mode` no está definido, el onboarding bloquea la instalación hasta que el modo se defina explícitamente.
- El onboarding local escribe `gateway.mode="local"` en la configuración. Si a un archivo de configuración posterior le falta `gateway.mode`, considéralo daño de configuración o una edición manual incompleta, no un atajo válido de modo local.
- El onboarding local instala los plugins descargables seleccionados cuando la ruta de configuración elegida los requiere.
- El onboarding remoto solo escribe información de conexión para el Gateway remoto y no instala paquetes de plugins locales.
- `--allow-unconfigured` es una vía de escape independiente para el runtime del gateway. No significa que el onboarding pueda omitir `gateway.mode`.

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

- A menos que pases `--skip-health`, el onboarding espera a que haya un gateway local accesible antes de finalizar correctamente.
- `--install-daemon` inicia primero la ruta de instalación del gateway gestionado. Sin él, ya debes tener un gateway local en ejecución, por ejemplo `openclaw gateway run`.
- Si solo quieres escrituras de configuración/espacio de trabajo/bootstrap en automatización, usa `--skip-health`.
- Si gestionas tú mismo los archivos del espacio de trabajo, pasa `--skip-bootstrap` para definir `agents.defaults.skipBootstrap: true` y omitir la creación de `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` y `BOOTSTRAP.md`.
- En Windows nativo, `--install-daemon` intenta primero con Tareas programadas y recurre a un elemento de inicio de sesión en la carpeta de Inicio por usuario si se deniega la creación de la tarea.

Comportamiento del onboarding interactivo con modo de referencia:

- Elige **Usar referencia secreta** cuando se solicite.
- Luego elige una de estas opciones:
  - Variable de entorno
  - Proveedor de secretos configurado (`file` o `exec`)
- El onboarding realiza una validación previa rápida antes de guardar la referencia.
  - Si la validación falla, el onboarding muestra el error y te permite reintentar.

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
    - `import`: ejecuta un proveedor de migración detectado, previsualiza el plan y luego lo aplica tras la confirmación.

  </Accordion>
  <Accordion title="Prefiltrado de proveedores">
    Cuando una opción de autenticación implica un proveedor preferido, el onboarding prefiltra los selectores de modelo predeterminado y lista de permitidos a ese proveedor. Para Volcengine y BytePlus, esto también coincide con las variantes de plan de codificación (`volcengine-plan/*`, `byteplus-plan/*`).

    Si el filtro de proveedor preferido todavía no produce modelos cargados, el onboarding recurre al catálogo sin filtrar en lugar de dejar el selector vacío.

  </Accordion>
  <Accordion title="Seguimientos de búsqueda web">
    Algunos proveedores de búsqueda web activan prompts de seguimiento específicos del proveedor:

    - **Grok** puede ofrecer configuración opcional de `x_search` con la misma `XAI_API_KEY` y una opción de modelo `x_search`.
    - **Kimi** puede pedir la región de la API de Moonshot (`api.moonshot.ai` frente a `api.moonshot.cn`) y el modelo predeterminado de búsqueda web de Kimi.

  </Accordion>
  <Accordion title="Otros comportamientos">
    - Comportamiento del alcance de DM del onboarding local: [Referencia de configuración de CLI](/es/start/wizard-cli-reference#outputs-and-internals).
    - Primer chat más rápido: `openclaw dashboard` (interfaz de control, sin configuración de canales).
    - Proveedor personalizado: conecta cualquier endpoint compatible con OpenAI o Anthropic, incluidos proveedores alojados que no aparecen en la lista. Usa Unknown para detectar automáticamente.
    - Si se detecta estado de Hermes, el onboarding ofrece un flujo de migración. Usa [Migrar](/es/cli/migrate) para planes de simulación, modo de sobrescritura, informes y asignaciones exactas.

  </Accordion>
</AccordionGroup>

## Comandos comunes de seguimiento

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

Usa `openclaw setup` en su lugar cuando solo necesites la configuración/espacio de trabajo base. Usa `openclaw configure` más tarde para cambios específicos y `openclaw channels add` para configuración solo de canales.

<Note>
`--json` no implica modo no interactivo. Usa `--non-interactive` para scripts.
</Note>
