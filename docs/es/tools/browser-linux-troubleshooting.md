---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Solucionar problemas de inicio de CDP en Chrome/Brave/Edge/Chromium para el control del navegador de OpenClaw en Linux
title: Solución de problemas del navegador
x-i18n:
    generated_at: "2026-07-05T11:47:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e0256e8ee441802086cd486923060be54f8966b423e5dcb71fc8961bbab5d729
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 16
---

## Problema: no se pudo iniciar Chrome CDP en el puerto 18800

```json
{ "error": "Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"." }
```

### Causa raíz

En Ubuntu y la mayoría de las distribuciones Linux, `apt install chromium` instala un envoltorio snap, no un navegador real:

```text
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

El confinamiento AppArmor de Snap interfiere con la forma en que OpenClaw genera y supervisa el proceso del navegador.

Otros fallos comunes de inicio en Linux:

- `The profile appears to be in use by another Chromium process`: archivos de bloqueo `Singleton*` obsoletos en el directorio del perfil administrado. OpenClaw elimina estos bloqueos y reintenta una vez cuando el bloqueo apunta a un proceso muerto o de otro host.
- `Missing X server or $DISPLAY`: se solicitó explícitamente un navegador visible en un host sin una sesión de escritorio. Los perfiles administrados locales recurren al modo sin interfaz en Linux cuando tanto `DISPLAY` como `WAYLAND_DISPLAY` no están definidos. Si configuras `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless: false` o `browser.profiles.<name>.headless: false`, elimina esa anulación con interfaz, configura `OPENCLAW_BROWSER_HEADLESS=1`, inicia `Xvfb`, ejecuta `openclaw browser start --headless` para un inicio administrado único, o ejecuta OpenClaw en una sesión de escritorio real.

### Solución 1: instalar Google Chrome (recomendado)

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # if there are dependency errors
```

Actualiza `~/.openclaw/openclaw.json`:

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

### Solución 2: usar Chromium snap en modo de solo adjuntar

Si debes conservar Chromium snap, configura OpenClaw para adjuntarse a un navegador iniciado manualmente en lugar de iniciarlo:

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

Inicia Chromium manualmente:

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

Opcionalmente, inícialo automáticamente con un servicio de usuario systemd:

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

```bash
systemctl --user enable --now openclaw-browser.service
```

### Verificar que el navegador funciona

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### Referencia de configuración

| Opción                           | Descripción                                                          | Valor predeterminado                                                            |
| -------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `browser.enabled`                | Habilitar el control del navegador                                               | `true`                                                             |
| `browser.executablePath`         | Ruta a un binario de navegador basado en Chromium (Chrome/Brave/Edge/Chromium) | detectado automáticamente (prefiere el navegador predeterminado del SO cuando está basado en Chromium) |
| `browser.headless`               | Ejecutar sin interfaz gráfica                                                      | `false`                                                            |
| `OPENCLAW_BROWSER_HEADLESS`      | Anulación por proceso para el modo sin interfaz del navegador administrado local         | sin definir                                                              |
| `browser.noSandbox`              | Añadir la marca `--no-sandbox` (necesaria para algunas configuraciones de Linux)               | `false`                                                            |
| `browser.attachOnly`             | No iniciar un navegador; solo adjuntarse a uno existente              | `false`                                                            |
| `browser.cdpPortRangeStart`      | Puerto CDP local inicial para perfiles asignados automáticamente                   | `18800` (derivado del puerto del Gateway)                            |
| `browser.localLaunchTimeoutMs`   | Tiempo de espera de descubrimiento de Chrome administrado local, hasta `120000`               | `15000`                                                            |
| `browser.localCdpReadyTimeoutMs` | Tiempo de espera de preparación de CDP posterior al inicio administrado local, hasta `120000`      | `8000`                                                             |

Ambos valores de tiempo de espera deben ser enteros positivos hasta `120000` ms; otros valores se rechazan al cargar la configuración. En Raspberry Pi, hosts VPS antiguos o almacenamiento lento, aumenta `browser.localLaunchTimeoutMs` cuando Chrome necesita más tiempo para exponer su endpoint HTTP CDP. Aumenta `browser.localCdpReadyTimeoutMs` cuando el inicio se realiza correctamente pero `openclaw browser start` aún informa `not reachable after start`.

### Problema: no se encontraron pestañas de Chrome para el perfil="user"

Estás usando el perfil `user` (`existing-session` / Chrome MCP) y no hay pestañas abiertas a las que adjuntarse.

Opciones de corrección:

1. Usa el navegador administrado en su lugar:
   `openclaw browser --browser-profile openclaw start` (o configura
   `browser.defaultProfile: "openclaw"`).
2. Mantén Chrome local en ejecución con al menos una pestaña abierta y luego reintenta con
   `--browser-profile user`.

Notas:

- `user` es solo para el host. En servidores Linux, contenedores o hosts remotos, prefiere perfiles CDP.
- `user` y otros perfiles `existing-session` comparten los límites actuales de Chrome MCP: solo acciones basadas en referencias, un archivo por carga, sin anulaciones de `timeoutMs` para diálogos, sin `wait --load networkidle`, y sin `responsebody`, exportación a PDF, interceptación de descargas ni acciones por lotes.
- Los perfiles de controlador `openclaw` locales asignan automáticamente `cdpPort`/`cdpUrl`; configúralos manualmente solo para CDP remoto.
- Los perfiles CDP remotos aceptan `http://`, `https://`, `ws://` y `wss://`.
  Usa HTTP(S) para el descubrimiento de `/json/version`, o WS(S) cuando tu servicio de navegador te proporcione una URL directa de socket DevTools.

## Relacionado

- [Navegador](/es/tools/browser)
- [Inicio de sesión del navegador](/es/tools/browser-login)
- [Solución de problemas de Browser WSL2 con CDP remoto de Windows](/es/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
