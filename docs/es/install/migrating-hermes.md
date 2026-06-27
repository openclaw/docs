---
read_when:
    - Vienes de Hermes y quieres conservar la configuración de tu modelo, los prompts, la memoria y las Skills
    - Quieres saber qué importa OpenClaw automáticamente y qué permanece solo en el archivo
    - Necesitas una ruta de migración limpia y con scripts (CI, portátil nuevo, automatización)
summary: Migra de Hermes a OpenClaw con una importación reversible con vista previa
title: Migrando desde Hermes
x-i18n:
    generated_at: "2026-06-27T11:49:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4f2a2bfea4fd276e3392261e8ecea09d147424636efb200ced1deb86ac0161b5
    source_path: install/migrating-hermes.md
    workflow: 16
---

OpenClaw importa el estado de Hermes mediante un proveedor de migración incluido. El proveedor previsualiza todo antes de cambiar el estado, redacta los secretos en planes e informes, y crea una copia de seguridad verificada antes de aplicar los cambios.

<Note>
Las importaciones requieren una configuración nueva de OpenClaw. Si ya tienes estado local de OpenClaw, restablece primero la configuración, las credenciales, las sesiones y el espacio de trabajo, o usa `openclaw migrate` directamente con `--overwrite` después de revisar el plan.
</Note>

## Dos formas de importar

<Tabs>
  <Tab title="Asistente de incorporación">
    La ruta más rápida. El asistente detecta Hermes en `~/.hermes` y muestra una vista previa antes de aplicar los cambios.

    ```bash
    openclaw onboard --flow import
    ```

    O apunta a un origen específico:

    ```bash
    openclaw onboard --import-from hermes --import-source ~/.hermes
    ```

  </Tab>
  <Tab title="CLI">
    Usa `openclaw migrate` para ejecuciones con scripts o repetibles. Consulta [`openclaw migrate`](/es/cli/migrate) para ver la referencia completa.

    ```bash
    openclaw migrate hermes --dry-run    # solo vista previa
    openclaw migrate apply hermes --yes  # aplicar omitiendo la confirmación
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
    - `memories/MEMORY.md` y `memories/USER.md` se **anexan** a los archivos de memoria correspondientes de OpenClaw en lugar de sobrescribirlos.

  </Accordion>
  <Accordion title="Configuración de memoria">
    Valores predeterminados de configuración de memoria para la memoria de archivos de OpenClaw. Los proveedores de memoria externos, como Honcho, se registran como elementos de archivo o de revisión manual para que puedas moverlos deliberadamente.
  </Accordion>
  <Accordion title="Skills">
    Las Skills con un archivo `SKILL.md` bajo `skills/<name>/` se copian, junto con los valores de configuración por Skill desde `skills.config`.
  </Accordion>
  <Accordion title="Credenciales de autenticación">
    `openclaw migrate` interactivo pregunta antes de importar credenciales de autenticación, con sí seleccionado de forma predeterminada. Las importaciones aceptadas incluyen credenciales OAuth de OpenAI de OpenCode desde `auth.json` de OpenCode, entradas de OpenCode y GitHub Copilot desde `auth.json` de OpenCode, y las [claves `.env` admitidas](/es/cli/migrate#supported-env-keys). Las entradas OAuth de `auth.json` de Hermes son estado heredado y se muestran como trabajo de reautenticación manual o doctor en lugar de importarse a la autenticación activa. Usa `--include-secrets` para la importación no interactiva de credenciales con `openclaw migrate`, `--no-auth-credentials` para omitirla, o `--import-secrets` de incorporación al importar desde el asistente de incorporación.
  </Accordion>
</AccordionGroup>

## Qué queda solo como archivo

El proveedor copia estos elementos en el directorio del informe de migración para revisión manual, pero **no** los carga en la configuración ni en las credenciales activas de OpenClaw:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `state.db`

OpenClaw se niega a ejecutar o confiar automáticamente en este estado porque los formatos y los supuestos de confianza pueden divergir entre sistemas. Mueve manualmente lo que necesites después de revisar el archivo.

## Flujo recomendado

<Steps>
  <Step title="Previsualizar el plan">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    El plan enumera todo lo que cambiará, incluidos conflictos, elementos omitidos y cualquier elemento sensible. La salida del plan redacta las claves anidadas que parecen secretas.

  </Step>
  <Step title="Aplicar con copia de seguridad">
    ```bash
    openclaw migrate apply hermes --yes
    ```

    OpenClaw crea y verifica una copia de seguridad antes de aplicar los cambios. Este ejemplo no interactivo importa estado no secreto. Ejecútalo sin `--yes` para responder a la solicitud de credenciales, o añade `--include-secrets` para incluir credenciales admitidas en ejecuciones desatendidas.

  </Step>
  <Step title="Ejecutar doctor">
    ```bash
    openclaw doctor
    ```

    [Doctor](/es/gateway/doctor) vuelve a aplicar cualquier migración de configuración pendiente y comprueba si hay problemas introducidos durante la importación.

  </Step>
  <Step title="Reiniciar y verificar">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Confirma que el Gateway esté en buen estado y que el modelo, la memoria y las Skills importados estén cargados.

  </Step>
</Steps>

## Gestión de conflictos

La aplicación se niega a continuar cuando el plan informa conflictos (un archivo o valor de configuración ya existe en el destino).

<Warning>
Vuelve a ejecutar con `--overwrite` solo cuando reemplazar el destino existente sea intencional. Los proveedores todavía pueden escribir copias de seguridad a nivel de elemento para archivos sobrescritos en el directorio del informe de migración.
</Warning>

En una instalación nueva de OpenClaw, los conflictos son poco frecuentes. Suelen aparecer cuando vuelves a ejecutar la importación en una configuración que ya tiene ediciones de usuario.

Si aparece un conflicto a mitad de la aplicación (por ejemplo, una carrera inesperada en un archivo de configuración), Hermes marca los elementos de configuración dependientes restantes como `skipped` con el motivo `blocked by earlier apply conflict` en lugar de escribirlos parcialmente. El informe de migración registra cada elemento bloqueado para que puedas resolver el conflicto original y volver a ejecutar la importación.

## Secretos

`openclaw migrate` interactivo pregunta si se deben importar las credenciales de autenticación detectadas, con sí seleccionado de forma predeterminada.

- Aceptar la solicitud importa credenciales OAuth de OpenAI de OpenCode desde `auth.json` de OpenCode, entradas de OpenCode y GitHub Copilot desde `auth.json` de OpenCode, y las [claves `.env` admitidas](/es/cli/migrate#supported-env-keys). Las entradas OAuth de `auth.json` de Hermes se informan para reautenticación manual de OpenAI o reparación con doctor.
- Usa `--no-auth-credentials` o elige no en la solicitud para importar solo estado no secreto.
- Usa `--include-secrets` al ejecutar de forma desatendida con `--yes`.
- Usa `--import-secrets` de incorporación al importar credenciales desde el asistente de incorporación.
- Para credenciales gestionadas por SecretRef, configura el origen de SecretRef después de que se complete la importación.

## Salida JSON para automatización

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

Con `--json` y sin `--yes`, la aplicación imprime el plan y no muta el estado. Este es el modo más seguro para CI y scripts compartidos.

## Solución de problemas

<AccordionGroup>
  <Accordion title="La aplicación se niega por conflictos">
    Inspecciona la salida del plan. Cada conflicto identifica la ruta de origen y el destino existente. Decide por elemento si omitirlo, editar el destino o volver a ejecutar con `--overwrite`.
  </Accordion>
  <Accordion title="Hermes está fuera de ~/.hermes">
    Pasa `--from /actual/path` (CLI) o `--import-source /actual/path` (incorporación).
  </Accordion>
  <Accordion title="La incorporación se niega a importar en una configuración existente">
    Las importaciones de incorporación requieren una configuración nueva. Restablece el estado y vuelve a hacer la incorporación, o usa `openclaw migrate apply hermes` directamente, que admite `--overwrite` y control explícito de copias de seguridad.
  </Accordion>
  <Accordion title="Las claves de API no se importaron">
    `openclaw migrate` interactivo importa claves de API solo cuando aceptas la solicitud de credenciales. Las ejecuciones no interactivas con `--yes` requieren `--include-secrets`; las importaciones de incorporación requieren `--import-secrets`. Solo se reconocen las [claves `.env` admitidas](/es/cli/migrate#supported-env-keys); otras variables en `.env` se ignoran.
  </Accordion>
</AccordionGroup>

## Relacionado

- [`openclaw migrate`](/es/cli/migrate): referencia completa de la CLI, contrato de Plugin y formas JSON.
- [Incorporación](/es/cli/onboard): flujo del asistente y marcas no interactivas.
- [Migración](/es/install/migrating): mover una instalación de OpenClaw entre máquinas.
- [Doctor](/es/gateway/doctor): comprobación de estado posterior a la migración.
- [Espacio de trabajo del agente](/es/concepts/agent-workspace): dónde residen `SOUL.md`, `AGENTS.md` y los archivos de memoria.
