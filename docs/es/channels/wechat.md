---
read_when:
    - Quieres conectar OpenClaw con WeChat o Weixin
    - Estás instalando o solucionando problemas del Plugin de canal openclaw-weixin
    - Necesitas entender cómo los plugins de canal externos se ejecutan junto al Gateway
summary: Configuración del canal WeChat mediante el Plugin externo openclaw-weixin
title: WeChat
x-i18n:
    generated_at: "2026-07-05T11:05:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 98faf95f9fb76deedb7df9adf3092083722a77bdd793de98c41a6f715cc0d14a
    source_path: channels/wechat.md
    workflow: 16
---

OpenClaw se conecta a WeChat mediante el Plugin de canal externo
`@tencent-weixin/openclaw-weixin` de Tencent.

Estado: Plugin externo, mantenido por el equipo de Tencent Weixin. Se admiten chats directos y
contenido multimedia. Los chats de grupo no se anuncian en los metadatos de
capacidades del Plugin (declara solo chats directos).

## Nomenclatura

- **WeChat** es el nombre visible para el usuario en esta documentación.
- **Weixin** es el nombre que usa el paquete de Tencent y el id del Plugin.
- `openclaw-weixin` es el id de canal de OpenClaw (`weixin` y `wechat` funcionan como alias).
- `@tencent-weixin/openclaw-weixin` es el paquete npm.

Usa `openclaw-weixin` en comandos de CLI y rutas de configuración.

## Cómo funciona

El código de WeChat no vive en el repositorio principal de OpenClaw. OpenClaw proporciona el
contrato genérico de Plugin de canal, y el Plugin externo proporciona el
runtime específico de WeChat:

1. `openclaw plugins install` instala `@tencent-weixin/openclaw-weixin`.
2. El Gateway descubre el manifiesto del Plugin y carga el punto de entrada del Plugin.
3. El Plugin registra el id de canal `openclaw-weixin`.
4. `openclaw channels login --channel openclaw-weixin` inicia el inicio de sesión por QR.
5. El Plugin almacena las credenciales de la cuenta bajo el directorio de estado de OpenClaw
   (`~/.openclaw` de forma predeterminada).
6. Cuando el Gateway arranca, el Plugin inicia su monitor de Weixin para cada
   cuenta configurada.
7. Los mensajes entrantes de WeChat se normalizan mediante el contrato de canal, se enrutan al
   agente de OpenClaw seleccionado y se devuelven mediante la ruta de salida del Plugin.

Esa separación importa: el núcleo de OpenClaw se mantiene independiente del canal. El inicio de sesión de WeChat,
las llamadas a la API Tencent iLink, la carga y descarga de contenido multimedia, los tokens de contexto y la
supervisión de cuentas son responsabilidad del Plugin externo.

## Instalación

Instalación rápida:

```bash
npx -y @tencent-weixin/openclaw-weixin-cli install
```

Instalación manual:

```bash
openclaw plugins install "@tencent-weixin/openclaw-weixin"
openclaw config set plugins.entries.openclaw-weixin.enabled true
```

Reinicia el Gateway después de instalar:

```bash
openclaw gateway restart
```

## Inicio de sesión

Ejecuta el inicio de sesión por QR en la misma máquina que ejecuta el Gateway:

```bash
openclaw channels login --channel openclaw-weixin
```

Escanea el código QR con WeChat en tu teléfono y confirma el inicio de sesión. El Plugin guarda
el token de la cuenta localmente después de un escaneo correcto.

Para añadir otra cuenta de WeChat, ejecuta otra vez el mismo comando de inicio de sesión. Para varias
cuentas, aísla las sesiones de mensajes directos por cuenta, canal y remitente:

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## Control de acceso

Los mensajes directos usan el modelo normal de emparejamiento y lista de permitidos de OpenClaw para Plugins
de canal.

Aprueba nuevos remitentes:

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

Para ver el modelo completo de control de acceso, consulta [Emparejamiento](/es/channels/pairing).

## Compatibilidad

El Plugin comprueba la versión de OpenClaw del host al arrancar.

| Línea del Plugin | Versión de OpenClaw                                            | Etiqueta npm |
| ---------------- | -------------------------------------------------------------- | ------------ |
| `2.x`            | `>=2026.5.12` (2.4.6 actual; las primeras 2.x aceptaban `>=2026.3.22`) | `latest` |
| `1.x`            | `>=2026.1.0 <2026.3.22`                                        | `legacy` |

Si el Plugin informa que tu versión de OpenClaw es demasiado antigua, actualiza
OpenClaw o instala la línea legacy del Plugin:

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## Proceso sidecar

El Plugin de WeChat puede ejecutar trabajo auxiliar junto al Gateway mientras supervisa la
API Tencent iLink. En el issue #68451, esa ruta auxiliar expuso un error en la
limpieza genérica de Gateway obsoleto de OpenClaw: un proceso secundario podía intentar limpiar el proceso
Gateway padre, causando bucles de reinicio bajo gestores de procesos como systemd.

La limpieza de arranque actual de OpenClaw excluye el proceso actual y sus ancestros,
por lo que un auxiliar de canal no puede finalizar el Gateway que lo lanzó. Esta corrección es
genérica; no es una ruta específica de WeChat en el núcleo.

## Solución de problemas

Comprueba la instalación y el estado:

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

Si el canal aparece como instalado pero no se conecta, confirma que el Plugin está
habilitado y reinicia:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

Si el Gateway se reinicia repetidamente después de habilitar WeChat, actualiza tanto OpenClaw como
el Plugin:

```bash
npm view @tencent-weixin/openclaw-weixin version
openclaw plugins install "@tencent-weixin/openclaw-weixin" --force
openclaw gateway restart
```

Si el arranque informa que el paquete de Plugin instalado `requires compiled runtime
output for TypeScript entry`, el paquete npm se publicó sin los archivos compilados de runtime
JavaScript que OpenClaw necesita. Actualiza o reinstala después de que el publicador del Plugin
publique un paquete corregido, o deshabilita/desinstala temporalmente el Plugin.

Deshabilitación temporal:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled false
openclaw gateway restart
```

## Documentación relacionada

- Resumen de canales: [Canales de chat](/es/channels)
- Emparejamiento: [Emparejamiento](/es/channels/pairing)
- Enrutamiento de canales: [Enrutamiento de canales](/es/channels/channel-routing)
- Arquitectura de Plugin: [Arquitectura de Plugin](/es/plugins/architecture)
- SDK de Plugin de canal: [SDK de Plugin de canal](/es/plugins/sdk-channel-plugins)
- Paquete externo: [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
