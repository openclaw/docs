---
read_when:
    - Quieres eliminar OpenClaw de una máquina
    - El servicio Gateway sigue ejecutándose después de la desinstalación
summary: Desinstalar OpenClaw por completo (CLI, servicio, estado, espacio de trabajo)
title: Desinstalar
x-i18n:
    generated_at: "2026-04-24T05:36:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6d73bc46f4878510706132e5c6cfec3c27cdb55578ed059dc12a785712616d75
    source_path: install/uninstall.md
    workflow: 15
---

Hay dos rutas:

- **Ruta fácil** si `openclaw` sigue instalado.
- **Eliminación manual del servicio** si la CLI ya no está, pero el servicio sigue ejecutándose.

## Ruta fácil (la CLI sigue instalada)

Recomendado: usa el desinstalador integrado:

```bash
openclaw uninstall
```

Modo no interactivo (automatización / npx):

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

4. Elimina tu espacio de trabajo (opcional, quita archivos del agente):

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

- Si usaste perfiles (`--profile` / `OPENCLAW_PROFILE`), repite el paso 3 para cada directorio de estado (los valores predeterminados son `~/.openclaw-<profile>`).
- En modo remoto, el directorio de estado vive en el **host Gateway**, así que ejecuta también allí los pasos 1-4.

## Eliminación manual del servicio (la CLI no está instalada)

Usa esto si el servicio Gateway sigue ejecutándose pero falta `openclaw`.

### macOS (launchd)

La etiqueta predeterminada es `ai.openclaw.gateway` (o `ai.openclaw.<profile>`; la heredada `com.openclaw.*` aún puede existir):

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

Si usaste un perfil, reemplaza la etiqueta y el nombre del plist por `ai.openclaw.<profile>`. Elimina cualquier plist heredado `com.openclaw.*` si existe.

### Linux (unidad de usuario systemd)

El nombre de unidad predeterminado es `openclaw-gateway.service` (o `openclaw-gateway-<profile>.service`):

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows (tarea programada)

El nombre de tarea predeterminado es `OpenClaw Gateway` (o `OpenClaw Gateway (<profile>)`).
El script de la tarea vive bajo tu directorio de estado.

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd"
```

Si usaste un perfil, elimina el nombre de tarea correspondiente y `~\.openclaw-<profile>\gateway.cmd`.

## Instalación normal vs checkout del código fuente

### Instalación normal (install.sh / npm / pnpm / bun)

Si usaste `https://openclaw.ai/install.sh` o `install.ps1`, la CLI se instaló con `npm install -g openclaw@latest`.
Elimínala con `npm rm -g openclaw` (o `pnpm remove -g` / `bun remove -g` si la instalaste de esa forma).

### Checkout del código fuente (git clone)

Si ejecutas desde un checkout del repositorio (`git clone` + `openclaw ...` / `bun run openclaw ...`):

1. Desinstala el servicio Gateway **antes** de eliminar el repositorio (usa la ruta fácil anterior o la eliminación manual del servicio).
2. Elimina el directorio del repositorio.
3. Elimina estado + espacio de trabajo como se muestra arriba.

## Relacionado

- [Resumen de instalación](/es/install)
- [Guía de migración](/es/install/migrating)
