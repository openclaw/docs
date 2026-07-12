---
read_when:
    - Ejecutar el Gateway de OpenClaw en WSL2 mientras Chrome se ejecuta en Windows
    - Detección de errores superpuestos del navegador y la interfaz de control en WSL2 y Windows
    - Cómo decidir entre Chrome MCP local al host y CDP remoto directo en configuraciones con hosts separados
summary: Soluciona problemas del Gateway en WSL2 y del CDP remoto de Chrome en Windows por capas
title: Solución de problemas de WSL2 + Windows + CDP remoto de Chrome
x-i18n:
    generated_at: "2026-07-11T23:37:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be6d9af2b3efb23be22a5ed6e6645348ddc53e6f997280410fa3e00bb44d8b6d
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 16
---

En la configuración habitual con hosts separados, el Gateway de OpenClaw se ejecuta dentro de WSL2, Chrome se ejecuta
en Windows y el control del navegador debe atravesar el límite entre WSL2 y Windows. Pueden surgir
varios problemas independientes a la vez (consulte el
[problema n.º 39369](https://github.com/openclaw/openclaw/issues/39369)): el transporte
CDP, la seguridad del origen de la interfaz de control y el token o emparejamiento pueden fallar cada uno
por separado y producir errores de aspecto similar. Revise las capas
siguientes en orden en lugar de intentar adivinar cuál está fallando.

## Elija primero el modo de navegador adecuado

### Opción 1: CDP remoto sin intermediarios desde WSL2 a Windows

Use un perfil de navegador remoto que apunte desde WSL2 a un punto de conexión CDP
de Chrome en Windows. Elija esta opción cuando el Gateway permanezca dentro de WSL2, Chrome se ejecute en
Windows y el control del navegador deba atravesar el límite entre WSL2 y Windows.

### Opción 2: MCP de Chrome local al host

Use el controlador `existing-session` (perfil `user`) solo cuando el Gateway se ejecute
en el mismo host que Chrome, quiera usar el estado local del navegador con la sesión iniciada, no
necesite transporte del navegador entre hosts y no necesite `responsebody`,
exportación a PDF, interceptación de descargas ni acciones por lotes (los perfiles MCP de Chrome no
admiten estas funciones).

Para un Gateway en WSL2 y Chrome en Windows, use CDP remoto sin intermediarios. MCP de Chrome es
local al host, no un puente de WSL2 a Windows.

## Arquitectura funcional

- WSL2 ejecuta el Gateway en `127.0.0.1:18789`
- Windows abre la interfaz de control en un navegador normal en `http://127.0.0.1:18789/`
- Chrome en Windows expone un punto de conexión CDP en el puerto `9222`
- WSL2 puede acceder a ese punto de conexión CDP de Windows
- OpenClaw dirige un perfil de navegador a la dirección accesible desde WSL2

## Regla fundamental para la interfaz de control

Cuando la interfaz se abra desde Windows, use localhost de Windows, a menos que tenga una
configuración HTTPS deliberada:

```text
http://127.0.0.1:18789/
```

No use de forma predeterminada una IP de la LAN. HTTP sin cifrar en una dirección de la LAN o de la tailnet puede
activar comportamientos relacionados con un origen no seguro o con la autenticación del dispositivo que no guardan relación con CDP. Consulte
[Interfaz de control](/es/web/control-ui).

## Validación por capas

Proceda de arriba abajo; no se salte pasos. Corregir una capa puede dejar visible
otro error procedente de una capa posterior.

### Capa 1: verifique que Chrome proporciona CDP en Windows

```powershell
chrome.exe --remote-debugging-port=9222 --user-data-dir="$env:LOCALAPPDATA\OpenClaw\ChromeCDP"
```

Chrome 136 y las versiones posteriores ignoran los modificadores de depuración remota de la línea de comandos para el
directorio de datos predeterminado de Chrome. Use un directorio de datos independiente y no predeterminado,
como se muestra arriba. Consulte el
[cambio de seguridad de la depuración remota](https://developer.chrome.com/blog/remote-debugging-port)
de Chrome.
Esto no permite controlar remotamente el perfil normal de Chrome con la sesión iniciada.

Desde Windows, verifique primero el propio Chrome:

```powershell
curl.exe http://127.0.0.1:9222/json/version
curl.exe http://127.0.0.1:9222/json/list
```

Si esto falla, diagnostique los procesos que escuchan en Windows como se indica a continuación. OpenClaw todavía no es
el problema.

#### Diagnostique IPv4 e IPv6 antes de cambiar portproxy

Chromium intenta vincular primero la depuración remota a `127.0.0.1` y recurre a
`[::1]` solo si falla la vinculación IPv4. Una regla `v4tov4` persistente que escuche en
`127.0.0.1:9222` puede ocupar ese punto de conexión antes de que se inicie Chrome. Chrome
recurre entonces a `[::1]:9222`, mientras que la regla antigua reenvía el tráfico IPv4 de vuelta a
su propio proceso de escucha y devuelve una respuesta vacía.

Compruebe desde Windows los procesos de escucha y las reglas de proxy reales, en lugar de inferirlos
a partir de la versión de Chrome:

```powershell
netstat -ano | findstr :9222
netsh interface portproxy show all
curl.exe http://127.0.0.1:9222/json/version
curl.exe http://[::1]:9222/json/version
```

Use `tasklist /fi "PID eq <PID>"` para cada PID de `netstat`.

- Si `chrome.exe` responde en `127.0.0.1`, elimine cualquier regla portproxy que también
  escuche en `127.0.0.1:9222`. Reenvíe únicamente la dirección del adaptador de Windows
  accesible desde WSL2 a `127.0.0.1`.
- Si `chrome.exe` responde únicamente en `[::1]`, dirija el proceso de escucha accesible desde WSL2 a
  `::1` mediante `v4tov6`, en lugar de reenviar a una dirección IPv4 sin usar:

  ```powershell
  netsh interface portproxy add v4tov6 listenaddress=WINDOWS_HOST_OR_IP listenport=9222 connectaddress=::1 connectport=9222
  ```

Vincule el proceso de escucha a la dirección del adaptador que necesite WSL2. No exponga el puerto
CDP en `0.0.0.0`, una dirección de la LAN ni una dirección de la tailnet: CDP permite controlar
la sesión del navegador.

### Capa 2: verifique que WSL2 puede acceder a ese punto de conexión de Windows

Desde WSL2, pruebe la dirección exacta que pretende usar en `cdpUrl`:

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

Resultado correcto:

- `/json/version` devuelve JSON con metadatos de Browser / Protocol-Version
- `/json/list` devuelve JSON (una matriz vacía es válida si no hay páginas abiertas)

Si esto falla, Windows todavía no expone el puerto a WSL2, la dirección no es
correcta desde WSL2 o falta la configuración del cortafuegos, del reenvío de puertos o del proxy. Corrija
esto antes de modificar la configuración de OpenClaw.

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
- mantenga `attachOnly: true` para navegadores administrados externamente
- `cdpUrl` puede usar `http://`, `https://`, `ws://` o `wss://`
- use HTTP(S) cuando quiera que OpenClaw detecte `/json/version`
- use WS(S) únicamente cuando el proveedor del navegador le proporcione una URL directa del
  socket de DevTools
- pruebe la misma URL con `curl` antes de esperar que OpenClaw funcione

### Capa 4: verifique por separado la capa de la interfaz de control

Abra `http://127.0.0.1:18789/` desde Windows y, a continuación, verifique:

- que el origen de la página coincida con lo que espera `gateway.controlUi.allowedOrigins`
- que la autenticación mediante token o el emparejamiento estén configurados correctamente
- que no esté diagnosticando un problema de autenticación de la interfaz de control como si fuera un problema del
  navegador

Página útil: [Interfaz de control](/es/web/control-ui).

### Capa 5: verifique el control del navegador de extremo a extremo

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

## Errores comunes que pueden inducir a confusión

| Mensaje                                                                                 | Significado                                                                                                                                                                           |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `control-ui-insecure-auth`                                                              | problema con el origen o el contexto seguro de la interfaz, no con el transporte CDP                                                                                                                     |
| `token_missing`                                                                         | problema de configuración de la autenticación                                                                                                                                                        |
| `pairing required`                                                                      | problema de aprobación del dispositivo                                                                                                                                                           |
| `Remote CDP for profile "remote" is not reachable`                                      | WSL2 no puede acceder al `cdpUrl` configurado                                                                                                                                         |
| respuesta CDP vacía / `other side closed` a través de portproxy                               | discrepancia del proceso de escucha de Windows o bucle sobre sí mismo; inspeccione ambas familias de loopback y `netsh interface portproxy show all`                                                                 |
| `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable` | el punto de conexión HTTP respondió, pero no se pudo abrir el WebSocket de DevTools                                                                                                        |
| configuración obsoleta del área de visualización, modo oscuro, configuración regional o modo sin conexión después de una sesión remota          | ejecute `openclaw browser --browser-profile remote stop` para cerrar la sesión y liberar la conexión almacenada en caché de Playwright/CDP sin reiniciar el Gateway ni el navegador externo |
| tiempo de espera en torno a `remoteCdpTimeoutMs` (valor predeterminado: 1500 ms)                                    | normalmente sigue siendo un problema de accesibilidad de CDP o un punto de conexión remoto lento o inaccesible                                                                                                             |
| `Playwright page enumeration timed out after 3000ms`                                    | se estableció la conexión CDP remota, pero se bloqueó la lectura persistente de sus pestañas; el plazo es el mayor de `remoteCdpTimeoutMs` y `remoteCdpHandshakeTimeoutMs`                               |
| `No Chrome tabs found for profile="user"`                                               | se seleccionó el perfil MCP local de Chrome cuando no hay pestañas locales al host disponibles                                                                                                          |

## Lista rápida de comprobación para el diagnóstico

1. Windows: ¿cuál de `127.0.0.1` o `[::1]` responde en `/json/version` y
   pertenece ese proceso de escucha a `chrome.exe`?
2. WSL2: ¿funciona `curl http://WINDOWS_HOST_OR_IP:9222/json/version`?
3. Configuración de OpenClaw: ¿usa `browser.profiles.<name>.cdpUrl` exactamente esa
   dirección accesible desde WSL2?
4. Interfaz de control: ¿está abriendo `http://127.0.0.1:18789/` en lugar de una IP de la LAN?
5. ¿Está intentando usar `existing-session` entre WSL2 y Windows en lugar
   de CDP remoto sin intermediarios?

Verifique primero de forma local el punto de conexión de Chrome en Windows, verifique después el mismo punto de conexión
desde WSL2 y solo entonces diagnostique la configuración de OpenClaw o la autenticación de la interfaz de control.

## Temas relacionados

- [Navegador](/es/tools/browser)
- [Inicio de sesión en el navegador](/es/tools/browser-login)
- [Solución de problemas del navegador en Linux](/es/tools/browser-linux-troubleshooting)
