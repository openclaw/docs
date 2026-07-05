---
read_when:
    - Vienes de Hermes y quieres conservar tu configuración del modelo, prompts, memoria y skills
    - Quieres saber qué importa OpenClaw automáticamente y qué permanece solo en archivo
    - Necesitas una ruta de migración limpia y automatizada (CI, portátil nuevo, automatización)
summary: Migra de Hermes a OpenClaw con una importación previsualizada y reversible
title: Migración desde Hermes
x-i18n:
    generated_at: "2026-07-05T11:24:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd9012efb084c00dfe55bb841fea3cc6908c08b528492f1552bf226f125961e6
    source_path: install/migrating-hermes.md
    workflow: 16
---

El proveedor de migración de Hermes incluido detecta el estado en `~/.hermes`, previsualiza cada cambio antes de aplicarlo, redacta los secretos en planes e informes y escribe una copia de seguridad verificada de OpenClaw antes de tocar nada.

<Note>
Las importaciones requieren una configuración nueva de OpenClaw. Si ya tienes estado local de OpenClaw, restablece primero la configuración, las credenciales, las sesiones y el espacio de trabajo, o usa `openclaw migrate apply hermes` directamente con `--overwrite` después de revisar el plan.
</Note>

## Dos formas de importar

<Tabs>
  <Tab title="Asistente de incorporación">
    Detecta Hermes en `~/.hermes` y muestra una vista previa antes de aplicar.

    ```bash
    openclaw onboard --flow import
    ```

    O apunta a una fuente específica:

    ```bash
    openclaw onboard --import-from hermes --import-source ~/.hermes
    ```

  </Tab>
  <Tab title="CLI">
    Usa `openclaw migrate` para ejecuciones con scripts o repetibles. Consulta [`openclaw migrate`](/es/cli/migrate) para ver la referencia completa.

    ```bash
    openclaw migrate hermes --dry-run    # preview only
    openclaw migrate apply hermes --yes  # apply with confirmation skipped
    ```

    Añade `--from <path>` cuando Hermes esté fuera de `~/.hermes`.

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
    Valores predeterminados de configuración de memoria para la memoria de archivos de OpenClaw. Los proveedores de memoria externos, como Honcho, se registran como elementos de archivo o de revisión manual para que puedas moverlos deliberadamente.
  </Accordion>
  <Accordion title="Skills">
    Las Skills con un archivo `SKILL.md` bajo `skills/<name>/` se copian, junto con los valores de configuración por Skill desde `skills.config`.
  </Accordion>
  <Accordion title="Credenciales de autenticación">
    `openclaw migrate` interactivo pregunta antes de importar credenciales de autenticación, con sí seleccionado de forma predeterminada. Al aceptar, se importan las entradas de OAuth de OpenAI de OpenCode y GitHub Copilot desde `auth.json` de OpenCode, además de las [claves `.env` de Hermes compatibles](/es/cli/migrate#supported-env-keys). Las entradas OAuth del propio `auth.json` de Hermes son estado heredado: aparecen como un elemento de reautenticación manual o doctor en lugar de importarse en la autenticación activa. Usa `--include-secrets` para importar credenciales en una ejecución no interactiva, `--no-auth-credentials` para omitir por completo la importación de credenciales, o la marca `--import-secrets` del asistente de incorporación.
  </Accordion>
</AccordionGroup>

## Qué queda solo como archivo

El proveedor copia estos elementos en el directorio de informes de migración para revisión manual, pero **no** los carga en la configuración ni en las credenciales activas de OpenClaw:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `state.db`

OpenClaw se niega a ejecutar o confiar automáticamente en este estado porque los formatos y los supuestos de confianza pueden variar entre sistemas. Mueve manualmente lo que necesites después de revisar el archivo.

## Flujo recomendado

<Steps>
  <Step title="Previsualizar el plan">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    El plan enumera todo lo que cambiará, incluidos conflictos, elementos omitidos y elementos sensibles. Las claves anidadas que parecen secretas se redactan en la salida.

  </Step>
  <Step title="Aplicar con copia de seguridad">
    ```bash
    openclaw migrate apply hermes --yes
    ```

    OpenClaw crea y verifica una copia de seguridad antes de aplicar. Este ejemplo no interactivo importa solo estado no secreto. Ejecuta sin `--yes` para responder al aviso de credenciales de forma interactiva, o añade `--include-secrets` para incluir credenciales compatibles en una ejecución desatendida.

  </Step>
  <Step title="Ejecutar doctor">
    ```bash
    openclaw doctor
    ```

    [Doctor](/es/gateway/doctor) vuelve a aplicar cualquier migración de configuración pendiente y comprueba si se introdujeron problemas durante la importación.

  </Step>
  <Step title="Reiniciar y verificar">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Confirma que el Gateway está en buen estado y que el modelo, la memoria y las Skills importados están cargados.

  </Step>
</Steps>

## Gestión de conflictos

Apply se niega a continuar cuando el plan informa conflictos (un archivo o valor de configuración ya existe en el destino).

<Warning>
Vuelve a ejecutar con `--overwrite` solo cuando reemplazar el destino existente sea intencional. Los proveedores aún pueden escribir copias de seguridad por elemento para archivos sobrescritos en el directorio de informes de migración.
</Warning>

Los conflictos son inusuales en una instalación nueva. Normalmente aparecen cuando vuelves a ejecutar la importación contra una configuración que ya tiene ediciones del usuario.

Si aparece un conflicto durante la aplicación (por ejemplo, una carrera inesperada en un archivo de configuración), Hermes marca los elementos de configuración dependientes restantes como `skipped` con el motivo `blocked by earlier apply conflict` en lugar de escribirlos parcialmente. El informe de migración registra cada elemento bloqueado para que puedas resolver el conflicto original y volver a ejecutar la importación.

## Secretos

`openclaw migrate` interactivo pregunta si se deben importar las credenciales de autenticación detectadas, con sí seleccionado de forma predeterminada.

- Al aceptar, se importan las entradas de OAuth de OpenAI de OpenCode y GitHub Copilot desde `auth.json` de OpenCode, además de las [claves `.env` compatibles](/es/cli/migrate#supported-env-keys). Las entradas OAuth del propio `auth.json` de Hermes se informan para reautenticación manual de OpenAI o reparación de doctor en su lugar.
- Usa `--no-auth-credentials`, o responde no en el aviso, para importar solo estado no secreto.
- Usa `--include-secrets` para importar credenciales en una ejecución `--yes` desatendida.
- Usa la marca `--import-secrets` del asistente de incorporación para importar credenciales desde el asistente.

## Salida JSON para automatización

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

Con `--json` y sin `--yes`, apply imprime el plan y no muta el estado: el modo más seguro para CI y scripts compartidos.

## Solución de problemas

<AccordionGroup>
  <Accordion title="Apply se niega por conflictos">
    Inspecciona la salida del plan. Cada conflicto identifica la ruta de origen y el destino existente. Decide por elemento si omitirlo, editar el destino o volver a ejecutar con `--overwrite`.
  </Accordion>
  <Accordion title="Hermes está fuera de ~/.hermes">
    Pasa `--from /actual/path` (CLI) o `--import-source /actual/path` (incorporación).
  </Accordion>
  <Accordion title="La incorporación se niega a importar en una configuración existente">
    Las importaciones de incorporación requieren una configuración nueva. Restablece el estado y vuelve a incorporarte, o usa `openclaw migrate apply hermes` directamente, que admite `--overwrite` y control explícito de copias de seguridad.
  </Accordion>
  <Accordion title="Las claves de API no se importaron">
    `openclaw migrate` interactivo importa claves de API solo cuando aceptas el aviso de credenciales. Las ejecuciones no interactivas con `--yes` necesitan `--include-secrets`; las importaciones de incorporación necesitan `--import-secrets`. Solo se reconocen las [claves `.env` compatibles](/es/cli/migrate#supported-env-keys); otras variables `.env` se ignoran.
  </Accordion>
</AccordionGroup>

## Relacionado

- [`openclaw migrate`](/es/cli/migrate): referencia completa de la CLI, contrato de Plugin y formas JSON.
- [Incorporación](/es/cli/onboard): flujo del asistente y marcas no interactivas.
- [Migración](/es/install/migrating): mover una instalación de OpenClaw entre máquinas.
- [Doctor](/es/gateway/doctor): comprobación de estado posterior a la migración.
- [Espacio de trabajo del agente](/es/concepts/agent-workspace): dónde residen `SOUL.md`, `AGENTS.md` y los archivos de memoria.
