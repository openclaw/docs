---
read_when:
    - Estás moviendo OpenClaw a un portátil/servidor nuevo
    - Quieres conservar sesiones, autenticación e inicios de sesión de canales (WhatsApp, etc.)
summary: Mover (migrar) una instalación de OpenClaw de una máquina a otra
title: Guía de migración
x-i18n:
    generated_at: "2026-04-24T05:35:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2c14be563d1eb052726324678cf2784efffc2341aa17f662587fdabe1d8ec1e2
    source_path: install/migrating.md
    workflow: 15
---

# Migrar OpenClaw a una máquina nueva

Esta guía mueve un Gateway de OpenClaw a una máquina nueva sin rehacer la incorporación.

## Qué se migra

Cuando copias el **directorio de estado** (`~/.openclaw/` de forma predeterminada) y tu **espacio de trabajo**, conservas:

- **Configuración** -- `openclaw.json` y todos los ajustes de Gateway
- **Autenticación** -- `auth-profiles.json` por agente (claves API + OAuth), además de cualquier estado de canal/proveedor en `credentials/`
- **Sesiones** -- historial de conversaciones y estado del agente
- **Estado del canal** -- inicio de sesión de WhatsApp, sesión de Telegram, etc.
- **Archivos del espacio de trabajo** -- `MEMORY.md`, `USER.md`, Skills y prompts

<Tip>
Ejecuta `openclaw status` en la máquina anterior para confirmar la ruta de tu directorio de estado.
Los perfiles personalizados usan `~/.openclaw-<profile>/` o una ruta establecida mediante `OPENCLAW_STATE_DIR`.
</Tip>

## Pasos de migración

<Steps>
  <Step title="Detener Gateway y hacer una copia de seguridad">
    En la máquina **anterior**, detén Gateway para que los archivos no cambien a mitad de la copia y luego archiva:

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    Si usas varios perfiles (por ejemplo `~/.openclaw-work`), archiva cada uno por separado.

  </Step>

  <Step title="Instalar OpenClaw en la máquina nueva">
    [Instala](/es/install) la CLI (y Node si hace falta) en la máquina nueva.
    No pasa nada si la incorporación crea un `~/.openclaw/` nuevo: lo sobrescribirás a continuación.
  </Step>

  <Step title="Copiar el directorio de estado y el espacio de trabajo">
    Transfiere el archivo con `scp`, `rsync -a` o una unidad externa, y luego extráelo:

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    Asegúrate de que se incluyeron los directorios ocultos y de que la propiedad de los archivos coincida con el usuario que ejecutará Gateway.

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

## Errores comunes

<AccordionGroup>
  <Accordion title="Desajuste de perfil o de directorio de estado">
    Si el Gateway anterior usaba `--profile` o `OPENCLAW_STATE_DIR` y el nuevo no,
    los canales parecerán desconectados y las sesiones estarán vacías.
    Inicia Gateway con el **mismo** perfil o directorio de estado que migraste y luego vuelve a ejecutar `openclaw doctor`.
  </Accordion>

  <Accordion title="Copiar solo openclaw.json">
    El archivo de configuración por sí solo no basta. Los perfiles de autenticación del modelo viven en
    `agents/<agentId>/agent/auth-profiles.json`, y el estado del canal/proveedor sigue
    viviendo en `credentials/`. Migra siempre el **directorio de estado completo**.
  </Accordion>

  <Accordion title="Permisos y propiedad">
    Si copiaste como root o cambiaste de usuario, Gateway puede no poder leer las credenciales.
    Asegúrate de que el directorio de estado y el espacio de trabajo pertenezcan al usuario que ejecuta Gateway.
  </Accordion>

  <Accordion title="Modo remoto">
    Si tu UI apunta a un Gateway **remoto**, el host remoto es el propietario de las sesiones y del espacio de trabajo.
    Migra el propio host de Gateway, no tu portátil local. Consulta [FAQ](/es/help/faq#where-things-live-on-disk).
  </Accordion>

  <Accordion title="Secretos en copias de seguridad">
    El directorio de estado contiene perfiles de autenticación, credenciales de canales y otro
    estado de proveedor.
    Guarda las copias de seguridad cifradas, evita canales de transferencia inseguros y rota las claves si sospechas exposición.
  </Accordion>
</AccordionGroup>

## Lista de verificación

En la máquina nueva, confirma:

- [ ] `openclaw status` muestra que Gateway está en ejecución
- [ ] Los canales siguen conectados (no hace falta volver a emparejar)
- [ ] El panel se abre y muestra las sesiones existentes
- [ ] Los archivos del espacio de trabajo (memoria, configuraciones) están presentes

## Relacionado

- [Resumen de instalación](/es/install)
- [Migración de Matrix](/es/install/migrating-matrix)
- [Desinstalar](/es/install/uninstall)
