---
read_when:
    - Quieres cambiar entre stable/beta/dev
    - Quieres fijar una versión, etiqueta o SHA específicos
    - Estás etiquetando o publicando versiones preliminares
sidebarTitle: Release Channels
summary: 'Canales estable, beta y de desarrollo: semántica, cambio, fijación y etiquetado'
title: Canales de lanzamiento
x-i18n:
    generated_at: "2026-04-30T05:47:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 741d8ed2a1599264e1b41a99e81fac4b06d14cb026aa945a8757b15e5733f682
    source_path: install/development-channels.md
    workflow: 16
---

# Canales de desarrollo

OpenClaw ofrece tres canales de actualización:

- **stable**: dist-tag de npm `latest`. Recomendado para la mayoría de los usuarios.
- **beta**: dist-tag de npm `beta` cuando está vigente; si beta no existe o es anterior a
  la última versión estable, el flujo de actualización vuelve a `latest`.
- **dev**: punta móvil de `main` (git). dist-tag de npm: `dev` (cuando se publica).
  La rama `main` es para experimentación y desarrollo activo. Puede contener
  funciones incompletas o cambios incompatibles. No la uses para gateways de producción.

Normalmente publicamos primero las compilaciones estables en **beta**, las probamos allí y luego ejecutamos un
paso explícito de promoción que mueve la compilación validada a `latest` sin
cambiar el número de versión. Los mantenedores también pueden publicar una versión estable
directamente en `latest` cuando sea necesario. Los dist-tags son la fuente de verdad para las
instalaciones desde npm.

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
  `latest` cuando `beta` no existe o es anterior a la etiqueta estable actual.
- **`stable`** (instalaciones con git): cambia a la etiqueta git estable más reciente.
- **`beta`** (instalaciones con git): prefiere la etiqueta git beta más reciente, pero vuelve a
  la etiqueta git estable más reciente cuando beta no existe o es anterior.
- **`dev`**: garantiza un checkout de git (predeterminado `~/openclaw`, se puede sobrescribir con
  `OPENCLAW_GIT_DIR`), cambia a `main`, hace rebase sobre upstream, compila e
  instala la CLI global desde ese checkout.

<Tip>
Si quieres stable y dev en paralelo, mantén dos clones y apunta tu gateway al estable.
</Tip>

## Apuntar a una versión o etiqueta puntual

Usa `--tag` para apuntar a un dist-tag, versión o especificación de paquete específicos para una sola
actualización **sin** cambiar tu canal persistido:

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

- `--tag` se aplica **solo a instalaciones de paquete (npm)**. Las instalaciones con git lo ignoran.
- La etiqueta no se conserva. Tu siguiente `openclaw update` usa tu canal configurado
  como de costumbre.
- Protección contra degradaciones: si la versión de destino es anterior a tu versión actual,
  OpenClaw solicita confirmación (omítela con `--yes`).
- `--channel beta` es distinto de `--tag beta`: el flujo del canal puede volver
  a stable/latest cuando beta no existe o es anterior, mientras que `--tag beta` apunta al
  dist-tag `beta` sin procesar para esa ejecución puntual.

## Simulación

Previsualiza lo que haría `openclaw update` sin hacer cambios:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

La simulación muestra el canal efectivo, la versión de destino, las acciones planificadas y
si se requeriría una confirmación de degradación.

## Plugins y canales

Cuando cambias de canal con `openclaw update`, OpenClaw también sincroniza las
fuentes de plugins:

- `dev` prefiere los plugins incluidos desde el checkout de git.
- `stable` y `beta` restauran los paquetes de plugins instalados desde npm.
- Los plugins instalados desde npm se actualizan después de que finaliza la actualización del núcleo.

## Comprobar el estado actual

```bash
openclaw update status
```

Muestra el canal activo, el tipo de instalación (git o paquete), la versión actual y
la fuente (configuración, etiqueta git, rama git o valor predeterminado).

## Buenas prácticas de etiquetado

- Etiqueta las versiones en las que quieres que aterricen los checkouts de git (`vYYYY.M.D` para stable,
  `vYYYY.M.D-beta.N` para beta).
- `vYYYY.M.D.beta.N` también se reconoce por compatibilidad, pero prefiere `-beta.N`.
- Las etiquetas heredadas `vYYYY.M.D-<patch>` se siguen reconociendo como stable (no beta).
- Mantén las etiquetas inmutables: nunca muevas ni reutilices una etiqueta.
- Los dist-tags de npm siguen siendo la fuente de verdad para las instalaciones desde npm:
  - `latest` -> stable
  - `beta` -> compilación candidata o compilación estable publicada primero en beta
  - `dev` -> instantánea de main (opcional)

## Disponibilidad de la app de macOS

Las compilaciones beta y dev pueden **no** incluir una versión de la app de macOS. Está bien:

- La etiqueta git y el dist-tag de npm aún pueden publicarse.
- Indica "sin compilación de macOS para esta beta" en las notas de la versión o el registro de cambios.

## Relacionado

- [Actualización](/es/install/updating)
- [Detalles internos del instalador](/es/install/installer)
