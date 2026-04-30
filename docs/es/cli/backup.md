---
read_when:
    - Quieres un archivo de copia de seguridad de primera clase para el estado local de OpenClaw
    - Quieres previsualizar qué rutas se incluirían antes de un restablecimiento o una desinstalación
summary: Referencia de CLI para `openclaw backup` (crear archivos de copia de seguridad locales)
title: Copia de seguridad
x-i18n:
    generated_at: "2026-04-30T05:32:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5c16f953bb32a1613181448f0e4c6ba8777383bce95bddc856dc7e1c3afe8550
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
openclaw backup verify ./2026-03-09T00-00-00.000Z-openclaw-backup.tar.gz
```

## Notas

- El archivo incluye un archivo `manifest.json` con las rutas de origen resueltas y la disposición del archivo.
- La salida predeterminada es un archivo `.tar.gz` con marca de tiempo en el directorio de trabajo actual.
- Si el directorio de trabajo actual está dentro de un árbol de origen respaldado, OpenClaw usa tu directorio de inicio como alternativa para la ubicación predeterminada del archivo.
- Los archivos existentes nunca se sobrescriben.
- Las rutas de salida dentro de los árboles de estado/origen del espacio de trabajo se rechazan para evitar la autoinclusión.
- `openclaw backup verify <archive>` valida que el archivo contenga exactamente un manifiesto raíz, rechaza rutas de archivo con estilo de recorrido y comprueba que cada carga útil declarada en el manifiesto exista en el tarball.
- `openclaw backup create --verify` ejecuta esa validación inmediatamente después de escribir el archivo.
- `openclaw backup create --only-config` respalda solo el archivo de configuración JSON activo.

## Qué se respalda

`openclaw backup create` planifica las fuentes de copia de seguridad desde tu instalación local de OpenClaw:

- El directorio de estado devuelto por el resolvedor de estado local de OpenClaw, normalmente `~/.openclaw`
- La ruta del archivo de configuración activo
- El directorio `credentials/` resuelto cuando existe fuera del directorio de estado
- Los directorios de espacios de trabajo descubiertos desde la configuración actual, a menos que pases `--no-include-workspace`

Los perfiles de autenticación de modelos ya forman parte del directorio de estado en
`agents/<agentId>/agent/auth-profiles.json`, por lo que normalmente quedan cubiertos por la
entrada de copia de seguridad del estado.

Si usas `--only-config`, OpenClaw omite el estado, el directorio de credenciales y el descubrimiento de espacios de trabajo, y archiva solo la ruta del archivo de configuración activo.

OpenClaw canonicaliza las rutas antes de crear el archivo. Si la configuración, el
directorio de credenciales o un espacio de trabajo ya están dentro del directorio de estado,
no se duplican como fuentes de copia de seguridad de nivel superior independientes. Las rutas que faltan se
omiten.

La carga útil del archivo almacena el contenido de los archivos de esos árboles de origen, y el `manifest.json` incrustado registra las rutas de origen absolutas resueltas junto con la disposición del archivo usada para cada recurso.

Los archivos de origen y manifiesto de plugins instalados bajo el árbol
`extensions/` del directorio de estado se incluyen, pero sus árboles de dependencias
`node_modules/` anidados se omiten. Esas dependencias son artefactos de instalación reconstruibles; después de
restaurar un archivo, usa `openclaw plugins update <id>` o reinstala el plugin
con `openclaw plugins install <spec> --force` cuando un plugin restaurado informe
dependencias faltantes.

## Comportamiento con configuración no válida

`openclaw backup` omite intencionadamente la comprobación previa normal de la configuración para poder seguir ayudando durante la recuperación. Como el descubrimiento de espacios de trabajo depende de una configuración válida, `openclaw backup create` ahora falla rápido cuando el archivo de configuración existe pero no es válido y la copia de seguridad de espacios de trabajo sigue habilitada.

Si aún quieres una copia de seguridad parcial en esa situación, vuelve a ejecutar:

```bash
openclaw backup create --no-include-workspace
```

Eso mantiene dentro del alcance el estado, la configuración y el directorio de credenciales externo, mientras
omite por completo el descubrimiento de espacios de trabajo.

Si solo necesitas una copia del propio archivo de configuración, `--only-config` también funciona cuando la configuración está mal formada porque no depende de analizar la configuración para descubrir espacios de trabajo.

## Tamaño y rendimiento

OpenClaw no impone un tamaño máximo de copia de seguridad integrado ni un límite de tamaño por archivo.

Los límites prácticos provienen de la máquina local y del sistema de archivos de destino:

- Espacio disponible para la escritura temporal del archivo más el archivo final
- Tiempo para recorrer árboles de espacios de trabajo grandes y comprimirlos en un `.tar.gz`
- Tiempo para volver a escanear el archivo si usas `openclaw backup create --verify` o ejecutas `openclaw backup verify`
- Comportamiento del sistema de archivos en la ruta de destino. OpenClaw prefiere un paso de publicación con enlace duro sin sobrescritura y recurre a una copia exclusiva cuando los enlaces duros no son compatibles

Los espacios de trabajo grandes suelen ser el principal factor del tamaño del archivo. Si quieres una copia de seguridad más pequeña o rápida, usa `--no-include-workspace`.

Para el archivo más pequeño, usa `--only-config`.

## Relacionado

- [Referencia de CLI](/es/cli)
