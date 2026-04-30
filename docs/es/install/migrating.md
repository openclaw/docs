---
read_when:
    - Estás trasladando OpenClaw a una laptop o un servidor nuevos
    - Vienes de otro sistema de agentes y quieres conservar el estado
    - Estás actualizando un Plugin in situ
summary: 'Centro de migración: importaciones entre sistemas, traslados de máquina a máquina y actualizaciones de Plugin'
title: Guía de migración
x-i18n:
    generated_at: "2026-04-30T05:49:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2a1dc86ed367a0b92cdc0d5189123bb045d327be944516f564dac723f324c97
    source_path: install/migrating.md
    workflow: 16
---

OpenClaw admite tres rutas de migración: importar desde otro sistema de agentes, mover una instalación existente a una máquina nueva y actualizar un Plugin en su lugar.

## Importar desde otro sistema de agentes

Usa los proveedores de migración incluidos para llevar instrucciones, servidores MCP, Skills, configuración del modelo y claves de API (con consentimiento) a OpenClaw. Los planes se previsualizan antes de cualquier cambio, los secretos se redactan en los informes y la aplicación está respaldada por una copia de seguridad verificada.

<CardGroup cols={2}>
  <Card title="Migrar desde Claude" href="/es/install/migrating-claude" icon="brain">
    Importa el estado de Claude Code y Claude Desktop, incluidos `CLAUDE.md`, servidores MCP, Skills y comandos de proyecto.
  </Card>
  <Card title="Migrar desde Hermes" href="/es/install/migrating-hermes" icon="feather">
    Importa la configuración de Hermes, proveedores, servidores MCP, memoria, Skills y claves `.env` compatibles.
  </Card>
</CardGroup>

El punto de entrada de la CLI es [`openclaw migrate`](/es/cli/migrate). La incorporación también puede ofrecer migración cuando detecta una fuente conocida (`openclaw onboard --flow import`).

## Mover OpenClaw a una máquina nueva

Copia el **directorio de estado** (`~/.openclaw/` de forma predeterminada) y tu **espacio de trabajo** para conservar:

- **Configuración** — `openclaw.json` y todos los ajustes del Gateway.
- **Autenticación** — `auth-profiles.json` por agente (claves de API más OAuth), además de cualquier estado de canal o proveedor en `credentials/`.
- **Sesiones** — historial de conversaciones y estado del agente.
- **Estado del canal** — inicio de sesión de WhatsApp, sesión de Telegram y similares.
- **Archivos del espacio de trabajo** — `MEMORY.md`, `USER.md`, Skills y prompts.

<Tip>
Ejecuta `openclaw status` en la máquina antigua para confirmar la ruta de tu directorio de estado. Los perfiles personalizados usan `~/.openclaw-<profile>/` o una ruta definida mediante `OPENCLAW_STATE_DIR`.
</Tip>

### Pasos de migración

<Steps>
  <Step title="Detener el Gateway y hacer una copia de seguridad">
    En la máquina **antigua**, detén el Gateway para que los archivos no cambien durante la copia y luego archiva:

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    Si usas varios perfiles (por ejemplo `~/.openclaw-work`), archiva cada uno por separado.

  </Step>

  <Step title="Instalar OpenClaw en la máquina nueva">
    [Instala](/es/install) la CLI (y Node si es necesario) en la máquina nueva. No pasa nada si la incorporación crea un `~/.openclaw/` nuevo. Lo sobrescribirás a continuación.
  </Step>

  <Step title="Copiar el directorio de estado y el espacio de trabajo">
    Transfiere el archivo mediante `scp`, `rsync -a` o una unidad externa, y luego extráelo:

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    Asegúrate de que se hayan incluido los directorios ocultos y de que la propiedad de los archivos coincida con el usuario que ejecutará el Gateway.

  </Step>

  <Step title="Ejecutar doctor y verificar">
    En la máquina nueva, ejecuta [Doctor](/es/gateway/doctor) para aplicar migraciones de configuración y reparar servicios:

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

### Problemas comunes

<AccordionGroup>
  <Accordion title="Perfil o directorio de estado no coincidente">
    Si el Gateway antiguo usaba `--profile` u `OPENCLAW_STATE_DIR` y el nuevo no, los canales aparecerán con la sesión cerrada y las sesiones estarán vacías. Inicia el Gateway con el **mismo** perfil o directorio de estado que migraste y luego vuelve a ejecutar `openclaw doctor`.
  </Accordion>

  <Accordion title="Copiar solo openclaw.json">
    El archivo de configuración por sí solo no basta. Los perfiles de autenticación de modelos están en `agents/<agentId>/agent/auth-profiles.json`, y el estado de canales y proveedores está en `credentials/`. Migra siempre el directorio de estado **completo**.
  </Accordion>

  <Accordion title="Permisos y propiedad">
    Si copiaste como root o cambiaste de usuario, es posible que el Gateway no pueda leer las credenciales. Asegúrate de que el directorio de estado y el espacio de trabajo sean propiedad del usuario que ejecuta el Gateway.
  </Accordion>

  <Accordion title="Modo remoto">
    Si tu UI apunta a un Gateway **remoto**, el host remoto posee las sesiones y el espacio de trabajo. Migra el propio host del Gateway, no tu portátil local. Consulta las [preguntas frecuentes](/es/help/faq#where-things-live-on-disk).
  </Accordion>

  <Accordion title="Secretos en copias de seguridad">
    El directorio de estado contiene perfiles de autenticación, credenciales de canales y otro estado de proveedores. Almacena las copias de seguridad cifradas, evita canales de transferencia inseguros y rota las claves si sospechas que han quedado expuestas.
  </Accordion>
</AccordionGroup>

### Lista de verificación

En la máquina nueva, confirma:

- [ ] `openclaw status` muestra que el Gateway está en ejecución.
- [ ] Los canales siguen conectados (no hace falta volver a emparejarlos).
- [ ] El panel se abre y muestra las sesiones existentes.
- [ ] Los archivos del espacio de trabajo (memoria, configuraciones) están presentes.

## Actualizar un Plugin en su lugar

Las actualizaciones de Plugin en su lugar conservan el mismo id de Plugin y las mismas claves de configuración, pero pueden mover el estado en disco al diseño actual. Las guías de actualización específicas de Plugin están junto a sus canales:

- [Migración de Matrix](/es/channels/matrix-migration): límites de recuperación de estado cifrado, comportamiento de instantáneas automáticas y comandos de recuperación manual.

## Relacionado

- [`openclaw migrate`](/es/cli/migrate): referencia de la CLI para importaciones entre sistemas.
- [Resumen de instalación](/es/install): todos los métodos de instalación.
- [Doctor](/es/gateway/doctor): comprobación de estado posterior a la migración.
- [Desinstalar](/es/install/uninstall): eliminar OpenClaw limpiamente.
