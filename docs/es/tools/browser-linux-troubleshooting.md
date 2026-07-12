---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Solucionar problemas de inicio de CDP en Chrome/Brave/Edge/Chromium para el control del navegador de OpenClaw en Linux
title: Solución de problemas del navegador
x-i18n:
    generated_at: "2026-07-11T23:32:57Z"
    model: gpt-5.6
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

En Ubuntu y en la mayoría de las distribuciones de Linux, `apt install chromium` instala un
envoltorio de snap, no un navegador real:

```text
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

El confinamiento de AppArmor de snap interfiere en la forma en que OpenClaw inicia y supervisa
el proceso del navegador.

Otros fallos habituales al iniciar en Linux:

- `The profile appears to be in use by another Chromium process`: hay archivos de bloqueo
  `Singleton*` obsoletos en el directorio del perfil administrado. OpenClaw elimina
  estos bloqueos y reintenta una vez cuando el bloqueo apunta a un proceso finalizado o
  de otro host.
- `Missing X server or $DISPLAY`: se solicitó explícitamente un navegador visible
  en un host sin sesión de escritorio. Los perfiles locales administrados cambian
  al modo sin interfaz gráfica en Linux cuando tanto `DISPLAY` como `WAYLAND_DISPLAY` están sin definir.
  Si establece `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless: false` o
  `browser.profiles.<name>.headless: false`, elimine esa anulación del modo con interfaz,
  establezca `OPENCLAW_BROWSER_HEADLESS=1`, inicie `Xvfb`, ejecute
  `openclaw browser start --headless` para realizar un único inicio administrado o ejecute
  OpenClaw en una sesión de escritorio real.

### Solución 1: instalar Google Chrome (recomendado)

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # si hay errores de dependencias
```

Actualice `~/.openclaw/openclaw.json`:

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

### Solución 2: usar Chromium de snap en modo de solo conexión

Si debe conservar Chromium de snap, configure OpenClaw para que se conecte a un
navegador iniciado manualmente en lugar de iniciarlo:

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

Inicie Chromium manualmente:

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

Opcionalmente, configúrelo para que se inicie automáticamente mediante un servicio de usuario de systemd:

```ini
# ~/.config/systemd/user/openclaw-browser.service
[Unit]
Description=Navegador de OpenClaw (Chrome CDP)
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

| Opción                           | Descripción                                                                         | Valor predeterminado                                                                  |
| -------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `browser.enabled`                | Habilita el control del navegador                                                   | `true`                                                                                |
| `browser.executablePath`         | Ruta al ejecutable de un navegador basado en Chromium (Chrome/Brave/Edge/Chromium) | se detecta automáticamente (se prefiere el navegador predeterminado del SO si se basa en Chromium) |
| `browser.headless`               | Ejecuta sin interfaz gráfica                                                        | `false`                                                                               |
| `OPENCLAW_BROWSER_HEADLESS`      | Anulación por proceso del modo sin interfaz del navegador local administrado       | sin definir                                                                           |
| `browser.noSandbox`              | Añade la opción `--no-sandbox` (necesaria en algunas configuraciones de Linux)     | `false`                                                                               |
| `browser.attachOnly`             | No inicia un navegador; solo se conecta a uno existente                            | `false`                                                                               |
| `browser.cdpPortRangeStart`      | Puerto CDP local inicial para los perfiles asignados automáticamente               | `18800` (derivado del puerto del Gateway)                                              |
| `browser.localLaunchTimeoutMs`   | Tiempo de espera para detectar Chrome local administrado, hasta `120000`           | `15000`                                                                               |
| `browser.localCdpReadyTimeoutMs` | Tiempo de espera para que CDP esté listo tras el inicio local administrado, hasta `120000` | `8000`                                                                          |

Ambos valores de tiempo de espera deben ser enteros positivos de hasta `120000` ms; los demás valores
se rechazan al cargar la configuración. En Raspberry Pi, hosts VPS antiguos o sistemas con
almacenamiento lento, aumente `browser.localLaunchTimeoutMs` cuando Chrome necesite más tiempo para
exponer su punto de conexión HTTP de CDP. Aumente `browser.localCdpReadyTimeoutMs` cuando
el inicio se complete correctamente, pero `openclaw browser start` siga indicando `not reachable
after start`.

### Problema: no se encontraron pestañas de Chrome para profile="user"

Está usando el perfil `user` (`existing-session` / Chrome MCP) y no hay
ninguna pestaña abierta a la que conectarse.

Opciones para solucionarlo:

1. Use en su lugar el navegador administrado:
   `openclaw browser --browser-profile openclaw start` (o establezca
   `browser.defaultProfile: "openclaw"`).
2. Mantenga Chrome local en ejecución con al menos una pestaña abierta y vuelva a intentarlo con
   `--browser-profile user`.

Notas:

- `user` solo funciona en el host. En servidores Linux, contenedores o hosts remotos, use
  preferentemente perfiles CDP.
- `user` y los demás perfiles `existing-session` comparten las limitaciones actuales de Chrome MCP:
  solo acciones basadas en referencias, un archivo por carga, sin anulaciones de `timeoutMs`
  para diálogos, sin `wait --load networkidle` y sin `responsebody`, exportación a PDF,
  interceptación de descargas ni acciones por lotes.
- Los perfiles locales del controlador `openclaw` asignan automáticamente `cdpPort`/`cdpUrl`; solo
  establézcalos manualmente para CDP remoto.
- Los perfiles CDP remotos admiten `http://`, `https://`, `ws://` y `wss://`.
  Use HTTP(S) para detectar `/json/version`, o WS(S) cuando su servicio de navegador
  le proporcione una URL directa del socket de DevTools.

## Contenido relacionado

- [Navegador](/es/tools/browser)
- [Inicio de sesión en el navegador](/es/tools/browser-login)
- [Solución de problemas de WSL2 del navegador](/es/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
