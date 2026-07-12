---
read_when:
    - Vienes de Hermes y quieres conservar la configuración del modelo, los prompts, la memoria y las Skills
    - Quieres saber qué importa OpenClaw automáticamente y qué permanece solo en el archivo histórico
    - Necesitas una ruta de migración limpia y automatizada mediante scripts (CI, portátil nuevo, automatización)
summary: Migra de Hermes a OpenClaw con una importación previsualizable y reversible
title: Migración desde Hermes
x-i18n:
    generated_at: "2026-07-11T23:11:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd9012efb084c00dfe55bb841fea3cc6908c08b528492f1552bf226f125961e6
    source_path: install/migrating-hermes.md
    workflow: 16
---

El proveedor de migración de Hermes incluido detecta el estado en `~/.hermes`, muestra una vista previa de cada cambio antes de aplicarlo, oculta los secretos en los planes e informes y escribe una copia de seguridad verificada de OpenClaw antes de modificar nada.

<Note>
Las importaciones requieren una configuración nueva de OpenClaw. Si ya tienes un estado local de OpenClaw, restablece primero la configuración, las credenciales, las sesiones y el espacio de trabajo, o usa directamente `openclaw migrate apply hermes` con `--overwrite` después de revisar el plan.
</Note>

## Dos formas de importar

<Tabs>
  <Tab title="Asistente de incorporación">
    Detecta Hermes en `~/.hermes` y muestra una vista previa antes de aplicar los cambios.

    ```bash
    openclaw onboard --flow import
    ```

    También puedes indicar un origen específico:

    ```bash
    openclaw onboard --import-from hermes --import-source ~/.hermes
    ```

  </Tab>
  <Tab title="CLI">
    Usa `openclaw migrate` para ejecuciones mediante scripts o repetibles. Consulta [`openclaw migrate`](/es/cli/migrate) para ver la referencia completa.

    ```bash
    openclaw migrate hermes --dry-run    # solo vista previa
    openclaw migrate apply hermes --yes  # aplicar omitiendo la confirmación
    ```

    Añade `--from <path>` cuando Hermes se encuentre fuera de `~/.hermes`.

  </Tab>
</Tabs>

## Qué se importa

<AccordionGroup>
  <Accordion title="Configuración del modelo">
    - Selección del modelo predeterminado desde `config.yaml` de Hermes.
    - Proveedores de modelos configurados y endpoints personalizados compatibles con OpenAI desde `providers` y `custom_providers`.

  </Accordion>
  <Accordion title="Servidores MCP">
    Definiciones de servidores MCP desde `mcp_servers` o `mcp.servers`.
  </Accordion>
  <Accordion title="Archivos del espacio de trabajo">
    - `SOUL.md` y `AGENTS.md` se copian en el espacio de trabajo del agente de OpenClaw.
    - `memories/MEMORY.md` y `memories/USER.md` se **añaden** a los archivos de memoria correspondientes de OpenClaw en lugar de sobrescribirlos.

  </Accordion>
  <Accordion title="Configuración de memoria">
    Valores predeterminados de la configuración de memoria para la memoria de archivos de OpenClaw. Los proveedores de memoria externos, como Honcho, se registran como elementos de archivo o de revisión manual para que puedas trasladarlos deliberadamente.
  </Accordion>
  <Accordion title="Skills">
    Las Skills que tengan un archivo `SKILL.md` en `skills/<name>/` se copian junto con los valores de configuración de cada Skill procedentes de `skills.config`.
  </Accordion>
  <Accordion title="Credenciales de autenticación">
    El comando interactivo `openclaw migrate` solicita confirmación antes de importar credenciales de autenticación, con sí seleccionado de forma predeterminada. Si aceptas, se importan las entradas de OAuth de OpenAI y GitHub Copilot de OpenCode desde el archivo `auth.json` de OpenCode, además de las [claves `.env` de Hermes compatibles](/es/cli/migrate#supported-env-keys). Las entradas de OAuth del propio archivo `auth.json` de Hermes son un estado heredado: se presentan como un elemento de reautenticación manual o de reparación mediante Doctor en lugar de importarse en la autenticación activa. Usa `--include-secrets` para importar credenciales en una ejecución no interactiva, `--no-auth-credentials` para omitir por completo la importación de credenciales o la opción `--import-secrets` del asistente de incorporación.
  </Accordion>
</AccordionGroup>

## Qué permanece solo en el archivo

El proveedor copia los siguientes elementos en el directorio del informe de migración para su revisión manual, pero **no** los carga en la configuración ni en las credenciales activas de OpenClaw:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `state.db`

OpenClaw se niega a ejecutar o confiar automáticamente en este estado porque los formatos y los supuestos de confianza pueden diferir entre sistemas. Tras revisar el archivo, traslada manualmente lo que necesites.

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

    OpenClaw crea y verifica una copia de seguridad antes de aplicar los cambios. Este ejemplo no interactivo importa únicamente el estado que no contiene secretos. Ejecuta el comando sin `--yes` para responder de forma interactiva a la solicitud de credenciales o añade `--include-secrets` para incluir las credenciales compatibles en una ejecución desatendida.

  </Step>
  <Step title="Ejecutar Doctor">
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

    Confirma que el Gateway funciona correctamente y que se han cargado el modelo, la memoria y las Skills importados.

  </Step>
</Steps>

## Gestión de conflictos

La aplicación se niega a continuar cuando el plan informa de conflictos (ya existe un archivo o un valor de configuración en el destino).

<Warning>
Vuelve a ejecutar el comando con `--overwrite` únicamente cuando sea intencional reemplazar el destino existente. Es posible que los proveedores sigan escribiendo copias de seguridad individuales de los archivos sobrescritos en el directorio del informe de migración.
</Warning>

Los conflictos son poco frecuentes en una instalación nueva. Normalmente aparecen cuando vuelves a ejecutar la importación sobre una configuración que ya contiene modificaciones del usuario.

Si surge un conflicto durante la aplicación (por ejemplo, una condición de carrera inesperada en un archivo de configuración), Hermes marca los elementos de configuración dependientes restantes como `skipped` con el motivo `blocked by earlier apply conflict`, en lugar de escribirlos parcialmente. El informe de migración registra cada elemento bloqueado para que puedas resolver el conflicto original y volver a ejecutar la importación.

## Secretos

El comando interactivo `openclaw migrate` pregunta si deseas importar las credenciales de autenticación detectadas, con sí seleccionado de forma predeterminada.

- Si aceptas, se importan las entradas de OAuth de OpenAI y GitHub Copilot de OpenCode desde el archivo `auth.json` de OpenCode, además de las [claves `.env` compatibles](/es/cli/migrate#supported-env-keys). En cambio, las entradas de OAuth del propio archivo `auth.json` de Hermes se notifican para realizar una reautenticación manual de OpenAI o una reparación mediante Doctor.
- Usa `--no-auth-credentials`, o responde no cuando se te solicite, para importar únicamente el estado que no contiene secretos.
- Usa `--include-secrets` para importar credenciales en una ejecución desatendida con `--yes`.
- Usa la opción `--import-secrets` del asistente de incorporación para importar credenciales desde el asistente.

## Salida JSON para automatización

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

Con `--json` y sin `--yes`, la aplicación imprime el plan y no modifica el estado: es el modo más seguro para CI y scripts compartidos.

## Solución de problemas

<AccordionGroup>
  <Accordion title="La aplicación se niega a continuar por conflictos">
    Inspecciona la salida del plan. Cada conflicto identifica la ruta de origen y el destino existente. Decide para cada elemento si debes omitirlo, editar el destino o volver a ejecutar el comando con `--overwrite`.
  </Accordion>
  <Accordion title="Hermes se encuentra fuera de ~/.hermes">
    Pasa `--from /actual/path` (CLI) o `--import-source /actual/path` (incorporación).
  </Accordion>
  <Accordion title="La incorporación se niega a importar en una configuración existente">
    Las importaciones durante la incorporación requieren una configuración nueva. Restablece el estado y repite la incorporación, o usa directamente `openclaw migrate apply hermes`, que admite `--overwrite` y el control explícito de las copias de seguridad.
  </Accordion>
  <Accordion title="Las claves de API no se importaron">
    El comando interactivo `openclaw migrate` solo importa claves de API cuando aceptas la solicitud de credenciales. Las ejecuciones no interactivas con `--yes` necesitan `--include-secrets`; las importaciones durante la incorporación necesitan `--import-secrets`. Solo se reconocen las [claves `.env` compatibles](/es/cli/migrate#supported-env-keys); las demás variables de `.env` se ignoran.
  </Accordion>
</AccordionGroup>

## Contenido relacionado

- [`openclaw migrate`](/es/cli/migrate): referencia completa de la CLI, contrato del Plugin y estructuras JSON.
- [Incorporación](/es/cli/onboard): flujo del asistente y opciones no interactivas.
- [Migración](/es/install/migrating): traslado de una instalación de OpenClaw entre máquinas.
- [Doctor](/es/gateway/doctor): comprobación de estado posterior a la migración.
- [Espacio de trabajo del agente](/es/concepts/agent-workspace): ubicación de `SOUL.md`, `AGENTS.md` y los archivos de memoria.
