---
read_when:
    - Trabajando en controles de telemetría / privacidad
    - Preguntas sobre qué datos se recopilan
summary: Telemetría de instalación recopilada mediante `clawhub sync` + exclusión voluntaria.
x-i18n:
    generated_at: "2026-05-12T15:43:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f492fa0176af1cb37fbf694f6c21ed63a769cf9eb8ee4b29f435d5ff0b0e683
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetría

ClawHub usa **telemetría mínima** para calcular **conteos de instalaciones** (lo que realmente está en uso) y para mejorar la ordenación/el filtrado.
Esto se basa en el comando de la CLI `clawhub sync`.

## Cuándo se recopila telemetría

La telemetría solo se envía cuando:

- Has **iniciado sesión** en la CLI (ya requerimos autenticación para los flujos de sincronización/publicación).
- Ejecutas `clawhub sync`.
- La telemetría **no está desactivada** (consulta “Cómo desactivar” más abajo).

Si no has iniciado sesión, no se informa nada.

## Qué recopilamos

En cada `clawhub sync`, la CLI informa una **instantánea completa** de lo que encontró, agrupado por raíz de análisis (“carpeta/raíz”).

Para cada raíz almacenamos:

- `rootId`: un **hash SHA-256** de la ruta raíz canónica (el servidor nunca ve la ruta sin procesar).
- `label`: una etiqueta legible derivada de los dos últimos segmentos de la ruta (las rutas de inicio se muestran con `~`).
- `firstSeenAt`, `lastSeenAt`, `expiredAt` opcional.

Para cada Skill encontrada bajo una raíz almacenamos:

- `skillId` (resuelto por slug; solo se rastrean las Skills que existen en el registro).
- `firstSeenAt`, `lastSeenAt`.
- `lastVersion` (según disponibilidad; actualmente la versión coincidente del registro si se conoce).
- `removedAt` opcional cuando una instalación informada previamente desaparece de una raíz.

### Qué _no_ recopilamos

- Ninguna ruta absoluta sin procesar de carpetas (solo `rootId` con hash + una etiqueta breve de visualización).
- Ningún contenido de archivos.
- Ningún registro por ejecución, prompts u otra salida de la CLI.
- Ningún seguimiento para Skills que no estén subidas al registro (los slugs desconocidos se ignoran).

## Conteos de instalaciones

Mantenemos dos contadores por Skill:

- `installsCurrent`: usuarios únicos que actualmente tienen la Skill instalada en al menos una raíz activa.
- `installsAllTime`: usuarios únicos que alguna vez informaron que tenían la Skill instalada.

### Múltiples raíces

Si sincronizas desde varias carpetas, tratamos cada raíz de análisis de forma independiente. Una Skill está “instalada actualmente” si existe en **cualquier** raíz activa.

### Detección de desinstalación

Como `sync` informa el conjunto completo por raíz:

- Si una Skill desaparece de una raíz en la siguiente sincronización, la marcamos como eliminada para esa raíz.
- Si la Skill se elimina de todas tus raíces, ya no cuenta para `installsCurrent`.
- `installsAllTime` nunca disminuye a menos que elimines la telemetría (consulta más abajo).

### Obsolescencia (120 días)

Las raíces que no informan telemetría durante **120 días** se marcan como obsoletas y sus instalaciones dejan de contar para `installsCurrent`.
Esto se evalúa de forma diferida (en el siguiente informe de telemetría) para evitar trabajos en segundo plano.

## Transparencia + controles de usuario

ClawHub proporciona una pestaña privada “Instalado” en tu propio perfil:

- Muestra las raíces exactas + las Skills instaladas que almacenamos.
- Incluye una vista de **exportación JSON**.
- Incluye una acción **Eliminar telemetría** para eliminar toda la telemetría almacenada de tu cuenta.

Todos los demás solo ven **contadores de instalaciones agregados**; nadie más puede ver tus raíces/carpetas.

Eliminar tu cuenta también elimina tus datos de telemetría.

## Cómo desactivar la telemetría

Define la variable de entorno:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Con esto definido, la CLI no enviará telemetría durante `clawhub sync`.
