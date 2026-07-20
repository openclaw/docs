---
read_when:
    - Integración de OpenClaw en una aplicación de escritorio o servidor
    - Supervisión del Gateway como proceso secundario
    - Gestión de la disponibilidad, el reinicio, el apagado o la configuración no válida del Gateway sin analizar los registros
summary: Supervisar el Gateway de OpenClaw como proceso secundario desde Electron u otra aplicación host
title: Integración de OpenClaw
x-i18n:
    generated_at: "2026-07-20T11:43:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ca67e03994f21446bfeca58c95c2cb624dde767b9983a89982627145f80dfb90
    source_path: gateway/embedding.md
    workflow: 16
---

Un host de integración debe supervisar el ejecutable `openclaw` instalado, usar el
protocolo WebSocket del Gateway como plano de control y tratar el proceso hijo como un
entorno de ejecución reemplazable. Esto mantiene explícitos la propiedad del proceso, el estado de disponibilidad, la recuperación ante fallos
y las actualizaciones sin depender de la estructura de estado privada de OpenClaw.

Para la autenticación del cliente y el estado de reconexión, consulte
[Creación de un cliente del Gateway](https://docs.openclaw.ai/gateway/clients).

## Iniciar el proceso hijo con un preajuste de integración

Use una instalación real de `node_modules` e inicie el ejecutable del paquete. Una
base útil para un host que controla la detección, el reinicio y el ciclo de vida de los canales es:

```ts
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Proporcione una ruta absoluta a un entorno de ejecución de Node real administrado por la aplicación host.
declare const hostNodeExecutable: string;

const packageEntry = fileURLToPath(import.meta.resolve("openclaw"));
const openclawEntry = resolve(dirname(packageEntry), "..", "openclaw.mjs");
const gateway = spawn(hostNodeExecutable, [openclawEntry, "gateway", "--allow-unconfigured"], {
  env: {
    ...process.env,
    OPENCLAW_DISABLE_BONJOUR: "1",
    OPENCLAW_EXEC_SHELL_SNAPSHOT: "0",
    OPENCLAW_NO_RESPAWN: "1",
    OPENCLAW_SKIP_CHANNELS: "1",
  },
  stdio: ["ignore", "inherit", "inherit"],
});
```

Resuelva OpenClaw mediante el paquete instalado como se muestra; no dé por sentado que un
binario `openclaw` local del proyecto se encuentra en el `PATH` del proceso host. El ejemplo
hereda la salida para que el proceso hijo no pueda bloquearse por tuberías de stdout o stderr llenas. Si el
host captura esos flujos, conecte consumidores inmediatamente después de iniciar el proceso.

| Configuración                      | Efecto en la integración                                                                                                                                                                  |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DISABLE_BONJOUR=1`     | Desactiva la publicidad multicast de LAN controlada por el Gateway cuando el host controla la detección.                                                                                  |
| `OPENCLAW_NO_RESPAWN=1`          | En un proceso hijo de integración no administrado, impide que OpenClaw delegue un reinicio por actualización a un proceso hijo desvinculado. Los reinicios habituales permanecen en el proceso, por lo que el host conserva la propiedad del PID supervisado. |
| `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` | Desactiva la captura de instantáneas del shell de inicio de sesión para los comandos ejecutados por el host.                                                                               |
| `OPENCLAW_SKIP_CHANNELS=1`       | Omite el inicio y la recarga de canales. Configúrelo únicamente cuando la aplicación integrada requiera un Gateway solo para el plano de control o WebChat.                               |

`--allow-unconfigured` omite únicamente la protección de inicio `gateway.mode=local`.
No escribe la configuración ni repara un archivo no válido. Omítalo cuando la aplicación integrada
aprovisione una configuración local normal mediante la incorporación, la CLI de configuración
o RPC del Gateway.

### Advertencia sobre las instantáneas del shell en Electron

La captura de instantáneas del shell ejecuta `process.execPath -e <script>` desde un shell de inicio de sesión. En
un proceso normal de Node, `process.execPath` es el ejecutable de Node. En Electron,
es el binario de Electron, que puede interpretar la invocación como el inicio de una aplicación
y mostrar una ventana emergente «Unable to find Electron app». Configure
`OPENCLAW_EXEC_SHELL_SNAPSHOT=0` en el entorno del proceso hijo del Gateway, no solo en
el proceso de renderizado. Por el mismo motivo, `hostNodeExecutable` debe apuntar a un
entorno de ejecución de Node real, en lugar del `process.execPath` de Electron.

## Gestionar una configuración no válida mediante el código de salida

El inicio del Gateway usa el código de salida `78` (`EX_CONFIG`) para fallos de inicio
relacionados con la configuración, incluida una configuración no válida. Tome decisiones según el código de salida en lugar de analizar
el texto de stderr legible por humanos:

1. Ejecute `openclaw doctor --fix --yes --non-interactive` con el mismo entorno de configuración y
   estado que el proceso hijo del Gateway.
2. Vuelva a intentar iniciar el Gateway una vez después de que doctor finalice correctamente.
3. Si el proceso hijo vuelve a finalizar con `78`, detenga el bucle de reparación y muestre al usuario
   el fallo de configuración.

Conserve stderr para el diagnóstico, pero no tome decisiones sobre el ciclo de vida basándose en su redacción.

Tras un inicio correcto, una edición no válida de la configuración activa resulta menos destructiva. El
supervisor de configuración registra que se omitió la recarga y sigue utilizando la última
configuración en memoria aceptada. Repare el archivo y deje que el supervisor acepte la siguiente
instantánea válida.

## Esperar la disponibilidad del protocolo

Use señales de WebSocket en lugar de una subcadena del registro:

1. Abra el WebSocket del Gateway.
2. Espere el evento `connect.challenge`. Este demuestra que el receptor aceptó el
   WebSocket y que puede comenzar el protocolo de enlace del desafío.
3. Envíe `connect` con la firma del dispositivo vinculada al desafío.
4. Considere `hello-ok` como la disponibilidad de la aplicación para RPC autenticado.

El desafío se produce deliberadamente antes de la inicialización completa. Si los
procesos auxiliares de inicio siguen pendientes, `connect` devuelve un error reintentable `UNAVAILABLE` con
`details.reason: "startup-sidecars"`, un `retryAfterMs` limitado, y después cierra
con el código `1013` y el motivo `gateway starting`. Use
`resolveGatewayStartupRetryAfterMs` de
`@openclaw/gateway-protocol/startup-unavailable` o la política integrada del cliente de referencia y, a continuación, vuelva a conectarse.

## Interpretar el reinicio y el apagado

Antes de un cierre ordenado, el Gateway transmite un evento `shutdown` con `reason`
y `restartExpectedMs`. Un valor `restartExpectedMs` distinto de nulo significa que se espera un reinicio
en el proceso o supervisado; `null` significa un apagado definitivo.

El código de cierre posterior del WebSocket es `1012` en ambos casos. El motivo de cierre
ordinario del cliente también es `service restart` en ambos casos, por lo que ni el código de cierre ni
el motivo distinguen el reinicio del apagado. Conserve la carga útil `shutdown`
anterior cuando llegue y combínela con la intención de detención del propio host y el
estado de salida del proceso hijo. Si la conexión desaparece sin el evento, use la política normal
de reconexión limitada y supervisión del proceso hijo.

## Usar RPC en lugar de archivos de estado

Mantenga el Gateway como único propietario del estado de OpenClaw. Las operaciones habituales
de integración ya disponen de métodos RPC:

| Tarea                              | Métodos RPC                                            |
| ---------------------------------- | ------------------------------------------------------ |
| Catálogo y ciclo de vida de sesiones | `sessions.list`, `sessions.patch`, `sessions.delete` |
| Visualización de la transcripción  | `chat.history`                                     |
| Informes de costes y uso           | `usage.cost`, `sessions.usage`                 |
| Estado de las credenciales del modelo | `models.authStatus`                                  |
| Configuración                      | `config.get`, `config.patch`                 |

`config.get` oculta los valores confidenciales y los identificadores SecretRef antes de devolver
la instantánea. Los métodos de escritura también devuelven la configuración censurada. Un cliente debe tratar el
centinela de censura como opaco y usar el contrato documentado de escritura de configuración; nunca
debe esperar que el Gateway devuelva secretos en texto sin formato.

No lea ni modifique archivos, tablas SQLite, archivos de transcripciones ni directorios de caché
en `~/.openclaw` para implementar funciones de la aplicación. Esas estructuras son detalles privados de
implementación del entorno de ejecución y pueden trasladarse o cambiar sin compatibilidad con el protocolo.

## Instalar; no aplanar

El paquete raíz `openclaw` no está diseñado para incorporarse como un único archivo. Los archivos
incluidos del entorno de ejecución en `dist/extensions` conservan autoimportaciones simples como
`openclaw/plugin-sdk/*`, mientras que el paquete npm excluye intencionadamente
los árboles `node_modules` de cada extensión.

Instale OpenClaw mediante npm, pnpm u otra instalación normal de paquetes de Node para que
Node pueda resolver las exportaciones del paquete y el árbol de dependencias raíz. Inicie el ejecutable
`openclaw` instalado. No copie únicamente `dist`, no aplane el paquete en un paquete
de aplicación ni incorpore archivos de extensiones seleccionados.

## Contenido relacionado

- [Creación de un cliente del Gateway](https://docs.openclaw.ai/gateway/clients)
- [Protocolo del Gateway](https://docs.openclaw.ai/gateway/protocol)
- [CLI del Gateway](https://docs.openclaw.ai/cli/gateway)
- [Integraciones del Gateway para aplicaciones externas](https://docs.openclaw.ai/gateway/external-apps)
