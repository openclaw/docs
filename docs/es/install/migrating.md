---
read_when:
    - Estás trasladando OpenClaw a una laptop o un servidor nuevo
    - Vienes de otro sistema de agentes y quieres conservar el estado
    - Estás actualizando un plugin in situ
summary: 'Centro de migración: importaciones entre sistemas, movimientos de máquina a máquina y actualizaciones de plugins'
title: Guía de migración
x-i18n:
    generated_at: "2026-07-05T11:29:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c7961f78bc654d328cb91a6ef982b6e47740fd831aec9249c8ffed3225dd0ccf
    source_path: install/migrating.md
    workflow: 16
---

OpenClaw admite tres rutas de migración: importar desde otro sistema de agentes, mover una instalación existente a una máquina nueva y actualizar un plugin en el lugar.

## Importar desde otro sistema de agentes

Los proveedores de migración incluidos llevan instrucciones, servidores MCP, habilidades, configuración de modelos y claves de API (opcionales) a OpenClaw. Los planes se previsualizan antes de cualquier cambio, los secretos se redactan en los informes y la aplicación está respaldada por una copia de seguridad verificada.

<CardGroup cols={2}>
  <Card title="Migrar desde Claude" href="/es/install/migrating-claude" icon="brain">
    Importa el estado de Claude Code y Claude Desktop, incluidos `CLAUDE.md`, servidores MCP, habilidades y comandos de proyecto.
  </Card>
  <Card title="Migrar desde Hermes" href="/es/install/migrating-hermes" icon="feather">
    Importa la configuración de Hermes, proveedores, servidores MCP, memoria, habilidades y claves `.env` compatibles.
  </Card>
</CardGroup>

El punto de entrada de la CLI es [`openclaw migrate`](/es/cli/migrate). La incorporación también puede ofrecer migración cuando detecta un origen conocido (`openclaw onboard --flow import`).

## Mover OpenClaw a una máquina nueva

Copia el **directorio de estado** (`~/.openclaw/` de forma predeterminada) y tu **espacio de trabajo** para conservar:

- **Configuración** — `openclaw.json` y todos los ajustes del gateway.
- **Autenticación** — `auth-profiles.json` por agente (claves de API más OAuth), además de cualquier estado de canal o proveedor bajo `credentials/`.
- **Sesiones** — historial de conversaciones y estado del agente.
- **Estado de canales** — inicio de sesión de WhatsApp, sesión de Telegram y similares.
- **Archivos del espacio de trabajo** — `MEMORY.md`, `USER.md`, habilidades y prompts.

<Tip>
Ejecuta `openclaw status` en la máquina antigua para confirmar la ruta de tu directorio de estado. Los perfiles personalizados usan `~/.openclaw-<profile>/` o una ruta definida mediante `OPENCLAW_STATE_DIR`.
</Tip>

### Pasos de migración

<Steps>
  <Step title="Detén el gateway y haz una copia de seguridad">
    En la máquina **antigua**, detén el gateway para que los archivos no cambien durante la copia y luego archiva:

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    Si usas varios perfiles (por ejemplo `~/.openclaw-work`), archiva cada uno por separado.

  </Step>

  <Step title="Instala OpenClaw en la máquina nueva">
    [Instala](/es/install) la CLI (y Node si es necesario) en la máquina nueva. No pasa nada si la incorporación crea un `~/.openclaw/` nuevo; lo sobrescribirás a continuación.
  </Step>

  <Step title="Copia el directorio de estado y el espacio de trabajo">
    Transfiere el archivo mediante `scp`, `rsync -a` o una unidad externa y luego extráelo:

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    Confirma que se incluyeron los directorios ocultos y que la propiedad de los archivos coincide con el usuario que ejecutará el gateway.

  </Step>

  <Step title="Ejecuta doctor y verifica">
    En la máquina nueva, ejecuta [Doctor](/es/gateway/doctor) para aplicar migraciones de configuración y reparar servicios:

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

Si Telegram o Discord usa el fallback de entorno predeterminado (`TELEGRAM_BOT_TOKEN` o `DISCORD_BOT_TOKEN`), verifica que el `.env` del directorio de estado migrado contenga esas claves sin imprimir los valores secretos:

```bash
awk -F= '/^(TELEGRAM_BOT_TOKEN|DISCORD_BOT_TOKEN)=/ { print $1 "=present" }' ~/.openclaw/.env
```

`openclaw doctor` también advierte cuando una cuenta predeterminada de Telegram o Discord habilitada no tiene ningún token configurado y la variable de entorno correspondiente no está disponible para el proceso de doctor.

### Errores comunes

<AccordionGroup>
  <Accordion title="Perfil o directorio de estado no coincide">
    Si el gateway antiguo usaba `--profile` o `OPENCLAW_STATE_DIR` y el nuevo no, los canales aparecerán con sesión cerrada y las sesiones estarán vacías. Inicia el gateway con el **mismo** perfil o directorio de estado que migraste y luego vuelve a ejecutar `openclaw doctor`.
  </Accordion>

  <Accordion title="Copiar solo openclaw.json">
    El archivo de configuración por sí solo no basta. Los perfiles de autenticación de modelos viven bajo `agents/<agentId>/agent/auth-profiles.json`, y el estado de canales y proveedores vive bajo `credentials/`. Migra siempre el directorio de estado **completo**.
  </Accordion>

  <Accordion title="Permisos y propiedad">
    Si copiaste como root o cambiaste de usuario, puede que el gateway no pueda leer las credenciales. Asegúrate de que el directorio de estado y el espacio de trabajo pertenezcan al usuario que ejecuta el gateway.
  </Accordion>

  <Accordion title="Modo remoto">
    Si tu IU apunta a un gateway **remoto**, el host remoto posee las sesiones y el espacio de trabajo. Migra el propio host del gateway, no tu portátil local. Consulta las [Preguntas frecuentes](/es/help/faq#where-things-live-on-disk).
  </Accordion>

  <Accordion title="Secretos en copias de seguridad">
    El directorio de estado contiene perfiles de autenticación, credenciales de canales y otro estado de proveedores. Guarda las copias de seguridad cifradas, evita canales de transferencia inseguros y rota las claves si sospechas exposición.
  </Accordion>
</AccordionGroup>

### Lista de verificación

En la máquina nueva, confirma:

- [ ] `openclaw status` muestra que el gateway está en ejecución.
- [ ] Los canales siguen conectados (no hace falta volver a emparejarlos).
- [ ] El panel se abre y muestra las sesiones existentes.
- [ ] Los archivos del espacio de trabajo (memoria, configuraciones) están presentes.

## Actualizar un plugin en el lugar

Las actualizaciones de plugins en el lugar conservan el mismo id de plugin y las claves de configuración, pero pueden mover el estado en disco al diseño actual. Las guías de actualización específicas de cada plugin viven junto a sus canales:

- [Migración de Matrix](/es/channels/matrix-migration): límites de recuperación de estado cifrado, comportamiento de instantáneas automáticas y comandos de recuperación manual.

## Relacionado

- [`openclaw migrate`](/es/cli/migrate): referencia de la CLI para importaciones entre sistemas.
- [Descripción general de instalación](/es/install): todos los métodos de instalación.
- [Doctor](/es/gateway/doctor): comprobación de estado posterior a la migración.
- [Desinstalar](/es/install/uninstall): eliminar OpenClaw limpiamente.
