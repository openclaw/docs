---
read_when:
    - Aloja OpenClaw para varios usuarios u organizaciones
    - Debe elegir un límite de aislamiento para las cargas de trabajo de los inquilinos
summary: Aloja varios dominios de confianza de inquilinos como una celda de Gateway de OpenClaw aislada por inquilino
title: Alojamiento multiinquilino
x-i18n:
    generated_at: "2026-07-12T14:34:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 5ffb873c7b9e7e463d932ad35eb009c34218447a051ac065c151ba57dc71b799
    source_path: gateway/multi-tenant-hosting.md
    workflow: 16
---

# Alojamiento multiinquilino

El modelo de seguridad predeterminado de OpenClaw establece un límite de operador de confianza por Gateway, no un aislamiento multiinquilino frente a actores hostiles dentro de un Gateway compartido. Por lo tanto, alojar usuarios u organizaciones que no comparten un límite de confianza implica ejecutar una instancia completa e independiente de OpenClaw para cada inquilino.

`openclaw fleet` denomina **celda** a cada instancia aislada. Una celda es un Gateway completo dentro de un contenedor reforzado, con su propio estado, credenciales, espacio de trabajo, cuentas de canales, token y puerto de host accesible únicamente mediante la interfaz de bucle invertido.

Fleet es **experimental**: sus comandos, opciones y perfil de contenedor pueden cambiar entre versiones sin un periodo de obsolescencia mientras se estabiliza la interfaz.

Fleet se prueba en hosts Linux y macOS. Actualmente no se ha probado en hosts Windows.

## Por qué cada inquilino necesita una celda

Un operador autenticado dentro de un Gateway desempeña una función de confianza en el plano de control. Los ID de sesión seleccionan el enrutamiento; no autorizan a un inquilino frente a otro. El aislamiento de agentes puede reducir el efecto del contenido no confiable y de la ejecución de herramientas, pero no convierte un Gateway compartido en un límite de autorización entre inquilinos.

Utilice una celda por inquilino para que cada dominio de confianza tenga un proceso de Gateway, un contenedor, un árbol de estado persistente y una credencial de Gateway independientes. Esto sigue el [modelo de seguridad del Gateway](/es/gateway/security): no aloje conjuntamente usuarios que no confíen entre sí en un mismo proceso de OpenClaw ni bajo un mismo usuario del sistema operativo.

## Arquitectura

La CLI de Fleet es un supervisor del ciclo de vida que se ejecuta en el host. Registra las celdas en la base de datos de estado de OpenClaw y solicita a un entorno de ejecución local de Docker o Podman que cree, inspeccione, inicie, detenga, sustituya y elimine sus contenedores. Los endpoints de entornos de ejecución remotos se rechazan porque las rutas de montaje y las URL de bucle invertido de Fleet pertenecen al host local; los hosts de celdas remotos se posponen hasta que dispongan de un contrato explícito de almacenamiento y endpoints. Fleet no actúa como proxy de los mensajes de los inquilinos ni añade una ruta de datos compartida en el nivel de la aplicación entre las celdas.

Cada celda ejecuta la imagen oficial `ghcr.io/openclaw/openclaw` en su propia red puente definida por el usuario. Los puentes independientes impiden el tráfico directo entre las IP de los contenedores de distintas celdas, a la vez que conservan el acceso NAT saliente para proveedores y canales. El tráfico saliente no está restringido de forma predeterminada. Las celdas de Podman pueden usar `--network internal` para bloquear el tráfico saliente y conservar el puerto de Gateway publicado en la interfaz de bucle invertido. Las redes internas de Docker impiden que ese puerto publicado funcione, por lo que Fleet rechaza esta combinación; en su lugar, aplique la política de tráfico saliente de Docker mediante reglas del cortafuegos del host, como la cadena `DOCKER-USER`. El Gateway de la celda escucha en el puerto `18789` dentro del contenedor, mientras que el entorno de ejecución solo lo publica en `127.0.0.1:<allocated-port>` en el host. Cuando se necesita acceso remoto, un operador puede colocar un proxy inverso aprobado, un túnel SSH o una red privada de Tailscale delante de ese endpoint de bucle invertido.

El estado persistente del Gateway procede de `<state-dir>/fleet/cells/<tenant>/` y se monta en `/home/node/.openclaw`. Las claves de cifrado de los perfiles de autenticación proceden de la ruta independiente del host `<state-dir>/fleet/auth-profile-secrets/<tenant>/` y se montan en `/home/node/.config/openclaw`, de acuerdo con la [disposición oficial de persistencia de Docker](/es/install/docker#storage-and-persistence). La clave no se encuentra anidada bajo el montaje de estado ordinario. Las cuentas de canales de cada inquilino finalizan dentro de la celda que las posee, por lo que no existe ninguna cuenta de canal compartida ni ningún enrutador compartido de mensajes entrantes en el MVP de Fleet.

La imagen oficial utiliza de forma predeterminada el usuario `node` sin privilegios de root, con el UID 1000. Fleet utiliza asignaciones de usuarios compatibles con el host para que los montajes privados permanezcan accesibles para escritura: Podman utiliza `keep-id`, Docker con privilegios de root utiliza la identidad sin privilegios de root de quien ejecuta el comando y Docker sin privilegios de root asigna el usuario root del contenedor al usuario sin privilegios del daemon. Docker y Podman aplican un reetiquetado privado `:Z` cuando SELinux está activo en el host. El perfil del contenedor evita funciones privilegiadas del host y es compatible con entornos sin privilegios de root, pero este tipo de ejecución es una elección y un requisito previo del entorno de ejecución del host, no algo que Fleet habilite automáticamente.

## Límite de confianza

La arquitectura multiinquilino protege a los inquilinos entre sí. Todos los inquilinos confían en el operador de Fleet y en el host. La resistencia frente a un host comprometido no es un objetivo.

Esto significa que un administrador del host puede inspeccionar la configuración y el entorno de los contenedores, leer los datos montados de las celdas, sustituir imágenes o acceder a los contenedores. Los tokens del Gateway y los valores proporcionados mediante `--env` son visibles para un administrador al inspeccionar Docker o Podman. Por lo tanto, utilice controles del host, una política de acceso administrativo, supervisión, copias de seguridad y un gestor de secretos aprobado.

La configuración de referencia evita la exposición accidental mediante interfaces de red comodín y elimina mecanismos habituales de escalada de privilegios en contenedores, pero no hace seguro un host que no sea de confianza.

## Niveles de aislamiento

Elija el límite que corresponda a los inquilinos que aloja:

1. **Configuración de referencia de contenedor reforzado.** Fleet elimina todas las capacidades de Linux, habilita `no-new-privileges`, aplica límites de PID, memoria, CPU y, opcionalmente, de disco para la capa escribible, utiliza montajes persistentes y redes independientes para cada celda y solo publica en la interfaz de bucle invertido del host. Las redes puente no restringen el tráfico saliente; utilice `--network internal` de Podman o una política de cortafuegos del host para Docker cuando una celda no deba iniciar conexiones salientes. Este es el perfil MVP para inquilinos que confían en el operador y en el host.
2. **Aislamiento más estricto mediante contenedores o máquinas virtuales.** Para cargas de trabajo de mayor riesgo, configure Docker o Podman para utilizar un entorno de ejecución de aislamiento OCI más estricto, como gVisor o Kata Containers, o coloque las celdas en micromáquinas virtuales. Esta es una configuración del entorno de ejecución o de la infraestructura; la opción `--runtime docker|podman` de Fleet elige la CLI del contenedor, no el backend de aislamiento OCI. Consulte los [entornos de ejecución de contenedores alternativos](https://docs.docker.com/engine/daemon/alternative-runtimes/) de Docker y la [guía del entorno de ejecución de máquinas virtuales de Docker](/es/install/docker-vm-runtime).
3. **Máquinas independientes para inquilinos hostiles.** No aloje conjuntamente inquilinos hostiles en un mismo proceso de OpenClaw ni bajo un mismo usuario del sistema operativo. Cuando los inquilinos no confíen en el mismo operador del host o necesiten un límite administrativo más estricto, utilice máquinas virtuales o hosts físicos independientes con una administración separada del entorno de ejecución.

Ningún nivel de esta escala cambia el modelo de confianza de la aplicación OpenClaw: un Gateway sigue siendo un único dominio de operador de confianza.

## Inicio rápido

Cree una celda. El comando muestra una sola vez un token de Gateway generado, por lo que debe guardarlo inmediatamente:

```bash
openclaw fleet create acme
```

Abra la URL `http://127.0.0.1:<port>` indicada en el host de Fleet, autentíquese con el token de ese inquilino y configure las credenciales de los proveedores y las cuentas de canales dentro de la celda.

Compruebe el estado del contenedor y la disponibilidad del Gateway:

```bash
openclaw fleet status acme
```

Actualice la celda conservando el puerto del host, los datos montados, el perfil de recursos, el entorno proporcionado por el usuario y el token del Gateway:

```bash
openclaw fleet upgrade acme
```

Elimine el contenedor y la fila del registro, pero conserve los datos del inquilino:

```bash
openclaw fleet rm acme --force
```

Para eliminar también los datos persistentes del inquilino, añada `--purge-data`. La purga requiere `--force`, es irreversible y realiza una comprobación de contención de la ruta resuelta antes de eliminar cualquier elemento:

```bash
openclaw fleet rm acme --purge-data --force
```

Consulte la [referencia de la CLI de `openclaw fleet`](/cli/fleet) para conocer todos los comandos y opciones.

## Funcionalidades pospuestas para después del MVP

La primera versión de Fleet deja deliberadamente estas funcionalidades para diseños posteriores:

- Cuentas de canales compartidas o un enrutador compartido de tráfico entrante
- Procesos de host simplificados para cada inquilino en lugar de instancias completas de OpenClaw
- Hosts de celdas remotos administrados por un único supervisor
- Un portal de autoservicio para inquilinos, un plano de facturación o una interfaz de administración delegada

Estas funciones necesitan contratos explícitos de identidad, enrutamiento, autorización y dominios de fallo. No deben aproximarse compartiendo un Gateway o sus credenciales entre inquilinos. Tampoco pertenecen al ámbito de Fleet: Fleet sigue siendo un supervisor del ciclo de vida para un único host, mientras que las flotas de varias máquinas gobernadas mediante identidades corresponden a una capa específica del plano de control situada por encima.

## Contenido relacionado

- [`openclaw fleet`](/cli/fleet)
- [Seguridad del Gateway](/es/gateway/security)
- [Varios Gateways](/es/gateway/multiple-gateways)
- [Docker](/es/install/docker)
- [Podman](/es/install/podman)
