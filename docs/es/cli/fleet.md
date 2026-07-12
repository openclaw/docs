---
read_when:
    - Aloja varios dominios de confianza de inquilinos en una sola máquina
    - Necesita crear, inspeccionar, actualizar o eliminar celdas de flota
summary: Referencia de la CLI para aprovisionar y gestionar celdas aisladas de OpenClaw por inquilino
title: Flota
x-i18n:
    generated_at: "2026-07-12T14:22:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 1160c1242073f506c2a2f98481f4ec933a073fd3da0bc20c4cee3e146a38e293
    source_path: cli/fleet.md
    workflow: 16
---

# `openclaw fleet`

`openclaw fleet` administra instancias completas de OpenClaw denominadas **celdas**. Cada celda tiene su propio Gateway, estado, credenciales, cuentas de canales, contenedor y puerto de host accesible solo mediante la interfaz de bucle invertido. Use una celda para cada límite de confianza entre inquilinos; no use un Gateway compartido como límite multiinquilino frente a inquilinos hostiles.

Fleet es **experimental**. Los nombres de los comandos, las opciones, los formatos de salida y el perfil del contenedor pueden cambiar entre versiones sin un período de obsolescencia mientras se estabiliza la interfaz.

Fleet admite Docker y Podman. La imagen predeterminada es `ghcr.io/openclaw/openclaw:latest`.

Fleet se prueba en hosts Linux y macOS. Actualmente no se ha probado en hosts Windows.

## Inicio rápido

```bash
openclaw fleet create acme
openclaw fleet status acme
openclaw fleet list
```

`fleet create` muestra una sola vez el token de Gateway generado junto con la URL de la celda. Guarde el token inmediatamente y, a continuación, configure las cuentas de canales de cada inquilino dentro de la celda de ese inquilino.

## ID de inquilinos

Los ID de inquilinos deben coincidir con:

```text
^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$
```

Esto permite entre 1 y 40 letras minúsculas, dígitos y guiones internos. Un ID debe comenzar y terminar con una letra o un dígito. Se rechazan las letras mayúsculas, los guiones bajos, las barras, los puntos, los espacios en blanco y las cadenas de recorrido de rutas como `../acme`.

El ID pasa a formar parte del nombre del contenedor: `openclaw-cell-<tenant>`.

## `fleet create`

Cree una celda e iníciela:

```bash
openclaw fleet create acme
```

Cree una celda de Podman en un puerto fijo sin iniciarla:

```bash
openclaw fleet create acme \
  --runtime podman \
  --port 19125 \
  --no-start
```

Pase variables de entorno específicas del inquilino repitiendo `--env`:

```bash
openclaw fleet create acme \
  --env TZ=America/Los_Angeles \
  --env OPENCLAW_DISABLE_BONJOUR=1
```

Las claves de entorno usan letras, dígitos y guiones bajos, y no pueden comenzar con un dígito. Los valores deben ocupar una sola línea porque Fleet los pasa mediante un archivo protegido de entorno del runtime. Fleet rechaza los intentos de sobrescribir las variables administradas de rutas del contenedor y del token de Gateway enumeradas en [Almacenamiento y disposición del contenedor](#storage-and-container-layout).

### Opciones de creación

| Opción                    | Valor predeterminado                  | Descripción                                                                                    |
| ------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `--image <ref>`           | `ghcr.io/openclaw/openclaw:latest`    | Imagen del contenedor de la celda.                                                             |
| `--runtime <runtime>`     | `docker`                              | CLI del contenedor: `docker` o `podman`.                                                       |
| `--port <number>`         | Se asigna automáticamente desde `19100` | Puerto del host en la interfaz de bucle invertido. Un puerto seleccionado explícitamente no debe pertenecer a otra celda registrada. |
| `--memory <value>`        | `2g`                                  | Límite de memoria del contenedor en la sintaxis de Docker/Podman.                              |
| `--cpus <value>`          | `2`                                   | Límite de CPU del contenedor.                                                                  |
| `--disk <size>`           | Ninguno                               | Limita la capa escribible del contenedor cuando el backend de almacenamiento admite cuotas.   |
| `--network <mode>`        | `bridge`                              | Modo de red saliente: `bridge` o `internal`.                                                   |
| `--pids-limit <number>`   | `512`                                 | Número máximo de procesos en el contenedor.                                                    |
| `--env <KEY=VALUE>`       | Ninguno                               | Pasa una variable de entorno a la celda. Repita la opción para especificar varios valores.     |
| `--gateway-token <value>` | Token hexadecimal aleatorio de 32 caracteres | Usa un token de Gateway proporcionado en lugar de generar uno. Consulte [Administración de tokens](#token-handling). |
| `--no-start`              | La celda se inicia                    | Crea el contenedor sin iniciarlo.                                                              |
| `--json`                  | Salida legible para personas          | Muestra una salida legible por máquinas.                                                       |

La asignación automática selecciona el primer puerto del registro que no esté en uso a partir de `19100`. Fleet rechaza los ID de inquilinos duplicados y los puertos explícitos que ya estén asignados a otra celda.

Las referencias de imágenes se pasan como un único argumento al runtime de contenedores. Se rechazan las referencias vacías y los valores que comienzan por `-` para impedir que una imagen se interprete como una opción de Docker o Podman.

El endpoint de Docker o Podman seleccionado debe ser local. Fleet rechaza los contextos remotos de Docker, los endpoints de `DOCKER_HOST` y los servicios remotos de Podman antes de reservar un puerto o crear estado local; los hosts de celdas remotos necesitan un contrato independiente de almacenamiento y endpoints, y quedan fuera de este MVP.

Cuando Fleet inicia una celda nueva, el proceso de creación espera hasta aproximadamente un minuto a que su Gateway responda a `/healthz`. Si la celda no alcanza un estado correcto, Fleet conserva intactos su contenedor y su fila del registro para `fleet status`, `fleet logs` o una eliminación explícita. `--no-start` omite esta comprobación de estado. El token de Gateway generado de una celda nueva con estado incorrecto no se pierde: permanece en el entorno del contenedor (`docker|podman inspect`) y, dado que la celda todavía no ha atendido tráfico, ejecutar `fleet rm --force` y después crearla de nuevo siempre es una alternativa segura.

### Fijación mediante resumen

Los comandos de creación y actualización aceptan referencias de imágenes fijadas mediante un resumen, como `--image ghcr.io/openclaw/openclaw@sha256:<digest>`. Fleet pasa literalmente la referencia de la imagen a Docker o Podman, lo que permite al operador mantener una celda en bytes de imagen inmutables en lugar de usar una etiqueta cambiante.

El resultado de la creación incluye el ID del inquilino, el nombre del contenedor, el puerto del host, el token de Gateway y la URL local. Incluso en la salida JSON, trate el resultado como información secreta porque contiene el token.

### Límites de disco

`--disk` limita únicamente la capa escribible del contenedor. Los directorios de estado y autenticación de cada inquilino montados mediante bind siguen usando el almacenamiento del host; use cuotas de proyecto del sistema de archivos del host cuando esos directorios también necesiten un límite estricto.

| Backend de runtime/almacenamiento | Compatibilidad con `--disk`                                                |
| --------------------------------- | -------------------------------------------------------------------------- |
| Docker overlay2 sobre XFS         | Requiere la opción de montaje `pquota` de XFS.                             |
| Docker btrfs o zfs                | Compatible mediante el controlador de almacenamiento.                     |
| Podman overlay                    | Requiere almacenamiento subyacente XFS.                                    |
| Otros backends                    | La creación del contenedor falla con el error del daemon y las indicaciones de Fleet para el backend. |

### Política de tráfico saliente

| Modo       | Docker                                                                                                | Podman                                                                              |
| ---------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `bridge`   | Compatible; el tráfico saliente no está restringido de forma predeterminada.                         | Compatible; el tráfico saliente no está restringido de forma predeterminada.       |
| `internal` | Se rechaza porque Docker no conserva el puerto publicado del Gateway en la interfaz de bucle invertido dentro de una red interna. | Compatible; el Gateway en la interfaz de bucle invertido permanece publicado mientras se bloquea el tráfico saliente. |

Para Docker, mantenga el modo bridge y aplique la política de tráfico saliente mediante reglas del firewall del host, como la cadena `DOCKER-USER`.

## `fleet list`

Enumere las celdas en orden de ID de inquilino:

```bash
openclaw fleet list
openclaw fleet ls
openclaw fleet list --json
```

La tabla contiene:

| Columna   | Significado                                                                                                                                                                                                                                                                               |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tenant`  | ID del inquilino.                                                                                                                                                                                                                                                                         |
| `state`   | Estado activo del contenedor obtenido mediante la inspección de Docker o Podman. `unknown` significa que el runtime no estaba disponible o que existe un contenedor con el nombre de la celda, pero sus etiquetas de propiedad de Fleet no coinciden con el registro (una señal de colisión o manipulación; inspecciónelo manualmente antes de actuar). |
| `port`    | Puerto del host en la interfaz de bucle invertido asignado al Gateway de la celda.                                                                                                                                                                                                         |
| `image`   | Imagen del contenedor registrada.                                                                                                                                                                                                                                                          |
| `created` | Hora de creación de la celda.                                                                                                                                                                                                                                                              |

Las filas del registro siguen visibles cuando Docker o Podman no están disponibles; solo el estado activo pasa a ser `unknown`.

## `fleet status`

Inspeccione una celda:

```bash
openclaw fleet status acme
openclaw fleet status acme --json
```

El estado combina la fila del registro de Fleet, la inspección activa del contenedor y una breve solicitud de mejor esfuerzo a:

```text
http://127.0.0.1:<host-port>/healthz
```

El resultado de la comprobación de estado es `ok`, `failed` o `skipped`. `/healthz` demuestra que el Gateway está activo, no que todos los canales o Plugin configurados estén totalmente listos. La comprobación se omite cuando no hay ningún endpoint local utilizable que comprobar.

## `fleet logs`

Transmita los registros del contenedor de una celda directamente al terminal:

```bash
openclaw fleet logs acme
openclaw fleet logs acme --follow
openclaw fleet logs acme --tail 200
openclaw fleet logs acme --since 10m
```

Fleet verifica las etiquetas de propiedad del contenedor registrado antes de leer cualquier registro, por lo que rechaza un contenedor ajeno que use el nombre de celda esperado. Presione Ctrl-C para finalizar `--follow` sin tratar la interrupción del operador como un fallo del comando. La salida de los registros pasa por un filtro de ocultación que sustituye el token de Gateway actual de la celda por `<redacted>` antes de que cualquier contenido llegue al terminal.

`fleet logs` no tiene un modo `--json` porque los registros del contenedor son un flujo sin procesar de stdout/stderr. Para scripts, limite la salida con `--tail` y use redirecciones o canalizaciones normales del shell.

## `fleet start`, `fleet stop` y `fleet restart`

Controle una celda existente con su runtime registrado:

```bash
openclaw fleet start acme
openclaw fleet stop acme
openclaw fleet restart acme
```

Estos comandos operan sobre el nombre de contenedor registrado. Fallan si el inquilino es desconocido o si el runtime registrado no puede realizar la operación.

## `fleet upgrade`

Vuelva a descargar la imagen registrada y sustituya el contenedor de la celda:

```bash
openclaw fleet upgrade acme
```

Mueva la celda a otra imagen:

```bash
openclaw fleet upgrade acme --image ghcr.io/openclaw/openclaw:<version>
```

La actualización descarga la imagen de destino, inspecciona el contenedor existente y la red de cada celda, detiene y elimina el contenedor y, a continuación, lo vuelve a crear y lo inicia. El reemplazo conserva el mismo puerto del host, los directorios de datos, la red puente de cada celda, el perfil de ejecución, los límites de recursos, la política de reinicio, el entorno gestionado por Fleet y los valores proporcionados originalmente mediante `--env`. El estado montado sobrevive al reemplazo del contenedor; el entorno predeterminado de la imagen puede cambiar con la imagen de destino.

El reemplazo solo se confirma después de que su Gateway responda a `/healthz` en el puerto de bucle invertido de la celda, de acuerdo con el contrato de estado que utiliza el archivo Compose oficial. Si un reemplazo finaliza, entra en un bucle de fallos o no alcanza un estado correcto en aproximadamente un minuto, se elimina y se restaura el contenedor anterior, de modo que una imagen defectuosa no deje fuera de servicio una celda operativa.

El token del Gateway no se almacena intencionadamente en el registro de Fleet. Antes de eliminar el contenedor anterior, Fleet lee su entorno y transfiere `OPENCLAW_GATEWAY_TOKEN` al reemplazo. No elimine manualmente el contenedor anterior antes de una actualización si el token no existe en ningún otro lugar bajo su control.

## `fleet backup` y `fleet restore`

Cree una copia de seguridad de una celda detenida:

```bash
openclaw fleet stop acme
openclaw fleet backup acme --out ./acme.tgz
```

Restaure ese archivo en la celda registrada:

```bash
openclaw fleet restore acme --from ./acme.tgz
```

Estos comandos requieren privilegios de operador del host. Los archivos contienen el estado del inquilino y secretos de autenticación, se crean con el modo `0600` y deben almacenarse como credenciales. La copia de seguridad rechaza una celda en ejecución para que el estado de SQLite se capture de forma coherente. La restauración rechaza una celda en ejecución salvo que se proporcione `--force`, reemplaza únicamente el estado de ese inquilino, rota el token del Gateway e imprime una sola vez el token nuevo. Fleet crea la copia de seguridad de un inquilino a la vez; la copia de seguridad de todos los inquilinos es una acción independiente del operador.

Ambos comandos aceptan `--max-bytes <bytes>` para limitar los datos de archivos archivados o extraídos, y ambos aplican el mismo límite fijo de un millón de segmentos de ruta del archivo, de modo que los archivos maliciosos compuestos únicamente por metadatos no puedan agotar los inodos del host y que toda copia de seguridad aceptada pueda restaurarse. La copia de seguridad acepta `--out <path>` y ambos comandos admiten `--json`.

Los archivos solo contienen archivos normales y directorios. La copia de seguridad nunca sigue ni almacena enlaces simbólicos, enlaces físicos, sockets ni nodos de dispositivo; el resultado informa de las cantidades omitidas. La restauración rechaza los archivos que contengan cualquier otro tipo de entrada. Los árboles de enlaces simbólicos que pueden volver a crearse, como `node_modules` del espacio de trabajo, deben reinstalarse dentro de la celda después de una restauración.

## `fleet doctor`

Audite todas las celdas o un inquilino sin modificar el estado de ejecución ni del sistema de archivos:

```bash
openclaw fleet doctor
openclaw fleet doctor acme --json
```

Doctor comprueba la localidad del entorno de ejecución, las etiquetas de propiedad, el estado, el endurecimiento, los límites de recursos, la vinculación del puerto de bucle invertido, la presencia del token, la propiedad de la red y el modo de salida, así como los permisos de los directorios de estado privados. Las advertencias describen las celdas detenidas o las diferencias de propiedad; cualquier comprobación fallida establece un código de salida del proceso distinto de cero.

## `fleet rm`

Elimine una celda detenida del entorno de ejecución y del registro, pero conserve los datos del inquilino:

```bash
openclaw fleet rm acme
```

Un contenedor en ejecución requiere `--force`:

```bash
openclaw fleet rm acme --force
```

Elimine también permanentemente los datos de la celda:

```bash
openclaw fleet rm acme --purge-data --force
```

Fleet elimina el contenedor de la celda antes de eliminar su red puente dedicada. `--purge-data` requiere `--force`. Antes de la eliminación recursiva, Fleet resuelve las dos raíces propiedad de Fleet y los dos directorios de cada inquilino. Cada destino debe ser exactamente el directorio final esperado del inquilino, estar estrictamente dentro de su raíz y no ser un enlace simbólico. Estas comprobaciones de contención impiden que una ruta corrupta del registro o un enlace simbólico entre inquilinos redirijan la eliminación a otra ubicación.

La purga puede volver a intentarse cuando un directorio exacto esperado del inquilino ya no existe. Esto permite que una invocación posterior termine la limpieza tras un fallo parcial del sistema de archivos sin relajar las comprobaciones de ruta para los directorios que todavía existen.

## Almacenamiento y disposición de los contenedores

El estado de las celdas y las claves de cifrado de los perfiles de autenticación utilizan rutas independientes por inquilino en el host, bajo el directorio de estado activo de OpenClaw:

```text
<state-dir>/fleet/cells/<tenant>/
<state-dir>/fleet/auth-profile-secrets/<tenant>/
```

El primer directorio se monta en `/home/node/.openclaw`. El segundo se monta en `/home/node/.config/openclaw`, de acuerdo con el montaje de claves de cifrado de la configuración oficial de Docker. Por lo tanto, la clave de cifrado no queda expuesta bajo el montaje de estado ordinario ni se incluye cuando solo se crea una copia de seguridad o se comparte el directorio de estado de la celda. Ambos directorios sobreviven a la eliminación y actualización normales; `fleet rm --purge-data --force` elimina ambos después de comprobaciones de contención independientes.

Antes del primer inicio, Fleet inicializa la configuración de la celda con `gateway.mode=local`, autenticación mediante token, la vinculación LAN del contenedor y los orígenes de la interfaz de control para el puerto asignado del host. El valor del token no se escribe en esa configuración; permanece en el entorno del contenedor.

Fleet fija las rutas del contenedor de la imagen oficial mediante estos valores de entorno:

| Variable                 | Valor del contenedor                 |
| ------------------------ | ------------------------------------ |
| `HOME`                   | `/home/node`                         |
| `OPENCLAW_HOME`          | `/home/node`                         |
| `OPENCLAW_STATE_DIR`     | `/home/node/.openclaw`               |
| `OPENCLAW_CONFIG_PATH`   | `/home/node/.openclaw/openclaw.json` |
| `OPENCLAW_WORKSPACE_DIR` | `/home/node/.openclaw/workspace`     |
| `OPENCLAW_GATEWAY_TOKEN` | Token de celda generado o suministrado |

La imagen oficial utiliza de forma predeterminada el usuario `node` sin privilegios de raíz, con UID 1000. Fleet mantiene los montajes vinculados privados con permisos `0700` modificables sin hacerlos accesibles para todos. Docker con privilegios de raíz ejecuta la celda con el UID y GID sin privilegios de raíz del usuario que realiza la invocación; Docker sin privilegios de raíz utiliza el UID 0 del contenedor, que se asigna al usuario sin privilegios del host que realiza la invocación dentro del espacio de nombres de usuario del daemon. Podman utiliza `keep-id` con el UID y GID del usuario que realiza la invocación. Cuando el propio Fleet se ejecuta como raíz con un entorno de ejecución con privilegios de raíz, conserva el usuario de la imagen y asigna los archivos iniciales del montaje al UID/GID 1000.

En hosts con SELinux, los montajes de Docker y Podman reciben un reetiquetado privado `:Z`. Si restaura o reubica los datos de una celda, mantenga las rutas de montaje vinculado modificables por el usuario efectivo del contenedor. El perfil es compatible con la ejecución sin privilegios de raíz, pero Docker o Podman ya deben estar configurados para ejecutarse sin privilegios de raíz en el host; Fleet no convierte un daemon con privilegios de raíz en uno sin ellos.

## Perfil de seguridad

Fleet aplica el siguiente perfil a cada celda:

| Control                  | Perfil aplicado                                      | Motivo                                                                                                                  |
| ------------------------ | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Capacidades de Linux     | `--cap-drop=ALL`                                     | El Gateway es un proceso de Node.js y no necesita capacidades adicionales de Linux.                                    |
| Elevación de privilegios | `--security-opt no-new-privileges`                   | Impide que los procesos obtengan privilegios mediante binarios setuid o setgid.                                         |
| Proceso de inicio        | `--init`                                             | Recolecta los procesos descendientes y reenvía las señales del ciclo de vida del contenedor.                            |
| Límite de procesos       | `--pids-limit 512` de forma predeterminada           | Limita el agotamiento por bifurcaciones y procesos.                                                                     |
| Límite de memoria        | `--memory 2g` de forma predeterminada                | Limita el uso de memoria de la celda.                                                                                   |
| Límite de CPU            | `--cpus 2` de forma predeterminada                   | Limita el uso de CPU de la celda.                                                                                       |
| Disco de capa escribible | `--disk` opcional                                    | Limita la capa del contenedor cuando el backend de almacenamiento del entorno de ejecución admite cuotas.               |
| Política de reinicio     | `--restart unless-stopped`                           | Reinicia una celda que ha fallado sin anular una detención intencionada.                                                |
| Publicación en el host   | Solo `127.0.0.1:<host-port>:18789`                   | Mantiene el Gateway fuera de las interfaces comodín del host.                                                           |
| Red de la celda          | Una red puente o interna de Podman por celda         | Separa el tráfico de IP de los contenedores y, opcionalmente, bloquea el tráfico saliente de Podman.                     |
| Identidad del contenedor | Asignación de usuario coincidente con el host        | Mantiene los montajes vinculados privados modificables sin conceder acceso general.                                     |
| Estado persistente       | Montajes por celda; sin montaje de estado compartido | Mantiene la configuración, las credenciales, las sesiones y los espacios de trabajo del inquilino en su árbol de datos. |
| Comando del contenedor   | `node dist/index.js gateway --bind lan --port 18789` | Escucha en la red del contenedor para que la asignación del puerto del host solo al bucle invertido pueda alcanzarlo.    |

Fleet nunca monta `/var/run/docker.sock`, utiliza `--privileged` ni las redes del host, ni añade capacidades. El puente de cada celda es un límite de separación entre celdas, no un cortafuegos de salida: las celdas conservan el acceso de red saliente necesario para proveedores y canales. Coloque delante del puerto de bucle invertido un proxy, un túnel SSH o una configuración de tailnet que se ajuste a su implementación. Solo se puede acceder directamente a `http://127.0.0.1:<port>` desde el host de Fleet.

Este perfil separa los contenedores de los inquilinos, pero no protege a los inquilinos del operador de Fleet, del administrador del entorno de ejecución de contenedores ni de un host comprometido. Consulte [Alojamiento multiinquilino](/gateway/multi-tenant-hosting) para conocer el modelo de confianza completo y opciones de aislamiento más estrictas.

## Gestión de tokens

De forma predeterminada, `fleet create` genera un token del Gateway hexadecimal y criptográficamente aleatorio de 32 caracteres y lo imprime una sola vez en el resultado de creación. Guárdelo en su gestor de secretos aprobado y evite registrar la salida de creación en los registros.

`--gateway-token` coloca un token personalizado en los argumentos del proceso local, que pueden conservarse en el historial del shell o ser visibles en las listas de procesos. Prefiera el token generado salvo que un flujo de trabajo existente de gestión de secretos requiera un valor suministrado.

El token y todos los valores proporcionados mediante `--env` residen en el entorno del contenedor. Fleet los escribe en un archivo de entorno de corta duración con modo `0600`, pasa únicamente la ruta de ese archivo a Docker o Podman y lo elimina después de que finalice el comando del entorno de ejecución. Los valores escritos explícitamente en `openclaw fleet create --gateway-token ...` o `--env KEY=VALUE` pueden seguir siendo visibles en los argumentos del proceso externo `openclaw` y en el historial del shell.

Los valores del entorno del contenedor no se ocultan al operador de confianza del host: los administradores de Docker o Podman pueden leerlos mediante la inspección del contenedor. La indicación de Fleet de que se «muestra una vez» describe la salida normal de la CLI, no la protección frente a un administrador del host.

## Contenido relacionado

- [Alojamiento multiinquilino](/gateway/multi-tenant-hosting)
- [Docker](/es/install/docker)
- [Podman](/es/install/podman)
- [Seguridad del Gateway](/es/gateway/security)
