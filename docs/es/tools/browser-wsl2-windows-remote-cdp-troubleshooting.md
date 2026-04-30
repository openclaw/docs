---
read_when:
    - Ejecutar OpenClaw Gateway en WSL2 mientras Chrome se ejecuta en Windows
    - Se observan errores superpuestos del navegador/control-ui en WSL2 y Windows
    - Decidir entre Chrome MCP local del host y CDP remoto sin procesar en configuraciones de host dividido
summary: Solucionar problemas del Gateway WSL2 + CDP remoto de Chrome de Windows por capas
title: Solución de problemas de WSL2 + Windows + CDP remoto de Chrome
x-i18n:
    generated_at: "2026-04-30T06:03:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7532c672f7e829b851d175d93354fc586baecea4af5f2555f57908780cedfd02
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 16
---

En la configuración común de host dividido, OpenClaw Gateway se ejecuta dentro de WSL2, Chrome se ejecuta en Windows y el control del navegador debe cruzar el límite entre WSL2 y Windows. El patrón de fallo por capas de [issue #39369](https://github.com/openclaw/openclaw/issues/39369) significa que pueden aparecer varios problemas independientes a la vez, lo que hace que primero parezca rota la capa equivocada.

## Elige primero el modo de navegador correcto

Tienes dos patrones válidos:

### Opción 1: CDP remoto directo desde WSL2 a Windows

Usa un perfil de navegador remoto que apunte desde WSL2 a un endpoint CDP de Chrome en Windows.

Elige esto cuando:

- el Gateway permanece dentro de WSL2
- Chrome se ejecuta en Windows
- necesitas que el control del navegador cruce el límite WSL2/Windows

### Opción 2: Chrome MCP local al host

Usa `existing-session` / `user` solo cuando el propio Gateway se ejecute en el mismo host que Chrome.

Elige esto cuando:

- OpenClaw y Chrome están en la misma máquina
- quieres el estado del navegador local con sesión iniciada
- no necesitas transporte de navegador entre hosts
- no necesitas rutas avanzadas gestionadas o solo de CDP directo como `responsebody`, exportación
  de PDF, interceptación de descargas o acciones por lotes

Para Gateway en WSL2 + Chrome en Windows, prefiere CDP remoto directo. Chrome MCP es local al host, no un puente de WSL2 a Windows.

## Arquitectura funcional

Forma de referencia:

- WSL2 ejecuta el Gateway en `127.0.0.1:18789`
- Windows abre la Interfaz de control en un navegador normal en `http://127.0.0.1:18789/`
- Chrome en Windows expone un endpoint CDP en el puerto `9222`
- WSL2 puede alcanzar ese endpoint CDP de Windows
- OpenClaw apunta un perfil de navegador a la dirección que es alcanzable desde WSL2

## Por qué esta configuración resulta confusa

Varios fallos pueden solaparse:

- WSL2 no puede alcanzar el endpoint CDP de Windows
- la Interfaz de control se abre desde un origen no seguro
- `gateway.controlUi.allowedOrigins` no coincide con el origen de la página
- falta el token o el emparejamiento
- el perfil de navegador apunta a la dirección equivocada

Por eso, corregir una capa puede dejar todavía visible un error diferente.

## Regla crítica para la Interfaz de control

Cuando la UI se abre desde Windows, usa localhost de Windows salvo que tengas una configuración HTTPS deliberada.

Usa:

`http://127.0.0.1:18789/`

No uses por defecto una IP de LAN para la Interfaz de control. HTTP sin cifrar en una dirección de LAN o tailnet puede activar comportamiento de origen inseguro/autenticación de dispositivo que no está relacionado con CDP en sí. Consulta [Interfaz de control](/es/web/control-ui).

## Valida por capas

Trabaja de arriba abajo. No te saltes pasos.

### Capa 1: Verifica que Chrome está sirviendo CDP en Windows

Inicia Chrome en Windows con la depuración remota habilitada:

```powershell
chrome.exe --remote-debugging-port=9222
```

Desde Windows, verifica primero el propio Chrome:

```powershell
curl http://127.0.0.1:9222/json/version
curl http://127.0.0.1:9222/json/list
```

Si esto falla en Windows, OpenClaw todavía no es el problema.

### Capa 2: Verifica que WSL2 puede alcanzar ese endpoint de Windows

Desde WSL2, prueba la dirección exacta que planeas usar en `cdpUrl`:

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

Buen resultado:

- `/json/version` devuelve JSON con metadatos de Browser / Protocol-Version
- `/json/list` devuelve JSON (un array vacío está bien si no hay páginas abiertas)

Si esto falla:

- Windows aún no está exponiendo el puerto a WSL2
- la dirección es incorrecta para el lado de WSL2
- todavía falta firewall / reenvío de puertos / proxy local

Corrige eso antes de tocar la configuración de OpenClaw.

### Capa 3: Configura el perfil de navegador correcto

Para CDP remoto directo, apunta OpenClaw a la dirección que sea alcanzable desde WSL2:

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
- mantén `attachOnly: true` para navegadores gestionados externamente
- `cdpUrl` puede ser `http://`, `https://`, `ws://` o `wss://`
- usa HTTP(S) cuando quieras que OpenClaw descubra `/json/version`
- usa WS(S) solo cuando el proveedor de navegador te proporcione una URL directa de socket DevTools
- prueba la misma URL con `curl` antes de esperar que OpenClaw funcione

### Capa 4: Verifica por separado la capa de la Interfaz de control

Abre la UI desde Windows:

`http://127.0.0.1:18789/`

Luego verifica:

- el origen de la página coincide con lo que espera `gateway.controlUi.allowedOrigins`
- la autenticación por token o el emparejamiento están configurados correctamente
- no estás depurando un problema de autenticación de la Interfaz de control como si fuera un problema del navegador

Página útil:

- [Interfaz de control](/es/web/control-ui)

### Capa 5: Verifica el control del navegador de extremo a extremo

Desde WSL2:

```bash
openclaw browser open https://example.com --browser-profile remote
openclaw browser tabs --browser-profile remote
```

Buen resultado:

- la pestaña se abre en Chrome en Windows
- `openclaw browser tabs` devuelve el destino
- las acciones posteriores (`snapshot`, `screenshot`, `navigate`) funcionan desde el mismo perfil

## Errores comunes que inducen a error

Trata cada mensaje como una pista específica de una capa:

- `control-ui-insecure-auth`
  - problema de origen de la UI / contexto seguro, no de transporte CDP
- `token_missing`
  - problema de configuración de autenticación
- `pairing required`
  - problema de aprobación del dispositivo
- `Remote CDP for profile "remote" is not reachable`
  - WSL2 no puede alcanzar el `cdpUrl` configurado
- `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable`
  - el endpoint HTTP respondió, pero aun así no se pudo abrir el WebSocket de DevTools
- anulaciones obsoletas de viewport / modo oscuro / locale / sin conexión después de una sesión remota
  - ejecuta `openclaw browser stop --browser-profile remote`
  - esto cierra la sesión de control activa y libera el estado de emulación Playwright/CDP sin reiniciar el gateway ni el navegador externo
- `gateway timeout after 1500ms`
  - a menudo sigue siendo alcanzabilidad de CDP o un endpoint remoto lento/inalcanzable
- `No Chrome tabs found for profile="user"`
  - se seleccionó un perfil Chrome MCP local donde no hay pestañas locales al host disponibles

## Lista rápida de triaje

1. Windows: ¿funciona `curl http://127.0.0.1:9222/json/version`?
2. WSL2: ¿funciona `curl http://WINDOWS_HOST_OR_IP:9222/json/version`?
3. Configuración de OpenClaw: ¿`browser.profiles.<name>.cdpUrl` usa esa dirección exacta alcanzable desde WSL2?
4. Interfaz de control: ¿estás abriendo `http://127.0.0.1:18789/` en lugar de una IP de LAN?
5. ¿Estás intentando usar `existing-session` entre WSL2 y Windows en lugar de CDP remoto directo?

## Conclusión práctica

La configuración suele ser viable. La parte difícil es que el transporte del navegador, la seguridad de origen de la Interfaz de control y el token/emparejamiento pueden fallar de forma independiente aunque se vean similares desde el lado del usuario.

En caso de duda:

- verifica primero el endpoint de Chrome en Windows localmente
- verifica después el mismo endpoint desde WSL2
- solo entonces depura la configuración de OpenClaw o la autenticación de la Interfaz de control

## Relacionado

- [Navegador](/es/tools/browser)
- [Inicio de sesión en el navegador](/es/tools/browser-login)
- [Solución de problemas del navegador en Linux](/es/tools/browser-linux-troubleshooting)
