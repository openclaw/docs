---
read_when:
    - Quieres un archivo de copia de seguridad de primera clase para el estado local de OpenClaw
    - Quiere obtener una vista previa de las rutas que se incluirían antes de restablecer o desinstalar
summary: Referencia de la CLI para `openclaw backup` (crear archivos de copia de seguridad locales)
title: Copia de seguridad
x-i18n:
    generated_at: "2026-07-12T14:24:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b40206e74b43edd6c1d2b00de3cbe9fcfa053bfbb2ffdff0323fb8c1671c28ea
    source_path: cli/backup.md
    workflow: 16
---

# `openclaw backup`

Crea un archivo de respaldo local para el estado, la configuración, los perfiles de autenticación, las credenciales de canales/proveedores, las sesiones y, opcionalmente, los espacios de trabajo de OpenClaw.

```bash
openclaw backup create
openclaw backup create --output ~/Backups
openclaw backup create --dry-run --json
openclaw backup create --verify
openclaw backup create --no-include-workspace
openclaw backup create --only-config
openclaw backup verify ./2026-03-09T08-00-00.000+08-00-openclaw-backup.tar.gz
```

## Notas

- El archivo incluye un `manifest.json` con las rutas de origen resueltas y la estructura del archivo.
- De forma predeterminada, se genera un archivo `.tar.gz` con marca de tiempo en el directorio de trabajo actual. Los nombres de archivo con marca de tiempo usan la zona horaria local de la máquina e incluyen el desplazamiento respecto de UTC. Si el directorio de trabajo actual está dentro de un árbol de origen incluido en el respaldo, OpenClaw usa el directorio principal como ubicación predeterminada del archivo.
- Los archivos existentes nunca se sobrescriben. Se rechazan las rutas de salida dentro de los árboles de estado o de espacios de trabajo de origen para evitar la autoinclusión.
- `openclaw backup verify <archive>` comprueba que el archivo contenga exactamente un manifiesto raíz, rechaza las rutas de archivo de tipo recorrido y los archivos auxiliares de SQLite, confirma que exista cada carga útil declarada en el manifiesto, valida la estructura de archivo de cada instantánea de SQLite y ejecuta comprobaciones completas de integridad y función en las bases de datos canónicas de OpenClaw. Los esquemas dedicados de los plugins permanecen opacos porque pueden requerir capacidades de SQLite definidas por sus propietarios. `openclaw backup create --verify` ejecuta esa validación inmediatamente después de escribir el archivo.
- `openclaw backup create --only-config` respalda únicamente el archivo de configuración JSON activo.

## Qué se incluye en el respaldo

`openclaw backup create` planifica los orígenes a partir de la instalación local de OpenClaw:

- El directorio de estado (normalmente `~/.openclaw`)
- La ruta del archivo de configuración activo
- El directorio `credentials/` resuelto cuando se encuentra fuera del directorio de estado
- Los directorios de espacios de trabajo detectados a partir de la configuración actual, salvo que se pase `--no-include-workspace`

Los perfiles de autenticación y otros estados de ejecución de cada agente se almacenan en SQLite, dentro del directorio de estado (`agents/<agentId>/agent/openclaw-agent.sqlite`), por lo que la entrada de respaldo del estado los incluye automáticamente.

`--only-config` omite la detección del estado, del directorio de credenciales y de los espacios de trabajo, y archiva únicamente la ruta del archivo de configuración activo.

OpenClaw canoniza las rutas antes de crear el archivo: si la configuración, el directorio de credenciales o un espacio de trabajo ya están dentro del directorio de estado, no se duplican como orígenes de respaldo independientes de nivel superior. Las rutas que no existen se omiten.

Durante la creación del archivo, OpenClaw omite archivos conocidos sujetos a modificaciones en vivo que no tienen valor para la restauración: transcripciones de sesiones activas de agentes, registros de ejecuciones de Cron, registros rotativos, colas de entrega, archivos de socket, PID y temporales dentro del directorio de estado, así como los archivos temporales relacionados con colas persistentes. El campo `skippedVolatileCount` del resultado JSON indica cuántos archivos se omitieron intencionadamente. Las bases de datos SQLite del directorio de estado se compactan con `VACUUM INTO` para que los restos de páginas eliminadas no se incorporen al archivo, y los archivos WAL/SHM activos no se copian. Si una base de datos propiedad de un plugin requiere capacidades de SQLite definidas por su propietario que no están disponibles, la operación falla de forma segura en lugar de recurrir a una copia sin procesar de las páginas. Los archivos SQLite incluidos mediante respaldos de espacios de trabajo se copian como archivos del espacio de trabajo y no están cubiertos por la garantía de compactación.

Se incluyen los archivos de origen y de manifiesto de los plugins instalados en el árbol `extensions/` del directorio de estado, pero se omiten sus árboles de dependencias `node_modules/` anidados por ser artefactos de instalación que se pueden volver a generar. Después de restaurar un archivo, use `openclaw plugins update <id>` o vuelva a instalar con `openclaw plugins install <spec> --force` si un plugin restaurado indica que faltan dependencias.

## Comportamiento ante una configuración no válida

`openclaw backup` omite la comprobación preliminar habitual de la configuración para poder seguir siendo útil durante la recuperación. La detección de espacios de trabajo depende de una configuración válida, por lo que `openclaw backup create` falla de inmediato cuando el archivo de configuración existe, pero no es válido, y el respaldo de espacios de trabajo sigue habilitado.

Para realizar un respaldo parcial en esa situación, vuelva a ejecutar el comando con `--no-include-workspace`: mantiene dentro del alcance el estado, la configuración y el directorio externo de credenciales, y omite por completo la detección de espacios de trabajo.

`--only-config` también funciona cuando la configuración tiene un formato incorrecto, ya que no analiza la configuración para detectar espacios de trabajo.

## Tamaño y rendimiento

OpenClaw no impone un tamaño máximo integrado para los respaldos ni un límite de tamaño por archivo. Los límites prácticos dependen de:

- El espacio disponible para escribir el archivo temporal y el archivo final
- El tiempo necesario para recorrer árboles grandes de espacios de trabajo y comprimirlos en un archivo `.tar.gz`
- El tiempo necesario para volver a examinar el archivo con `--verify` o `openclaw backup verify`
- El comportamiento del sistema de archivos de destino: OpenClaw prefiere un paso de publicación mediante enlace físico sin sobrescritura y recurre a una copia exclusiva cuando no se admiten enlaces físicos

Los espacios de trabajo grandes suelen ser el principal factor que determina el tamaño del archivo. Use `--no-include-workspace` para obtener un respaldo más pequeño y rápido, o `--only-config` para generar el archivo más pequeño.

## Contenido relacionado

- [Referencia de la CLI](/es/cli)
