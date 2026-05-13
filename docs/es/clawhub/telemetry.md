---
read_when:
    - Trabajando en controles de telemetría / privacidad
    - Preguntas sobre qué datos se recopilan
summary: Telemetría de instalación recopilada mediante `clawhub sync` + exclusión voluntaria.
x-i18n:
    generated_at: "2026-05-13T05:33:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f492fa0176af1cb37fbf694f6c21ed63a769cf9eb8ee4b29f435d5ff0b0e683
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetría

ClawHub usa **telemetría mínima** para calcular **recuentos de instalaciones** (lo que realmente está en uso) y para ofrecer una mejor ordenación/filtrado.
Esto se basa en el comando de la CLI `clawhub sync`.

## Cuándo se recopila telemetría

La telemetría solo se envía cuando:

- Has **iniciado sesión** en la CLI (ya requerimos autenticación para los flujos de sincronización/publicación).
- Ejecutas `clawhub sync`.
- La telemetría **no está deshabilitada** (consulta “Cómo deshabilitarla” a continuación).

Si no has iniciado sesión, no se informa nada.

## Qué recopilamos

En cada `clawhub sync`, la CLI informa una **instantánea completa** de lo que encontró, agrupado por raíz de escaneo (“carpeta/raíz”).

Para cada raíz almacenamos:

- `rootId`: un **hash SHA-256** de la ruta raíz canónica (el servidor nunca ve la ruta sin procesar).
- `label`: una etiqueta legible para humanos derivada de los dos últimos segmentos de la ruta (las rutas de inicio se muestran con `~`).
- `firstSeenAt`, `lastSeenAt`, `expiredAt` opcional.

Para cada skill encontrado bajo una raíz almacenamos:

- `skillId` (resuelto por slug; solo se rastrean los skills que existen en el registro).
- `firstSeenAt`, `lastSeenAt`.
- `lastVersion` (según disponibilidad; actualmente la versión coincidente del registro si se conoce).
- `removedAt` opcional cuando una instalación informada anteriormente desaparece de una raíz.

### Qué _no_ recopilamos

- Ninguna ruta absoluta de carpeta sin procesar (solo `rootId` con hash + una etiqueta de visualización breve).
- Ningún contenido de archivos.
- Ningún registro por ejecución, prompt u otra salida de la CLI.
- Ningún rastreo de skills que no estén subidos al registro (los slugs desconocidos se ignoran).

## Recuentos de instalaciones

Mantenemos dos contadores por skill:

- `installsCurrent`: usuarios únicos que actualmente tienen el skill instalado en al menos una raíz activa.
- `installsAllTime`: usuarios únicos que alguna vez han informado que tienen el skill instalado.

### Varias raíces

Si sincronizas desde varias carpetas, tratamos cada raíz de escaneo de forma independiente. Un skill está “instalado actualmente” si existe en **cualquier** raíz activa.

### Detección de desinstalación

Dado que `sync` informa el conjunto completo por raíz:

- Si un skill desaparece de una raíz en la siguiente sincronización, lo marcamos como eliminado para esa raíz.
- Si el skill se elimina de todas tus raíces, ya no cuenta para `installsCurrent`.
- `installsAllTime` nunca disminuye a menos que elimines la telemetría (consulta a continuación).

### Obsolescencia (120 días)

Las raíces que no informan telemetría durante **120 días** se marcan como obsoletas y sus instalaciones dejan de contar para `installsCurrent`.
Esto se evalúa de forma diferida (en el siguiente informe de telemetría) para evitar trabajos en segundo plano.

## Transparencia + controles de usuario

ClawHub proporciona una pestaña privada “Instalado” en tu propio perfil:

- Muestra las raíces exactas + los skills instalados que almacenamos.
- Incluye una vista de **exportación JSON**.
- Incluye una acción **Eliminar telemetría** para eliminar toda la telemetría almacenada de tu cuenta.

Todos los demás solo ven **contadores de instalaciones agregados**; nadie más puede ver tus raíces/carpetas.

Eliminar tu cuenta también elimina tus datos de telemetría.

## Cómo deshabilitar la telemetría

Establece la variable de entorno:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Con esto establecido, la CLI no enviará telemetría durante `clawhub sync`.
