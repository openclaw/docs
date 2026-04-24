---
read_when:
    - Ejecutar OpenClaw Gateway en WSL2 mientras Chrome vive en Windows
    - Ver errores superpuestos de browser/control-ui entre WSL2 y Windows
    - Decidir entre Chrome MCP local del host y CDP remoto sin procesar en configuraciones de host dividido
summary: Solucionar problemas de Gateway en WSL2 + CDP remoto de Chrome en Windows por capas
title: Solución de problemas de WSL2 + Windows + CDP remoto de Chrome remoto
x-i18n:
    generated_at: "2026-04-24T05:52:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30c8b94332e74704f85cbce5891b677b264fd155bc180c44044ab600e84018fd
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 15
---

Esta guía cubre la configuración común de host dividido donde:

- Gateway de OpenClaw se ejecuta dentro de WSL2
- Chrome se ejecuta en Windows
- el control del navegador debe cruzar el límite entre WSL2 y Windows

También cubre el patrón de fallo por capas de [issue #39369](https://github.com/openclaw/openclaw/issues/39369): pueden aparecer a la vez varios problemas independientes, lo que hace que primero parezca rota la capa equivocada.

## Elige primero el modo de navegador correcto

Tienes dos patrones válidos:

### Opción 1: CDP remoto sin procesar desde WSL2 a Windows

Usa un perfil de navegador remoto que apunte desde WSL2 a un endpoint CDP de Chrome en Windows.

Elige esta opción cuando:

- Gateway permanezca dentro de WSL2
- Chrome se ejecute en Windows
- necesites que el control del navegador cruce el límite WSL2/Windows

### Opción 2: Chrome MCP local del host

Usa `existing-session` / `user` solo cuando el propio Gateway se ejecute en el mismo host que Chrome.

Elige esta opción cuando:

- OpenClaw y Chrome estén en la misma máquina
- quieras el estado local de navegador ya autenticado
- no necesites transporte de navegador entre hosts
- no necesites rutas avanzadas solo de CDP sin procesar/gestionado como `responsebody`, exportación
  de PDF, interceptación de descargas o acciones por lotes

Para Gateway en WSL2 + Chrome en Windows, prefiere CDP remoto sin procesar. Chrome MCP es local al host, no un puente entre WSL2 y Windows.

## Arquitectura funcional

Forma de referencia:

- WSL2 ejecuta Gateway en `127.0.0.1:18789`
- Windows abre la UI de Control en un navegador normal en `http://127.0.0.1:18789/`
- Chrome en Windows expone un endpoint CDP en el puerto `9222`
- WSL2 puede alcanzar ese endpoint CDP de Windows
- OpenClaw apunta un perfil de navegador a la dirección accesible desde WSL2

## Por qué esta configuración resulta confusa

Pueden solaparse varios fallos:

- WSL2 no puede alcanzar el endpoint CDP de Windows
- la UI de Control se abre desde un origen no seguro
- `gateway.controlUi.allowedOrigins` no coincide con el origen de la página
- falta token o emparejamiento
- el perfil de navegador apunta a la dirección incorrecta

Por eso, corregir una capa puede seguir dejando visible un error distinto.

## Regla crítica para la UI de Control

Cuando la UI se abra desde Windows, usa localhost de Windows a menos que tengas una configuración HTTPS deliberada.

Usa:

`http://127.0.0.1:18789/`

No uses por defecto una IP LAN para la UI de Control. HTTP simple sobre una dirección LAN o tailnet puede activar comportamiento de origen no seguro/autenticación de dispositivo que no tiene relación con el propio CDP. Consulta [UI de Control](/es/web/control-ui).

## Validar por capas

Trabaja de arriba abajo. No te saltes pasos.

### Capa 1: verificar que Chrome sirve CDP en Windows

Inicia Chrome en Windows con depuración remota habilitada:

```powershell
chrome.exe --remote-debugging-port=9222
```

Desde Windows, verifica primero el propio Chrome:

```powershell
curl http://127.0.0.1:9222/json/version
curl http://127.0.0.1:9222/json/list
```

Si esto falla en Windows, OpenClaw todavía no es el problema.

### Capa 2: verificar que WSL2 puede alcanzar ese endpoint de Windows

Desde WSL2, prueba la dirección exacta que planeas usar en `cdpUrl`:

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

Buen resultado:

- `/json/version` devuelve JSON con metadatos de Browser / Protocol-Version
- `/json/list` devuelve JSON (un arreglo vacío es válido si no hay páginas abiertas)

Si esto falla:

- Windows todavía no está exponiendo el puerto a WSL2
- la dirección es incorrecta para el lado de WSL2
- aún falta firewall / reenvío de puertos / proxy local

Corrige eso antes de tocar la configuración de OpenClaw.

### Capa 3: configurar el perfil de navegador correcto

Para CDP remoto sin procesar, haz que OpenClaw apunte a la dirección accesible desde WSL2:

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

- usa la dirección accesible desde WSL2, no la que solo funciona en Windows
- mantén `attachOnly: true` para navegadores gestionados externamente
- `cdpUrl` puede ser `http://`, `https://`, `ws://` o `wss://`
- usa HTTP(S) cuando quieras que OpenClaw descubra `/json/version`
- usa WS(S) solo cuando el proveedor del navegador te dé una URL directa de socket DevTools
- prueba la misma URL con `curl` antes de esperar que OpenClaw funcione

### Capa 4: verificar por separado la capa de la UI de Control

Abre la UI desde Windows:

`http://127.0.0.1:18789/`

Luego verifica:

- que el origen de la página coincida con lo que espera `gateway.controlUi.allowedOrigins`
- que la autenticación por token o el emparejamiento estén configurados correctamente
- que no estés depurando un problema de autenticación de la UI de Control como si fuera un problema del navegador

Página útil:

- [UI de Control](/es/web/control-ui)

### Capa 5: verificar el control del navegador de extremo a extremo

Desde WSL2:

```bash
openclaw browser open https://example.com --browser-profile remote
openclaw browser tabs --browser-profile remote
```

Buen resultado:

- la pestaña se abre en Chrome de Windows
- `openclaw browser tabs` devuelve el objetivo
- las acciones posteriores (`snapshot`, `screenshot`, `navigate`) funcionan desde el mismo perfil

## Errores comunes que inducen a engaño

Trata cada mensaje como una pista específica de capa:

- `control-ui-insecure-auth`
  - problema de origen de UI / contexto seguro, no de transporte CDP
- `token_missing`
  - problema de configuración de autenticación
- `pairing required`
  - problema de aprobación del dispositivo
- `Remote CDP for profile "remote" is not reachable`
  - WSL2 no puede alcanzar el `cdpUrl` configurado
- `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable`
  - el endpoint HTTP respondió, pero aun así no pudo abrirse el WebSocket de DevTools
- anulaciones obsoletas de viewport / dark-mode / locale / offline después de una sesión remota
  - ejecuta `openclaw browser stop --browser-profile remote`
  - esto cierra la sesión activa de control y libera el estado de emulación de Playwright/CDP sin reiniciar ni Gateway ni el navegador externo
- `gateway timeout after 1500ms`
  - a menudo sigue siendo accesibilidad CDP o un endpoint remoto lento/inaccesible
- `No Chrome tabs found for profile="user"`
  - se seleccionó un perfil local de Chrome MCP del host donde no hay pestañas locales disponibles

## Lista rápida de triage

1. Windows: ¿funciona `curl http://127.0.0.1:9222/json/version`?
2. WSL2: ¿funciona `curl http://WINDOWS_HOST_OR_IP:9222/json/version`?
3. Configuración de OpenClaw: ¿`browser.profiles.<name>.cdpUrl` usa esa dirección exacta accesible desde WSL2?
4. UI de Control: ¿estás abriendo `http://127.0.0.1:18789/` en lugar de una IP LAN?
5. ¿Estás intentando usar `existing-session` entre WSL2 y Windows en lugar de CDP remoto sin procesar?

## Conclusión práctica

La configuración normalmente es viable. La parte difícil es que el transporte del navegador, la seguridad del origen de la UI de Control y el token/emparejamiento pueden fallar de forma independiente mientras desde el lado del usuario parecen lo mismo.

En caso de duda:

- verifica primero localmente el endpoint de Chrome en Windows
- verifica después el mismo endpoint desde WSL2
- solo entonces depura la configuración de OpenClaw o la autenticación de la UI de Control

## Relacionado

- [Navegador](/es/tools/browser)
- [Inicio de sesión en navegador](/es/tools/browser-login)
- [Solución de problemas del navegador en Linux](/es/tools/browser-linux-troubleshooting)
