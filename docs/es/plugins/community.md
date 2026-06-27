---
doc-schema-version: 1
read_when:
    - Quieres encontrar Plugins de terceros de OpenClaw
    - Quieres publicar o incluir tu propio Plugin en ClawHub
summary: Encuentra y publica plugins de OpenClaw mantenidos por la comunidad
title: Plugins de la comunidad
x-i18n:
    generated_at: "2026-06-27T12:10:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0ecf059fa0c32f09d09381b2153a6a63ca522d49719aaa8476209389a6b5b36a
    source_path: plugins/community.md
    workflow: 16
---

Los plugins de la comunidad son paquetes de terceros que amplían OpenClaw con canales,
herramientas, proveedores, ganchos u otras capacidades. Usa [ClawHub](/es/clawhub) como la
superficie principal de descubrimiento para plugins públicos de la comunidad.

## Buscar plugins

Busca en ClawHub desde la CLI:

```bash
openclaw plugins search "calendar"
```

Instala un plugin de ClawHub con un prefijo de origen explícito:

```bash
openclaw plugins install clawhub:<package-name>
```

npm sigue siendo una ruta de instalación directa admitida durante la transición del lanzamiento:

```bash
openclaw plugins install npm:<package-name>
```

Usa [Administrar plugins](/es/plugins/manage-plugins) para ejemplos comunes de instalación,
actualización, inspección y desinstalación. Usa [`openclaw plugins`](/es/cli/plugins) para la
referencia completa de comandos y las reglas de selección de origen.

## Publicar plugins

Publica plugins públicos de la comunidad en ClawHub cuando quieras que los usuarios de OpenClaw
los descubran e instalen. ClawHub posee el listado de paquetes en vivo, el historial de
lanzamientos, el estado de análisis y las indicaciones de instalación; la documentación no mantiene
un catálogo estático de plugins de terceros.

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Antes de publicar, asegúrate de que el plugin tenga metadatos de paquete, un manifiesto de plugin,
documentación de configuración y un propietario de mantenimiento claro. ClawHub valida el ámbito del propietario,
el nombre del paquete, la versión, los límites de archivos y los metadatos de origen antes de crear un
lanzamiento; luego mantiene los lanzamientos nuevos ocultos de las superficies normales de instalación y descarga
hasta que finalicen la revisión y la verificación.

Usa esta lista de verificación antes de publicar:

| Requisito            | Por qué                                             |
| -------------------- | --------------------------------------------------- |
| Publicado en ClawHub | Los usuarios necesitan que funcionen las indicaciones de `openclaw plugins install` |
| Repositorio público de GitHub | Revisión del código fuente, seguimiento de incidencias, transparencia |
| Documentación de configuración y uso | Los usuarios necesitan saber cómo configurarlo |
| Mantenimiento activo | Actualizaciones recientes o gestión receptiva de incidencias |

Usa estas páginas para el contrato completo de publicación:

- [Publicación de ClawHub](/es/clawhub/publishing) explica propietarios, ámbitos, lanzamientos,
  revisión, validación de paquetes y transferencia de paquetes.
- [Crear plugins](/es/plugins/building-plugins) muestra la forma del paquete de plugin
  y el flujo de trabajo de primera publicación.
- [Manifiesto de plugin](/es/plugins/manifest) define los campos nativos del manifiesto de plugin.

## Relacionado

- [Plugins](/es/tools/plugin) - instalar, configurar, reiniciar y solucionar problemas
- [Administrar plugins](/es/plugins/manage-plugins) - ejemplos de comandos
- [Publicación de ClawHub](/es/clawhub/publishing) - reglas de publicación y lanzamiento
