---
read_when:
    - Quieres cambiar entre estable/beta/desarrollo
    - Quieres fijar una versión, etiqueta o SHA específicos
    - Estás etiquetando o publicando versiones preliminares
sidebarTitle: Release Channels
summary: 'Canales estable, beta y dev: semántica, cambio, fijación y etiquetado'
title: Canales de lanzamiento
x-i18n:
    generated_at: "2026-05-07T01:52:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6579110cc5c0e62ef238d7e4200db5fea188f35dc9366a17b3cf92a58c8935cc
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw distribuye tres canales de actualización:

- **stable**: dist-tag de npm `latest`. Recomendado para la mayoría de los usuarios.
- **beta**: dist-tag de npm `beta` cuando está actualizado; si beta falta o es anterior a
  la versión estable más reciente, el flujo de actualización vuelve a `latest`.
- **dev**: cabecera móvil de `main` (git). dist-tag de npm: `dev` (cuando se publica).
  La rama `main` es para experimentación y desarrollo activo. Puede contener
  funciones incompletas o cambios incompatibles. No la uses para gateways de producción.

Normalmente publicamos primero las compilaciones estables en **beta**, las probamos allí y luego ejecutamos un
paso explícito de promoción que mueve la compilación validada a `latest` sin
cambiar el número de versión. Los mantenedores también pueden publicar una versión estable
directamente en `latest` cuando sea necesario. Los dist-tags son la fuente de verdad para las
instalaciones de npm.

## Líneas de soporte mensuales planificadas

OpenClaw aún no distribuye un canal LTS ni de soporte mensual. Estamos trabajando
hacia líneas de soporte mensuales compatibles con SemVer para que los usuarios puedan permanecer en una línea más tranquila
mientras `latest` sigue avanzando rápidamente.

La forma de versión planificada es `YYYY.M.PATCH`:

- `YYYY` es el año.
- `M` es la línea de lanzamiento mensual, sin cero inicial.
- `PATCH` se incrementa dentro de esa línea mensual y puede superar 100 si es necesario.

Ejemplos de etiquetas futuras:

- `v2026.6.0`, `v2026.6.1`, `v2026.6.2` para la línea de junio.
- `v2026.6.3-beta.1` para una versión preliminar en el tren rápido/latest.
- Un dist-tag futuro de línea de soporte como `stable-2026-6` o `lts-2026-6` puede
  apuntar a una línea mensual, pero hoy no hay ningún canal de ese tipo disponible.

Hasta que llegue esa migración, los canales públicos de actualización siguen siendo `stable`, `beta`
y `dev`.

## Cambiar de canal

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` conserva tu elección en la configuración (`update.channel`) y alinea el
método de instalación:

- **`stable`** (instalaciones de paquete): actualiza mediante el dist-tag de npm `latest`.
- **`beta`** (instalaciones de paquete): prefiere el dist-tag de npm `beta`, pero vuelve a
  `latest` cuando falta `beta` o es anterior a la etiqueta estable actual.
- **`stable`** (instalaciones git): cambia a la etiqueta git estable más reciente.
- **`beta`** (instalaciones git): prefiere la etiqueta git beta más reciente, pero vuelve a
  la etiqueta git estable más reciente cuando beta falta o es anterior.
- **`dev`**: garantiza un checkout de git (por defecto `~/openclaw`, sobrescríbelo con
  `OPENCLAW_GIT_DIR`), cambia a `main`, rebasea sobre upstream, compila e
  instala la CLI global desde ese checkout.

<Tip>
Si quieres stable y dev en paralelo, mantén dos clones y apunta tu gateway al estable.
</Tip>

## Selección puntual de versión o etiqueta

Usa `--tag` para apuntar a un dist-tag, versión o especificación de paquete concretos para una sola
actualización **sin** cambiar tu canal conservado:

```bash
# Install a specific version
openclaw update --tag 2026.4.1-beta.1

# Install from the beta dist-tag (one-off, does not persist)
openclaw update --tag beta

# Install from GitHub main branch (npm tarball)
openclaw update --tag main

# Install a specific npm package spec
openclaw update --tag openclaw@2026.4.1-beta.1
```

Notas:

- `--tag` se aplica **solo a instalaciones de paquete (npm)**. Las instalaciones git lo ignoran.
- La etiqueta no se conserva. Tu siguiente `openclaw update` usa tu canal configurado
  como de costumbre.
- Protección contra degradación: si la versión de destino es anterior a tu versión actual,
  OpenClaw solicita confirmación (sáltala con `--yes`).
- `--channel beta` es distinto de `--tag beta`: el flujo de canal puede volver a
  stable/latest cuando beta falta o es anterior, mientras que `--tag beta` apunta al
  dist-tag `beta` sin procesar para esa ejecución única.

## Ejecución de prueba

Previsualiza lo que haría `openclaw update` sin aplicar cambios:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

La ejecución de prueba muestra el canal efectivo, la versión de destino, las acciones planificadas y
si se requeriría una confirmación de degradación.

## Plugins y canales

Cuando cambias de canal con `openclaw update`, OpenClaw también sincroniza las fuentes de plugins:

- `dev` prefiere los plugins incluidos desde el checkout de git.
- `stable` y `beta` restauran los paquetes de plugins instalados mediante npm.
- Los plugins instalados mediante npm se actualizan después de que se completa la actualización del núcleo.

## Comprobar el estado actual

```bash
openclaw update status
```

Muestra el canal activo, el tipo de instalación (git o paquete), la versión actual y
la fuente (configuración, etiqueta git, rama git o valor predeterminado).

## Prácticas recomendadas para etiquetas

- Etiqueta las versiones en las que quieres que aterricen los checkouts de git (`vYYYY.M.D` para versiones
  estables actuales, `vYYYY.M.D-beta.N` para versiones beta actuales).
- `vYYYY.M.D.beta.N` también se reconoce por compatibilidad, pero prefiere `-beta.N`.
- Las etiquetas heredadas `vYYYY.M.D-<patch>` todavía se reconocen como estables (no beta),
  pero el modelo de soporte mensual planificado usará números de parche normales
  (`vYYYY.M.PATCH`) en lugar de un sufijo de corrección con guion.
- Mantén las etiquetas inmutables: nunca muevas ni reutilices una etiqueta.
- Los dist-tags de npm siguen siendo la fuente de verdad para las instalaciones de npm:
  - `latest` -> estable
  - `beta` -> compilación candidata o compilación estable publicada primero en beta
  - `dev` -> instantánea de main (opcional)

## Disponibilidad de la app para macOS

Las compilaciones beta y dev pueden **no** incluir una versión de la app para macOS. Eso está bien:

- La etiqueta git y el dist-tag de npm aún pueden publicarse.
- Indica "sin compilación de macOS para esta beta" en las notas de la versión o en el changelog.

## Relacionado

- [Actualización](/es/install/updating)
- [Aspectos internos del instalador](/es/install/installer)
