---
read_when:
    - Trabajando en los controles de telemetría y privacidad
    - Preguntas sobre qué datos se recopilan
summary: Telemetría de instalación recopilada por la CLI de ClawHub y cómo desactivarla.
x-i18n:
    generated_at: "2026-07-19T01:49:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 906be32778baaf89e77c5350cd33ff3b975df66d8152a33fdf20c24b5c8286ce
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetría

ClawHub utiliza telemetría mínima de la CLI para calcular recuentos agregados de instalaciones.

## Cuándo se recopila la telemetría

La telemetría solo se envía cuando:

- Se ha iniciado sesión en la CLI.
- Se ejecuta `clawhub install <slug>`.
- La telemetría **no está desactivada** (véase «Cómo desactivarla» a continuación).

Si no se ha iniciado sesión, no se notifica nada.

## Qué recopilamos

Por cada `clawhub install` notificado, la CLI envía un evento de instalación mediante el mejor esfuerzo posible.

El evento incluye:

- `slug`: el slug de la skill instalada.
- `version`: la versión instalada, cuando se conoce.

### Qué _no_ recopilamos

- Ninguna ruta de carpeta ni identificador derivado de una carpeta.
- Ningún contenido de archivo.
- Ningún registro por ejecución, prompt ni otra salida de la CLI.

## Recuentos de instalaciones

ClawHub mantiene contadores agregados por skill:

- `installsAllTime`: usuarios únicos que han notificado al menos una instalación de la skill mediante la CLI.
- `installsCurrent`: usuarios únicos que han notificado una instalación y no han eliminado su
  telemetría.

## Transparencia y controles para los usuarios

Solo se muestran **contadores agregados de instalaciones**.

Al eliminar la cuenta, también se eliminan los datos de telemetría.

## Cómo desactivar la telemetría

Establezca la variable de entorno:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Al establecerla, la CLI no enviará telemetría de instalaciones.
