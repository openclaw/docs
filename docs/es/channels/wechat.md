---
read_when:
    - Quieres conectar OpenClaw a WeChat o Weixin
    - Estás instalando o solucionando problemas del Plugin de canal openclaw-weixin
    - Necesitas entender cómo se ejecutan los Plugins de canal externos junto al Gateway
summary: Configuración del canal WeChat mediante el Plugin externo openclaw-weixin
title: WeChat
x-i18n:
    generated_at: "2026-04-24T05:21:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: ea7c815a364c2ae087041bf6de5b4182334c67377e18b9bedfa0f9d949afc09c
    source_path: channels/wechat.md
    workflow: 15
---

OpenClaw se conecta a WeChat mediante el Plugin de canal externo de Tencent
`@tencent-weixin/openclaw-weixin`.

Estado: Plugin externo. Se admiten chats directos y multimedia. Los chats grupales no
están anunciados por los metadatos de capacidades del Plugin actual.

## Nomenclatura

- **WeChat** es el nombre visible para el usuario en esta documentación.
- **Weixin** es el nombre usado por el paquete de Tencent y por el id del Plugin.
- `openclaw-weixin` es el id de canal de OpenClaw.
- `@tencent-weixin/openclaw-weixin` es el paquete de npm.

Usa `openclaw-weixin` en los comandos CLI y en las rutas de configuración.

## Cómo funciona

El código de WeChat no vive en el repositorio central de OpenClaw. OpenClaw proporciona el
contrato genérico de Plugin de canal, y el Plugin externo proporciona el entorno de ejecución
específico de WeChat:

1. `openclaw plugins install` instala `@tencent-weixin/openclaw-weixin`.
2. El Gateway detecta el manifiesto del Plugin y carga el punto de entrada del Plugin.
3. El Plugin registra el id de canal `openclaw-weixin`.
4. `openclaw channels login --channel openclaw-weixin` inicia el inicio de sesión con QR.
5. El Plugin almacena las credenciales de la cuenta en el directorio de estado de OpenClaw.
6. Cuando se inicia el Gateway, el Plugin inicia su monitor de Weixin para cada
   cuenta configurada.
7. Los mensajes entrantes de WeChat se normalizan mediante el contrato de canal, se enrutan al
   agente de OpenClaw seleccionado y se envían de vuelta mediante la ruta saliente del Plugin.

Esa separación es importante: el núcleo de OpenClaw debe seguir siendo independiente del canal. El inicio de sesión de WeChat,
las llamadas a la API Tencent iLink, la carga/descarga de multimedia, los tokens de contexto y la
supervisión de cuentas son responsabilidad del Plugin externo.

## Instalar

Instalación rápida:

```bash
npx -y @tencent-weixin/openclaw-weixin-cli install
```

Instalación manual:

```bash
openclaw plugins install "@tencent-weixin/openclaw-weixin"
openclaw config set plugins.entries.openclaw-weixin.enabled true
```

Reinicia el Gateway después de la instalación:

```bash
openclaw gateway restart
```

## Inicio de sesión

Ejecuta el inicio de sesión con QR en la misma máquina que ejecuta el Gateway:

```bash
openclaw channels login --channel openclaw-weixin
```

Escanea el código QR con WeChat en tu teléfono y confirma el inicio de sesión. El Plugin guarda
el token de la cuenta localmente después de un escaneo exitoso.

Para agregar otra cuenta de WeChat, ejecuta de nuevo el mismo comando de inicio de sesión. Para varias
cuentas, aísla las sesiones de mensajes directos por cuenta, canal y remitente:

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## Control de acceso

Los mensajes directos usan el modelo normal de emparejamiento y lista de permitidos de OpenClaw para
Plugins de canal.

Aprueba nuevos remitentes:

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

Para el modelo completo de control de acceso, consulta [Emparejamiento](/es/channels/pairing).

## Compatibilidad

El Plugin verifica la versión del host de OpenClaw al iniciarse.

| Línea del Plugin | Versión de OpenClaw      | Etiqueta npm |
| ---------------- | ------------------------ | ------------ |
| `2.x`            | `>=2026.3.22`           | `latest`     |
| `1.x`            | `>=2026.1.0 <2026.3.22` | `legacy`     |

Si el Plugin informa que tu versión de OpenClaw es demasiado antigua, actualiza
OpenClaw o instala la línea heredada del Plugin:

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## Proceso sidecar

El Plugin de WeChat puede ejecutar trabajo auxiliar junto al Gateway mientras supervisa la
API Tencent iLink. En el issue #68451, esa ruta auxiliar expuso un error en la
limpieza genérica de Gateway obsoleto de OpenClaw: un proceso hijo podía intentar limpiar el proceso
padre del Gateway, causando bucles de reinicio en gestores de procesos como systemd.

La limpieza actual del inicio de OpenClaw excluye el proceso actual y sus ancestros,
por lo que un auxiliar de canal no debe matar al Gateway que lo inició. Esta corrección es
genérica; no es una ruta específica de WeChat en el núcleo.

## Solución de problemas

Verifica la instalación y el estado:

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

Si el canal aparece como instalado pero no se conecta, confirma que el Plugin esté
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

Desactivación temporal:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled false
openclaw gateway restart
```

## Documentación relacionada

- Resumen de canales: [Canales de chat](/es/channels)
- Emparejamiento: [Emparejamiento](/es/channels/pairing)
- Enrutamiento de canales: [Enrutamiento de canales](/es/channels/channel-routing)
- Arquitectura de Plugins: [Arquitectura de Plugins](/es/plugins/architecture)
- SDK de Plugins de canal: [SDK de Plugins de canal](/es/plugins/sdk-channel-plugins)
- Paquete externo: [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
