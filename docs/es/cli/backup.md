---
read_when:
    - Quieres un archivo de copia de seguridad de primera clase para el estado local de OpenClaw
    - Quieres obtener una vista previa de qué rutas se incluirían antes de restablecer o desinstalar
summary: Referencia de la CLI para `openclaw backup` (crear archivos de copia de seguridad locales)
title: Copia de seguridad
x-i18n:
    generated_at: "2026-04-24T05:22:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88d83cf04c163d76658575aa6d90be1dd7379934fa2822a07e13311c4324f8fd
    source_path: cli/backup.md
    workflow: 15
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

- El archivo incluye un archivo `manifest.json` con las rutas de origen resueltas y el diseño del archivo.
- La salida predeterminada es un archivo `.tar.gz` con marca temporal en el directorio de trabajo actual.
- Si el directorio de trabajo actual está dentro de un árbol de origen incluido en la copia de seguridad, OpenClaw recurre a tu directorio personal como ubicación predeterminada del archivo.
- Los archivos de archivo existentes nunca se sobrescriben.
- Las rutas de salida dentro de los árboles de origen del estado/espacio de trabajo se rechazan para evitar la auto-inclusión.
- `openclaw backup verify <archive>` valida que el archivo contenga exactamente un manifiesto raíz, rechaza rutas de archivo de tipo traversal y comprueba que cada carga útil declarada en el manifiesto exista en el archivo tar.
- `openclaw backup create --verify` ejecuta esa validación inmediatamente después de escribir el archivo.
- `openclaw backup create --only-config` respalda solo el archivo de configuración JSON activo.

## Qué se respalda

`openclaw backup create` planifica fuentes de copia de seguridad desde tu instalación local de OpenClaw:

- El directorio de estado devuelto por el resolvedor de estado local de OpenClaw, normalmente `~/.openclaw`
- La ruta del archivo de configuración activo
- El directorio `credentials/` resuelto cuando existe fuera del directorio de estado
- Los directorios de espacios de trabajo detectados a partir de la configuración actual, a menos que pases `--no-include-workspace`

Los perfiles de autenticación del modelo ya forman parte del directorio de estado en
`agents/<agentId>/agent/auth-profiles.json`, por lo que normalmente quedan cubiertos por la entrada de copia de seguridad del estado.

Si usas `--only-config`, OpenClaw omite la detección de estado, directorio de credenciales y espacios de trabajo, y archiva solo la ruta del archivo de configuración activo.

OpenClaw canoniza las rutas antes de crear el archivo. Si la configuración, el
directorio de credenciales o un espacio de trabajo ya se encuentran dentro del directorio de estado,
no se duplican como fuentes de copia de seguridad independientes de nivel superior. Las rutas que faltan se
omiten.

La carga útil del archivo almacena el contenido de los archivos de esos árboles de origen, y el `manifest.json` incrustado registra las rutas de origen absolutas resueltas más el diseño del archivo usado para cada recurso.

## Comportamiento con configuración no válida

`openclaw backup` omite intencionadamente la validación previa normal de la configuración para que pueda seguir ayudando durante la recuperación. Dado que la detección del espacio de trabajo depende de una configuración válida, `openclaw backup create` ahora falla rápidamente cuando el archivo de configuración existe pero no es válido y la copia de seguridad del espacio de trabajo sigue habilitada.

Si aun así quieres una copia de seguridad parcial en esa situación, vuelve a ejecutar:

```bash
openclaw backup create --no-include-workspace
```

Eso mantiene el estado, la configuración y el directorio externo de credenciales dentro del alcance mientras
omite por completo la detección del espacio de trabajo.

Si solo necesitas una copia del propio archivo de configuración, `--only-config` también funciona cuando la configuración está mal formada porque no depende de analizar la configuración para detectar espacios de trabajo.

## Tamaño y rendimiento

OpenClaw no impone un tamaño máximo integrado para la copia de seguridad ni un límite de tamaño por archivo.

Los límites prácticos dependen de la máquina local y del sistema de archivos de destino:

- Espacio disponible para la escritura temporal del archivo más el archivo final
- Tiempo para recorrer árboles grandes de espacios de trabajo y comprimirlos en un `.tar.gz`
- Tiempo para volver a analizar el archivo si usas `openclaw backup create --verify` o ejecutas `openclaw backup verify`
- Comportamiento del sistema de archivos en la ruta de destino. OpenClaw prefiere un paso de publicación mediante enlace físico sin sobrescritura y recurre a una copia exclusiva cuando los enlaces físicos no son compatibles

Los espacios de trabajo grandes suelen ser el principal factor del tamaño del archivo. Si quieres una copia de seguridad más pequeña o más rápida, usa `--no-include-workspace`.

Para obtener el archivo más pequeño, usa `--only-config`.

## Relacionado

- [Referencia de la CLI](/es/cli)
