---
read_when:
    - Quieres eliminar OpenClaw de una máquina
    - El servicio gateway sigue ejecutándose después de la desinstalación
summary: Desinstalar OpenClaw por completo (CLI, servicio, estado, espacio de trabajo)
title: Desinstalar
x-i18n:
    generated_at: "2026-06-27T11:49:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0f63bde2769b3d35d928aed1668121086a2952338f2634d45d55da8cc637025b
    source_path: install/uninstall.md
    workflow: 16
---

Dos rutas:

- **Ruta fácil** si `openclaw` todavía está instalado.
- **Eliminación manual del servicio** si la CLI ya no está, pero el servicio sigue ejecutándose.

## Ruta fácil (CLI aún instalada)

Recomendado: usa el desinstalador integrado:

```bash
openclaw uninstall
```

Al usar la CLI, la eliminación del estado conserva los directorios de espacio de trabajo configurados salvo que también selecciones `--workspace`.

Previsualiza qué se eliminará (seguro):

```bash
openclaw uninstall --dry-run --all
```

No interactivo (automatización / npx). Úsalo con cuidado y solo después de confirmar los alcances:

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

Pasos manuales (mismo resultado):

1. Detén el servicio Gateway:

```bash
openclaw gateway stop
```

2. Desinstala el servicio Gateway (launchd/systemd/schtasks):

```bash
openclaw gateway uninstall
```

3. Elimina estado + configuración:

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

Si estableciste `OPENCLAW_CONFIG_PATH` en una ubicación personalizada fuera del directorio de estado, elimina también ese archivo.
Si quieres conservar un espacio de trabajo dentro del directorio de estado, como `~/.openclaw/workspace`, muévelo aparte antes de ejecutar `rm -rf` o elimina selectivamente el contenido de estado.

4. Elimina tu espacio de trabajo (opcional, elimina archivos de agente):

```bash
rm -rf ~/.openclaw/workspace
```

5. Elimina la instalación de la CLI (elige el que usaste):

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

6. Si instalaste la aplicación de macOS:

```bash
rm -rf /Applications/OpenClaw.app
```

Notas:

- Si usaste perfiles (`--profile` / `OPENCLAW_PROFILE`), repite el paso 3 para cada directorio de estado (los valores predeterminados son `~/.openclaw-<profile>`).
- En modo remoto, el directorio de estado vive en el **host Gateway**, así que ejecuta también allí los pasos 1-4.

## Eliminación manual del servicio (CLI no instalada)

Usa esto si el servicio Gateway sigue ejecutándose, pero falta `openclaw`.

### macOS (launchd)

La etiqueta predeterminada es `ai.openclaw.gateway` (o `ai.openclaw.<profile>`; aún puede existir el heredado `com.openclaw.*`):

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

Si usaste un perfil, reemplaza la etiqueta y el nombre del plist por `ai.openclaw.<profile>`. Elimina cualquier plist heredado `com.openclaw.*` si está presente.

### Linux (unidad de usuario systemd)

El nombre de unidad predeterminado es `openclaw-gateway.service` (o `openclaw-gateway-<profile>.service`):

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows (tarea programada)

El nombre de tarea predeterminado es `OpenClaw Gateway` (o `OpenClaw Gateway (<profile>)`).
El script de la tarea vive bajo tu directorio de estado como `gateway.cmd`; las instalaciones actuales también pueden
crear un lanzador sin ventana `gateway.vbs` que el Programador de tareas ejecuta en lugar de
abrir `gateway.cmd` directamente.

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd" -ErrorAction SilentlyContinue
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.vbs" -ErrorAction SilentlyContinue
```

Si usaste un perfil, elimina el nombre de tarea correspondiente y los archivos `gateway.cmd` /
`gateway.vbs` bajo `~\.openclaw-<profile>`.

## Instalación normal frente a checkout de código fuente

### Instalación normal (install.sh / npm / pnpm / bun)

Si usaste `https://openclaw.ai/install.sh` o `install.ps1`, la CLI se instaló con `npm install -g openclaw@latest`.
Elimínala con `npm rm -g openclaw` (o `pnpm remove -g` / `bun remove -g` si la instalaste de esa forma).

### Checkout de código fuente (git clone)

Si ejecutas desde un checkout del repositorio (`git clone` + `openclaw ...` / `bun run openclaw ...`):

1. Desinstala el servicio Gateway **antes** de eliminar el repositorio (usa la ruta fácil anterior o la eliminación manual del servicio).
2. Elimina el directorio del repositorio.
3. Elimina estado + espacio de trabajo como se mostró arriba.

## Relacionado

- [Resumen de instalación](/es/install)
- [Guía de migración](/es/install/migrating)
