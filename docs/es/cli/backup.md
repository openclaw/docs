---
read_when:
    - Quieres un archivo de respaldo de primera clase para el estado local de OpenClaw
    - Quieres previsualizar qué rutas se incluirían antes de restablecer o desinstalar
summary: Referencia de CLI para `openclaw backup` (crear archivos de copia de seguridad locales)
title: Copia de seguridad
x-i18n:
    generated_at: "2026-06-27T10:56:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ac7d8e4babd24f1c46ac48dca6c413e12361173df83cfe485dd3945ccd30c3e
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

- El archivo incluye un archivo `manifest.json` con las rutas de origen resueltas y el diseño del archivo.
- La salida predeterminada es un archivo `.tar.gz` con marca de tiempo en el directorio de trabajo actual.
- Los nombres de archivo de respaldo con marca de tiempo usan la zona horaria local de tu máquina e incluyen el desplazamiento UTC.
- Si el directorio de trabajo actual está dentro de un árbol de origen respaldado, OpenClaw recurre a tu directorio de inicio para la ubicación predeterminada del archivo.
- Los archivos de archivo existentes nunca se sobrescriben.
- Las rutas de salida dentro de los árboles de estado/espacio de trabajo de origen se rechazan para evitar la autoinclusión.
- `openclaw backup verify <archive>` valida que el archivo contenga exactamente un manifiesto raíz, rechaza rutas de archivo de estilo transversal y comprueba que cada carga útil declarada en el manifiesto exista en el tarball.
- `openclaw backup create --verify` ejecuta esa validación inmediatamente después de escribir el archivo.
- `openclaw backup create --only-config` respalda solo el archivo de configuración JSON activo.

## Qué se respalda

`openclaw backup create` planifica las fuentes de respaldo desde tu instalación local de OpenClaw:

- El directorio de estado devuelto por el resolutor de estado local de OpenClaw, normalmente `~/.openclaw`
- La ruta del archivo de configuración activo
- El directorio `credentials/` resuelto cuando existe fuera del directorio de estado
- Los directorios de espacios de trabajo detectados desde la configuración actual, salvo que pases `--no-include-workspace`

Los perfiles de autenticación de modelos ya forman parte del directorio de estado bajo
`agents/<agentId>/agent/auth-profiles.json`, por lo que normalmente quedan cubiertos por la
entrada de respaldo de estado.

Si usas `--only-config`, OpenClaw omite el estado, el directorio de credenciales y la detección de espacios de trabajo, y archiva únicamente la ruta del archivo de configuración activo.

OpenClaw canonicaliza las rutas antes de construir el archivo. Si la configuración, el
directorio de credenciales o un espacio de trabajo ya están dentro del directorio de estado,
no se duplican como fuentes de respaldo de nivel superior separadas. Las rutas faltantes se
omiten.

La carga útil del archivo almacena el contenido de los archivos de esos árboles de origen, y el `manifest.json` incrustado registra las rutas absolutas de origen resueltas junto con el diseño de archivo usado para cada recurso.

Durante la creación del archivo, OpenClaw omite archivos conocidos de mutación en vivo que no tienen valor de restauración, incluidos los transcritos de sesiones de agentes activas, los registros de ejecuciones Cron, los registros rotativos, las colas de entrega, los archivos de socket/pid/temporales bajo el directorio de estado y los archivos temporales relacionados de colas duraderas. El resultado JSON incluye `skippedVolatileCount` para que la automatización pueda ver cuántos archivos se omitieron intencionalmente.

Se incluyen los archivos de origen y manifiesto de Plugin instalados bajo el árbol
`extensions/` del directorio de estado, pero se omiten sus árboles de dependencias
`node_modules/` anidados. Esas dependencias son artefactos de instalación reconstruibles; después
de restaurar un archivo, usa `openclaw plugins update <id>` o reinstala el Plugin
con `openclaw plugins install <spec> --force` cuando un Plugin restaurado informe
dependencias faltantes.

## Comportamiento con configuración no válida

`openclaw backup` omite intencionalmente la comprobación previa normal de configuración para poder ayudar durante la recuperación. Como la detección de espacios de trabajo depende de una configuración válida, `openclaw backup create` ahora falla rápido cuando el archivo de configuración existe pero no es válido y el respaldo de espacios de trabajo sigue habilitado.

Si aun así quieres un respaldo parcial en esa situación, vuelve a ejecutar:

```bash
openclaw backup create --no-include-workspace
```

Eso mantiene el estado, la configuración y el directorio externo de credenciales dentro del alcance mientras
omite por completo la detección de espacios de trabajo.

Si solo necesitas una copia del archivo de configuración en sí, `--only-config` también funciona cuando la configuración tiene formato incorrecto porque no depende de analizar la configuración para detectar espacios de trabajo.

## Tamaño y rendimiento

OpenClaw no impone un tamaño máximo de respaldo integrado ni un límite de tamaño por archivo.

Los límites prácticos provienen de la máquina local y del sistema de archivos de destino:

- Espacio disponible para la escritura temporal del archivo más el archivo final
- Tiempo para recorrer árboles grandes de espacios de trabajo y comprimirlos en un `.tar.gz`
- Tiempo para volver a escanear el archivo si usas `openclaw backup create --verify` o ejecutas `openclaw backup verify`
- Comportamiento del sistema de archivos en la ruta de destino. OpenClaw prefiere un paso de publicación mediante enlace duro sin sobrescritura y recurre a una copia exclusiva cuando los enlaces duros no son compatibles

Los espacios de trabajo grandes suelen ser el principal factor del tamaño del archivo. Si quieres un respaldo más pequeño o más rápido, usa `--no-include-workspace`.

Para el archivo más pequeño, usa `--only-config`.

## Relacionado

- [Referencia de la CLI](/es/cli)
