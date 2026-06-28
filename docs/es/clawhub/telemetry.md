---
read_when:
    - Trabajando en los controles de telemetría / privacidad
    - Preguntas sobre qué datos se recopilan
summary: Telemetría de instalación recopilada por la CLI de ClawHub y cómo optar por no participar.
x-i18n:
    generated_at: "2026-06-28T05:07:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 906be32778baaf89e77c5350cd33ff3b975df66d8152a33fdf20c24b5c8286ce
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetría

ClawHub usa telemetría mínima de la CLI para calcular recuentos agregados de instalaciones.

## Cuándo se recopila telemetría

La telemetría solo se envía cuando:

- Has iniciado sesión en la CLI.
- Ejecutas `clawhub install <slug>`.
- La telemetría **no está deshabilitada** (consulta “Cómo deshabilitarla” abajo).

Si no has iniciado sesión, no se informa nada.

## Qué recopilamos

En cada `clawhub install` informado, la CLI envía un evento de instalación de mejor esfuerzo.

El evento incluye:

- `slug`: el slug de la Skill instalada.
- `version`: la versión instalada, cuando se conoce.

### Qué _no_ recopilamos

- Ninguna ruta de carpeta ni identificadores derivados de carpetas.
- Ningún contenido de archivos.
- Ningún registro por ejecución, prompt ni otra salida de la CLI.

## Recuentos de instalaciones

ClawHub mantiene contadores agregados por Skill:

- `installsAllTime`: usuarios únicos que han informado al menos una instalación de la CLI para la Skill.
- `installsCurrent`: usuarios únicos que han informado una instalación y no han eliminado su
  telemetría.

## Transparencia y controles de usuario

Todos solo ven **contadores de instalaciones agregados**.

Eliminar tu cuenta también elimina tus datos de telemetría.

## Cómo deshabilitar la telemetría

Define la variable de entorno:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Con esto definido, la CLI no enviará telemetría de instalaciones.
