---
read_when:
    - Ejecutar el Gateway de OpenClaw en WSL2 mientras Chrome se ejecuta en Windows
    - Errores superpuestos del navegador y de la interfaz de control en WSL2 y Windows
    - Elección entre Chrome MCP local al host y CDP remoto sin procesar en configuraciones con hosts separados
summary: Solucionar problemas del Gateway de WSL2 y del CDP remoto de Chrome para Windows por capas
title: Solución de problemas de WSL2 + Windows + CDP remoto de Chrome
x-i18n:
    generated_at: "2026-07-20T00:54:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 66ec4ed5bfccc66b594a43d56296c69242e8b9cf50b36c6cb3990b1d6ea58faa
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 16
---

En la configuración habitual con hosts separados, OpenClaw Gateway se ejecuta dentro de WSL2, Chrome se ejecuta
en Windows y el control del navegador debe atravesar el límite entre WSL2 y Windows. Pueden surgir varios
problemas independientes a la vez (consulte el
[problema n.º 39369](https://github.com/openclaw/openclaw/issues/39369)): el transporte
CDP, la seguridad del origen de la interfaz de control y el token/emparejamiento pueden fallar de
forma independiente y producir errores de apariencia similar. Recorra las capas
siguientes en orden, en lugar de intentar adivinar cuál está fallando.

## Elija primero el modo de navegador adecuado

### Opción 1: CDP remoto sin procesar de WSL2 a Windows

Use un perfil de navegador remoto que apunte desde WSL2 a un endpoint CDP de
Chrome en Windows. Elija esta opción cuando el Gateway permanezca dentro de WSL2, Chrome se ejecute en
Windows y el control del navegador deba atravesar el límite entre WSL2 y Windows.

### Opción 2: MCP de Chrome local al host

Use el controlador `existing-session` (perfil `user`) solo cuando el Gateway se ejecute
en el mismo host que Chrome, se quiera utilizar el estado del navegador local con la sesión iniciada, no se
necesite transporte del navegador entre hosts y no se necesiten `responsebody`,
exportación a PDF, interceptación de descargas ni acciones por lotes (los perfiles MCP de Chrome no
admiten estas funciones).

Para Gateway en WSL2 + Chrome en Windows, use CDP remoto sin procesar. MCP de Chrome es
local al host, no un puente de WSL2 a Windows.

## Arquitectura funcional

- WSL2 ejecuta el Gateway en `127.0.0.1:18789`
- Windows abre la interfaz de control en un navegador normal en `http://127.0.0.1:18789/`
- Chrome en Windows expone un endpoint CDP en el puerto `9222`
- WSL2 puede acceder a ese endpoint CDP de Windows
- OpenClaw dirige un perfil de navegador a la dirección accesible desde WSL2

## Regla crítica para la interfaz de control

Cuando la interfaz se abra desde Windows, use localhost de Windows, a menos que se disponga de una
configuración HTTPS deliberada:

```text
http://127.0.0.1:18789/
```

No use de forma predeterminada una IP de LAN. HTTP sin cifrar en una dirección de LAN o tailnet puede
activar comportamientos de origen no seguro o de autenticación del dispositivo que no están relacionados con el propio CDP. Consulte
[Interfaz de control](/es/web/control-ui).

## Validación por capas

Proceda de arriba abajo; no se salte ningún paso. Corregir una capa puede hacer que aún quede
visible un error distinto de una capa inferior.

### Capa 1: compruebe que Chrome proporciona CDP en Windows

```powershell
chrome.exe --remote-debugging-port=9222 --user-data-dir="$env:LOCALAPPDATA\OpenClaw\ChromeCDP"
```

Chrome 136 y versiones posteriores ignoran los modificadores de línea de comandos de depuración remota para el
directorio de datos predeterminado de Chrome. Use un directorio de datos independiente y no predeterminado, como
se muestra arriba. Consulte el
[cambio de seguridad de la depuración remota](https://developer.chrome.com/blog/remote-debugging-port) de Chrome.
Esto no permite controlar de forma remota el perfil normal de Chrome con la sesión iniciada.

Desde Windows, compruebe primero el propio Chrome:

```powershell
curl.exe http://127.0.0.1:9222/json/version
curl.exe http://127.0.0.1:9222/json/list
```

Si esto falla, diagnostique los procesos de escucha de Windows que aparecen a continuación. OpenClaw todavía no es el
problema.

#### Diagnostique IPv4 e IPv6 antes de cambiar portproxy

Chromium intenta vincular primero la depuración remota a `127.0.0.1` y recurre a
`[::1]` solo si falla la vinculación IPv4. Una regla persistente `v4tov4` que escuche en
`127.0.0.1:9222` puede ocupar ese endpoint antes de que se inicie Chrome. Entonces, Chrome
recurre a `[::1]:9222`, mientras que la regla antigua reenvía el tráfico IPv4 a
su propio proceso de escucha y devuelve una respuesta vacía.

Compruebe los procesos de escucha y las reglas de proxy reales desde Windows, en lugar de deducirlos
a partir de la versión de Chrome:

```powershell
netstat -ano | findstr :9222
netsh interface portproxy show all
curl.exe http://127.0.0.1:9222/json/version
curl.exe http://[::1]:9222/json/version
```

Use `tasklist /fi "PID eq <PID>"` para cada PID de `netstat`.

- Si `chrome.exe` responde en `127.0.0.1`, elimine cualquier regla portproxy que también
  escuche en `127.0.0.1:9222`. Reenvíe únicamente la dirección del adaptador de Windows accesible desde WSL2
  a `127.0.0.1`.
- Si `chrome.exe` responde únicamente en `[::1]`, dirija el proceso de escucha accesible desde WSL2 a
  `::1` con `v4tov6`, en lugar de reenviarlo a una dirección IPv4 que no se utiliza:

  ```powershell
  netsh interface portproxy add v4tov6 listenaddress=WINDOWS_HOST_OR_IP listenport=9222 connectaddress=::1 connectport=9222
  ```

Vincule el proceso de escucha a la dirección del adaptador que necesita WSL2. No exponga el puerto
CDP en `0.0.0.0`, una dirección de LAN ni una dirección de tailnet: CDP concede el control de
la sesión del navegador.

### Capa 2: compruebe que WSL2 puede acceder a ese endpoint de Windows

Desde WSL2, pruebe la dirección exacta que tiene previsto usar en `cdpUrl`:

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

Resultado correcto:

- `/json/version` devuelve JSON con metadatos de Browser / Protocol-Version
- `/json/list` devuelve JSON (se admite una matriz vacía si no hay páginas abiertas)

Si esto falla, Windows aún no expone el puerto a WSL2, la dirección es
incorrecta desde WSL2 o falta configurar el firewall, el reenvío de puertos o el proxy. Corrija
eso antes de modificar la configuración de OpenClaw.

### Capa 3: configure el perfil de navegador correcto

Dirija OpenClaw a la dirección accesible desde WSL2:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "remote",
    profiles: {
      remote: {
        cdpUrl: "http://WINDOWS_HOST_OR_IP:9222",
        attachOnly: true,
        color: "#00AA00",
      },
    },
  },
}
```

Notas:

- use la dirección accesible desde WSL2, no una que solo funcione en Windows
- mantenga `attachOnly: true` para los navegadores gestionados externamente
- `cdpUrl` puede ser `http://`, `https://`, `ws://` o `wss://`
- use HTTP(S) cuando quiera que OpenClaw detecte `/json/version`
- use WS(S) solo cuando el proveedor del navegador proporcione una URL directa del
  socket de DevTools
- pruebe la misma URL con `curl` antes de esperar que OpenClaw funcione correctamente

### Capa 4: compruebe por separado la capa de la interfaz de control

Abra `http://127.0.0.1:18789/` desde Windows y compruebe:

- que el origen de la página coincida con lo que espera `gateway.controlUi.allowedOrigins`
- que la autenticación mediante token o el emparejamiento estén configurados correctamente
- que no se esté diagnosticando un problema de autenticación de la interfaz de control como si fuera un problema del
  navegador

Página útil: [Interfaz de control](/es/web/control-ui).

### Capa 5: compruebe el control integral del navegador

Desde WSL2:

```bash
openclaw browser --browser-profile remote open https://example.com
openclaw browser --browser-profile remote tabs
```

Resultado correcto:

- la pestaña se abre en Chrome para Windows
- `browser tabs` devuelve el destino
- las acciones posteriores (`snapshot`, `screenshot`, `navigate`) funcionan desde el mismo
  perfil

## Errores engañosos frecuentes

| Mensaje                                                                                 | Significado                                                                                                                                                                           |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `control-ui-insecure-auth`                                                              | problema con el origen o el contexto seguro de la interfaz, no con el transporte CDP                                                                                                                     |
| `token_missing`                                                                         | problema de configuración de la autenticación                                                                                                                                                        |
| `pairing required`                                                                      | problema de aprobación del dispositivo                                                                                                                                                           |
| `Remote CDP for profile "remote" is not reachable`                                      | WSL2 no puede acceder al `cdpUrl` configurado                                                                                                                                         |
| respuesta CDP vacía / `other side closed` mediante un portproxy                               | discrepancia en el proceso de escucha de Windows o bucle sobre sí mismo; inspeccione ambas familias de loopback y `netsh interface portproxy show all`                                                                 |
| `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable` | el endpoint HTTP respondió, pero no se pudo abrir el WebSocket de DevTools                                                                                                        |
| valores obsoletos de ventana gráfica, modo oscuro, configuración regional o modo sin conexión después de una sesión remota          | ejecute `openclaw browser --browser-profile remote stop` para cerrar la sesión y liberar la conexión de Playwright/CDP almacenada en caché sin reiniciar el Gateway ni el navegador externo |
| tiempo de espera agotado durante la comprobación de acceso a CDP                                                         | por lo general, sigue siendo un problema de acceso a CDP o un endpoint remoto lento o inaccesible                                                                                                             |
| `Playwright page enumeration timed out after 3000ms`                                    | el CDP remoto se conectó, pero la lectura persistente de su pestaña se bloqueó                                                                                                                     |
| `No Chrome tabs found for profile="user"`                                               | se seleccionó un perfil MCP de Chrome local sin pestañas locales al host disponibles                                                                                                          |

## Lista de comprobación para un diagnóstico rápido

1. Windows: ¿cuál de `127.0.0.1` o `[::1]` responde en `/json/version` y
   pertenece ese proceso de escucha a `chrome.exe`?
2. WSL2: ¿funciona `curl http://WINDOWS_HOST_OR_IP:9222/json/version`?
3. Configuración de OpenClaw: ¿usa `browser.profiles.<name>.cdpUrl` esa dirección exacta
   accesible desde WSL2?
4. Interfaz de control: ¿se está abriendo `http://127.0.0.1:18789/` en lugar de una IP de LAN?
5. ¿Se está intentando usar `existing-session` entre WSL2 y Windows en lugar
   de CDP remoto sin procesar?

Compruebe primero el endpoint de Chrome para Windows de forma local, compruebe después el mismo endpoint
desde WSL2 y solo entonces diagnostique la configuración de OpenClaw o la autenticación de la interfaz de control.

## Contenido relacionado

- [Navegador](/es/tools/browser)
- [Inicio de sesión en el navegador](/es/tools/browser-login)
- [Solución de problemas del navegador en Linux](/es/tools/browser-linux-troubleshooting)
