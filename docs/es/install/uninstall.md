---
read_when:
    - Quieres eliminar OpenClaw de un equipo
    - El servicio Gateway sigue ejecutándose después de la desinstalación
summary: Desinstalar OpenClaw por completo (CLI, servicio, estado, espacio de trabajo)
title: Desinstalar
x-i18n:
    generated_at: "2026-07-11T23:14:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84f01dc11defe6f19c89232375e48bad383b2e71379f47f43e759d3d7bb908b5
    source_path: install/uninstall.md
    workflow: 16
---

Dos opciones:

- **Opción sencilla** si `openclaw` sigue instalado.
- **Eliminación manual del servicio** si la CLI ya no está disponible, pero el servicio sigue ejecutándose.

## Opción sencilla (la CLI sigue instalada)

Recomendación: use el desinstalador integrado:

```bash
openclaw uninstall
```

La eliminación del estado conserva los directorios de espacios de trabajo configurados, a menos que también seleccione `--workspace`.

Previsualice lo que se eliminará (seguro):

```bash
openclaw uninstall --dry-run --all
```

Modo no interactivo (automatización / npx). Úselo con precaución y solo después de confirmar los ámbitos:

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

Opciones: `--service`, `--state`, `--workspace` y `--app` seleccionan ámbitos individuales; `--all` selecciona los cuatro.

Pasos manuales (mismo resultado):

1. Detenga el servicio del Gateway:

```bash
openclaw gateway stop
```

2. Desinstale el servicio del Gateway (launchd/systemd/schtasks):

```bash
openclaw gateway uninstall
```

3. Elimine el estado y la configuración:

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

Si estableció `OPENCLAW_CONFIG_PATH` en una ubicación personalizada fuera del directorio de estado, elimine también ese archivo.
Si desea conservar un espacio de trabajo dentro del directorio de estado, como `~/.openclaw/workspace`, muévalo a otra ubicación antes de ejecutar `rm -rf` o elimine selectivamente el contenido del estado.

4. Elimine su espacio de trabajo (opcional; elimina los archivos del agente):

```bash
rm -rf ~/.openclaw/workspace
```

5. Elimine la instalación de la CLI (elija el comando correspondiente al método que utilizó):

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

6. Si instaló la aplicación para macOS:

```bash
rm -rf /Applications/OpenClaw.app
```

Notas:

- Si utilizó perfiles (`--profile` / `OPENCLAW_PROFILE`), repita el paso 3 para cada directorio de estado (los valores predeterminados son `~/.openclaw-<profile>`).
- En el modo remoto, el directorio de estado se encuentra en el **host del Gateway**, así que ejecute allí también los pasos 1 a 4.

## Eliminación manual del servicio (la CLI no está instalada)

Use este método si el servicio del Gateway sigue ejecutándose, pero falta `openclaw`.

### macOS (launchd)

La etiqueta predeterminada es `ai.openclaw.gateway` (o `ai.openclaw.<profile>` cuando se utiliza un perfil):

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

Si utilizó un perfil, sustituya la etiqueta y el nombre del archivo plist por `ai.openclaw.<profile>`.

### Linux (unidad de usuario de systemd)

El nombre predeterminado de la unidad es `openclaw-gateway.service` (o `openclaw-gateway-<profile>.service`). En los equipos actualizados desde instalaciones muy antiguas, aún puede existir una unidad anterior al cambio de nombre llamada `clawdbot-gateway.service`; `openclaw uninstall` / `openclaw gateway uninstall` la detecta y elimina automáticamente.

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows (tarea programada)

El nombre predeterminado de la tarea es `OpenClaw Gateway` (o `OpenClaw Gateway (<profile>)`).
La tarea inicia un script `gateway.vbs` sin ventana desde su directorio de estado que, a su vez,
ejecuta `gateway.cmd`; elimine ambos.

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd" -ErrorAction SilentlyContinue
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.vbs" -ErrorAction SilentlyContinue
```

Si utilizó un perfil, elimine la tarea con el nombre correspondiente y los archivos `gateway.cmd` /
`gateway.vbs` ubicados en `~\.openclaw-<profile>`.

## Instalación normal frente a copia de trabajo del código fuente

### Instalación normal (install.sh / npm / pnpm / bun)

Si utilizó `https://openclaw.ai/install.sh` o `install.ps1`, la CLI se instaló mediante `npm install -g openclaw@latest`.
Elimínela con `npm rm -g openclaw` (o `pnpm remove -g` / `bun remove -g` si utilizó uno de esos métodos para instalarla).

### Copia de trabajo del código fuente (git clone)

Si ejecuta OpenClaw desde una copia de trabajo del repositorio (`git clone` + `openclaw ...` / `bun run openclaw ...`):

1. Desinstale el servicio del Gateway **antes** de eliminar el repositorio (utilice la opción sencilla anterior o la eliminación manual del servicio).
2. Elimine el directorio del repositorio.
3. Elimine el estado y el espacio de trabajo como se indicó anteriormente.

## Contenido relacionado

- [Descripción general de la instalación](/es/install)
- [Guía de migración](/es/install/migrating)
