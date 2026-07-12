---
read_when:
    - Estás trasladando OpenClaw a un nuevo portátil o servidor
    - Vienes de otro sistema de agentes y quieres conservar el estado
    - Estás actualizando un plugin existente in situ
summary: 'Centro de migración: importaciones entre sistemas, traslados de una máquina a otra y actualizaciones de plugins'
title: Guía de migración
x-i18n:
    generated_at: "2026-07-11T23:13:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c7961f78bc654d328cb91a6ef982b6e47740fd831aec9249c8ffed3225dd0ccf
    source_path: install/migrating.md
    workflow: 16
---

OpenClaw admite tres rutas de migración: importar desde otro sistema de agentes, trasladar una instalación existente a una máquina nueva y actualizar un Plugin en el mismo lugar.

## Importar desde otro sistema de agentes

Los proveedores de migración incluidos incorporan a OpenClaw instrucciones, servidores MCP, Skills, configuración de modelos y, opcionalmente, claves de API. Los planes se previsualizan antes de realizar cualquier cambio, los secretos se ocultan en los informes y la aplicación cuenta con el respaldo de una copia de seguridad verificada.

<CardGroup cols={2}>
  <Card title="Migración desde Claude" href="/es/install/migrating-claude" icon="brain">
    Importa el estado de Claude Code y Claude Desktop, incluidos `CLAUDE.md`, servidores MCP, Skills y comandos de proyecto.
  </Card>
  <Card title="Migración desde Hermes" href="/es/install/migrating-hermes" icon="feather">
    Importa la configuración de Hermes, proveedores, servidores MCP, memoria, Skills y claves compatibles de `.env`.
  </Card>
</CardGroup>

El punto de entrada de la CLI es [`openclaw migrate`](/es/cli/migrate). La incorporación también puede ofrecer la migración cuando detecta un origen conocido (`openclaw onboard --flow import`).

## Trasladar OpenClaw a una máquina nueva

Copia el **directorio de estado** (`~/.openclaw/` de forma predeterminada) y tu **espacio de trabajo** para conservar:

- **Configuración** — `openclaw.json` y todos los ajustes del Gateway.
- **Autenticación** — el archivo `auth-profiles.json` de cada agente (claves de API y OAuth), además de cualquier estado de canal o proveedor en `credentials/`.
- **Sesiones** — el historial de conversaciones y el estado de los agentes.
- **Estado de los canales** — el inicio de sesión de WhatsApp, la sesión de Telegram y otros similares.
- **Archivos del espacio de trabajo** — `MEMORY.md`, `USER.md`, Skills e indicaciones.

<Tip>
Ejecuta `openclaw status` en la máquina antigua para confirmar la ruta del directorio de estado. Los perfiles personalizados usan `~/.openclaw-<profile>/` o una ruta establecida mediante `OPENCLAW_STATE_DIR`.
</Tip>

### Pasos de migración

<Steps>
  <Step title="Detener el Gateway y crear una copia de seguridad">
    En la máquina **antigua**, detén el Gateway para que los archivos no cambien durante la copia y, a continuación, crea un archivo comprimido:

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    Si usas varios perfiles (por ejemplo, `~/.openclaw-work`), archiva cada uno por separado.

  </Step>

  <Step title="Instalar OpenClaw en la máquina nueva">
    [Instala](/es/install) la CLI (y Node si es necesario) en la máquina nueva. No importa si la incorporación crea un nuevo `~/.openclaw/`, ya que lo sobrescribirás en el paso siguiente.
  </Step>

  <Step title="Copiar el directorio de estado y el espacio de trabajo">
    Transfiere el archivo mediante `scp`, `rsync -a` o una unidad externa y, a continuación, extráelo:

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    Confirma que se hayan incluido los directorios ocultos y que la propiedad de los archivos corresponda al usuario que ejecutará el Gateway.

  </Step>

  <Step title="Ejecutar Doctor y verificar">
    En la máquina nueva, ejecuta [Doctor](/es/gateway/doctor) para aplicar las migraciones de configuración y reparar los servicios:

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

Si Telegram o Discord usan la alternativa predeterminada de variables de entorno (`TELEGRAM_BOT_TOKEN` o `DISCORD_BOT_TOKEN`), verifica que el archivo `.env` del directorio de estado migrado contenga esas claves sin imprimir los valores secretos:

```bash
awk -F= '/^(TELEGRAM_BOT_TOKEN|DISCORD_BOT_TOKEN)=/ { print $1 "=present" }' ~/.openclaw/.env
```

`openclaw doctor` también advierte cuando una cuenta predeterminada habilitada de Telegram o Discord no tiene ningún token configurado y la variable de entorno correspondiente no está disponible para el proceso de Doctor.

### Problemas habituales

<AccordionGroup>
  <Accordion title="Discordancia del perfil o del directorio de estado">
    Si el Gateway antiguo usaba `--profile` u `OPENCLAW_STATE_DIR` y el nuevo no, los canales aparecerán con la sesión cerrada y las sesiones estarán vacías. Inicia el Gateway con el **mismo** perfil o directorio de estado que migraste y, a continuación, vuelve a ejecutar `openclaw doctor`.
  </Accordion>

  <Accordion title="Copiar únicamente openclaw.json">
    El archivo de configuración por sí solo no es suficiente. Los perfiles de autenticación de modelos se encuentran en `agents/<agentId>/agent/auth-profiles.json`, y el estado de los canales y proveedores se encuentra en `credentials/`. Migra siempre el directorio de estado **completo**.
  </Accordion>

  <Accordion title="Permisos y propiedad">
    Si realizaste la copia como usuario raíz o cambiaste de usuario, es posible que el Gateway no pueda leer las credenciales. Asegúrate de que el directorio de estado y el espacio de trabajo sean propiedad del usuario que ejecuta el Gateway.
  </Accordion>

  <Accordion title="Modo remoto">
    Si tu interfaz apunta a un Gateway **remoto**, el host remoto es el propietario de las sesiones y del espacio de trabajo. Migra el propio host del Gateway, no tu portátil local. Consulta las [preguntas frecuentes](/es/help/faq#where-things-live-on-disk).
  </Accordion>

  <Accordion title="Secretos en las copias de seguridad">
    El directorio de estado contiene perfiles de autenticación, credenciales de canales y otros datos de estado de proveedores. Guarda las copias de seguridad cifradas, evita canales de transferencia inseguros y rota las claves si sospechas que han quedado expuestas.
  </Accordion>
</AccordionGroup>

### Lista de verificación

En la máquina nueva, confirma lo siguiente:

- [ ] `openclaw status` muestra que el Gateway está en ejecución.
- [ ] Los canales siguen conectados (no es necesario volver a vincularlos).
- [ ] El panel se abre y muestra las sesiones existentes.
- [ ] Los archivos del espacio de trabajo (memoria y configuraciones) están presentes.

## Actualizar un Plugin en el mismo lugar

Las actualizaciones de Plugins en el mismo lugar conservan el mismo identificador de Plugin y las mismas claves de configuración, pero pueden trasladar el estado almacenado en disco a la disposición actual. Las guías de actualización específicas de cada Plugin se encuentran junto a sus canales:

- [Migración de Matrix](/es/channels/matrix-migration): límites de recuperación del estado cifrado, comportamiento de las instantáneas automáticas y comandos de recuperación manual.

## Contenido relacionado

- [`openclaw migrate`](/es/cli/migrate): referencia de la CLI para importaciones entre sistemas.
- [Descripción general de la instalación](/es/install): todos los métodos de instalación.
- [Doctor](/es/gateway/doctor): comprobación del estado después de la migración.
- [Desinstalación](/es/install/uninstall): cómo eliminar OpenClaw de forma limpia.
