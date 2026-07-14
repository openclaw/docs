---
read_when:
    - Se necesita un archivo de copia de seguridad de primera clase para el estado local de OpenClaw
    - Se necesita una instantánea compacta y verificada de una base de datos SQLite de OpenClaw
    - Se desea obtener una vista previa de las rutas que se incluirían antes de restablecer o desinstalar
summary: Referencia de la CLI para `openclaw backup` (archivos y instantáneas de SQLite)
title: Copia de seguridad
x-i18n:
    generated_at: "2026-07-14T13:33:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 6f52d6c96feb08862d2f666c0ed777f5ecb12713a10d6a8ec4cc0374d015250d
    source_path: cli/backup.md
    workflow: 16
---

# `openclaw backup`

Crea un archivo de copia de seguridad local para el estado, la configuración, los perfiles de autenticación, las credenciales de canales/proveedores, las sesiones y, opcionalmente, los espacios de trabajo de OpenClaw.

```bash
openclaw backup create
openclaw backup create --output ~/Backups
openclaw backup create --dry-run --json
openclaw backup create --verify
openclaw backup create --no-include-workspace
openclaw backup create --only-config
openclaw backup verify ./2026-03-09T08-00-00.000+08-00-openclaw-backup.tar.gz
openclaw backup sqlite create --global --repository ~/Backups/openclaw-sqlite
openclaw backup sqlite create --agent main --repository ~/Backups/openclaw-sqlite
openclaw backup sqlite list --repository ~/Backups/openclaw-sqlite
openclaw backup sqlite verify ~/Backups/openclaw-sqlite/<snapshot-id>
openclaw backup sqlite verify ~/Backups/openclaw-sqlite/<snapshot-id> --scratch ~/Private/openclaw-scratch
openclaw backup sqlite restore ~/Backups/openclaw-sqlite/<snapshot-id> --target ./restored/openclaw.sqlite
```

## Notas

- El archivo incluye un `manifest.json` con las rutas de origen resueltas y la disposición del archivo.
- La salida predeterminada es un archivo `.tar.gz` con marca de tiempo en el directorio de trabajo actual. Los nombres de archivo con marca de tiempo utilizan la zona horaria local de la máquina e incluyen el desfase UTC. Si el directorio de trabajo actual está dentro de un árbol de origen incluido en la copia de seguridad, OpenClaw utiliza el directorio personal como ubicación predeterminada del archivo.
- Los archivos existentes nunca se sobrescriben. Se rechazan las rutas de salida situadas dentro de los árboles de estado o de espacios de trabajo de origen para evitar que el archivo se incluya a sí mismo.
- `openclaw backup verify <archive>` comprueba que el archivo contenga exactamente un manifiesto raíz, rechaza rutas de archivo de tipo recorrido y archivos auxiliares de SQLite, confirma que exista cada carga útil declarada en el manifiesto, valida la estructura de archivo de cada instantánea de SQLite y ejecuta comprobaciones completas de integridad y función en las bases de datos canónicas de OpenClaw. Los esquemas específicos de los plugins permanecen opacos porque pueden requerir capacidades de SQLite definidas por su propietario. `openclaw backup create --verify` ejecuta esa validación inmediatamente después de escribir el archivo.
- `openclaw backup create --only-config` crea una copia de seguridad únicamente del archivo de configuración JSON activo.

## Instantáneas de SQLite

Use `openclaw backup sqlite` cuando necesite un artefacto portátil para una base de datos SQLite propiedad de OpenClaw, en lugar de un archivo de estado amplio.

La creación de instantáneas acepta exactamente un origen con nombre:

| Comando                                                         | Base de datos                   |
| --------------------------------------------------------------- | ------------------------------- |
| `openclaw backup sqlite create --global --repository <dir>`     | Estado compartido de OpenClaw   |
| `openclaw backup sqlite create --agent <id> --repository <dir>` | Una base de datos por agente    |

El repositorio contiene un directorio por cada instantánea confirmada. Cada directorio de instantánea contiene exactamente:

- `manifest.json`
- `database.sqlite`

La creación de instantáneas verifica la base de datos activa antes de leerla, utiliza `VACUUM INTO` de SQLite para capturar el estado WAL confirmado en una base de datos compacta, vuelve a verificar la base de datos generada y publica el directorio completado sin sobrescribir rutas existentes. Las instantáneas globales eliminan las filas transitorias de la cola de entrega y vuelven a compactar la base de datos para que las cargas útiles eliminadas de la cola no permanezcan en páginas libres.

No copie archivos activos `.sqlite`, `-wal`, `-shm` ni `-journal` como artefacto de portabilidad. Copie únicamente directorios de instantáneas completadas.

Las instantáneas de SQLite pueden contener perfiles de autenticación, estados de sesión, estados de plugins y otros registros confidenciales. Proteja los repositorios con los mismos permisos, cifrado, política de retención y restricciones de destino que el directorio de estado activo de OpenClaw.

### Verificación y restauración

```bash
openclaw backup sqlite verify <snapshot-directory>
openclaw backup sqlite restore <snapshot-directory> --target <new-database-path>
```

La verificación comprueba la estructura estricta del manifiesto, el tamaño y el SHA-256 del artefacto, la integridad de SQLite, las claves externas, la versión del esquema, la función y el propietario de la base de datos, y las definiciones de índices propiedad de OpenClaw.

La verificación valida una copia privada fijada por contenido para que las condiciones de carrera en los nombres de ruta no puedan sustituir los bytes que inspecciona SQLite. De forma predeterminada, esa copia temporal se crea junto al repositorio de instantáneas y se elimina antes de que finalice el comando. La raíz de preparación y su cadena de antecesores deben impedir que otros usuarios la sustituyan. Las raíces POSIX deben pertenecer al usuario actual y no permitir escritura al grupo ni a otros usuarios; se aceptan antecesores con bit adhesivo, como `/tmp`, para elementos secundarios pertenecientes al usuario. Se rechazan las concesiones de ACL de macOS que expongan la preparación o permitan sustituirla. Las raíces y los antecesores de Windows deben pertenecer al usuario actual o a una entidad de seguridad de confianza del sistema operativo, con ACL que impidan el acceso de entidades no confiables al área de preparación. Para un montaje de solo lectura o un recurso compartido de red, indique `--scratch <existing-private-directory>` en un almacenamiento con controles equivalentes de cifrado y destino.

La creación de instantáneas aplica las mismas comprobaciones de propietario, ACL, antecesores e identidad de ruta al repositorio antes de preparar o publicar los bytes de la base de datos.

La restauración repite la verificación y escribe únicamente en un destino nuevo. Rechaza un destino existente y los archivos auxiliares `-wal`, `-shm` o `-journal`, y nunca sustituye directamente una base de datos activa de OpenClaw. El directorio principal del destino está sujeto a los mismos requisitos de seguridad de rutas que el área temporal de verificación. La activación de una base de datos restaurada sigue siendo un paso explícito del operador que debe realizarse sin conexión.

Los repositorios de instantáneas son directorios locales. La programación, la carga, la retención, los paquetes WAL incrementales, la conmutación por error y la restauración durante el arranque quedan deliberadamente fuera del ámbito de este comando.

## Elementos incluidos en la copia de seguridad

`openclaw backup create` planifica los orígenes a partir de la instalación local de OpenClaw:

- El directorio de estado (normalmente `~/.openclaw`)
- La ruta del archivo de configuración activo
- El directorio `credentials/` resuelto cuando se encuentra fuera del directorio de estado
- Los directorios de espacios de trabajo detectados en la configuración actual, salvo que se indique `--no-include-workspace`

Los perfiles de autenticación y otros estados de ejecución por agente se almacenan en SQLite dentro del directorio de estado (`agents/<agentId>/agent/openclaw-agent.sqlite`), por lo que la entrada de copia de seguridad del estado los incluye automáticamente.

`--only-config` omite la detección del estado, del directorio de credenciales y de los espacios de trabajo, y archiva únicamente la ruta del archivo de configuración activo.

OpenClaw normaliza las rutas antes de crear el archivo: si la configuración, el directorio de credenciales o un espacio de trabajo ya se encuentran dentro del directorio de estado, no se duplican como orígenes independientes de nivel superior de la copia de seguridad. Las rutas inexistentes se omiten.

Durante la creación del archivo, OpenClaw excluye las rutas conocidas sujetas a modificaciones activas antes de que `tar` las lea. Esto evita condiciones de carrera entre el tamaño registrado de un archivo y las escrituras simultáneas. El filtro aplica las siguientes reglas relativas al estado en cada directorio de estado incluido en la copia de seguridad:

| Ámbito relativo al estado                      | Sufijos de archivo omitidos      |
| ---------------------------------------------- | -------------------------------- |
| `sessions/**`                                | `.jsonl`, `.log`              |
| `agents/<agentId>/sessions/**`               | `.jsonl`, `.log`              |
| `cron/runs/**`                               | `.jsonl`, `.log`              |
| `logs/**`                                    | `.jsonl`, `.log`              |
| `delivery-queue/**`                          | `.json`, `.delivered`, `.tmp` |
| `session-delivery-queue/**`                  | `.json`, `.delivered`, `.tmp` |
| Cualquier ruta bajo el directorio de estado incluido en la copia de seguridad | `.sock`, `.pid`, `.tmp`       |

Estas reglas no filtran los archivos de los espacios de trabajo situados fuera del directorio de estado. También omiten los archivos completados de transcripciones y registros que coincidan con la tabla, por lo que dichos registros deben conservarse por separado cuando sean necesarios. El campo `skippedVolatileCount` del resultado JSON indica cuántos archivos se omitieron deliberadamente.

Las bases de datos SQLite situadas bajo el directorio de estado se compactan con `VACUUM INTO` para que los restos de páginas eliminadas no se incluyan en el archivo, y los archivos WAL/SHM activos no se copian. Una base de datos propiedad de un plugin que requiera capacidades de SQLite definidas por su propietario y no disponibles produce un error seguro en lugar de recurrir a una copia sin procesar de las páginas. Los archivos SQLite incluidos mediante copias de seguridad de espacios de trabajo se copian como archivos del espacio de trabajo y no están cubiertos por la garantía de compactación.

Se incluyen los archivos de código fuente y manifiesto de los plugins instalados bajo el árbol `extensions/` del directorio de estado, pero se omiten sus árboles de dependencias `node_modules/` anidados porque son artefactos de instalación que se pueden reconstruir. Después de restaurar un archivo, use `openclaw plugins update <id>` o vuelva a instalar con `openclaw plugins install <spec> --force` si un plugin restaurado informa de que faltan dependencias.

## Comportamiento con una configuración no válida

`openclaw backup` omite la comprobación preliminar normal de la configuración para que pueda seguir siendo útil durante la recuperación. La detección de espacios de trabajo depende de una configuración válida, por lo que `openclaw backup create` falla inmediatamente cuando el archivo de configuración existe, pero no es válido, y la copia de seguridad de los espacios de trabajo sigue habilitada.

Para realizar una copia de seguridad parcial en esa situación, vuelva a ejecutar el comando con `--no-include-workspace`: mantiene dentro del ámbito el estado, la configuración y el directorio externo de credenciales, mientras omite por completo la detección de espacios de trabajo.

`--only-config` también funciona cuando la configuración está mal formada, ya que no analiza la configuración para detectar espacios de trabajo.

## Tamaño y rendimiento

OpenClaw no impone un tamaño máximo integrado para las copias de seguridad ni un límite de tamaño por archivo. Los límites prácticos dependen de:

- El espacio disponible para la escritura del archivo temporal y el archivo final
- El tiempo necesario para recorrer árboles de espacios de trabajo grandes y comprimirlos en un `.tar.gz`
- El tiempo necesario para volver a examinar el archivo con `--verify` o `openclaw backup verify`
- El comportamiento del sistema de archivos de destino: OpenClaw prefiere un paso de publicación mediante enlace físico sin sobrescritura y recurre a una copia exclusiva cuando no se admiten enlaces físicos

Los espacios de trabajo grandes suelen ser el principal factor que determina el tamaño del archivo. Use `--no-include-workspace` para obtener una copia de seguridad más pequeña y rápida, o `--only-config` para obtener el archivo más pequeño.

## Contenido relacionado

- [Referencia de la CLI](/es/cli)
