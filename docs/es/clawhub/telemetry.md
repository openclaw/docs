---
read_when:
    - Trabajando en los controles de telemetría / privacidad
    - Preguntas sobre qué datos se recopilan
summary: Instala la telemetría recopilada por la CLI de ClawHub y cómo desactivarla.
x-i18n:
    generated_at: "2026-07-01T07:51:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 906be32778baaf89e77c5350cd33ff3b975df66d8152a33fdf20c24b5c8286ce
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetría

ClawHub usa telemetría mínima de la CLI para calcular conteos agregados de instalaciones.

## Cuándo se recopila la telemetría

La telemetría solo se envía cuando:

- Has iniciado sesión en la CLI.
- Ejecutas `clawhub install <slug>`.
- La telemetría **no está deshabilitada** (consulta “Cómo deshabilitarla” más abajo).

Si no has iniciado sesión, no se informa nada.

## Qué recopilamos

En cada `clawhub install` informado, la CLI envía un evento de instalación de mejor esfuerzo.

El evento incluye:

- `slug`: el slug de la habilidad instalada.
- `version`: la versión instalada, cuando se conoce.

### Qué _no_ recopilamos

- Ninguna ruta de carpeta ni identificadores derivados de carpetas.
- Ningún contenido de archivos.
- Ningún registro por ejecución, prompts u otra salida de la CLI.

## Conteos de instalaciones

ClawHub mantiene contadores agregados por habilidad:

- `installsAllTime`: usuarios únicos que han informado al menos una instalación de CLI para la habilidad.
- `installsCurrent`: usuarios únicos que han informado una instalación y no han eliminado su
  telemetría.

## Transparencia + controles del usuario

Todos solo ven **contadores de instalaciones agregados**.

Eliminar tu cuenta también elimina tus datos de telemetría.

## Cómo deshabilitar la telemetría

Configura la variable de entorno:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Con esto configurado, la CLI no enviará telemetría de instalación.
