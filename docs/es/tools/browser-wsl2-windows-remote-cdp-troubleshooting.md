---
read_when:
    - Ejecutar OpenClaw Gateway en WSL2 mientras Chrome está en Windows
    - Viendo errores superpuestos del navegador/control-ui en WSL2 y Windows
    - Decidir entre Chrome MCP local del host y CDP remoto sin procesar en configuraciones de host dividido
summary: Solucionar problemas de Gateway en WSL2 + CDP remoto de Chrome en Windows por capas
title: WSL2 + Windows + solución de problemas de CDP de Chrome remoto
x-i18n:
    generated_at: "2026-07-05T11:43:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e1a2cd455663add52b53d2b880db884b3d798afac63e8a943d28550726cf0ea7
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 16
---

En la configuración común con host dividido, OpenClaw Gateway se ejecuta dentro de WSL2, Chrome se ejecuta
en Windows, y el control del navegador debe cruzar el límite WSL2/Windows. Varios
problemas independientes pueden aparecer a la vez (consulta
[issue #39369](https://github.com/openclaw/openclaw/issues/39369)): el transporte
CDP, la seguridad de origen de la IU de control y el token/emparejamiento pueden fallar cada uno
por separado mientras producen errores de aspecto similar. Recorre las capas
siguientes en orden en lugar de adivinar cuál está rota.

## Elige primero el modo de navegador correcto

### Opción 1: CDP remoto sin procesar de WSL2 a Windows

Usa un perfil de navegador remoto que apunte desde WSL2 a un endpoint CDP de
Chrome en Windows. Elige esto cuando el Gateway permanezca dentro de WSL2, Chrome se ejecute en
Windows y el control del navegador deba cruzar el límite WSL2/Windows.

### Opción 2: Chrome MCP local al host

Usa el controlador `existing-session` (perfil `user`) solo cuando el Gateway se ejecute
en el mismo host que Chrome, quieras el estado local del navegador con sesión iniciada, no
necesites transporte de navegador entre hosts y no necesites `responsebody`,
exportación a PDF, interceptación de descargas ni acciones por lotes (los perfiles de Chrome MCP
no admiten estas funciones).

Para Gateway en WSL2 + Chrome en Windows, usa CDP remoto sin procesar. Chrome MCP es
local al host, no un puente de WSL2 a Windows.

## Arquitectura funcional

- WSL2 ejecuta el Gateway en `127.0.0.1:18789`
- Windows abre la IU de control en un navegador normal en `http://127.0.0.1:18789/`
- Chrome en Windows expone un endpoint CDP en el puerto `9222`
- WSL2 puede alcanzar ese endpoint CDP de Windows
- OpenClaw apunta un perfil de navegador a la dirección alcanzable desde WSL2

## Regla crítica para la IU de control

Cuando la IU se abre desde Windows, usa localhost de Windows a menos que tengas una
configuración HTTPS deliberada:

```text
http://127.0.0.1:18789/
```

No uses por defecto una IP de LAN. HTTP sin cifrar en una dirección de LAN o tailnet puede
activar un comportamiento de origen inseguro/autenticación de dispositivo no relacionado con CDP en sí. Consulta
[IU de control](/es/web/control-ui).

## Valida por capas

Trabaja de arriba abajo; no te saltes pasos. Corregir una capa puede dejar todavía
visible un error distinto de una capa más abajo.

### Capa 1: verifica que Chrome esté sirviendo CDP en Windows

```powershell
chrome.exe --remote-debugging-port=9222
```

Desde Windows, verifica primero Chrome en sí:

```powershell
curl http://127.0.0.1:9222/json/version
curl http://127.0.0.1:9222/json/list
```

Si esto falla en Windows, OpenClaw todavía no es el problema.

### Capa 2: verifica que WSL2 pueda alcanzar ese endpoint de Windows

Desde WSL2, prueba la dirección exacta que planeas usar en `cdpUrl`:

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

Resultado correcto:

- `/json/version` devuelve JSON con metadatos de Browser / Protocol-Version
- `/json/list` devuelve JSON (un arreglo vacío está bien si no hay páginas abiertas)

Si esto falla, Windows aún no está exponiendo el puerto a WSL2, la dirección es
incorrecta para el lado de WSL2, o falta firewall/reenvío de puertos/proxy. Corrige
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

- usa la dirección alcanzable desde WSL2, no la que solo funciona en Windows
- mantén `attachOnly: true` para navegadores administrados externamente
- `cdpUrl` puede ser `http://`, `https://`, `ws://` o `wss://`
- usa HTTP(S) cuando quieras que OpenClaw descubra `/json/version`
- usa WS(S) solo cuando el proveedor del navegador te dé una URL de socket
  DevTools directa
- prueba la misma URL con `curl` antes de esperar que OpenClaw funcione

### Capa 4: verifica la capa de la IU de control por separado

Abre `http://127.0.0.1:18789/` desde Windows y luego verifica:

- el origen de la página coincide con lo que espera `gateway.controlUi.allowedOrigins`
- la autenticación por token o el emparejamiento está configurado correctamente
- no estás depurando un problema de autenticación de la IU de control como si fuera un problema de
  navegador

Página útil: [IU de control](/es/web/control-ui).

### Capa 5: verifica el control del navegador de extremo a extremo

Desde WSL2:

```bash
openclaw browser --browser-profile remote open https://example.com
openclaw browser --browser-profile remote tabs
```

Resultado correcto:

- la pestaña se abre en Chrome en Windows
- `browser tabs` devuelve el destino
- las acciones posteriores (`snapshot`, `screenshot`, `navigate`) funcionan desde el mismo
  perfil

## Errores engañosos comunes

| Mensaje                                                                                 | Significado                                                                                                                                                                           |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `control-ui-insecure-auth`                                                              | Problema de origen de la IU/contexto seguro, no un problema de transporte CDP                                                                                                          |
| `token_missing`                                                                         | problema de configuración de autenticación                                                                                                                                            |
| `pairing required`                                                                      | problema de aprobación de dispositivo                                                                                                                                                 |
| `Remote CDP for profile "remote" is not reachable`                                      | WSL2 no puede alcanzar el `cdpUrl` configurado                                                                                                                                         |
| `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable` | el endpoint HTTP respondió, pero no se pudo abrir el WebSocket de DevTools                                                                                                             |
| anulaciones obsoletas de viewport / modo oscuro / configuración regional / sin conexión después de una sesión remota | ejecuta `openclaw browser --browser-profile remote stop` para cerrar la sesión y liberar la conexión Playwright/CDP en caché sin reiniciar el Gateway ni el navegador externo |
| timeout alrededor de `remoteCdpTimeoutMs` (predeterminado 1500ms)                       | por lo general sigue siendo alcanzabilidad de CDP, o un endpoint remoto lento/inalcanzable                                                                                            |
| `No Chrome tabs found for profile="user"`                                               | perfil local de Chrome MCP seleccionado cuando no hay pestañas locales al host disponibles                                                                                            |

## Lista rápida de triaje

1. Windows: ¿funciona `curl http://127.0.0.1:9222/json/version`?
2. WSL2: ¿funciona `curl http://WINDOWS_HOST_OR_IP:9222/json/version`?
3. Configuración de OpenClaw: ¿`browser.profiles.<name>.cdpUrl` usa esa dirección exacta
   alcanzable desde WSL2?
4. IU de control: ¿estás abriendo `http://127.0.0.1:18789/` en lugar de una IP de LAN?
5. ¿Estás intentando usar `existing-session` entre WSL2 y Windows en lugar
   de CDP remoto sin procesar?

Verifica primero localmente el endpoint de Chrome en Windows, luego verifica el mismo endpoint
desde WSL2 y solo después depura la configuración de OpenClaw o la autenticación de la IU de control.

## Relacionado

- [Navegador](/es/tools/browser)
- [Inicio de sesión del navegador](/es/tools/browser-login)
- [Solución de problemas de navegador en Linux](/es/tools/browser-linux-troubleshooting)
