---
read_when:
    - Ejecutar OpenClaw Gateway en WSL2 mientras Chrome reside en Windows
    - Se observan errores superpuestos de navegador/control-ui en WSL2 y Windows
    - Decidir entre MCP de Chrome local al host y CDP remoto sin procesar en configuraciones de host dividido
summary: Solucionar problemas de Gateway en WSL2 + CDP remoto de Chrome en Windows por capas
title: Solución de problemas de WSL2 + Windows + CDP remoto de Chrome
x-i18n:
    generated_at: "2026-07-06T10:54:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be6d9af2b3efb23be22a5ed6e6645348ddc53e6f997280410fa3e00bb44d8b6d
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 16
---

En la configuración común de hosts separados, OpenClaw Gateway se ejecuta dentro de WSL2, Chrome se ejecuta
en Windows, y el control del navegador debe cruzar el límite WSL2/Windows. Pueden aparecer varios
problemas independientes a la vez (consulta
[issue #39369](https://github.com/openclaw/openclaw/issues/39369)): el transporte CDP,
la seguridad de origen de la interfaz de usuario de control y el token/emparejamiento pueden fallar cada uno
por separado mientras producen errores de aspecto similar. Recorre las capas
siguientes en orden en lugar de adivinar cuál está rota.

## Elige primero el modo de navegador correcto

### Opción 1: CDP remoto directo de WSL2 a Windows

Usa un perfil de navegador remoto que apunte desde WSL2 a un endpoint CDP de Chrome en Windows.
Elige esto cuando el Gateway permanezca dentro de WSL2, Chrome se ejecute en
Windows y el control del navegador tenga que cruzar el límite WSL2/Windows.

### Opción 2: Chrome MCP local al host

Usa el controlador `existing-session` (perfil `user`) solo cuando el Gateway se ejecute
en el mismo host que Chrome, quieras el estado del navegador local con sesión iniciada, no
necesites transporte de navegador entre hosts y no necesites `responsebody`,
exportación a PDF, interceptación de descargas ni acciones por lotes (los perfiles de Chrome MCP no
admiten esto).

Para WSL2 Gateway + Chrome en Windows, usa CDP remoto directo. Chrome MCP es
local al host, no un puente de WSL2 a Windows.

## Arquitectura funcional

- WSL2 ejecuta el Gateway en `127.0.0.1:18789`
- Windows abre la interfaz de usuario de control en un navegador normal en `http://127.0.0.1:18789/`
- Chrome en Windows expone un endpoint CDP en el puerto `9222`
- WSL2 puede alcanzar ese endpoint CDP de Windows
- OpenClaw apunta un perfil de navegador a la dirección alcanzable desde WSL2

## Regla crítica para la interfaz de usuario de control

Cuando la interfaz de usuario se abre desde Windows, usa localhost de Windows salvo que tengas una
configuración HTTPS deliberada:

```text
http://127.0.0.1:18789/
```

No uses una IP de LAN de forma predeterminada. HTTP sin cifrar en una dirección de LAN o tailnet puede
activar comportamiento de origen inseguro/autenticación de dispositivo no relacionado con CDP en sí. Consulta
[Interfaz de usuario de control](/es/web/control-ui).

## Validar por capas

Trabaja de arriba abajo; no te saltes pasos. Arreglar una capa aún puede dejar
visible un error distinto de una capa más abajo.

### Capa 1: verifica que Chrome esté sirviendo CDP en Windows

```powershell
chrome.exe --remote-debugging-port=9222 --user-data-dir="$env:LOCALAPPDATA\OpenClaw\ChromeCDP"
```

Chrome 136 y versiones posteriores ignoran los modificadores de línea de comandos de depuración remota para el
directorio de datos predeterminado de Chrome. Usa un directorio de datos separado y no predeterminado como
se muestra arriba. Consulta el
[cambio de seguridad de depuración remota](https://developer.chrome.com/blog/remote-debugging-port) de Chrome.
Esto no hace que el perfil normal de Chrome con sesión iniciada sea controlable de forma remota.

Desde Windows, verifica primero Chrome en sí:

```powershell
curl.exe http://127.0.0.1:9222/json/version
curl.exe http://127.0.0.1:9222/json/list
```

Si esto falla, diagnostica los listeners de Windows a continuación. OpenClaw todavía no es el
problema.

#### Diagnostica IPv4 e IPv6 antes de cambiar portproxy

Chromium intenta enlazar la depuración remota a `127.0.0.1` primero y recurre a
`[::1]` solo si falla el enlace IPv4. Una regla `v4tov4` persistente que escuche en
`127.0.0.1:9222` puede ocupar ese endpoint antes de que Chrome arranque. Chrome entonces
recurre a `[::1]:9222`, mientras la regla antigua reenvía el tráfico IPv4 de vuelta a
su propio listener y devuelve una respuesta vacía.

Comprueba los listeners y las reglas de proxy reales desde Windows en lugar de inferirlos
a partir de la versión de Chrome:

```powershell
netstat -ano | findstr :9222
netsh interface portproxy show all
curl.exe http://127.0.0.1:9222/json/version
curl.exe http://[::1]:9222/json/version
```

Usa `tasklist /fi "PID eq <PID>"` para cada PID de `netstat`.

- Si `chrome.exe` responde en `127.0.0.1`, elimina cualquier regla de portproxy que también
  escuche en `127.0.0.1:9222`. Reenvía solo la dirección del adaptador de Windows alcanzable
  desde WSL2 a `127.0.0.1`.
- Si `chrome.exe` responde solo en `[::1]`, apunta el listener alcanzable desde WSL2 a
  `::1` con `v4tov6` en lugar de reenviar a una dirección IPv4 no usada:

  ```powershell
  netsh interface portproxy add v4tov6 listenaddress=WINDOWS_HOST_OR_IP listenport=9222 connectaddress=::1 connectport=9222
  ```

Enlaza el listener a la dirección del adaptador que necesita WSL2. No expongas el puerto
CDP en `0.0.0.0`, una dirección de LAN ni una dirección de tailnet: CDP concede control de
la sesión del navegador.

### Capa 2: verifica que WSL2 pueda alcanzar ese endpoint de Windows

Desde WSL2, prueba la dirección exacta que planeas usar en `cdpUrl`:

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

Buen resultado:

- `/json/version` devuelve JSON con metadatos Browser / Protocol-Version
- `/json/list` devuelve JSON (un arreglo vacío está bien si no hay páginas abiertas)

Si esto falla, Windows aún no está exponiendo el puerto a WSL2, la dirección es
incorrecta para el lado de WSL2, o falta firewall/reenvío de puertos/proxy. Arregla
eso antes de tocar la configuración de OpenClaw.

### Capa 3: configura el perfil de navegador correcto

Apunta OpenClaw a la dirección alcanzable desde WSL2:

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

- usa la dirección alcanzable desde WSL2, no lo que solo funcione en Windows
- conserva `attachOnly: true` para navegadores gestionados externamente
- `cdpUrl` puede ser `http://`, `https://`, `ws://` o `wss://`
- usa HTTP(S) cuando quieras que OpenClaw descubra `/json/version`
- usa WS(S) solo cuando el proveedor del navegador te dé una URL directa de socket
  DevTools
- prueba la misma URL con `curl` antes de esperar que OpenClaw tenga éxito

### Capa 4: verifica por separado la capa de la interfaz de usuario de control

Abre `http://127.0.0.1:18789/` desde Windows y luego verifica:

- que el origen de la página coincida con lo que espera `gateway.controlUi.allowedOrigins`
- que la autenticación con token o el emparejamiento estén configurados correctamente
- que no estés depurando un problema de autenticación de la interfaz de usuario de control como si fuera un problema de
  navegador

Página útil: [Interfaz de usuario de control](/es/web/control-ui).

### Capa 5: verifica el control de navegador de extremo a extremo

Desde WSL2:

```bash
openclaw browser --browser-profile remote open https://example.com
openclaw browser --browser-profile remote tabs
```

Buen resultado:

- la pestaña se abre en Chrome en Windows
- `browser tabs` devuelve el objetivo
- las acciones posteriores (`snapshot`, `screenshot`, `navigate`) funcionan desde el mismo
  perfil

## Errores engañosos comunes

| Mensaje                                                                                 | Significado                                                                                                                                                                           |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `control-ui-insecure-auth`                                                              | problema de origen de la interfaz de usuario/contexto seguro, no un problema de transporte CDP                                                                                        |
| `token_missing`                                                                         | problema de configuración de autenticación                                                                                                                                            |
| `pairing required`                                                                      | problema de aprobación de dispositivo                                                                                                                                                 |
| `Remote CDP for profile "remote" is not reachable`                                      | WSL2 no puede alcanzar el `cdpUrl` configurado                                                                                                                                       |
| respuesta CDP vacía / `other side closed` a través de un portproxy                      | incompatibilidad de listener de Windows o un bucle consigo mismo; inspecciona ambas familias de loopback y `netsh interface portproxy show all`                                      |
| `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable` | el endpoint HTTP respondió, pero no se pudo abrir el WebSocket de DevTools                                                                                                            |
| viewport obsoleto / modo oscuro / configuración regional / anulaciones offline después de una sesión remota | ejecuta `openclaw browser --browser-profile remote stop` para cerrar la sesión y liberar la conexión Playwright/CDP almacenada en caché sin reiniciar el Gateway ni el navegador externo |
| timeout alrededor de `remoteCdpTimeoutMs` (predeterminado 1500 ms)                      | normalmente sigue siendo alcanzabilidad de CDP, o un endpoint remoto lento/no alcanzable                                                                                              |
| `Playwright page enumeration timed out after 3000ms`                                    | el CDP remoto se conectó, pero la lectura de su pestaña persistente se bloqueó; el plazo es el mayor de `remoteCdpTimeoutMs` y `remoteCdpHandshakeTimeoutMs`                         |
| `No Chrome tabs found for profile="user"`                                               | perfil local Chrome MCP seleccionado donde no hay pestañas locales al host disponibles                                                                                                |

## Lista rápida de triaje

1. Windows: ¿cuál de `127.0.0.1` o `[::1]` responde en `/json/version`, y
   ese listener pertenece a `chrome.exe`?
2. WSL2: ¿funciona `curl http://WINDOWS_HOST_OR_IP:9222/json/version`?
3. Configuración de OpenClaw: ¿`browser.profiles.<name>.cdpUrl` usa esa dirección exacta
   alcanzable desde WSL2?
4. Interfaz de usuario de control: ¿estás abriendo `http://127.0.0.1:18789/` en lugar de una IP de LAN?
5. ¿Estás intentando usar `existing-session` entre WSL2 y Windows en lugar
   de CDP remoto directo?

Verifica primero localmente el endpoint de Chrome en Windows, verifica el mismo endpoint
desde WSL2 en segundo lugar, y solo entonces depura la configuración de OpenClaw o la autenticación de la interfaz de usuario de control.

## Relacionado

- [Navegador](/es/tools/browser)
- [Inicio de sesión del navegador](/es/tools/browser-login)
- [Solución de problemas de navegador en Linux](/es/tools/browser-linux-troubleshooting)
