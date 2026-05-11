---
read_when:
    - Quieres un archivo de copia de seguridad de primera clase para el estado local de OpenClaw
    - Quiere previsualizar qué rutas se incluirían antes de restablecer o desinstalar
summary: Referencia de la CLI para `openclaw backup` (crear archivos de copia de seguridad locales)
title: Copia de seguridad
x-i18n:
    generated_at: "2026-05-11T20:25:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2c95cf475a563ad4f0a2dbaeda504b265580545c9d3f6f71d2f4d2a183e76a5c
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
openclaw backup verify ./2026-03-09T00-00-00.000Z-openclaw-backup.tar.gz
```

## Notas

- El archivo incluye un archivo `manifest.json` con las rutas de origen resueltas y el diseño del archivo.
- La salida predeterminada es un archivo `.tar.gz` con marca de tiempo en el directorio de trabajo actual.
- Si el directorio de trabajo actual está dentro de un árbol de origen respaldado, OpenClaw recurre a tu directorio de inicio para la ubicación predeterminada del archivo.
- Los archivos existentes nunca se sobrescriben.
- Las rutas de salida dentro de los árboles de estado/espacio de trabajo de origen se rechazan para evitar la autoinclusión.
- `openclaw backup verify <archive>` valida que el archivo contenga exactamente un manifiesto raíz, rechaza rutas de archivo con estilo de recorrido y comprueba que toda carga útil declarada en el manifiesto exista en el tarball.
- `openclaw backup create --verify` ejecuta esa validación inmediatamente después de escribir el archivo.
- `openclaw backup create --only-config` respalda solo el archivo de configuración JSON activo.

## Qué se respalda

`openclaw backup create` planifica las fuentes de respaldo desde tu instalación local de OpenClaw:

- El directorio de estado devuelto por el resolvedor de estado local de OpenClaw, normalmente `~/.openclaw`
- La ruta del archivo de configuración activo
- El directorio `credentials/` resuelto cuando existe fuera del directorio de estado
- Los directorios de espacios de trabajo descubiertos desde la configuración actual, a menos que pases `--no-include-workspace`

Los perfiles de autenticación de modelos ya forman parte del directorio de estado en
`agents/<agentId>/agent/auth-profiles.json`, por lo que normalmente quedan cubiertos por la
entrada de respaldo del estado.

Si usas `--only-config`, OpenClaw omite el descubrimiento de estado, directorio de credenciales y espacios de trabajo, y archiva solo la ruta del archivo de configuración activo.

OpenClaw canoniza las rutas antes de crear el archivo. Si la configuración, el
directorio de credenciales o un espacio de trabajo ya están dentro del directorio de estado,
no se duplican como fuentes de respaldo independientes de nivel superior. Las rutas ausentes se
omiten.

La carga útil del archivo almacena el contenido de archivos de esos árboles de origen, y el `manifest.json` incrustado registra las rutas de origen absolutas resueltas junto con el diseño del archivo usado para cada recurso.

Durante la creación del archivo, OpenClaw omite archivos conocidos de mutación en vivo que no tienen valor de restauración, incluidos transcripciones de sesiones de agentes activos, registros de ejecución de Cron, registros rotativos, colas de entrega, archivos de sockets/pid/temporales bajo el directorio de estado y archivos temporales relacionados de colas duraderas. El resultado JSON incluye `skippedVolatileCount` para que la automatización pueda ver cuántos archivos se omitieron intencionalmente.

Los archivos fuente y de manifiesto de Plugins instalados bajo el árbol
`extensions/` del directorio de estado se incluyen, pero sus árboles de dependencias
`node_modules/` anidados se omiten. Esas dependencias son artefactos de instalación reconstruibles; después de
restaurar un archivo, usa `openclaw plugins update <id>` o reinstala el Plugin
con `openclaw plugins install <spec> --force` cuando un Plugin restaurado informe
dependencias faltantes.

## Comportamiento de configuración no válida

`openclaw backup` omite intencionalmente la verificación previa normal de configuración para poder seguir ayudando durante la recuperación. Como el descubrimiento de espacios de trabajo depende de una configuración válida, `openclaw backup create` ahora falla rápido cuando el archivo de configuración existe pero no es válido y el respaldo de espacios de trabajo sigue habilitado.

Si aun así quieres un respaldo parcial en esa situación, vuelve a ejecutar:

```bash
openclaw backup create --no-include-workspace
```

Eso mantiene dentro del alcance el estado, la configuración y el directorio externo de credenciales, mientras
omite por completo el descubrimiento de espacios de trabajo.

Si solo necesitas una copia del archivo de configuración en sí, `--only-config` también funciona cuando la configuración está mal formada porque no depende de analizar la configuración para descubrir espacios de trabajo.

## Tamaño y rendimiento

OpenClaw no impone un tamaño máximo de respaldo integrado ni un límite de tamaño por archivo.

Los límites prácticos provienen de la máquina local y del sistema de archivos de destino:

- Espacio disponible para la escritura temporal del archivo más el archivo final
- Tiempo para recorrer árboles de espacios de trabajo grandes y comprimirlos en un `.tar.gz`
- Tiempo para volver a escanear el archivo si usas `openclaw backup create --verify` o ejecutas `openclaw backup verify`
- Comportamiento del sistema de archivos en la ruta de destino. OpenClaw prefiere un paso de publicación mediante enlace físico sin sobrescritura y recurre a copia exclusiva cuando los enlaces físicos no son compatibles

Los espacios de trabajo grandes suelen ser el principal factor del tamaño del archivo. Si quieres un respaldo más pequeño o más rápido, usa `--no-include-workspace`.

Para el archivo más pequeño, usa `--only-config`.

## Relacionado

- [Referencia de CLI](/es/cli)
