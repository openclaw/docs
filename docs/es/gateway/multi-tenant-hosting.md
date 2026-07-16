---
doc-schema-version: 1
read_when:
    - Aloja OpenClaw para varios usuarios u organizaciones
    - Debe elegir un límite de aislamiento para las cargas de trabajo de los inquilinos
summary: Aloje varios dominios de confianza de inquilinos como una celda aislada de OpenClaw Gateway por inquilino
title: Alojamiento multiinquilino
x-i18n:
    generated_at: "2026-07-16T11:39:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 383d32331b45d40db6fb4ff8242dd9a3cf8898a3ccab19f0372cd06bbd83fc05
    source_path: gateway/multi-tenant-hosting.md
    workflow: 16
---

# Alojamiento multiinquilino

El modelo de seguridad predeterminado de OpenClaw establece un límite de operador de confianza por Gateway, no un aislamiento multiinquilino hostil dentro de un Gateway compartido. Por lo tanto, alojar usuarios u organizaciones que no comparten un límite de confianza implica ejecutar una instancia completa e independiente de OpenClaw para cada inquilino.

`openclaw fleet` denomina **celda** a cada instancia aislada. Una celda es un Gateway completo en un contenedor reforzado con su propio estado, credenciales, espacio de trabajo, cuentas de canales, token y puerto del host limitado a la interfaz de bucle invertido.

Fleet es **experimental**: sus comandos, indicadores y perfil de contenedor pueden cambiar entre versiones sin un período de obsolescencia.

Fleet se prueba en hosts Linux y macOS. Actualmente no se ha probado en hosts Windows.

## Por qué cada inquilino necesita una celda

Un operador autenticado dentro de un Gateway desempeña una función de confianza en el plano de control. Los identificadores de sesión seleccionan el enrutamiento; no autorizan a un inquilino frente a otro. El aislamiento de agentes puede reducir el efecto del contenido que no es de confianza y de la ejecución de herramientas, pero no convierte un Gateway compartido en un límite de autorización entre inquilinos.

Utilice una celda por inquilino para que cada dominio de confianza tenga un proceso de Gateway, un contenedor, un árbol de estado persistente y una credencial de Gateway independientes. Esto se ajusta al [modelo de seguridad del Gateway](/es/gateway/security): no ubique conjuntamente a usuarios que no confían entre sí en un mismo proceso de OpenClaw ni bajo un mismo usuario del sistema operativo.

## Arquitectura

La CLI de Fleet es un supervisor del ciclo de vida que se ejecuta en el host. Registra las celdas en la base de datos de estado de OpenClaw y solicita a un entorno de ejecución local de Docker o Podman que cree, inspeccione, inicie, detenga, sustituya y elimine sus contenedores. No se admiten puntos de conexión de entornos de ejecución remotos porque las rutas de montaje y las URL de bucle invertido de Fleet pertenecen al host local. Fleet no actúa como proxy de los mensajes de los inquilinos ni añade una ruta compartida de datos en el nivel de la aplicación entre las celdas.

Cada celda ejecuta la imagen oficial `ghcr.io/openclaw/openclaw` en su propia red puente definida por el usuario. Los puentes independientes impiden el tráfico directo mediante direcciones IP de contenedores entre las celdas, al tiempo que mantienen el acceso NAT saliente para proveedores y canales. El tráfico saliente no está restringido de forma predeterminada. Las celdas de Podman pueden utilizar `--network internal` para bloquear el tráfico saliente y conservar el puerto de bucle invertido publicado del Gateway. Las redes internas de Docker interrumpen ese puerto publicado, por lo que Fleet rechaza esta combinación; en su lugar, aplique la política de tráfico saliente de Docker mediante reglas del cortafuegos del host, como la cadena `DOCKER-USER`. El Gateway de la celda escucha en el puerto `18789` dentro del contenedor, mientras que el entorno de ejecución solo lo publica en `127.0.0.1:<allocated-port>` en el host. Cuando se necesita acceso remoto, un operador puede colocar un proxy inverso aprobado, un túnel SSH o una red privada de Tailscale delante de ese punto de conexión de bucle invertido.

El estado persistente del Gateway procede de `<state-dir>/fleet/cells/<tenant>/` y se monta en `/home/node/.openclaw`. Las claves de cifrado de los perfiles de autenticación proceden de la ruta independiente del host `<state-dir>/fleet/auth-profile-secrets/<tenant>/` y se montan en `/home/node/.config/openclaw`, conforme a la [disposición oficial de persistencia de Docker](/es/install/docker#storage-and-persistence). La clave no está anidada bajo el montaje de estado ordinario. Las cuentas de canales de cada inquilino terminan dentro de la celda que las posee; Fleet no proporciona una cuenta de canal compartida ni un enrutador de mensajes entrantes.

La imagen oficial utiliza de forma predeterminada el usuario no raíz `node` con UID 1000. Fleet utiliza asignaciones de usuarios compatibles con el host para que los montajes privados sigan siendo escribibles: Podman utiliza `keep-id`, Docker con privilegios de raíz utiliza la identidad no raíz que lo invoca y Docker sin privilegios de raíz asigna el usuario raíz del contenedor al usuario sin privilegios del demonio. Docker y Podman aplican un reetiquetado privado `:Z` cuando SELinux está activo en el host. El perfil del contenedor evita las funciones privilegiadas del host y es compatible con entornos sin privilegios de raíz, pero el funcionamiento sin privilegios de raíz depende de una elección y un requisito previo del entorno de ejecución del host; Fleet no lo habilita automáticamente.

## Límite de confianza

La multiinquilinidad protege a los inquilinos entre sí. Todos los inquilinos confían en el operador de Fleet y en el host. La resistencia frente a un host comprometido no es un objetivo.

Esto significa que un administrador del host puede inspeccionar la configuración y el entorno de los contenedores, leer los datos montados de las celdas, sustituir imágenes o acceder a los contenedores. Los tokens del Gateway y los valores proporcionados mediante `--env` son visibles para un administrador mediante la inspección de Docker o Podman. Utilice en consecuencia controles del host, políticas de acceso administrativo, supervisión, copias de seguridad y un gestor de secretos aprobado.

La configuración de referencia evita la exposición accidental de red mediante comodines y elimina mecanismos habituales de escalada de privilegios en contenedores, pero no hace seguro un host que no sea de confianza.

## Niveles de aislamiento

Elija el límite que corresponda a los inquilinos que aloja:

1. **Configuración de referencia de contenedor reforzado.** Fleet elimina todas las capacidades de Linux, habilita `no-new-privileges`, aplica límites de PID, memoria, CPU y, opcionalmente, de disco para la capa escribible, utiliza montajes persistentes y redes independientes para cada celda, y solo publica en la interfaz de bucle invertido del host. Las redes puente no restringen el tráfico saliente; utilice `--network internal` de Podman o la política del cortafuegos del host para Docker cuando una celda no deba iniciar conexiones salientes. Este es el perfil predeterminado para los inquilinos que confían en el operador y el host.
2. **Aislamiento más sólido mediante contenedores o máquinas virtuales.** Para cargas de trabajo de mayor riesgo, configure Docker o Podman para utilizar un entorno de ejecución OCI con mayor aislamiento, como gVisor o Kata Containers, o coloque las celdas en micromáquinas virtuales. Esta configuración corresponde al entorno de ejecución o a la infraestructura; la opción `--runtime docker|podman` de Fleet elige la CLI del contenedor, no el entorno de aislamiento OCI. Consulte los [entornos de ejecución de contenedores alternativos](https://docs.docker.com/engine/daemon/alternative-runtimes/) de Docker y la [guía del entorno de ejecución de Docker en máquinas virtuales](/es/install/docker-vm-runtime).
3. **Máquinas independientes para inquilinos hostiles.** No ubique conjuntamente a inquilinos hostiles en un mismo proceso de OpenClaw ni bajo un mismo usuario del sistema operativo. Cuando los inquilinos no confían en el mismo operador del host o necesitan un límite administrativo más sólido, utilice máquinas virtuales o hosts físicos independientes con una administración separada del entorno de ejecución.

Ningún nivel de esta escala cambia el modelo de confianza de la aplicación OpenClaw: un Gateway sigue siendo un dominio de operador de confianza.

## Inicio rápido

Cree una celda. El comando muestra una sola vez un token de Gateway generado, por lo que debe guardarlo inmediatamente:

```bash
openclaw fleet create acme
```

Abra la URL `http://127.0.0.1:<port>` indicada en el host de Fleet, autentíquese con el token de ese inquilino y configure las credenciales del proveedor y las cuentas de canales dentro de la celda.

Compruebe el estado del contenedor y la disponibilidad del Gateway:

```bash
openclaw fleet status acme
```

Actualice conservando el puerto del host, los datos montados, el perfil de recursos, el entorno proporcionado por el usuario y el token del Gateway:

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

Consulte la [referencia de la CLI de `openclaw fleet`](/es/cli/fleet) para conocer todos los comandos y opciones.

## Alcance actual

Fleet no proporciona las siguientes funciones:

- Cuentas de canales compartidas ni un enrutador de entrada compartido
- Procesos de host reducidos por inquilino en lugar de instancias completas de OpenClaw
- Hosts remotos de celdas gestionados por un único supervisor
- Un portal de autoservicio para inquilinos, un plano de facturación o una interfaz de administración delegada

Estas capacidades requieren contratos explícitos de identidad, enrutamiento, autorización y dominios de fallo. No intente aproximarlas compartiendo un Gateway o sus credenciales entre inquilinos. Fleet es un supervisor del ciclo de vida para un único host; las flotas de varias máquinas gobernadas mediante identidades requieren una capa de plano de control independiente.

## Temas relacionados

- [`openclaw fleet`](/es/cli/fleet)
- [Seguridad del Gateway](/es/gateway/security)
- [Varios gateways](/es/gateway/multiple-gateways)
- [Docker](/es/install/docker)
- [Podman](/es/install/podman)
