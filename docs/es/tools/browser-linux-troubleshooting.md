---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Corrige problemas de inicio de CDP de Chrome/Brave/Edge/Chromium para el control del navegador de OpenClaw en Linux
title: Solución de problemas del navegador
x-i18n:
    generated_at: "2026-04-24T05:52:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: e6f59048d6a5b587b8d6c9ac0d32b3215f68a7e39192256b28f22936cab752e1
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 15
---

## Problema: "Failed to start Chrome CDP on port 18800"

El servidor de control del navegador de OpenClaw no puede iniciar Chrome/Brave/Edge/Chromium con el error:

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### Causa raíz

En Ubuntu (y muchas distribuciones Linux), la instalación predeterminada de Chromium es un **paquete snap**. El confinamiento AppArmor de snap interfiere con la forma en que OpenClaw genera y supervisa el proceso del navegador.

El comando `apt install chromium` instala un paquete stub que redirige a snap:

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

Esto NO es un navegador real; es solo un wrapper.

### Solución 1: Instalar Google Chrome (recomendado)

Instala el paquete `.deb` oficial de Google Chrome, que no está aislado por snap:

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # if there are dependency errors
```

Luego actualiza tu configuración de OpenClaw (`~/.openclaw/openclaw.json`):

```json
{
  "browser": {
    "enabled": true,
    "executablePath": "/usr/bin/google-chrome-stable",
    "headless": true,
    "noSandbox": true
  }
}
```

### Solución 2: Usar Snap Chromium con modo solo de conexión

Si debes usar Chromium con snap, configura OpenClaw para conectarse a un navegador iniciado manualmente:

1. Actualiza la configuración:

```json
{
  "browser": {
    "enabled": true,
    "attachOnly": true,
    "headless": true,
    "noSandbox": true
  }
}
```

2. Inicia Chromium manualmente:

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

3. Opcionalmente crea un servicio systemd de usuario para iniciar Chrome automáticamente:

```ini
# ~/.config/systemd/user/openclaw-browser.service
[Unit]
Description=OpenClaw Browser (Chrome CDP)
After=network.target

[Service]
ExecStart=/snap/bin/chromium --headless --no-sandbox --disable-gpu --remote-debugging-port=18800 --user-data-dir=%h/.openclaw/browser/openclaw/user-data about:blank
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

Habilítalo con: `systemctl --user enable --now openclaw-browser.service`

### Verificar que el navegador funciona

Comprobar estado:

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
```

Probar navegación:

```bash
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### Referencia de configuración

| Option                   | Description                                                          | Default                                                     |
| ------------------------ | -------------------------------------------------------------------- | ----------------------------------------------------------- |
| `browser.enabled`        | Habilitar control del navegador                                      | `true`                                                      |
| `browser.executablePath` | Ruta a un binario de navegador basado en Chromium (Chrome/Brave/Edge/Chromium) | detección automática (prefiere el navegador predeterminado cuando está basado en Chromium) |
| `browser.headless`       | Ejecutar sin GUI                                                     | `false`                                                     |
| `browser.noSandbox`      | Añadir la bandera `--no-sandbox` (necesaria en algunas configuraciones Linux) | `false`                                                     |
| `browser.attachOnly`     | No iniciar el navegador, solo conectarse a uno existente             | `false`                                                     |
| `browser.cdpPort`        | Puerto de Chrome DevTools Protocol                                   | `18800`                                                     |

### Problema: "No Chrome tabs found for profile=\"user\""

Estás usando un perfil `existing-session` / Chrome MCP. OpenClaw puede ver Chrome local,
pero no hay pestañas abiertas disponibles para conectarse.

Opciones para solucionarlo:

1. **Usar el navegador gestionado:** `openclaw browser start --browser-profile openclaw`
   (o establece `browser.defaultProfile: "openclaw"`).
2. **Usar Chrome MCP:** asegúrate de que Chrome local se esté ejecutando con al menos una pestaña abierta y luego vuelve a intentarlo con `--browser-profile user`.

Notas:

- `user` es solo para host local. Para servidores Linux, contenedores o hosts remotos, prefiere perfiles CDP.
- `user` / otros perfiles `existing-session` mantienen los límites actuales de Chrome MCP:
  acciones basadas en referencias, hooks de carga de un solo archivo, sin anulaciones de tiempo de espera de diálogos, sin
  `wait --load networkidle` y sin `responsebody`, exportación PDF, interceptación de descargas
  ni acciones por lotes.
- Los perfiles locales `openclaw` asignan automáticamente `cdpPort`/`cdpUrl`; establécelos solo para CDP remoto.
- Los perfiles CDP remotos aceptan `http://`, `https://`, `ws://` y `wss://`.
  Usa HTTP(S) para detección `/json/version`, o WS(S) cuando tu servicio de navegador
  te proporcione una URL directa de socket DevTools.

## Relacionado

- [Browser](/es/tools/browser)
- [Inicio de sesión en Browser](/es/tools/browser-login)
- [Solución de problemas de Browser WSL2](/es/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
