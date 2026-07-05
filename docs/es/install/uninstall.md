---
read_when:
    - Quieres eliminar OpenClaw de una máquina
    - El servicio de Gateway sigue ejecutándose después de la desinstalación
summary: Desinstalar OpenClaw por completo (CLI, servicio, estado, espacio de trabajo)
title: Desinstalar
x-i18n:
    generated_at: "2026-07-05T11:29:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84f01dc11defe6f19c89232375e48bad383b2e71379f47f43e759d3d7bb908b5
    source_path: install/uninstall.md
    workflow: 16
---

Dos rutas:

- **Ruta sencilla** si `openclaw` todavía está instalado.
- **Eliminación manual del servicio** si la CLI ya no está, pero el servicio sigue ejecutándose.

## Ruta sencilla (CLI todavía instalada)

Recomendado: usa el desinstalador integrado:

```bash
openclaw uninstall
```

La eliminación del estado conserva los directorios de espacio de trabajo configurados, a menos que también selecciones `--workspace`.

Previsualiza qué se eliminará (seguro):

```bash
openclaw uninstall --dry-run --all
```

No interactivo (automatización / npx). Úsalo con cautela y solo después de confirmar los alcances:

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

Flags: `--service`, `--state`, `--workspace`, `--app` seleccionan alcances individuales; `--all` selecciona los cuatro.

Pasos manuales (mismo resultado):

1. Detén el servicio Gateway:

```bash
openclaw gateway stop
```

2. Desinstala el servicio Gateway (launchd/systemd/schtasks):

```bash
openclaw gateway uninstall
```

3. Elimina el estado y la configuración:

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

Si configuraste `OPENCLAW_CONFIG_PATH` con una ubicación personalizada fuera del directorio de estado, elimina también ese archivo.
Si quieres conservar un espacio de trabajo dentro del directorio de estado, como `~/.openclaw/workspace`, muévelo a otro lugar antes de ejecutar `rm -rf` o elimina selectivamente el contenido del estado.

4. Elimina tu espacio de trabajo (opcional, elimina archivos del agente):

```bash
rm -rf ~/.openclaw/workspace
```

5. Elimina la instalación de la CLI (elige la que usaste):

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

6. Si instalaste la app de macOS:

```bash
rm -rf /Applications/OpenClaw.app
```

Notas:

- Si usaste perfiles (`--profile` / `OPENCLAW_PROFILE`), repite el paso 3 para cada directorio de estado (los predeterminados son `~/.openclaw-<profile>`).
- En modo remoto, el directorio de estado reside en el **host Gateway**, así que ejecuta allí también los pasos 1-4.

## Eliminación manual del servicio (CLI no instalada)

Usa esto si el servicio Gateway sigue ejecutándose pero falta `openclaw`.

### macOS (launchd)

La etiqueta predeterminada es `ai.openclaw.gateway` (o `ai.openclaw.<profile>` con un perfil):

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

Si usaste un perfil, reemplaza la etiqueta y el nombre del plist por `ai.openclaw.<profile>`.

### Linux (unidad de usuario systemd)

El nombre predeterminado de la unidad es `openclaw-gateway.service` (o `openclaw-gateway-<profile>.service`). Una unidad anterior al cambio de nombre, `clawdbot-gateway.service`, aún puede existir en máquinas actualizadas desde instalaciones muy antiguas; `openclaw uninstall` / `openclaw gateway uninstall` la detecta y elimina automáticamente.

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows (tarea programada)

El nombre predeterminado de la tarea es `OpenClaw Gateway` (o `OpenClaw Gateway (<profile>)`).
La tarea inicia un script `gateway.vbs` sin ventana en tu directorio de estado, que a su vez
ejecuta `gateway.cmd`; elimina ambos.

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd" -ErrorAction SilentlyContinue
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.vbs" -ErrorAction SilentlyContinue
```

Si usaste un perfil, elimina el nombre de tarea correspondiente y los archivos `gateway.cmd` /
`gateway.vbs` bajo `~\.openclaw-<profile>`.

## Instalación normal vs. checkout de código fuente

### Instalación normal (install.sh / npm / pnpm / bun)

Si usaste `https://openclaw.ai/install.sh` o `install.ps1`, la CLI se instaló con `npm install -g openclaw@latest`.
Elimínala con `npm rm -g openclaw` (o `pnpm remove -g` / `bun remove -g` si la instalaste de esa forma).

### Checkout de código fuente (git clone)

Si ejecutas desde un checkout del repo (`git clone` + `openclaw ...` / `bun run openclaw ...`):

1. Desinstala el servicio Gateway **antes** de eliminar el repo (usa la ruta sencilla anterior o la eliminación manual del servicio).
2. Elimina el directorio del repo.
3. Elimina el estado y el espacio de trabajo como se mostró arriba.

## Relacionado

- [Resumen de instalación](/es/install)
- [Guía de migración](/es/install/migrating)
