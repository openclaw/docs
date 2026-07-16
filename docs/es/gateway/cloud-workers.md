---
read_when: You want agent sessions to run on ephemeral cloud machines instead of the Gateway host, or you are configuring cloudWorkers profiles.
sidebarTitle: Cloud Workers
status: active
summary: 'Envía sesiones a máquinas desechables en la nube: aprovisionamiento, entorno de ejecución de workers, inferencia mediante proxy y transmisión de resultados en tiempo real'
title: Workers en la nube
x-i18n:
    generated_at: "2026-07-16T11:33:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c20b3b4f1408ed3ef0beb155a207f99476323cf67eba7b44931eec32c79e52be
    source_path: gateway/cloud-workers.md
    workflow: 16
---

Los trabajadores en la nube permiten que una sesión ejecute su bucle de agente en una máquina desechable en la nube mientras todo lo relacionado con la sesión permanece donde siempre: visible en la barra lateral, transmitiéndose en directo y con la transcripción bajo la propiedad del Gateway. El Gateway arrienda una máquina, instala en ella una copia fijada de OpenClaw, sincroniza el espacio de trabajo de la sesión y entrega el bucle de turnos a un proceso `openclaw worker` restringido. Las llamadas al modelo se canalizan de vuelta mediante el Gateway, por lo que las credenciales del proveedor nunca salen de la máquina local, y el almacenamiento en caché de solicitudes sigue funcionando porque el proveedor ve un único flujo continuo.

Cuando finaliza el trabajo (o falla la máquina), esta se descarta. El estado persistente —la transcripción, las confirmaciones del espacio de trabajo y los registros de ubicación— permanece con el Gateway.

<Note>
Los trabajadores en la nube son opcionales y permanecen invisibles hasta que se configura un perfil. Las instalaciones sin configurar no muestran nuevos RPC, opciones de configuración ni elementos de interfaz.
</Note>

## Qué se ejecuta en cada ubicación

| Aspecto                                                 | Ubicación                                                                         |
| ------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Bucle del agente y herramientas (`exec`, `read`, `write`, `edit`, …) | Máquina del trabajador en la nube                                                 |
| Inferencia del modelo y credenciales del proveedor      | Gateway (canalizadas mediante una referencia `{provider, model}`)                  |
| Transcripción (persistente, almacén de sesiones)        | Gateway                                                                           |
| Transmisión en directo a la barra lateral               | Distribución del Gateway, alimentada por el flujo de eventos reproducible del trabajador |
| Historial de Git del espacio de trabajo                 | Creado en la máquina sin credenciales; el Gateway adopta las confirmaciones y se encarga de enviar los cambios o crear la PR |

La máquina no necesita puertos de entrada salvo `sshd`: el Gateway establece una conexión saliente mediante SSH fijado y un túnel inverso transporta de vuelta el WebSocket del trabajador. El proveedor Crabbox incluido obliga a usar la ruta SSH pública y desactiva la inscripción administrada en Tailscale. El acceso saliente a Internet depende de la política del proveedor; el perfil predeterminado de AWS puede acceder a Internet, salvo que se restrinjan su red o su grupo de seguridad.

## Requisitos

- Un Plugin de proveedor de trabajadores. El Plugin `crabbox` incluido controla la CLI de [Crabbox](https://github.com/openclaw/crabbox), que gestiona los arrendamientos entre distintos backends de nube (AWS, Hetzner y otros). El binario `crabbox` debe estar en `PATH` (o debe establecerse `settings.binary`) y las credenciales del proveedor ya deben estar configuradas. La admisión de AWS requiere Crabbox 0.38.1 o una versión posterior.
- Para los trabajadores de Crabbox en AWS, el valor efectivo de `aws.instanceProfile` debe estar vacío. El proveedor comprueba `crabbox config show --json` antes de la asignación y, después, exige que `crabbox inspect --json` indique `providerMetadata.instanceProfileAttached: false` a partir de `DescribeInstances` de EC2. Los arrendamientos con un rol de instancia o sin metadatos autoritativos se detienen y se rechazan.
- Node.js en la máquina arrendada. Las imágenes básicas de nube normalmente no lo incluyen; instálelo mediante el comando `setup` del perfil.
- Una sesión con un árbol de trabajo administrado que pertenezca a la sesión (créelo con `worktree: true`). El despacho mueve el contenido de ese árbol de trabajo; los directorios normales se sincronizan como un espejo del manifiesto.

## Configuración

Añada un perfil en `cloudWorkers.profiles` dentro de `openclaw.json`:

```json
{
  "cloudWorkers": {
    "profiles": {
      "aws": {
        "provider": "crabbox",
        "install": "bundle",
        "settings": {
          "provider": "aws",
          "class": "standard",
          "ttl": "8h",
          "idleTimeout": "45m",
          "setup": "test -x /usr/bin/node || (curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt-get install -y nodejs)"
        }
      }
    }
  }
}
```

Campos del perfil:

| Clave      | Significado                                                                                                                                                                                                                                    |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | Identificador del proveedor de trabajadores registrado por un Plugin (`crabbox` para el Plugin incluido).                                                                                                                                 |
| `install`  | `bundle` (valor predeterminado) distribuye la compilación del Gateway en ejecución; `npm` instala exactamente la versión publicada del Gateway con la integridad fijada. `npm` exige que el Gateway se ejecute desde una versión empaquetada. |
| `settings` | JSON propiedad del proveedor. Para crabbox: `provider` (backend), `class` (clase de máquina), `ttl`, `idleTimeout` (duraciones de Go), y las opciones `setup` y la ruta absoluta `binary`. OpenClaw obliga a usar SSH público y desactiva Tailscale administrado para estos arrendamientos. |
| `lifetime` | Política almacenada opcional (`idleTimeoutMinutes`, `maxLifetimeMinutes`).                                                                                                                                                                           |

### El comando de configuración

`settings.setup` se ejecuta en la máquina arrendada después de que SSH esté listo y antes de instalar OpenClaw. Se ejecuta en **cada** intento de aprovisionamiento (incluidas las repeticiones después de un despacho interrumpido), por lo que debe ser idempotente; proteja las instalaciones con una comprobación `command -v`/`test -x`, como en el ejemplo. Si la configuración falla, el proveedor detiene el arrendamiento y el despacho falla de forma segura; no se deja en ejecución ninguna máquina configurada parcialmente.

### Canales de instalación

- **`bundle`** empaqueta el archivo `dist` del Gateway en ejecución, un archivo `package.json` depurado y todos los paquetes del espacio de trabajo a los que haga referencia la compilación, todo ello cubierto por un hash de contenido. La máquina verifica el paquete intacto mediante ese hash y, a continuación, instala las dependencias de producción de npm (con los scripts desactivados). Así se ejecuta una compilación de desarrollo en un trabajador.
- **`npm`** comprueba que la versión exista en el registro público, fija su integridad SHA-512 e instala `openclaw@<version>` de forma que coincida exactamente con el Gateway.

## Despacho de una sesión

En la interfaz de control, abra **New Session**, elija un agente cuyo entorno de ejecución configurado sea OpenClaw, seleccione un destino **Cloud · profile** configurado en el menú **Where** e inicie la tarea. La selección de la nube activa automáticamente el árbol de trabajo administrado requerido; el Gateway crea la sesión, completa el despacho y solo entonces envía el primer turno. La insignia del servidor en la barra lateral de la sesión muestra el estado persistente de la ubicación. Los destinos en la nube no se ofrecen para catálogos de sesiones de CLI externas.

El flujo RPC equivalente es:

Cree una sesión con un árbol de trabajo administrado y, después, despáchela (el RPC requiere `operator.admin` y solo existe cuando hay perfiles configurados):

Los trabajadores en la nube ejecutan el entorno del agente de OpenClaw. Elija un `openai/*` u otro modelo que se resuelva a ese entorno; las sesiones configuradas para un entorno de CLI externo como `claude-cli` no se pueden despachar.

```bash
openclaw gateway call sessions.create \
  --params '{"key":"agent:main:big-refactor","worktree":true,"cwd":"/path/to/repo","worktreeName":"big-refactor"}'

openclaw gateway call sessions.dispatch \
  --timeout 1500000 \
  --params '{"key":"agent:main:big-refactor","profileId":"aws"}'
```

`sessions.dispatch` cierra la admisión de turnos locales, espera a que finalice el trabajo activo, aprovisiona el arrendamiento, ejecuta la configuración, inicializa OpenClaw, sincroniza el espacio de trabajo y devuelve el control una vez que la ubicación alcanza la propiedad del trabajador `active`. Reserve varios minutos para el primer despacho; los arrendamientos y las instalaciones se almacenan en caché cuando el proveedor lo permite. Después, interactúe con la sesión como de costumbre: los turnos se enrutan automáticamente al trabajador.

Los turnos completados del trabajador reconcilian los archivos aptos del espacio de trabajo, sujetos a límites de tamaño, con el árbol de trabajo administrado de la sesión antes de liberar la reclamación del turno. El evento terminal del trabajador crea una barrera persistente de resultado pendiente antes de recibir confirmación, por lo que la recuperación tras reiniciar el Gateway recupera el espacio de trabajo remoto antes de que la limpieza de turnos obsoletos pueda destruir a su propietario. La reconciliación autentica el manifiesto del trabajador y se detiene si detecta divergencia local, en lugar de sobrescribir cualquiera de los lados. Antes de modificar archivos, el Gateway almacena un diario de reversión limitado en su base de datos de estado SQLite; un reintento recupera ese diario después de la interrupción de un proceso del Gateway. Los resultados del espacio de trabajo utilizan la semántica de archivos de Git: se conservan los archivos normales, los bits de ejecución, los enlaces simbólicos, las adiciones, los cambios y las eliminaciones, pero no los directorios vacíos ni otros modos de directorio. Los objetos de confirmación remotos no se conservan; los cambios de archivo resultantes permanecen en el árbol de trabajo administrado para su revisión y confirmación normales.

Cuando el trabajo haya terminado y no haya ningún turno en ejecución, abra el menú de la sesión y elija **Stop cloud worker…**. El Gateway realiza una última reconciliación del espacio de trabajo antes de destruir el entorno. Una ubicación que ya esté en `draining` o `reconciling` está finalizando su desmantelamiento; espere a que su insignia cambie a `reclaimed` antes de eliminar la sesión.

En caso de que un trabajador asociado esté averiado o fuera de control, un operador puede llamar a `environments.destroy` con `{ "force": true }` como último recurso. El desmantelamiento forzado marca de forma persistente la ubicación como fallida y abandona cualquier resultado remoto sin reconciliar antes de destruir el entorno.

El RPC administrativo equivalente es:

```bash
openclaw gateway call sessions.reclaim \
  --timeout 600000 \
  --params '{"key":"agent:main:big-refactor"}'
```

La ubicación avanza por una máquina de estados persistente (`local → requested → provisioning → syncing → starting → active`), por lo que un reinicio del Gateway durante el despacho realiza la reconciliación en lugar de dejar máquinas huérfanas. Un turno de modelo fallido mantiene disponible la ubicación activa para volver a intentarlo. Si falla la reconciliación entrante del espacio de trabajo, el trabajador también permanece activo para que el operador pueda resolver el conflicto local y volver a intentarlo sin perder el resultado remoto; en cambio, los fallos del ciclo de vida trasladan la ubicación a un estado de error o recuperación y conservan la parte final del diagnóstico.

## Modelo de seguridad

- **Entrada cerrada del trabajador.** Los trabajadores se comunican mediante un protocolo dedicado en el socket tunelizado, con una lista cerrada de métodos permitidos; un trabajador no puede llamar a los RPC del operador.
- **Credenciales emitidas y almacenadas como hash.** Cada despacho emite una credencial de trabajador; el Gateway almacena únicamente su hash. La rotación de credenciales y el aislamiento por época del propietario garantizan como máximo un propietario activo por sesión: un trabajador obsoleto que vuelva a conectarse queda aislado y nunca se combina.
- **Fijación de la clave del host.** El proveedor debe proporcionar la clave de host SSH de la máquina durante el aprovisionamiento; la inicialización se conecta con una fijación estricta y falla de forma segura si no está disponible.
- **Sin credenciales permanentes del modelo, del servicio de alojamiento de repositorios ni de la nube en la máquina.** La autenticación del modelo permanece en el Gateway (la inferencia se transporta mediante una referencia `{provider, model}`), las confirmaciones de Git del espacio de trabajo se crean sin credenciales del servicio de alojamiento de repositorios y los metadatos del arrendamiento de Crabbox en AWS se comprueban de forma autoritativa para detectar un rol de instancia antes de la configuración. Mantenga también los comandos de configuración libres de credenciales.
- **Salida propiedad del proveedor.** El túnel inverso elimina cualquier necesidad de acceso directo al modelo por parte de OpenClaw, pero OpenClaw no modifica los cortafuegos del proveedor. Restrinja el tráfico saliente en el proveedor de trabajadores cuando la tarea lo requiera.
- **Transcripciones persistentes y procesadas exactamente una vez.** El trabajador confirma lotes de transcripciones mediante un protocolo de comparación e intercambio con respecto a la hoja de la sesión; una base obsoleta detiene la ejecución de forma segura en lugar de duplicar o reorganizar resultados de pago.

## Solución de problemas

- **`sessions.dispatch` es un método desconocido** — no hay ningún `cloudWorkers.profiles` configurado o el solicitante carece de `operator.admin`.
- **"Los turnos de trabajadores en la nube requieren el entorno de ejecución de OpenClaw"** — elija un modelo cuyo entorno de ejecución configurado sea OpenClaw. Los entornos de ejecución de CLI externos, como `claude-cli`, no admiten la inferencia de trabajadores.
- **"El arranque del trabajador requiere Node.js en el host arrendado"** — añada una instalación de Node a `settings.setup` (véase más arriba).
- **La atestación del rol de instancia de AWS falla** — borre `aws.instanceProfile` (y `CRABBOX_AWS_INSTANCE_PROFILE`, si está definido). Instale Crabbox 0.38.1 o una versión posterior; los binarios anteriores no exponen el contrato `providerMetadata.instanceProfileAttached` autoritativo necesario para la admisión en AWS.
- **El despacho falla con un error del proveedor** — el registro de ubicación y `environments.list` conservan el último error, incluida la parte final de stderr de la configuración o el arranque. Las cajas se destruyen cuando se produce un fallo, por lo que esa parte final es la principal fuente forense.
- **Tiempo de espera agotado en el cliente durante el despacho** — `openclaw gateway call` utiliza de forma predeterminada un tiempo de espera de 10s; proporcione un valor generoso para `--timeout` (el despacho continúa ejecutándose en el servidor de cualquier modo y un reintento durante el aprovisionamiento se rechaza con `session cannot dispatch from placement provisioning`).
- **Mantenimiento de los arrendamientos** — `crabbox list --provider <backend>` muestra los arrendamientos activos; `crabbox stop --provider <backend> --id <lease>` libera uno manualmente. Los arrendamientos inactivos caducan según el valor `idleTimeout` del perfil.

## Contenido relacionado

- [Aislamiento](/es/gateway/sandboxing) — reducción del radio de impacto de la ejecución local de herramientas
- [CLI de sesiones](/es/cli/sessions) — inspección de las sesiones almacenadas
- [Referencia de configuración](/es/gateway/configuration-reference)
