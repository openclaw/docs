---
read_when:
    - Vienes de Hermes y quieres conservar la configuración de tu modelo, tus indicaciones, tu memoria y tus Skills
    - Quieres saber qué importa OpenClaw automáticamente y qué permanece solo en el archivo
    - Necesitas una ruta de migración limpia y basada en scripts (CI, portátil recién configurado, automatización)
summary: Migra de Hermes a OpenClaw con una importación reversible y con vista previa
title: Migración desde Hermes
x-i18n:
    generated_at: "2026-04-30T05:48:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01f8a71e524b31c85864be63e54fc8a2057ecb06a73aac9e6fb107fc0c49757d
    source_path: install/migrating-hermes.md
    workflow: 16
---

OpenClaw importa el estado de Hermes mediante un proveedor de migración incluido. El proveedor previsualiza todo antes de cambiar el estado, redacta los secretos en los planes y los informes, y crea una copia de seguridad verificada antes de aplicar los cambios.

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
    - Selección de modelo predeterminada desde `config.yaml` de Hermes.
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
    Valores predeterminados de configuración de memoria para la memoria basada en archivos de OpenClaw. Los proveedores de memoria externos, como Honcho, se registran como elementos de archivo o de revisión manual para que puedas moverlos deliberadamente.
  </Accordion>
  <Accordion title="Skills">
    Las Skills con un archivo `SKILL.md` bajo `skills/<name>/` se copian junto con los valores de configuración por Skill desde `skills.config`.
  </Accordion>
  <Accordion title="Claves de API (opcional)">
    Establece `--include-secrets` para importar las claves `.env` admitidas: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`. Sin la marca, los secretos nunca se copian.
  </Accordion>
</AccordionGroup>

## Qué queda solo como archivo

El proveedor copia estos elementos en el directorio del informe de migración para revisión manual, pero **no** los carga en la configuración ni en las credenciales activas de OpenClaw:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `auth.json`
- `state.db`

OpenClaw se niega a ejecutar o confiar automáticamente en este estado porque los formatos y los supuestos de confianza pueden divergir entre sistemas. Mueve manualmente lo que necesites después de revisar el archivo.

## Flujo recomendado

<Steps>
  <Step title="Previsualiza el plan">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    El plan enumera todo lo que cambiará, incluidos conflictos, elementos omitidos y cualquier elemento sensible. La salida del plan redacta las claves anidadas que parezcan secretas.

  </Step>
  <Step title="Aplica con copia de seguridad">
    ```bash
    openclaw migrate apply hermes --yes
    ```

    OpenClaw crea y verifica una copia de seguridad antes de aplicar los cambios. Si necesitas importar claves de API, añade `--include-secrets`.

  </Step>
  <Step title="Ejecuta doctor">
    ```bash
    openclaw doctor
    ```

    [Doctor](/es/gateway/doctor) vuelve a aplicar cualquier migración de configuración pendiente y comprueba si se introdujeron problemas durante la importación.

  </Step>
  <Step title="Reinicia y verifica">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Confirma que el Gateway esté en buen estado y que el modelo, la memoria y las Skills importados estén cargados.

  </Step>
</Steps>

## Manejo de conflictos

La aplicación se niega a continuar cuando el plan informa conflictos (un archivo o valor de configuración ya existe en el destino).

<Warning>
Vuelve a ejecutar con `--overwrite` solo cuando reemplazar el destino existente sea intencional. Los proveedores aún pueden escribir copias de seguridad a nivel de elemento para archivos sobrescritos en el directorio del informe de migración.
</Warning>

En una instalación nueva de OpenClaw, los conflictos son inusuales. Suelen aparecer cuando vuelves a ejecutar la importación en una configuración que ya tiene ediciones del usuario.

Si surge un conflicto a mitad de la aplicación (por ejemplo, una condición de carrera inesperada en un archivo de configuración), Hermes marca los elementos de configuración dependientes restantes como `skipped` con el motivo `blocked by earlier apply conflict` en lugar de escribirlos parcialmente. El informe de migración registra cada elemento bloqueado para que puedas resolver el conflicto original y volver a ejecutar la importación.

## Secretos

Los secretos nunca se importan de forma predeterminada.

- Ejecuta primero `openclaw migrate apply hermes --yes` para importar el estado no secreto.
- Si también quieres copiar las claves `.env` admitidas, vuelve a ejecutar con `--include-secrets`.
- Para credenciales gestionadas por SecretRef, configura la fuente de SecretRef después de que finalice la importación.

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
    Las importaciones de incorporación requieren una configuración nueva. Restablece el estado y vuelve a incorporarlo, o usa `openclaw migrate apply hermes` directamente, que admite `--overwrite` y control explícito de copias de seguridad.
  </Accordion>
  <Accordion title="Las claves de API no se importaron">
    `--include-secrets` es obligatorio, y solo se reconocen las claves enumeradas arriba. Otras variables en `.env` se ignoran.
  </Accordion>
</AccordionGroup>

## Relacionado

- [`openclaw migrate`](/es/cli/migrate): referencia completa de CLI, contrato de Plugin y formas JSON.
- [Incorporación](/es/cli/onboard): flujo del asistente y marcas no interactivas.
- [Migración](/es/install/migrating): mover una instalación de OpenClaw entre máquinas.
- [Doctor](/es/gateway/doctor): comprobación de estado posterior a la migración.
- [Espacio de trabajo del agente](/es/concepts/agent-workspace): dónde residen `SOUL.md`, `AGENTS.md` y los archivos de memoria.
