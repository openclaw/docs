---
read_when: You want agent sessions to run on ephemeral cloud machines instead of the Gateway host, or you are configuring cloudWorkers profiles.
sidebarTitle: Cloud Workers
status: active
summary: 'Despacha sesiones a máquinas desechables en la nube: aprovisionamiento, entorno de ejecución de workers, inferencia mediante proxy y transmisión de resultados en tiempo real'
title: Trabajadores en la nube
x-i18n:
    generated_at: "2026-07-21T08:59:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4e81fb50512639b3b0e00522dea914533b596574f35baf304c932c2962ac103c
    source_path: gateway/cloud-workers.md
    workflow: 16
---

Los trabajadores en la nube permiten que una sesión ejecute el bucle de su agente en una máquina temporal en la nube mientras todo lo relacionado con la sesión permanece donde siempre: visible en la barra lateral, transmitiéndose en directo y con la transcripción bajo la propiedad del Gateway. El Gateway arrienda una máquina, instala en ella una copia fijada de OpenClaw, sincroniza el espacio de trabajo de la sesión y entrega el bucle de turnos a un proceso `openclaw worker` restringido. Las llamadas al modelo se redirigen mediante proxy a través del Gateway, por lo que las credenciales del proveedor nunca salen de la máquina local, y el almacenamiento en caché de prompts sigue funcionando porque el proveedor ve un flujo continuo.

Cuando finaliza el trabajo (o la máquina deja de funcionar), la máquina se descarta. El estado persistente —la transcripción, los commits del espacio de trabajo y los registros de ubicación— reside en el Gateway.

<Note>
Los trabajadores en la nube son opcionales y permanecen invisibles hasta que se configura un perfil. Las instalaciones sin configurar no muestran nuevos RPC, configuraciones ni elementos de la interfaz.
</Note>

## Qué se ejecuta en cada lugar

| Aspecto                                                 | Ubicación                                                                         |
| ------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Bucle del agente + herramientas (`exec`, `read`, `write`, `edit`, …) | Máquina del trabajador en la nube                                                                 |
| Inferencia del modelo y credenciales del proveedor                | Gateway (mediante proxy por la referencia `{provider, model}`)                               |
| Transcripción (persistente, almacén de la sesión)                     | Gateway                                                                          |
| Transmisión en directo a la barra lateral                         | Distribución del Gateway, alimentada por el flujo de eventos reproducible del trabajador                      |
| Historial de Git del espacio de trabajo                                   | Creado en la máquina sin credenciales; el Gateway adopta los commits y controla el push/PR |

La máquina no necesita puertos de entrada salvo `sshd`: el Gateway establece una conexión saliente mediante SSH fijado y un túnel inverso transporta de vuelta el WebSocket del trabajador. El proveedor Crabbox incluido fuerza la ruta SSH pública y desactiva la inscripción administrada en Tailscale. El acceso saliente a Internet depende de la política del proveedor; el perfil predeterminado de AWS puede acceder a Internet a menos que se restrinja su red o grupo de seguridad.

## Requisitos

- Un Plugin de proveedor de trabajadores. El Plugin `crabbox` incluido controla la CLI de [Crabbox](https://github.com/openclaw/crabbox), que gestiona los arrendamientos entre distintos backends de nube (AWS, Hetzner y otros). El binario `crabbox` debe estar en `PATH` (o debe establecerse `settings.binary`) con las credenciales del proveedor ya configuradas. La admisión en AWS requiere Crabbox 0.38.1 o una versión posterior.
- Para los trabajadores de Crabbox en AWS, el valor efectivo de `aws.instanceProfile` debe estar vacío. El proveedor comprueba `crabbox config show --json` antes de la asignación y después exige que `crabbox inspect --json` indique `providerMetadata.instanceProfileAttached: false` desde `DescribeInstances` de EC2. Los arrendamientos con un rol de instancia o sin metadatos autoritativos se detienen y se rechazan.
- Node.js en la máquina arrendada. Las imágenes básicas de nube no suelen incluirlo; instálelo mediante el comando `setup` del perfil.
- Una sesión con un árbol de trabajo administrado y propiedad de la sesión (créelo con `worktree: true`). El despacho traslada el contenido de ese árbol de trabajo; los directorios normales se sincronizan como un espejo del manifiesto.

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

| Clave        | Significado                                                                                                                                                                                                                                        |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | Identificador del proveedor de trabajadores registrado por un Plugin (`crabbox` para el Plugin incluido).                                                                                                                                                                  |
| `install`  | `bundle` (valor predeterminado) distribuye la compilación del Gateway en ejecución; `npm` instala exactamente la versión publicada del Gateway con la integridad fijada. `npm` requiere que el Gateway se ejecute desde una versión empaquetada.                                                      |
| `settings` | JSON controlado por el proveedor. Para Crabbox: `provider` (backend), `class` (clase de máquina), `ttl`, `idleTimeout` (duraciones de Go), `setup` opcional y ruta absoluta `binary`. OpenClaw fuerza el SSH público y desactiva Tailscale administrado para estos arrendamientos. |
| `lifetime` | Política almacenada opcional (`idleTimeoutMinutes`, `maxLifetimeMinutes`).                                                                                                                                                                           |

### El comando de preparación

`settings.setup` se ejecuta en la máquina arrendada después de que SSH esté listo y antes de instalar OpenClaw. Se ejecuta en **cada** intento de aprovisionamiento (incluidas las repeticiones posteriores a un despacho interrumpido), por lo que debe ser idempotente: proteja las instalaciones con una comprobación `command -v`/`test -x`, como en el ejemplo. Si la preparación falla, el proveedor detiene el arrendamiento y el despacho se cierra de forma segura; no queda en ejecución ninguna máquina configurada parcialmente.

### Canales de instalación

- **`bundle`** empaqueta el `dist` del Gateway en ejecución, un `package.json` reducido y cualquier paquete del espacio de trabajo al que haga referencia la compilación, todo ello cubierto por un hash de contenido. La máquina verifica el paquete intacto mediante ese hash y después instala las dependencias npm de producción (con los scripts desactivados). Así se ejecuta una compilación de desarrollo en un trabajador.
- **`npm`** comprueba que la versión publicada existe en el registro público, fija su integridad SHA-512 e instala `openclaw@<version>` de modo que coincida exactamente con el Gateway.

## Despacho de una sesión

En la interfaz de control, abra **Nueva sesión**, elija un agente cuyo entorno de ejecución configurado sea OpenClaw, seleccione un destino **Nube · perfil** configurado en el menú **Ubicación** e inicie la tarea. Al seleccionar la nube se activa automáticamente el árbol de trabajo administrado requerido; el Gateway crea la sesión, finaliza el despacho y solo entonces envía el primer turno. La insignia del servidor en la barra lateral de la sesión muestra el estado persistente de la ubicación. Los destinos en la nube no se ofrecen para catálogos de sesiones de CLI externas.

El flujo RPC equivalente es:

Cree una sesión con un árbol de trabajo administrado y, a continuación, despáchela (el RPC requiere `operator.admin` y solo existe cuando hay perfiles configurados):

Los trabajadores en la nube ejecutan el entorno de ejecución del agente de OpenClaw. Elija un `openai/*` u otro modelo que se resuelva en ese entorno de ejecución; las sesiones configuradas para un entorno de ejecución de CLI externo, como `claude-cli`, no pueden despacharse.

```bash
openclaw gateway call sessions.create \
  --params '{"key":"agent:main:big-refactor","worktree":true,"cwd":"/path/to/repo","worktreeName":"big-refactor"}'

openclaw gateway call sessions.dispatch \
  --timeout 1500000 \
  --params '{"key":"agent:main:big-refactor","profileId":"aws"}'
```

`sessions.dispatch` cierra la admisión de turnos locales, espera a que finalice el trabajo activo, aprovisiona el arrendamiento, ejecuta la preparación, inicia OpenClaw, sincroniza el espacio de trabajo y termina cuando la ubicación alcanza la propiedad del trabajador `active`. Reserve varios minutos para el primer despacho; los arrendamientos y las instalaciones se almacenan en caché cuando el proveedor lo permite. Después, interactúe con la sesión como de costumbre: los turnos se dirigen automáticamente al trabajador.

Los turnos completados del trabajador reconcilian los archivos aptos y con tamaño limitado del espacio de trabajo con el árbol de trabajo administrado de la sesión antes de liberar la asignación del turno. El evento terminal del trabajador crea una barrera persistente de resultado pendiente antes de confirmarse. A continuación, el Gateway prepara el resultado completo de la nube como una referencia de Git en `refs/openclaw/worker-results/` antes de aplicarlo, por lo que la versión de la nube puede recuperarse aunque el Gateway se detenga durante la aplicación. Los resultados del espacio de trabajo utilizan la semántica de archivos de Git: se conservan los archivos normales, los bits de ejecución, los enlaces simbólicos, las adiciones, los cambios y las eliminaciones, pero no los directorios vacíos ni otros modos de directorio. Los cambios resultantes en los archivos permanecen en el árbol de trabajo administrado para su revisión y commit habituales.

La aplicación utiliza el manifiesto del momento del despacho como base de fusión. Se aplican los cambios realizados únicamente en la nube, los cambios realizados únicamente en local permanecen intactos y las rutas modificadas en ambos lados utilizan una política de fusión de tres vías que conserva la versión local. Un turno con conflictos también finaliza: la transcripción informa del resumen limitado de rutas y de la referencia del resultado preparado, la ubicación presenta el mismo conflicto en la interfaz de control y los cambios de la nube sin conflictos permanecen aplicados. El aviso incluye `git show <ref>:<path>` para inspeccionar un archivo presente en la nube y un comando `git checkout <ref> -- <path>` de especificación literal de ruta de nivel superior para obtenerlo desde cualquier directorio del espacio de trabajo. Ejecute los comandos en Bash o zsh (Git Bash en Windows). Si la inspección indica que la ruta no existe, el resultado de la nube la eliminó; verifíquelo y elimine manualmente la ruta local conservada. Si el checkout informa de una obstrucción de archivo o directorio, mueva o elimine la ruta local que bloquea la operación y vuelva a intentarlo. Si la propia referencia preparada ya no existe, considere que el aviso está obsoleto y no modifique la ruta local. Las referencias preparadas con conflictos siguen disponibles después de liberar la barrera normal del turno; un resultado limpio posterior elimina el aviso y retira la referencia anterior, mientras que la eliminación explícita de la barrera constituye el límite final de limpieza.

Mientras un resultado protegido por una barrera sigue reconciliándose, un nuevo turno espera hasta 15 segundos a que se libere la asignación anterior. Si continúa ocupado, el turno falla con el mensaje práctico «el resultado del espacio de trabajo del turno anterior en la nube sigue reconciliándose» y puede volver a intentarse poco después. Tras un reinicio, la recuperación detecta los resultados pendientes y preparados antes de limpiar las asignaciones obsoletas, completa o vuelve a intentar su aplicación local y recupera los entornos inactivos solo después de conservar el resultado. El diario de reversión limitado de SQLite permite recuperar una aplicación interrumpida en el sistema de archivos sin repetir mutaciones ya aceptadas.

Cuando el trabajo haya finalizado y no se esté ejecutando ningún turno, abra el menú de la sesión y elija **Detener trabajador en la nube…**. El Gateway realiza una última reconciliación del espacio de trabajo antes de destruir el entorno. Una ubicación que ya se encuentre en `draining` o `reconciling` está terminando su desmantelamiento; espere a que su insignia cambie a `reclaimed` antes de eliminar la sesión.

Para un trabajador adjunto averiado o fuera de control, un operador puede llamar a `environments.destroy` con `{ "force": true }` como último recurso. El desmantelamiento forzado marca de forma persistente la ubicación como fallida y abandona cualquier resultado remoto sin reconciliar antes de destruir el entorno.

El RPC administrativo equivalente es:

```bash
openclaw gateway call sessions.reclaim \
  --timeout 600000 \
  --params '{"key":"agent:main:big-refactor"}'
```

La asignación avanza mediante una máquina de estados duradera (`local → requested → provisioning → syncing → starting → active`), por lo que, si el Gateway se reinicia durante el despacho, se realiza la reconciliación en lugar de dejar máquinas sin liberar. Un turno de modelo fallido mantiene disponible la asignación activa para volver a intentarlo. Los conflictos de rutas del espacio de trabajo conservan la versión local, aplican el resto del resultado de la nube y preservan la referencia de la nube preparada para su inspección; otros fallos de reconciliación o del ciclo de vida conservan su barrera de recuperación duradera y la cola de diagnóstico hasta que la recuperación pueda volver a intentarlo de forma segura o reclamar el entorno.

## Modelo de seguridad

- **Entrada de trabajadores cerrada.** Los trabajadores se comunican mediante un protocolo dedicado en el socket tunelizado con una lista cerrada de métodos permitidos; un trabajador no puede llamar a RPC del operador.
- **Credenciales emitidas y almacenadas como hash.** Cada despacho emite una credencial de trabajador; el Gateway almacena únicamente su hash. La rotación de credenciales y la barrera por época del propietario garantizan como máximo un propietario activo por sesión: un trabajador obsoleto que vuelve a conectarse queda bloqueado, nunca se fusiona.
- **Fijación de claves de host.** El proveedor debe proporcionar la clave de host SSH de la máquina durante el aprovisionamiento; el arranque se conecta con fijación estricta y, si no dispone de ella, falla de forma cerrada.
- **Sin credenciales permanentes del modelo, del servicio de repositorios ni de la nube en la máquina.** La autenticación del modelo permanece en el Gateway (la inferencia se transmite mediante la referencia `{provider, model}`), los commits de git del espacio de trabajo se crean sin credenciales del servicio de repositorios y los metadatos del arrendamiento de Crabbox AWS se comprueban de forma autoritativa para detectar un rol de instancia antes de la configuración. Mantenga también los comandos de configuración libres de credenciales.
- **Tráfico saliente administrado por el proveedor.** El túnel inverso elimina cualquier necesidad de OpenClaw de acceder directamente al modelo, pero OpenClaw no reescribe los cortafuegos del proveedor. Restrinja el tráfico saliente en el proveedor del trabajador cuando la tarea lo requiera.
- **Transcripciones duraderas y exactamente una vez.** El trabajador confirma lotes de transcripciones mediante un protocolo de comparación e intercambio con la hoja de la sesión; una base obsoleta detiene la ejecución en lugar de duplicar o cambiar de base la salida de pago.

## Solución de problemas

- **`sessions.dispatch` es un método desconocido** — no hay ningún `cloudWorkers.profiles` configurado o el llamador carece de `operator.admin`.
- **"Los turnos de trabajadores en la nube requieren el entorno de ejecución de OpenClaw"** — elija un modelo cuyo entorno de ejecución configurado sea OpenClaw. Los entornos de ejecución de CLI externos, como `claude-cli`, no admiten la inferencia de trabajadores.
- **"El arranque del trabajador requiere Node.js en el host arrendado"** — añada una instalación de Node a `settings.setup` (véase más arriba).
- **Falla la atestación del rol de instancia de AWS** — borre `aws.instanceProfile` (y `CRABBOX_AWS_INSTANCE_PROFILE`, si está establecido). Instale Crabbox 0.38.1 o una versión posterior; los binarios anteriores no exponen el contrato autoritativo `providerMetadata.instanceProfileAttached` requerido para la admisión de AWS.
- **El despacho falla con un error del proveedor** — el registro de asignación y `environments.list` conservan el último error, incluida la cola de stderr de la configuración o el arranque. Las máquinas se destruyen cuando se produce un fallo, por lo que esa cola constituye la principal fuente forense.
- **Tiempo de espera agotado en el cliente durante el despacho** — `openclaw gateway call` utiliza de forma predeterminada un tiempo de espera de 10s; asigne un valor generoso a `--timeout` (el despacho continúa ejecutándose en el servidor en cualquier caso, y un nuevo intento durante el aprovisionamiento se rechaza con `session cannot dispatch from placement provisioning`).
- **Aviso de conflicto del espacio de trabajo en la nube** — el turno finalizó y conservó la versión local de cada ruta indicada. Use los comandos de la referencia preparada incluidos en el aviso para inspeccionar o adoptar la versión de la nube; no es necesario volver a intentar los cambios sin conflictos, que ya se han aplicado.
- **“El resultado del espacio de trabajo del turno anterior en la nube todavía se está reconciliando”** — el Gateway esperó brevemente la barrera duradera del resultado anterior y no pudo adquirir la reclamación de la sesión. Espere a que finalice la reconciliación y vuelva a intentar el turno; reiniciar el Gateway es seguro porque la recuperación conserva los resultados preparados antes de reclamar un trabajador inactivo.
- **Mantenimiento de arrendamientos** — `crabbox list --provider <backend>` muestra los arrendamientos activos; `crabbox stop --provider <backend> --id <lease>` libera uno manualmente. Los arrendamientos inactivos caducan según el valor `idleTimeout` del perfil.

## Contenido relacionado

- [Aislamiento](/es/gateway/sandboxing) — reducción del radio de impacto de la ejecución local de herramientas
- [CLI de sesiones](/es/cli/sessions) — inspección de sesiones almacenadas
- [Referencia de configuración](/es/gateway/configuration-reference)
