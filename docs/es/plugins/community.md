---
doc-schema-version: 1
read_when:
    - Quieres encontrar plugins de OpenClaw de terceros
    - Quieres publicar o incluir tu propio plugin en ClawHub
summary: Encuentra y publica plugins de OpenClaw mantenidos por la comunidad
title: Plugins comunitarios
x-i18n:
    generated_at: "2026-07-05T11:30:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a9eb477f20da8171a35c22ea6b112d77ff4afe0878f60314c052746aef4e0ac
    source_path: plugins/community.md
    workflow: 16
---

Los plugins comunitarios son paquetes de terceros que amplían OpenClaw con
canales, herramientas, proveedores, hooks u otras capacidades. Usa
[ClawHub](/clawhub) como la superficie principal de descubrimiento para plugins
comunitarios públicos.

## Buscar plugins

Busca en ClawHub desde la CLI:

```bash
openclaw plugins search "calendar"
```

Instala un plugin de ClawHub con un prefijo de origen explícito:

```bash
openclaw plugins install clawhub:<package-name>
```

npm sigue siendo una ruta de instalación directa compatible durante la transición
de lanzamiento:

```bash
openclaw plugins install npm:<package-name>
```

Usa [Administrar plugins](/es/plugins/manage-plugins) para ejemplos comunes de
instalación, actualización, inspección y desinstalación. Usa
[`openclaw plugins`](/es/cli/plugins) para la referencia completa de comandos y las
reglas de selección de origen.

## Publicar plugins

Publica plugins comunitarios públicos en ClawHub para que los usuarios de
OpenClaw puedan descubrirlos e instalarlos. ClawHub es responsable del listado
activo de paquetes, el historial de versiones, el estado de escaneo y las
sugerencias de instalación; la documentación no mantiene un catálogo estático de
plugins de terceros.

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Antes de publicar, asegúrate de que el plugin tenga metadatos de paquete, un
manifiesto de plugin, documentación de configuración y un propietario de
mantenimiento claro. ClawHub valida el alcance del propietario, el nombre del
paquete, la versión, los límites de archivos y los metadatos de origen antes de
crear una versión, y luego mantiene las nuevas versiones ocultas de las
superficies normales de instalación y descarga hasta que finalicen la revisión y
la verificación.

Lista de comprobación antes de publicar:

| Requisito            | Por qué                                             |
| -------------------- | --------------------------------------------------- |
| Publicado en ClawHub | Los usuarios necesitan que funcionen las sugerencias de `openclaw plugins install` |
| Repositorio público de GitHub | Revisión del código fuente, seguimiento de incidencias, transparencia |
| Documentación de configuración y uso | Los usuarios necesitan saber cómo configurarlo |
| Mantenimiento activo | Actualizaciones recientes o gestión receptiva de incidencias |

Contrato completo de publicación:

- [Publicación en ClawHub](/es/clawhub/publishing) - propietarios, alcances,
  versiones, revisión, validación de paquetes y transferencia de paquetes
- [Crear plugins](/es/plugins/building-plugins) - la forma del paquete de plugin
  y el primer flujo de publicación
- [Manifiesto de plugin](/es/plugins/manifest) - campos del manifiesto de plugin nativo

## Relacionado

- [Plugins](/es/tools/plugin) - instalar, configurar, reiniciar y solucionar problemas
- [Administrar plugins](/es/plugins/manage-plugins) - ejemplos de comandos
- [Publicación en ClawHub](/es/clawhub/publishing) - reglas de publicación y versiones
