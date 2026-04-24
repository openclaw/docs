---
read_when:
    - Quieres cambiar entre stable/beta/dev
    - Quieres fijar una versión, etiqueta o SHA específicos
    - Estás etiquetando o publicando versiones preliminares
sidebarTitle: Release Channels
summary: 'Canales estable, beta y dev: semántica, cambio, fijación y etiquetado'
title: Canales de versiones
x-i18n:
    generated_at: "2026-04-24T05:34:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: d892f3b801cb480652e6e7e757c91c000e842689070564f18782c25108dafa3e
    source_path: install/development-channels.md
    workflow: 15
---

# Canales de desarrollo

OpenClaw distribuye tres canales de actualización:

- **stable**: npm dist-tag `latest`. Recomendado para la mayoría de los usuarios.
- **beta**: npm dist-tag `beta` cuando está actualizado; si beta falta o es más antiguo que
  la versión estable más reciente, el flujo de actualización recurre a `latest`.
- **dev**: cabecera móvil de `main` (git). npm dist-tag: `dev` (cuando se publica).
  La rama `main` es para experimentación y desarrollo activo. Puede contener
  funciones incompletas o cambios incompatibles. No la uses para gateways de producción.

Normalmente publicamos primero las compilaciones estables en **beta**, las probamos allí y luego ejecutamos un
paso explícito de promoción que mueve la compilación validada a `latest` sin
cambiar el número de versión. Los responsables también pueden publicar una versión estable
directamente en `latest` cuando sea necesario. Los dist-tags son la fuente de verdad para las
instalaciones por npm.

## Cambiar de canal

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` conserva tu elección en la configuración (`update.channel`) y alinea el
método de instalación:

- **`stable`** (instalaciones de paquetes): actualiza mediante el dist-tag `latest` de npm.
- **`beta`** (instalaciones de paquetes): prefiere el dist-tag `beta` de npm, pero recurre a
  `latest` cuando `beta` falta o es más antiguo que la etiqueta estable actual.
- **`stable`** (instalaciones git): hace checkout de la etiqueta git estable más reciente.
- **`beta`** (instalaciones git): prefiere la etiqueta git beta más reciente, pero recurre a
  la etiqueta git estable más reciente cuando beta falta o es más antigua.
- **`dev`**: garantiza una copia git (predeterminada `~/openclaw`, se puede anular con
  `OPENCLAW_GIT_DIR`), cambia a `main`, hace rebase sobre upstream, compila e
  instala la CLI global desde esa copia.

Consejo: si quieres stable + dev en paralelo, mantén dos clones y apunta tu
gateway al estable.

## Objetivo puntual de versión o etiqueta

Usa `--tag` para apuntar a un dist-tag, versión o especificación de paquete concretos en una sola
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

- `--tag` se aplica **solo a instalaciones de paquetes (npm)**. Las instalaciones git lo ignoran.
- La etiqueta no se conserva. Tu siguiente `openclaw update` usará tu canal configurado
  como siempre.
- Protección frente a downgrade: si la versión objetivo es más antigua que tu versión actual,
  OpenClaw solicita confirmación (omítela con `--yes`).
- `--channel beta` es distinto de `--tag beta`: el flujo de canal puede recurrir
  a stable/latest cuando beta falta o es más antigua, mientras que `--tag beta` apunta al
  dist-tag `beta` sin procesar solo en esa ejecución.

## Simulación

Previsualiza lo que haría `openclaw update` sin efectuar cambios:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

La simulación muestra el canal efectivo, la versión objetivo, las acciones planificadas y
si sería necesaria una confirmación de downgrade.

## Plugins y canales

Cuando cambias de canal con `openclaw update`, OpenClaw también sincroniza las
fuentes de Plugins:

- `dev` prefiere Plugins incluidos desde la copia git.
- `stable` y `beta` restauran paquetes de Plugins instalados por npm.
- Los Plugins instalados por npm se actualizan después de completarse la actualización del núcleo.

## Comprobar el estado actual

```bash
openclaw update status
```

Muestra el canal activo, el tipo de instalación (git o paquete), la versión actual y
la fuente (configuración, etiqueta git, rama git o valor predeterminado).

## Buenas prácticas de etiquetado

- Etiqueta las versiones en las que quieras que aterricen las copias git (`vYYYY.M.D` para estable,
  `vYYYY.M.D-beta.N` para beta).
- `vYYYY.M.D.beta.N` también se reconoce por compatibilidad, pero se prefiere `-beta.N`.
- Las etiquetas heredadas `vYYYY.M.D-<patch>` siguen reconociéndose como estables (no beta).
- Mantén las etiquetas inmutables: nunca muevas ni reutilices una etiqueta.
- Los dist-tags de npm siguen siendo la fuente de verdad para instalaciones npm:
  - `latest` -> stable
  - `beta` -> compilación candidata o compilación estable publicada primero en beta
  - `dev` -> instantánea de main (opcional)

## Disponibilidad de la app de macOS

Las compilaciones beta y dev pueden **no** incluir una versión de la app de macOS. Eso está bien:

- La etiqueta git y el dist-tag de npm pueden publicarse igualmente.
- Indica claramente "sin compilación de macOS para esta beta" en las notas de la versión o en el changelog.

## Relacionado

- [Actualización](/es/install/updating)
- [Aspectos internos del instalador](/es/install/installer)
