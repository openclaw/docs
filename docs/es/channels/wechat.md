---
read_when:
    - Quieres conectar OpenClaw con WeChat o Weixin
    - Está instalando o solucionando problemas del plugin de canal openclaw-weixin
    - Necesitas comprender cómo se ejecutan los plugins de canales externos junto al Gateway
summary: Configuración del canal de WeChat mediante el plugin externo openclaw-weixin
title: WeChat
x-i18n:
    generated_at: "2026-07-11T22:56:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 98faf95f9fb76deedb7df9adf3092083722a77bdd793de98c41a6f715cc0d14a
    source_path: channels/wechat.md
    workflow: 16
---

OpenClaw se conecta a WeChat mediante el plugin de canal externo de Tencent
`@tencent-weixin/openclaw-weixin`.

Estado: plugin externo, mantenido por el equipo de Tencent Weixin. Se admiten los chats directos y
el contenido multimedia. Los chats grupales no se anuncian en los metadatos de capacidades
del plugin (solo declara chats directos).

## Nomenclatura

- **WeChat** es el nombre de cara al usuario en esta documentación.
- **Weixin** es el nombre que utiliza el paquete de Tencent y el id. del plugin.
- `openclaw-weixin` es el id. de canal de OpenClaw (`weixin` y `wechat` funcionan como alias).
- `@tencent-weixin/openclaw-weixin` es el paquete de npm.

Usa `openclaw-weixin` en los comandos de la CLI y las rutas de configuración.

## Cómo funciona

El código de WeChat no se encuentra en el repositorio principal de OpenClaw. OpenClaw proporciona el
contrato genérico de plugins de canal, y el plugin externo proporciona el entorno de ejecución
específico de WeChat:

1. `openclaw plugins install` instala `@tencent-weixin/openclaw-weixin`.
2. El Gateway detecta el manifiesto del plugin y carga su punto de entrada.
3. El plugin registra el id. de canal `openclaw-weixin`.
4. `openclaw channels login --channel openclaw-weixin` inicia el acceso mediante QR.
5. El plugin almacena las credenciales de la cuenta en el directorio de estado de OpenClaw
   (`~/.openclaw` de forma predeterminada).
6. Cuando se inicia el Gateway, el plugin inicia su monitor de Weixin para cada
   cuenta configurada.
7. Los mensajes entrantes de WeChat se normalizan mediante el contrato de canal, se enrutan al
   agente de OpenClaw seleccionado y se devuelven mediante la ruta de salida del plugin.

Esta separación es importante: el núcleo de OpenClaw permanece independiente de los canales. El inicio de sesión en WeChat,
las llamadas a la API iLink de Tencent, la carga y descarga de contenido multimedia, los tokens de contexto y la
supervisión de cuentas son responsabilidad del plugin externo.

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

Reinicia el Gateway después de la instalación:

```bash
openclaw gateway restart
```

## Inicio de sesión

Ejecuta el inicio de sesión mediante QR en el mismo equipo donde se ejecuta el Gateway:

```bash
openclaw channels login --channel openclaw-weixin
```

Escanea el código QR con WeChat en tu teléfono y confirma el inicio de sesión. El plugin guarda
localmente el token de la cuenta después de un escaneo correcto.

Para añadir otra cuenta de WeChat, vuelve a ejecutar el mismo comando de inicio de sesión. Si tienes varias
cuentas, aísla las sesiones de mensajes directos por cuenta, canal y remitente:

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## Control de acceso

Los mensajes directos utilizan el modelo normal de vinculación y lista de permitidos de OpenClaw para los plugins
de canal.

Aprueba nuevos remitentes:

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

Para conocer el modelo completo de control de acceso, consulta [Vinculación](/es/channels/pairing).

## Compatibilidad

El plugin comprueba la versión de OpenClaw del host al iniciarse.

| Línea del plugin | Versión de OpenClaw                                             | Etiqueta de npm |
| ---------------- | --------------------------------------------------------------- | --------------- |
| `2.x`            | `>=2026.5.12` (actual: 2.4.6; las primeras versiones 2.x aceptaban `>=2026.3.22`) | `latest` |
| `1.x`            | `>=2026.1.0 <2026.3.22`                                         | `legacy` |

Si el plugin indica que tu versión de OpenClaw es demasiado antigua, actualiza
OpenClaw o instala la línea antigua del plugin:

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## Proceso auxiliar

El plugin de WeChat puede ejecutar tareas auxiliares junto al Gateway mientras supervisa la
API iLink de Tencent. En el problema n.º 68451, esa ruta auxiliar dejó al descubierto un error en la
limpieza genérica de instancias obsoletas del Gateway de OpenClaw: un proceso secundario podía intentar limpiar el proceso
principal del Gateway, lo que provocaba ciclos de reinicio con gestores de procesos como systemd.

La limpieza actual durante el inicio de OpenClaw excluye el proceso actual y sus procesos antecesores,
por lo que un auxiliar del canal no puede finalizar el Gateway que lo inició. Esta corrección es
genérica; no es una ruta específica de WeChat en el núcleo.

## Solución de problemas

Comprueba la instalación y el estado:

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

Si el canal aparece como instalado, pero no se conecta, confirma que el plugin esté
habilitado y reinicia:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

Si el Gateway se reinicia repetidamente después de habilitar WeChat, actualiza tanto OpenClaw como
el plugin:

```bash
npm view @tencent-weixin/openclaw-weixin version
openclaw plugins install "@tencent-weixin/openclaw-weixin" --force
openclaw gateway restart
```

Si al iniciarse se indica que el paquete de plugin instalado `requires compiled runtime
output for TypeScript entry`, el paquete de npm se publicó sin los archivos compilados del entorno de ejecución
de JavaScript que necesita OpenClaw. Actualízalo o vuelve a instalarlo después de que el
editor del plugin publique un paquete corregido, o deshabilita o desinstala temporalmente el plugin.

Deshabilitación temporal:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled false
openclaw gateway restart
```

## Documentación relacionada

- Descripción general de los canales: [Canales de chat](/es/channels)
- Vinculación: [Vinculación](/es/channels/pairing)
- Enrutamiento de canales: [Enrutamiento de canales](/es/channels/channel-routing)
- Arquitectura de plugins: [Arquitectura de plugins](/es/plugins/architecture)
- SDK de plugins de canal: [SDK de plugins de canal](/es/plugins/sdk-channel-plugins)
- Paquete externo: [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
