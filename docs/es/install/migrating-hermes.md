---
read_when:
    - Vienes de Hermes y quieres conservar la configuración de tus modelos, los prompts, la memoria y las Skills
    - Quieres saber qué importa OpenClaw automáticamente y qué permanece solo en el archivo.
    - Se necesita una ruta de migración limpia y automatizada mediante scripts (CI, portátil nuevo, automatización)
summary: Migra de Hermes a OpenClaw con una importación previsualizada y reversible
title: Migración desde Hermes
x-i18n:
    generated_at: "2026-07-19T02:00:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6b75d8bb1c5d40693354a8902e35ade4239dc001705abeee04a004e2cbaaa94c
    source_path: install/migrating-hermes.md
    workflow: 16
---

El proveedor de migración de Hermes incluido sigue `HERMES_HOME` y el perfil activo de Hermes, y recurre a `~/.hermes` en macOS/Linux o a `%LOCALAPPDATA%\hermes` en Windows. Muestra una vista previa de cada cambio antes de aplicarlo, oculta los secretos en los planes e informes y crea una copia de seguridad verificada de OpenClaw antes de modificar nada. Una ruta `--from` explícita siempre tiene prioridad.

<Note>
Las importaciones requieren una configuración nueva de OpenClaw. Si ya existe un estado local de OpenClaw, restablezca primero la configuración, las credenciales, las sesiones y el espacio de trabajo, o use `openclaw migrate apply hermes` directamente con `--overwrite` después de revisar el plan.
</Note>

## Dos formas de importar

<Tabs>
  <Tab title="Asistente de incorporación">
    Detecta el directorio de inicio y el perfil activos de Hermes y muestra una vista previa antes de aplicar los cambios.

    ```bash
    openclaw onboard --flow import
    ```

    O indique una fuente específica:

    ```bash
    openclaw onboard --import-from hermes --import-source ~/.hermes
    ```

  </Tab>
  <Tab title="CLI">
    Use `openclaw migrate` para ejecuciones mediante scripts o repetibles. Consulte [`openclaw migrate`](/es/cli/migrate) para obtener la referencia completa.

    ```bash
    openclaw migrate hermes --dry-run    # solo vista previa
    openclaw migrate apply hermes --yes  # aplicar omitiendo la confirmación
    ```

    Añada `--from <path>` para anular la detección del directorio de inicio y el perfil de Hermes.

  </Tab>
</Tabs>

## Qué se importa

<AccordionGroup>
  <Accordion title="Configuración del modelo">
    - Selección del modelo predeterminado de `config.yaml` de Hermes.
    - Proveedores de modelos configurados y endpoints personalizados de `model`, `providers` y `custom_providers`, incluidos los transportes actuales de Hermes Chat Completions, Codex Responses y Anthropic Messages.

  </Accordion>
  <Accordion title="Servidores MCP">
    Definiciones de servidores MCP de `mcp_servers` o `mcp.servers`, incluidos el estado deshabilitado, los tiempos de espera, la compatibilidad con herramientas paralelas, el ámbito de OAuth, los campos TLS compatibles y la política de herramientas nativas, de recursos y de prompts. Las variables de entorno y los encabezados literales requieren consentimiento para importar credenciales. La configuración exclusiva de Hermes para el ciclo de vida, el muestreo, la obtención de información, las comprobaciones previas, el mantenimiento de conexión, el paquete de CA, la clave de cliente protegida por contraseña y el cliente OAuth registrado previamente se convierte en elementos de revisión manual en lugar de una configuración no válida de OpenClaw.
  </Accordion>
  <Accordion title="Archivos del espacio de trabajo">
    - `SOUL.md` y `AGENTS.md` se copian en el espacio de trabajo del agente de OpenClaw.
    - `memories/MEMORY.md` y `memories/USER.md` se **añaden** a los archivos de memoria correspondientes de OpenClaw en lugar de sobrescribirlos.
    - Las superficies exclusivas de memoria se comportan de forma diferente: la página de memoria de incorporación y la página de importación de memoria de la interfaz de control copian estos dos archivos en `memory/imports/hermes/` para su recuperación indexada y no modifican la memoria existente del espacio de trabajo.

  </Accordion>
  <Accordion title="Configuración de memoria">
    Valores predeterminados de la configuración de memoria para la memoria de archivos de OpenClaw. Los proveedores de memoria externos, como Honcho, se registran como elementos de archivo o de revisión manual para que puedan trasladarse de forma deliberada.
  </Accordion>
  <Accordion title="Skills">
    Las Skills con un archivo `SKILL.md` en cualquier ubicación bajo `skills/` se detectan de forma recursiva, se trasladan a una estructura plana en el directorio de Skills del espacio de trabajo de OpenClaw y se copian junto con sus archivos auxiliares. Se conservan los valores de configuración de cada Skill de `skills.config`.
  </Accordion>
  <Accordion title="Credenciales de autenticación">
    El modo interactivo de `openclaw migrate` solicita confirmación antes de importar las credenciales de autenticación, con la opción afirmativa seleccionada de forma predeterminada. Las importaciones aceptadas incluyen las entradas OAuth actuales de OpenAI Codex en Hermes, las entradas OAuth de OpenAI y GitHub Copilot en OpenCode y las [claves `.env` compatibles de Hermes](/es/cli/migrate#supported-env-keys). Use `--include-secrets` para una importación no interactiva, `--no-auth-credentials` para omitir las credenciales o la opción `--import-secrets` de la incorporación. Después de importar OAuth de Hermes, no mantenga Hermes y OpenClaw usando la misma concesión de actualización; vuelva a autenticar uno de los dos antes de ejecutar ambos.
  </Accordion>
</AccordionGroup>

## Qué permanece solo en el archivo

El proveedor copia lo siguiente en el directorio de informes de migración para su revisión manual, pero **no** lo carga en la configuración ni en las credenciales activas de OpenClaw:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `plans/`, `workspace/`, `skins/` y `kanban/`
- Almacenes `pairing/` y `platforms/`, además del estado de enrutamiento y procesos del Gateway
- `state.db`, `hermes_state.db`, `projects.db`, `response_store.db`, `memory_store.db`, `verification_evidence.db`, `kanban.db` y `retaindb_queue.db`

OpenClaw se niega a ejecutar este estado o confiar automáticamente en él porque los formatos y los supuestos de confianza pueden divergir entre sistemas. Tras revisar el archivo, traslade manualmente lo que necesite.

## Flujo recomendado

<Steps>
  <Step title="Previsualizar el plan">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    El plan enumera todo lo que cambiará, incluidos los conflictos, los elementos omitidos y los elementos sensibles. Las claves anidadas que parecen contener secretos se ocultan en la salida.

  </Step>
  <Step title="Aplicar con copia de seguridad">
    ```bash
    openclaw migrate apply hermes --yes
    ```

    OpenClaw crea y verifica una copia de seguridad antes de aplicar los cambios. Este ejemplo no interactivo solo importa el estado no secreto. Ejecútelo sin `--yes` para responder de forma interactiva a la solicitud de credenciales o añada `--include-secrets` para incluir las credenciales compatibles en una ejecución desatendida.

  </Step>
  <Step title="Ejecutar doctor">
    ```bash
    openclaw doctor
    ```

    [Doctor](/es/gateway/doctor) vuelve a aplicar las migraciones de configuración pendientes y comprueba si se introdujeron problemas durante la importación.

  </Step>
  <Step title="Reiniciar y verificar">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Confirme que el Gateway funciona correctamente y que el modelo, la memoria y las Skills importados están cargados.

  </Step>
</Steps>

## Gestión de conflictos

La aplicación se niega a continuar cuando el plan informa de conflictos (ya existe un archivo o valor de configuración en el destino).

<Warning>
Vuelva a ejecutar con `--overwrite` solo cuando se pretenda reemplazar el destino existente. Los proveedores aún pueden crear copias de seguridad por elemento de los archivos sobrescritos en el directorio de informes de migración.
</Warning>

Los conflictos son poco habituales en una instalación nueva. Por lo general, aparecen cuando se vuelve a ejecutar la importación en una configuración que ya contiene modificaciones del usuario.

Si aparece un conflicto durante la aplicación (por ejemplo, una condición de carrera inesperada en un archivo de configuración), ese elemento se registra como conflicto mientras continúan los archivos, las Skills, las credenciales, los archivos y las entradas de configuración independientes. Resuelva el elemento en conflicto y vuelva a ejecutar la importación; las importaciones de memoria idénticas son idempotentes.

## Secretos

El modo interactivo de `openclaw migrate` pregunta si se deben importar las credenciales de autenticación detectadas, con la opción afirmativa seleccionada de forma predeterminada.

- Si se acepta, se importan las entradas OAuth actuales de OpenAI Codex en Hermes, las entradas OAuth de OpenAI y GitHub Copilot en OpenCode y las [claves `.env` compatibles](/es/cli/migrate#supported-env-keys).
- Use `--no-auth-credentials`, o responda no en la solicitud, para importar únicamente el estado no secreto.
- Use `--include-secrets` para importar credenciales en una ejecución desatendida de `--yes`.
- Use la opción `--import-secrets` del asistente de incorporación para importar credenciales desde el asistente.

## Salida JSON para automatización

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

Con `--json` y sin `--yes`, la aplicación imprime el plan y no modifica el estado: es el modo más seguro para la CI y los scripts compartidos.

## Solución de problemas

<AccordionGroup>
  <Accordion title="La aplicación se rechaza debido a conflictos">
    Inspeccione la salida del plan. Cada conflicto identifica la ruta de origen y el destino existente. Decida para cada elemento si debe omitirlo, editar el destino o volver a ejecutar con `--overwrite`.
  </Accordion>
  <Accordion title="Hermes se encuentra fuera de ~/.hermes">
    Especifique `--from /actual/path` (CLI) o `--import-source /actual/path` (incorporación).
  </Accordion>
  <Accordion title="La incorporación se niega a importar en una configuración existente">
    Las importaciones de incorporación requieren una configuración nueva. Restablezca el estado y repita la incorporación, o use `openclaw migrate apply hermes` directamente, que admite `--overwrite` y el control explícito de las copias de seguridad.
  </Accordion>
  <Accordion title="Las claves de API no se importaron">
    El modo interactivo de `openclaw migrate` solo importa las claves de API cuando se acepta la solicitud de credenciales. Las ejecuciones no interactivas de `--yes` necesitan `--include-secrets`; las importaciones de incorporación necesitan `--import-secrets`. Solo se reconocen las [claves `.env` compatibles](/es/cli/migrate#supported-env-keys); las demás variables `.env` se ignoran.
  </Accordion>
</AccordionGroup>

## Relacionado

- [`openclaw migrate`](/es/cli/migrate): referencia completa de la CLI, contrato del Plugin y estructuras JSON.
- [Incorporación](/es/cli/onboard): flujo del asistente y opciones no interactivas.
- [Migración](/es/install/migrating): trasladar una instalación de OpenClaw entre equipos.
- [Doctor](/es/gateway/doctor): comprobación de estado posterior a la migración.
- [Espacio de trabajo del agente](/es/concepts/agent-workspace): ubicación de `SOUL.md`, `AGENTS.md` y los archivos de memoria.
