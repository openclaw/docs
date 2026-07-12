---
read_when:
    - Trabajando en los controles de telemetría y privacidad
    - Preguntas sobre qué datos se recopilan
summary: Telemetría de instalación recopilada por la CLI de ClawHub y cómo desactivarla.
x-i18n:
    generated_at: "2026-07-11T22:58:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 906be32778baaf89e77c5350cd33ff3b975df66d8152a33fdf20c24b5c8286ce
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetría

ClawHub utiliza una telemetría mínima de la CLI para calcular el total agregado de instalaciones.

## Cuándo se recopila la telemetría

La telemetría solo se envía cuando:

- Ha iniciado sesión en la CLI.
- Ejecuta `clawhub install <slug>`.
- La telemetría **no está deshabilitada** (consulte «Cómo deshabilitarla» más adelante).

Si no ha iniciado sesión, no se informa de nada.

## Qué recopilamos

Por cada `clawhub install` notificado, la CLI envía un evento de instalación según el mejor esfuerzo.

El evento incluye:

- `slug`: el slug de la Skill instalada.
- `version`: la versión instalada, cuando se conoce.

### Lo que _no_ recopilamos

- Ninguna ruta de carpeta ni identificador derivado de una carpeta.
- Ningún contenido de archivos.
- Ningún registro por ejecución, prompt ni otra salida de la CLI.

## Recuentos de instalaciones

ClawHub mantiene contadores agregados por Skill:

- `installsAllTime`: usuarios únicos que han notificado al menos una instalación de la Skill mediante la CLI.
- `installsCurrent`: usuarios únicos que han notificado una instalación y no han eliminado sus
  datos de telemetría.

## Transparencia y controles del usuario

Todos ven únicamente **contadores de instalaciones agregados**.

Al eliminar su cuenta, también se eliminan sus datos de telemetría.

## Cómo deshabilitar la telemetría

Establezca la variable de entorno:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Al establecerla, la CLI no enviará telemetría de instalaciones.
