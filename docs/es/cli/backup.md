---
read_when:
    - Se necesita un archivo de copia de seguridad de primera clase para el estado local de OpenClaw
    - Necesita una instantánea compacta y verificada de una base de datos SQLite de OpenClaw
    - Quiere obtener una vista previa de las rutas que se incluirían antes de restablecer o desinstalar
summary: Referencia de la CLI para `openclaw backup` (archivos y snapshots de SQLite)
title: Copia de seguridad
x-i18n:
    generated_at: "2026-07-19T01:49:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: aa9444b5e57e9c6f9492e4b017be96ea8d9da88cf335fd163ea6744975fda37b
    source_path: cli/backup.md
    workflow: 16
---

# `openclaw backup`

Crea un archivo de respaldo local para el estado, la configuración, los perfiles de autenticación, las credenciales de canales y proveedores, las sesiones y, opcionalmente, los espacios de trabajo de OpenClaw.

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

- El archivo incluye un `manifest.json` con las rutas de origen resueltas y la estructura del archivo.
- La salida predeterminada es un archivo `.tar.gz` con marca de tiempo en el directorio de trabajo actual. Los nombres de archivo con marca de tiempo usan la zona horaria local de la máquina e incluyen el desfase respecto de UTC. Si el directorio de trabajo actual está dentro de un árbol de origen incluido en el respaldo, OpenClaw usa el directorio de inicio como ubicación predeterminada del archivo.
- Los archivos existentes nunca se sobrescriben. Se rechazan las rutas de salida dentro de los árboles de estado o de espacios de trabajo de origen para evitar la autoinclusión.
- `openclaw backup verify <archive>` comprueba que el archivo contenga exactamente un manifiesto raíz, rechaza rutas de archivo de tipo recorrido y archivos auxiliares de SQLite, confirma que exista cada carga útil declarada en el manifiesto, valida la estructura de archivo de cada instantánea de SQLite y ejecuta comprobaciones completas de integridad y función en las bases de datos canónicas de OpenClaw. Los esquemas dedicados de plugins permanecen opacos porque pueden requerir capacidades de SQLite definidas por sus propietarios. `openclaw backup create --verify` ejecuta esa validación inmediatamente después de escribir el archivo.
- `openclaw backup create --only-config` respalda únicamente el archivo de configuración JSON activo.

## Instantáneas de SQLite

Usa `openclaw backup sqlite` cuando necesites un artefacto portátil para una base de datos SQLite propiedad de OpenClaw en lugar de un archivo amplio del estado.

La creación de instantáneas acepta exactamente un origen con nombre:

| Comando                                                         | Base de datos                     |
| --------------------------------------------------------------- | --------------------------------- |
| `openclaw backup sqlite create --global --repository <dir>`     | Estado compartido de OpenClaw     |
| `openclaw backup sqlite create --agent <id> --repository <dir>` | Una base de datos por cada agente |

El repositorio contiene un directorio por cada instantánea confirmada. Cada directorio de instantánea contiene exactamente:

- `manifest.json`
- `database.sqlite`

La creación de instantáneas verifica la base de datos activa antes de leerla, usa `VACUUM INTO` de SQLite para capturar el estado WAL confirmado en una base de datos compacta, vuelve a verificar la base de datos generada y publica el directorio completo sin sobrescribir rutas existentes. Las instantáneas globales eliminan las filas transitorias de la cola de entrega y vuelven a compactarse para que las cargas útiles eliminadas de la cola no se conserven en páginas libres.

No copies archivos activos `.sqlite`, `-wal`, `-shm` ni `-journal` como artefacto de portabilidad. Copia únicamente directorios de instantáneas completos.

Las instantáneas de SQLite pueden contener perfiles de autenticación, estado de sesiones, estado de plugins y otros registros confidenciales. Protege los repositorios con los mismos permisos, cifrado, política de retención y restricciones de destino que el directorio de estado activo de OpenClaw.

### Verificar y restaurar

```bash
openclaw backup sqlite verify <snapshot-directory>
openclaw backup sqlite restore <snapshot-directory> --target <new-database-path>
```

La verificación comprueba la estructura estricta del manifiesto, el tamaño y el SHA-256 del artefacto, la integridad de SQLite, las claves externas, la versión del esquema, la función y el propietario de la base de datos, y las definiciones de índices propiedad de OpenClaw.

La verificación valida una copia privada fijada por contenido para que las condiciones de carrera en los nombres de ruta no puedan sustituir los bytes que inspecciona SQLite. De forma predeterminada, esa copia temporal se crea junto al repositorio de instantáneas y se elimina antes de que finalice el comando. La raíz de preparación y su cadena de antecesores deben impedir que otros usuarios la sustituyan. Las raíces POSIX deben pertenecer al usuario actual y no permitir escritura por parte del grupo ni de otros usuarios; se aceptan antecesores con bit adhesivo, como `/tmp`, para elementos secundarios propiedad del usuario. Se rechazan las concesiones de ACL de macOS que expongan el área de preparación o permitan sustituirla. Las raíces y los antecesores de Windows deben pertenecer al usuario actual o a una entidad principal de confianza del sistema operativo, con ACL que denieguen a usuarios no confiables el acceso al área de preparación. Para un montaje de solo lectura o un recurso compartido de red, especifica `--scratch <existing-private-directory>` en un almacenamiento con controles equivalentes de cifrado y destino.

La creación de instantáneas aplica al repositorio las mismas comprobaciones de propietario, ACL, antecesores e identidad de ruta antes de preparar o publicar los bytes de la base de datos.

La restauración repite la verificación y escribe únicamente en un destino nuevo. Rechaza un destino existente o un archivo auxiliar `-wal`, `-shm` o `-journal`, y nunca sustituye directamente una base de datos activa de OpenClaw. El directorio principal del destino tiene los mismos requisitos de seguridad de ruta que el área temporal de verificación. La activación de una base de datos restaurada sigue siendo un paso explícito y sin conexión que debe realizar el operador.

Los repositorios de instantáneas son directorios locales. La programación, la carga, la retención, los paquetes WAL incrementales, la conmutación por error y el comportamiento de restauración durante el arranque están intencionalmente fuera del alcance de este comando.

## Qué se respalda

`openclaw backup create` planifica los orígenes desde la instalación local de OpenClaw:

- El directorio de estado (normalmente `~/.openclaw`)
- La ruta del archivo de configuración activo
- El directorio `credentials/` resuelto cuando se encuentra fuera del directorio de estado
- Los directorios de espacios de trabajo detectados a partir de la configuración actual, a menos que se especifique `--no-include-workspace`

Los perfiles de autenticación y otros estados de ejecución por agente se almacenan en SQLite dentro del directorio de estado (`agents/<agentId>/agent/openclaw-agent.sqlite`), por lo que se incluyen automáticamente en la entrada de respaldo del estado.

`--only-config` omite la detección del estado, del directorio de credenciales y de los espacios de trabajo, y archiva únicamente la ruta del archivo de configuración activo.

OpenClaw convierte las rutas a su forma canónica antes de crear el archivo: si la configuración, el directorio de credenciales o un espacio de trabajo ya están dentro del directorio de estado, no se duplican como orígenes de respaldo independientes de nivel superior. Las rutas que no existen se omiten.

Durante la creación del archivo, OpenClaw excluye las rutas conocidas que pueden modificarse en tiempo real antes de que `tar` las lea. Esto evita condiciones de carrera entre el tamaño registrado de un archivo y las escrituras simultáneas. El filtro aplica las siguientes reglas relativas al estado dentro de cada directorio de estado respaldado:

| Ámbito relativo al estado                      | Sufijos de archivo omitidos                  |
| ---------------------------------------------- | -------------------------------------------- |
| `sessions/**`                                | `.jsonl`, `.log`              |
| `agents/<agentId>/sessions/**`               | `.jsonl`, `.log`              |
| `cron/runs/**`                               | `.jsonl`, `.log`              |
| `logs/**`                                    | `.jsonl`, `.log`              |
| `delivery-queue/**`                          | `.json`, `.delivered`, `.tmp` |
| `session-delivery-queue/**`                  | `.json`, `.delivered`, `.tmp` |
| Cualquier ruta bajo el directorio de estado respaldado | `.sock`, `.pid`, `.tmp`       |

Estas reglas no filtran los archivos de espacios de trabajo situados fuera del directorio de estado. También omiten los archivos completos de transcripción y registro que coincidan con la tabla, por lo que esos registros deben conservarse por separado cuando sea necesario. El campo `skippedVolatileCount` del resultado JSON indica cuántos archivos se omitieron intencionalmente.

Las bases de datos SQLite situadas dentro del directorio de estado se compactan con `VACUUM INTO` para que los restos de páginas eliminadas no se incorporen al archivo, y no se copian los archivos WAL/SHM activos. Si una base de datos propiedad de un plugin requiere capacidades de SQLite definidas por el propietario que no están disponibles, la operación falla de forma segura en lugar de recurrir a una copia directa de las páginas. Los archivos SQLite incluidos mediante respaldos de espacios de trabajo se copian como archivos del espacio de trabajo y no están cubiertos por la garantía de compactación.

Se incluyen los archivos de origen y manifiesto de los plugins instalados dentro del árbol `extensions/` del directorio de estado, pero sus árboles de dependencias `node_modules/` anidados se omiten por ser artefactos de instalación que se pueden reconstruir. Después de restaurar un archivo, usa `openclaw plugins update <id>` o reinstala mediante `openclaw plugins install <spec> --force` si un plugin restaurado informa que faltan dependencias.

También se omiten las raíces de ejecución administradas por el instalador y que se pueden reconstruir dentro del directorio de estado: `dev/`, `git/`, `npm/`, el elemento heredado `npm-runtime/` y `tools/`. Estas contienen copias de trabajo administradas, árboles de paquetes y entornos de ejecución descargados, en lugar de estados de usuario autoritativos; después de la restauración, reinstala o actualiza el entorno de ejecución o plugin correspondiente. Se seguirá incluyendo un archivo de configuración, directorio de credenciales o espacio de trabajo configurado explícitamente dentro de una de estas raíces.

## Comportamiento con una configuración no válida

`openclaw backup` omite la comprobación preliminar normal de la configuración para que pueda seguir siendo útil durante la recuperación. La detección de espacios de trabajo depende de una configuración válida, por lo que `openclaw backup create` falla inmediatamente cuando el archivo de configuración existe, pero no es válido, y el respaldo de los espacios de trabajo sigue habilitado.

Para realizar un respaldo parcial en esa situación, vuelve a ejecutar el comando con `--no-include-workspace`: mantiene dentro del alcance el estado, la configuración y el directorio externo de credenciales, al tiempo que omite por completo la detección de espacios de trabajo.

`--only-config` también funciona cuando la configuración tiene un formato incorrecto, ya que no la analiza para detectar espacios de trabajo.

## Tamaño y rendimiento

OpenClaw no impone un tamaño máximo integrado para el respaldo ni un límite de tamaño por archivo. Si una escritura de archivo no produce datos durante cinco minutos, falla y elimina el archivo temporal parcial en lugar de quedar bloqueada indefinidamente. Los límites prácticos dependen de:

- El espacio disponible para la escritura del archivo temporal y para el archivo final
- El tiempo necesario para recorrer grandes árboles de espacios de trabajo y comprimirlos en un `.tar.gz`
- El tiempo necesario para volver a analizar el archivo mediante `--verify` o `openclaw backup verify`
- El comportamiento del sistema de archivos de destino: OpenClaw prefiere un paso de publicación mediante enlace físico sin sobrescritura y recurre a una copia exclusiva cuando no se admiten enlaces físicos

Los espacios de trabajo grandes suelen ser el principal factor que determina el tamaño del archivo. Usa `--no-include-workspace` para obtener un respaldo más pequeño y rápido, o `--only-config` para obtener el archivo más pequeño.

## Contenido relacionado

- [Referencia de la CLI](/es/cli)
