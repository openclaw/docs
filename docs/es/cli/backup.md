---
read_when:
    - Quieres un archivo de respaldo de primer nivel para el estado local de OpenClaw
    - Quieres previsualizar qué rutas se incluirían antes de restablecer o desinstalar
summary: Referencia de CLI para `openclaw backup` (crear archivos de copia de seguridad locales)
title: Copia de seguridad
x-i18n:
    generated_at: "2026-07-05T11:06:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 48487eb747b88111899106f507b4ce6364b56c65b88da2e33c43fc160c6b17a9
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

- El archivo incorpora un `manifest.json` con las rutas de origen resueltas y el diseño del archivo.
- La salida predeterminada es un archivo `.tar.gz` con marca de tiempo en el directorio de trabajo actual. Los nombres de archivo con marca de tiempo usan la zona horaria local de tu equipo e incluyen el desfase UTC. Si el directorio de trabajo actual está dentro de un árbol de origen respaldado, OpenClaw usa tu directorio de inicio como alternativa para la ubicación predeterminada del archivo.
- Los archivos de archivo existentes nunca se sobrescriben. Las rutas de salida dentro de los árboles de estado/espacio de trabajo de origen se rechazan para evitar la autoinclusión.
- `openclaw backup verify <archive>` comprueba que el archivo contenga exactamente un manifiesto raíz, rechaza rutas de archivo de estilo recorrido y confirma que cada carga útil declarada en el manifiesto exista en el tarball. `openclaw backup create --verify` ejecuta esa validación inmediatamente después de escribir el archivo.
- `openclaw backup create --only-config` respalda solo el archivo de configuración JSON activo.

## Qué se respalda

`openclaw backup create` planifica los orígenes desde tu instalación local de OpenClaw:

- El directorio de estado (normalmente `~/.openclaw`)
- La ruta del archivo de configuración activo
- El directorio `credentials/` resuelto cuando existe fuera del directorio de estado
- Los directorios de espacio de trabajo descubiertos desde la configuración actual, a menos que pases `--no-include-workspace`

Los perfiles de autenticación y otros estados de ejecución por agente viven en SQLite bajo el directorio de estado (`agents/<agentId>/agent/openclaw-agent.sqlite`), por lo que la entrada de respaldo del estado los cubre automáticamente.

`--only-config` omite el estado, el directorio de credenciales y el descubrimiento de espacios de trabajo, y archiva solo la ruta del archivo de configuración activo.

OpenClaw canonicaliza las rutas antes de crear el archivo: si la configuración, el directorio de credenciales o un espacio de trabajo ya viven dentro del directorio de estado, no se duplican como orígenes de respaldo de nivel superior separados. Las rutas faltantes se omiten.

Durante la creación del archivo, OpenClaw omite archivos conocidos de mutación en vivo sin valor de restauración: transcripciones de sesiones de agentes activas, registros de ejecuciones cron, registros rotativos, colas de entrega, archivos de socket/pid/temporales bajo el directorio de estado y archivos temporales relacionados de colas durables. El `skippedVolatileCount` del resultado JSON informa cuántos archivos se omitieron intencionalmente. Las bases de datos SQLite bajo el directorio de estado se capturan de forma segura (`VACUUM INTO`) en lugar de copiarse en vivo, por lo que los archivos WAL/SHM abiertos no corrompen el respaldo.

Se incluyen los archivos fuente y de manifiesto de plugins instalados bajo el árbol `extensions/` del directorio de estado, pero sus árboles de dependencias `node_modules/` anidados se omiten como artefactos de instalación reconstruibles. Después de restaurar un archivo, usa `openclaw plugins update <id>` o reinstala con `openclaw plugins install <spec> --force` si un plugin restaurado informa dependencias faltantes.

## Comportamiento con configuración no válida

`openclaw backup` omite la comprobación previa normal de configuración para poder seguir ayudando durante la recuperación. El descubrimiento de espacios de trabajo depende de una configuración válida, por lo que `openclaw backup create` falla de inmediato cuando el archivo de configuración existe pero no es válido y el respaldo de espacios de trabajo sigue habilitado.

Para un respaldo parcial en esa situación, vuelve a ejecutarlo con `--no-include-workspace`: mantiene en alcance el estado, la configuración y el directorio de credenciales externo, mientras omite por completo el descubrimiento de espacios de trabajo.

`--only-config` también funciona cuando la configuración está mal formada, ya que no analiza la configuración para descubrir espacios de trabajo.

## Tamaño y rendimiento

OpenClaw no aplica un tamaño máximo de respaldo integrado ni un límite de tamaño por archivo. Los límites prácticos provienen de:

- Espacio disponible para la escritura temporal del archivo más el archivo final
- Tiempo para recorrer árboles grandes de espacios de trabajo y comprimirlos en un `.tar.gz`
- Tiempo para volver a examinar el archivo con `--verify` u `openclaw backup verify`
- Comportamiento del sistema de archivos de destino: OpenClaw prefiere un paso de publicación mediante enlace físico sin sobrescritura y recurre a copia exclusiva cuando no se admiten enlaces físicos

Los espacios de trabajo grandes suelen ser el principal factor del tamaño del archivo. Usa `--no-include-workspace` para un respaldo más pequeño/rápido, o `--only-config` para el archivo más pequeño.

## Relacionado

- [Referencia de CLI](/es/cli)
