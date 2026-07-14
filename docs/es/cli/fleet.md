---
read_when:
    - Aloja varios dominios de confianza de inquilinos en una sola máquina
    - Necesita crear, inspeccionar, actualizar o eliminar celdas de flota
summary: Referencia de la CLI para aprovisionar y gestionar celdas aisladas de OpenClaw por inquilino
title: Flota
x-i18n:
    generated_at: "2026-07-14T13:31:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: be589500e4715541f175caf0d5135a96baee4874e64c60c8b6f188ff1f70bc9f
    source_path: cli/fleet.md
    workflow: 16
---

# `openclaw fleet`

`openclaw fleet` administra instancias completas de OpenClaw denominadas **celdas**. Cada celda tiene su propio Gateway, estado, credenciales, cuentas de canales, contenedor y puerto de host accesible solo mediante loopback. Use una celda para cada límite de confianza entre inquilinos; no use un Gateway compartido como límite multiinquilino frente a partes hostiles.

Fleet es **experimental**. Los nombres de comandos, las opciones, los formatos de salida y el perfil del contenedor pueden cambiar entre versiones sin un periodo de obsolescencia.

Fleet admite Docker y Podman. La imagen predeterminada es `ghcr.io/openclaw/openclaw:latest`.

Fleet se prueba en hosts Linux y macOS. Actualmente no se ha probado en hosts Windows.

## Inicio rápido

```bash
openclaw fleet create acme
openclaw fleet status acme
openclaw fleet list
```

`fleet create` muestra una sola vez el token de Gateway generado junto con la URL de la celda. Guarde el token inmediatamente y, después, configure las cuentas de canales de cada inquilino dentro de la celda correspondiente.

## Identificadores de inquilino

Los identificadores de inquilino deben coincidir con:

```text
^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$
```

Esto permite entre 1 y 40 letras minúsculas, dígitos y guiones internos. Un identificador debe comenzar y terminar con una letra o un dígito. Se rechazan las letras mayúsculas, los guiones bajos, las barras, los puntos, los espacios en blanco y las cadenas de recorrido como `../acme`.

El identificador pasa a formar parte del nombre del contenedor: `openclaw-cell-<tenant>`.

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

Las claves de entorno usan letras, dígitos y guiones bajos, y no pueden comenzar con un dígito. Los valores deben ocupar una sola línea porque Fleet los pasa mediante un archivo de entorno protegido del entorno de ejecución. Fleet rechaza los intentos de sobrescribir las variables administradas de rutas del contenedor y del token de Gateway enumeradas en [Almacenamiento y disposición del contenedor](#storage-and-container-layout).

### Opciones de creación

| Opción                    | Valor predeterminado                   | Descripción                                                                                    |
| ------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `--image <ref>`           | `ghcr.io/openclaw/openclaw:latest`    | Imagen de contenedor de la celda.                                                                  |
| `--runtime <runtime>`     | `docker`                              | CLI del contenedor: `docker` o `podman`.                                                           |
| `--port <number>`         | Se asigna automáticamente desde `19100`  | Puerto de host de loopback. Un puerto seleccionado explícitamente no debe pertenecer a otra celda registrada.    |
| `--memory <value>`        | `2g`                                  | Límite de memoria del contenedor en la sintaxis de Docker/Podman.                                                |
| `--cpus <value>`          | `2`                                   | Límite de CPU del contenedor.                                                                           |
| `--disk <size>`           | Ninguno                                  | Limita la capa escribible del contenedor cuando el backend de almacenamiento admite cuotas.                     |
| `--network <mode>`        | `bridge`                              | Modo de red saliente: `bridge` o `internal`.                                                 |
| `--pids-limit <number>`   | `512`                                 | Número máximo de procesos en el contenedor.                                                  |
| `--env <KEY=VALUE>`       | Ninguno                                  | Pasa una variable de entorno a la celda. Repita la opción para proporcionar varios valores.                          |
| `--gateway-token <value>` | Token hexadecimal aleatorio de 32 caracteres | Usa un token de Gateway proporcionado en lugar de generar uno. Consulte [Gestión de tokens](#token-handling). |
| `--no-start`              | La celda se inicia                           | Crea el contenedor sin iniciarlo.                                                      |
| `--json`                  | Salida legible para personas                 | Muestra una salida legible por máquinas.                                                                 |

La asignación automática selecciona el primer puerto del registro que no esté en uso y que sea igual o superior a `19100`. Fleet rechaza los identificadores de inquilino duplicados y los puertos explícitos que ya estén asignados a otra celda.

Las referencias de imagen se pasan como un único argumento al entorno de ejecución de contenedores. Se rechazan las referencias vacías y los valores que comienzan con `-` para impedir que una imagen se interprete como una opción de Docker o Podman.

El endpoint de Docker o Podman seleccionado debe ser local. Fleet rechaza los contextos remotos de Docker, los endpoints `DOCKER_HOST` y los servicios remotos de Podman antes de reservar un puerto o crear estado local. No se admiten hosts remotos para las celdas.

Cuando Fleet inicia una celda nueva, el proceso de creación espera hasta aproximadamente un minuto a que su Gateway responda a `/healthz`. Si la celda no alcanza un estado correcto, Fleet conserva intactos su contenedor y la fila del registro para `fleet status`, `fleet logs` o su eliminación explícita. `--no-start` omite esta comprobación de estado. El token de Gateway generado para una celda nueva cuyo estado no sea correcto no se pierde: permanece en el entorno del contenedor (`docker|podman inspect`) y, como la celda todavía no ha atendido tráfico, ejecutar `fleet rm --force` seguido de una nueva creación siempre es una alternativa segura.

### Fijación mediante resumen

Los comandos de creación y actualización aceptan referencias de imagen fijadas mediante un resumen, como `--image ghcr.io/openclaw/openclaw@sha256:<digest>`. Fleet pasa literalmente la referencia de imagen a Docker o Podman, lo que permite mantener una celda en bytes de imagen inmutables en lugar de una etiqueta cambiante.

El resultado de la creación incluye el identificador del inquilino, el nombre del contenedor, el puerto del host, el token de Gateway y la URL local. Incluso en la salida JSON, trate el resultado como información secreta porque contiene el token.

### Límites de disco

`--disk` limita únicamente la capa escribible del contenedor. Los directorios de estado y autenticación de cada inquilino montados mediante bind permanecen en el almacenamiento del host; use cuotas de proyecto del sistema de archivos del host cuando esos directorios también necesiten un límite estricto.

| Entorno de ejecución/backend de almacenamiento | Compatibilidad con `--disk`                                                             |
| ----------------------- | ---------------------------------------------------------------------------- |
| Docker overlay2 sobre XFS  | Requiere la opción de montaje `pquota` de XFS.                                      |
| Docker btrfs o zfs     | Compatible mediante el controlador de almacenamiento.                                             |
| Podman overlay          | Requiere almacenamiento subyacente XFS.                                                |
| Otros backends          | La creación del contenedor falla con el error del daemon y las indicaciones de Fleet para el backend. |

### Política de salida

| Modo       | Docker                                                                                                | Podman                                                                              |
| ---------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `bridge`   | Compatible; el tráfico saliente no está restringido de forma predeterminada.                                                | Compatible; el tráfico saliente no está restringido de forma predeterminada.                              |
| `internal` | Se rechaza porque Docker no conserva el puerto de loopback publicado del Gateway en una red interna. | Compatible; el Gateway de loopback permanece publicado mientras se bloquea el tráfico saliente. |

Para Docker, mantenga el modo puente y aplique la política de tráfico saliente mediante reglas del cortafuegos del host, como la cadena `DOCKER-USER`.

## `fleet list`

Enumere las celdas ordenadas por identificador de inquilino:

```bash
openclaw fleet list
openclaw fleet ls
openclaw fleet list --json
```

La tabla contiene:

| Columna    | Significado                                                                                                                                                                                                                                                                               |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tenant`  | Identificador del inquilino.                                                                                                                                                                                                                                                                            |
| `state`   | Estado activo del contenedor obtenido mediante la inspección de Docker o Podman. `unknown` significa que el entorno de ejecución no estaba disponible o que existe un contenedor con el nombre de la celda, pero sus etiquetas de propiedad de Fleet no coinciden con el registro (señal de colisión o manipulación; inspecciónelo manualmente antes de actuar). |
| `port`    | Puerto de host de loopback asignado al Gateway de la celda.                                                                                                                                                                                                                                        |
| `image`   | Imagen de contenedor registrada.                                                                                                                                                                                                                                                             |
| `created` | Hora de creación de la celda.                                                                                                                                                                                                                                                                   |

Las filas del registro siguen visibles cuando Docker o Podman no están disponibles; solo el estado activo pasa a ser `unknown`.

## `fleet status`

Inspeccione una celda:

```bash
openclaw fleet status acme
openclaw fleet status acme --json
```

El estado combina la fila del registro de Fleet, la inspección activa del contenedor y una solicitud breve de mejor esfuerzo a:

```text
http://127.0.0.1:<host-port>/healthz
```

El resultado de la comprobación de estado es `ok`, `failed` o `skipped`. `/healthz` demuestra que el Gateway está activo, no que todos los canales o plugins configurados estén completamente preparados. La comprobación se omite cuando no hay ningún endpoint local utilizable que comprobar.

## `fleet logs`

Transmita los registros del contenedor de una celda directamente al terminal:

```bash
openclaw fleet logs acme
openclaw fleet logs acme --follow
openclaw fleet logs acme --tail 200
openclaw fleet logs acme --since 10m
```

Fleet verifica las etiquetas de propiedad del contenedor registrado antes de leer cualquier registro, por lo que rechaza un contenedor ajeno que use el nombre de celda esperado. La transmisión se fija al identificador del contenedor inspeccionado, por lo que una sustitución simultánea no puede redirigirla a una generación más reciente. Pulse Ctrl-C para finalizar `--follow` sin considerar la detención por parte del operador como un fallo del comando. La salida de registros pasa por un filtro de ocultación que sustituye el token de Gateway actual de la celda por `<redacted>` antes de que cualquier contenido llegue al terminal.

`fleet logs` no tiene un modo `--json` porque los registros del contenedor son un flujo sin procesar de stdout/stderr. Para scripts, limite la salida con `--tail` y use redirecciones o canalizaciones estándar del shell.

## `fleet start`, `fleet stop` y `fleet restart`

Controle una celda existente con su entorno de ejecución registrado:

```bash
openclaw fleet start acme
openclaw fleet stop acme
openclaw fleet restart acme
```

Estos comandos operan sobre el nombre de contenedor registrado. Fallan si el inquilino es desconocido o si el entorno de ejecución registrado no puede realizar la operación.

## `fleet upgrade`

Vuelva a descargar la imagen registrada y sustituya el contenedor de la celda:

```bash
openclaw fleet upgrade acme
```

Traslade la celda a otra imagen:

```bash
openclaw fleet upgrade acme --image ghcr.io/openclaw/openclaw:<version>
```

La actualización descarga la imagen de destino, inspecciona el contenedor existente y la red por celda, detiene y elimina el contenedor y, a continuación, vuelve a crearlo y lo inicia. El sustituto conserva el mismo puerto del host, los directorios de datos, la red puente por celda, el perfil del entorno de ejecución, los límites de recursos, la política de reinicio, el entorno administrado por Fleet y los valores proporcionados originalmente con `--env`. El estado montado sobrevive a la sustitución del contenedor; el entorno predeterminado de la imagen puede cambiar con la imagen de destino.

La sustitución solo se confirma después de que su Gateway responda a `/healthz` en el puerto de bucle invertido de la celda, de acuerdo con el contrato de estado que utiliza el archivo Compose oficial. Si un sustituto termina, entra en un bucle de fallos o no alcanza un estado correcto en aproximadamente un minuto, se elimina y se restaura el contenedor anterior, por lo que una imagen defectuosa no deja fuera de servicio una celda operativa.

El token del Gateway no se almacena intencionadamente en el registro de Fleet. Antes de eliminar el contenedor antiguo, Fleet lee su entorno y transfiere `OPENCLAW_GATEWAY_TOKEN` al sustituto. No elimine manualmente el contenedor antiguo antes de una actualización si el token no existe en ningún otro lugar bajo su control.

## `fleet backup` y `fleet restore`

Realice una copia de seguridad de una celda detenida:

```bash
openclaw fleet stop acme
openclaw fleet backup acme --out ./acme.tgz
```

Restaure ese archivo en la celda registrada:

```bash
openclaw fleet restore acme --from ./acme.tgz
```

Estos comandos requieren privilegios de operador del host. Los archivos contienen el estado del inquilino y secretos de autenticación, se crean con el modo `0600` y deben almacenarse como credenciales. La copia de seguridad rechaza una celda en ejecución para capturar el estado de SQLite de forma coherente. La restauración rechaza una celda en ejecución salvo que se proporcione `--force`, sustituye únicamente el estado de ese inquilino, rota el token del Gateway e imprime el nuevo token una sola vez. Fleet realiza la copia de seguridad de un inquilino cada vez; la copia de seguridad de todos los inquilinos es una acción de operador independiente.

La restauración necesita un contenedor detenido existente porque el perfil de entorno de ejecución obtenido mediante su inspección proporciona los límites del sustituto, la asignación de usuario, la procedencia del entorno y la imagen. Si el contenedor registrado se eliminó por otra vía, ejecute primero `fleet rm <tenant> --force` sin `--purge-data`, vuelva a crear la celda con la imagen prevista y `--no-start` y, a continuación, vuelva a intentar la restauración. La primera eliminación conserva intactos ambos directorios de datos del inquilino.

Ambos comandos aceptan `--max-bytes <bytes>` para limitar los datos de archivo archivados o extraídos, y ambos aplican el mismo límite fijo de un millón de segmentos de ruta de archivo para que los archivos maliciosos compuestos únicamente por metadatos no puedan agotar los inodos del host y para que toda copia de seguridad aceptada pueda restaurarse. La copia de seguridad acepta `--out <path>` y ambos comandos admiten `--json`.

Los archivos contienen únicamente archivos normales y directorios. La copia de seguridad nunca sigue ni almacena enlaces simbólicos, enlaces físicos, sockets ni nodos de dispositivo; los recuentos de elementos omitidos se indican en el resultado. La restauración rechaza los archivos que contengan cualquier otro tipo de entrada. Los árboles de enlaces simbólicos que pueden volver a crearse, como `node_modules` del espacio de trabajo, deben reinstalarse dentro de la celda después de una restauración.

## `fleet doctor`

Audite todas las celdas o un inquilino sin modificar el estado del entorno de ejecución ni del sistema de archivos:

```bash
openclaw fleet doctor
openclaw fleet doctor acme --json
```

Doctor comprueba la localidad del entorno de ejecución, las etiquetas de propiedad, el estado, el refuerzo de seguridad, los límites de recursos, la vinculación del puerto de bucle invertido, la presencia del token, la propiedad de la red y el modo de salida, y los permisos de los directorios de estado privados. Las advertencias describen las celdas detenidas o las diferencias de propiedad; cualquier comprobación fallida establece un código de salida del proceso distinto de cero.

## `fleet rm`

Elimine una celda detenida del entorno de ejecución y del registro, pero conserve los datos del inquilino:

```bash
openclaw fleet rm acme
```

Un contenedor en ejecución requiere `--force`:

```bash
openclaw fleet rm acme --force
```

Elimine también de forma permanente los datos de la celda:

```bash
openclaw fleet rm acme --purge-data --force
```

Fleet elimina el contenedor de la celda antes de eliminar su red puente dedicada. `--purge-data` requiere `--force`. Antes de la eliminación recursiva, Fleet resuelve las dos raíces propiedad de Fleet y los dos directorios por inquilino. Cada destino debe ser exactamente la hoja de inquilino esperada, estar estrictamente dentro de su raíz y no ser un enlace simbólico. Estas comprobaciones de contención impiden que una ruta de registro dañada o un enlace simbólico entre inquilinos redirijan la eliminación a otra ubicación.

La purga puede volver a intentarse cuando ya no existe un directorio de inquilino esperado exacto. Esto permite que una invocación posterior finalice la limpieza después de un fallo parcial del sistema de archivos sin relajar las comprobaciones de ruta para los directorios que todavía existen.

## Almacenamiento y disposición de los contenedores

El estado de la celda y las claves de cifrado del perfil de autenticación utilizan rutas del host independientes por inquilino bajo el directorio de estado activo de OpenClaw:

```text
<state-dir>/fleet/cells/<tenant>/
<state-dir>/fleet/auth-profile-secrets/<tenant>/
```

El primer directorio se monta en `/home/node/.openclaw`. El segundo se monta en `/home/node/.config/openclaw`, de acuerdo con el montaje de claves de cifrado de la configuración oficial de Docker. Por tanto, la clave de cifrado no queda expuesta bajo el montaje de estado ordinario ni se incluye cuando solo se copia o comparte el directorio de estado de la celda. Ambos directorios sobreviven a la eliminación normal y a la actualización; `fleet rm --purge-data --force` elimina ambos tras realizar comprobaciones de contención independientes.

Antes del primer inicio, Fleet inicializa la configuración de la celda con `gateway.mode=local`, autenticación mediante token, la vinculación del contenedor a la LAN y los orígenes de Control UI para el puerto de host asignado. El valor del token no se escribe en esa configuración; permanece en el entorno del contenedor.

Fleet fija las rutas de contenedor de la imagen oficial mediante estos valores de entorno:

| Variable                 | Valor del contenedor                  |
| ------------------------ | ------------------------------------ |
| `HOME`                   | `/home/node`                         |
| `OPENCLAW_HOME`          | `/home/node`                         |
| `OPENCLAW_STATE_DIR`     | `/home/node/.openclaw`               |
| `OPENCLAW_CONFIG_PATH`   | `/home/node/.openclaw/openclaw.json` |
| `OPENCLAW_WORKSPACE_DIR` | `/home/node/.openclaw/workspace`     |
| `OPENCLAW_GATEWAY_TOKEN` | Token de celda generado o proporcionado |

La imagen oficial utiliza de forma predeterminada el usuario no root `node` con UID 1000. Fleet mantiene los montajes bind privados `0700` con permisos de escritura sin hacerlos accesibles para todos. Docker con root ejecuta la celda con el UID y GID no root de quien realiza la invocación; Docker sin root utiliza el UID 0 del contenedor, que se asigna al usuario no privilegiado del host que realiza la invocación dentro del espacio de nombres de usuario del daemon. Podman utiliza `keep-id` con el UID y GID de quien realiza la invocación. Cuando Fleet se ejecuta como root con un entorno de ejecución con root, conserva el usuario de la imagen y asigna los archivos de montaje iniciales al UID/GID 1000.

En hosts SELinux, los montajes de Docker y Podman reciben un reetiquetado privado `:Z`. Si restaura o reubica los datos de una celda, mantenga las rutas montadas mediante bind con permisos de escritura para el usuario efectivo del contenedor. El perfil es compatible con la ejecución sin root, pero Docker o Podman ya deben estar configurados para funcionar sin root en el host; Fleet no convierte un daemon con root en uno sin root.

## Perfil de seguridad

Fleet aplica el siguiente perfil a cada celda:

| Control                    | Perfil aplicado                                      | Motivo                                                                                                       |
| -------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Capacidades de Linux       | `--cap-drop=ALL`                                     | El Gateway es un proceso de Node.js y no necesita capacidades adicionales de Linux.                         |
| Elevación de privilegios   | `--security-opt no-new-privileges`                   | Impide que los procesos obtengan privilegios mediante binarios setuid o setgid.                              |
| Proceso init               | `--init`                                             | Recolecta los procesos descendientes y reenvía las señales del ciclo de vida del contenedor.                 |
| Límite de procesos         | `--pids-limit 512` de forma predeterminada          | Limita el agotamiento por bifurcaciones y procesos.                                                          |
| Límite de memoria          | `--memory 2g` de forma predeterminada               | Limita el uso de memoria de la celda.                                                                        |
| Límite de CPU              | `--cpus 2` de forma predeterminada                  | Limita el uso de CPU de la celda.                                                                            |
| Disco de capa escribible   | `--disk` opcional                                    | Limita la capa del contenedor cuando el backend de almacenamiento del entorno de ejecución admite cuotas.   |
| Política de reinicio       | `--restart unless-stopped`                           | Reinicia una celda que ha fallado sin anular una detención intencionada.                                     |
| Publicación en el host     | Solo `127.0.0.1:<host-port>:18789`                   | Mantiene el Gateway fuera de las interfaces comodín del host.                                               |
| Red de la celda            | Una red puente o red interna de Podman por celda     | Separa el tráfico de IP de los contenedores y, opcionalmente, bloquea la salida de Podman.                   |
| Identidad del contenedor   | Asignación de usuario coincidente con el host        | Mantiene los montajes bind privados con permisos de escritura sin conceder acceso a todos.                   |
| Estado persistente         | Montajes por celda; sin montaje de estado compartido | Mantiene la configuración, las credenciales, las sesiones y los espacios de trabajo del inquilino en su árbol de datos. |
| Comando del contenedor     | `node dist/index.js gateway --bind lan --port 18789` | Escucha en la red del contenedor para que la asignación del puerto del host solo al bucle invertido pueda acceder a él. |

Fleet nunca monta `/var/run/docker.sock`, utiliza `--privileged` ni redes del host, ni añade capacidades. El puente por celda es un límite de separación entre celdas, no un cortafuegos de salida: las celdas conservan la salida de red necesaria para proveedores y canales. Coloque delante del puerto de bucle invertido un proxy, un túnel SSH o una configuración de tailnet que se ajuste a su despliegue. `http://127.0.0.1:<port>` solo es accesible directamente desde el host de Fleet.

Este perfil separa los contenedores de los inquilinos, pero no protege a los inquilinos del operador de Fleet, del administrador del entorno de ejecución de contenedores ni de un host comprometido. Consulte [Alojamiento multiinquilino](/es/gateway/multi-tenant-hosting) para conocer el modelo de confianza completo y las opciones de aislamiento más estrictas.

## Gestión de tokens

De forma predeterminada, `fleet create` genera un token del Gateway hexadecimal, criptográficamente aleatorio, de 32 caracteres y lo imprime una sola vez en el resultado de creación. Almacénelo en el gestor de secretos aprobado y evite capturar la salida de creación en los registros.

`--gateway-token` coloca un token personalizado en los argumentos del proceso local, que pueden conservarse en el historial del shell o ser visibles en las listas de procesos. Prefiera el token generado salvo que un flujo de gestión de secretos existente requiera un valor proporcionado.

El token y todos los valores pasados mediante `--env` residen en el entorno del contenedor. Fleet los escribe en un archivo de entorno de corta duración con modo `0600`, pasa únicamente la ruta de ese archivo a Docker o Podman y lo elimina cuando finaliza el comando del entorno de ejecución. Los valores escritos explícitamente en `openclaw fleet create --gateway-token ...` o `--env KEY=VALUE` aún pueden ser visibles en los argumentos del proceso externo `openclaw` y en el historial del shell.

Los valores de entorno del contenedor no están ocultos para el operador de confianza del host: los administradores de Docker o Podman pueden leerlos mediante la inspección del contenedor. La indicación «se muestra una sola vez» de Fleet describe la salida normal de la CLI, no la resistencia frente a un administrador del host.

## Contenido relacionado

- [Alojamiento multiinquilino](/es/gateway/multi-tenant-hosting)
- [Docker](/es/install/docker)
- [Podman](/es/install/podman)
- [Seguridad del Gateway](/es/gateway/security)
