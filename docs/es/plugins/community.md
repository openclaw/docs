---
doc-schema-version: 1
read_when:
    - Quieres encontrar plugins de terceros para OpenClaw
    - Quieres publicar o incluir tu propio plugin en ClawHub
summary: Encuentra y publica plugins de OpenClaw mantenidos por la comunidad
title: Plugins de la comunidad
x-i18n:
    generated_at: "2026-07-11T23:17:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a9eb477f20da8171a35c22ea6b112d77ff4afe0878f60314c052746aef4e0ac
    source_path: plugins/community.md
    workflow: 16
---

Los plugins de la comunidad son paquetes de terceros que amplían OpenClaw con
canales, herramientas, proveedores, hooks u otras capacidades. Usa
[ClawHub](/clawhub) como la principal vía para descubrir plugins públicos de la
comunidad.

## Buscar plugins

Busca en ClawHub desde la CLI:

```bash
openclaw plugins search "calendar"
```

Instala un plugin de ClawHub con un prefijo de origen explícito:

```bash
openclaw plugins install clawhub:<package-name>
```

npm sigue siendo una vía de instalación directa compatible durante la transición del lanzamiento:

```bash
openclaw plugins install npm:<package-name>
```

Consulta [Gestionar plugins](/es/plugins/manage-plugins) para ver ejemplos habituales de
instalación, actualización, inspección y desinstalación. Consulta
[`openclaw plugins`](/es/cli/plugins) para ver la referencia completa de comandos y las
reglas de selección del origen.

## Publicar plugins

Publica los plugins públicos de la comunidad en ClawHub para que los usuarios de OpenClaw
puedan descubrirlos e instalarlos. ClawHub gestiona el listado activo de paquetes, el
historial de versiones, el estado de los análisis y las indicaciones de instalación; la
documentación no mantiene un catálogo estático de plugins de terceros.

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Antes de publicar, asegúrate de que el plugin tenga metadatos del paquete, un
manifiesto del plugin, documentación de configuración y un responsable de mantenimiento
claramente definido. ClawHub valida el ámbito del propietario, el nombre del paquete, la
versión, los límites de archivos y los metadatos del código fuente antes de crear una
versión; después, mantiene las nuevas versiones ocultas en las vías normales de instalación
y descarga hasta que finalicen la revisión y la verificación.

Lista de comprobación antes de publicar:

| Requisito              | Motivo                                                                          |
| ---------------------- | ------------------------------------------------------------------------------- |
| Publicado en ClawHub   | Los usuarios necesitan que funcionen las indicaciones de `openclaw plugins install` |
| Repositorio público de GitHub | Revisión del código fuente, seguimiento de incidencias y transparencia     |
| Documentación de configuración y uso | Los usuarios necesitan saber cómo configurarlo                    |
| Mantenimiento activo   | Actualizaciones recientes o gestión diligente de las incidencias                |

Contrato completo de publicación:

- [Publicación en ClawHub](/es/clawhub/publishing): propietarios, ámbitos, versiones,
  revisión, validación de paquetes y transferencia de paquetes
- [Crear plugins](/es/plugins/building-plugins): la estructura del paquete del plugin
  y el flujo de trabajo para la primera publicación
- [Manifiesto del plugin](/es/plugins/manifest): campos del manifiesto nativo del plugin

## Contenido relacionado

- [Plugins](/es/tools/plugin): instalar, configurar, reiniciar y solucionar problemas
- [Gestionar plugins](/es/plugins/manage-plugins): ejemplos de comandos
- [Publicación en ClawHub](/es/clawhub/publishing): reglas de publicación y lanzamiento
