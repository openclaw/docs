---
read_when:
    - Desea cambiar entre stable/beta/dev
    - Quieres fijar una versión, una etiqueta o un SHA específicos
    - Estás etiquetando o publicando versiones preliminares
sidebarTitle: Release Channels
summary: 'Canales estable, beta y de desarrollo: semántica, cambio, fijación y etiquetado'
title: Canales de lanzamiento
x-i18n:
    generated_at: "2026-05-07T13:20:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2516165635eb8fbaddf19e07fbb591b659479b5226c2bf467e29247552ababb
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw distribuye tres canales de actualización:

- **stable**: etiqueta de distribución de npm `latest`. Recomendado para la mayoría de los usuarios.
- **beta**: etiqueta de distribución de npm `beta` cuando está actualizada; si beta falta o es más antigua que
  la última versión estable, el flujo de actualización recurre a `latest`.
- **dev**: punta móvil de `main` (git). Etiqueta de distribución de npm: `dev` (cuando se publica).
  La rama `main` es para experimentación y desarrollo activo. Puede contener
  funciones incompletas o cambios incompatibles. No la uses para gateways de producción.

Normalmente publicamos primero las compilaciones estables en **beta**, las probamos allí y luego ejecutamos un
paso explícito de promoción que mueve la compilación validada a `latest` sin
cambiar el número de versión. Los mantenedores también pueden publicar una versión estable
directamente en `latest` cuando sea necesario. Las etiquetas de distribución son la fuente de verdad para las
instalaciones de npm.

## Cambiar de canal

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` conserva tu elección en la configuración (`update.channel`) y alinea el
método de instalación:

- **`stable`** (instalaciones de paquete): actualiza mediante la etiqueta de distribución de npm `latest`.
- **`beta`** (instalaciones de paquete): prefiere la etiqueta de distribución de npm `beta`, pero recurre a
  `latest` cuando `beta` falta o es más antigua que la etiqueta estable actual.
- **`stable`** (instalaciones de git): cambia a la última etiqueta estable de git.
- **`beta`** (instalaciones de git): prefiere la última etiqueta beta de git, pero recurre a
  la última etiqueta estable de git cuando beta falta o es más antigua.
- **`dev`**: garantiza un checkout de git (predeterminado `~/openclaw`, se puede anular con
  `OPENCLAW_GIT_DIR`), cambia a `main`, hace rebase sobre upstream, compila e
  instala la CLI global desde ese checkout.

<Tip>
Si quieres stable y dev en paralelo, mantén dos clones y apunta tu gateway al estable.
</Tip>

## Apuntar a una versión o etiqueta puntual

Usa `--tag` para apuntar a una etiqueta de distribución, versión o especificación de paquete específica para una sola
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

- `--tag` se aplica **solo a instalaciones de paquete (npm)**. Las instalaciones de git lo ignoran.
- La etiqueta no se conserva. Tu siguiente `openclaw update` usa tu canal configurado
  como de costumbre.
- Protección contra degradación: si la versión de destino es más antigua que tu versión actual,
  OpenClaw pide confirmación (omítela con `--yes`).
- `--channel beta` es diferente de `--tag beta`: el flujo de canal puede recurrir
  a stable/latest cuando beta falta o es más antigua, mientras que `--tag beta` apunta a la
  etiqueta de distribución `beta` sin procesar para esa ejecución única.

## Simulación

Previsualiza lo que haría `openclaw update` sin realizar cambios:

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
- `stable` y `beta` restauran paquetes de plugins instalados mediante npm.
- Los plugins instalados mediante npm se actualizan después de que se completa la actualización del núcleo.

## Comprobar el estado actual

```bash
openclaw update status
```

Muestra el canal activo, el tipo de instalación (git o paquete), la versión actual y
la fuente (configuración, etiqueta de git, rama de git o valor predeterminado).

## Buenas prácticas de etiquetado

- Etiqueta las versiones en las que quieres que caigan los checkouts de git (`vYYYY.M.D` para stable,
  `vYYYY.M.D-beta.N` para beta).
- `vYYYY.M.D.beta.N` también se reconoce por compatibilidad, pero prefiere `-beta.N`.
- Las etiquetas heredadas `vYYYY.M.D-<patch>` todavía se reconocen como estables (no beta).
- Mantén las etiquetas inmutables: nunca muevas ni reutilices una etiqueta.
- Las etiquetas de distribución de npm siguen siendo la fuente de verdad para las instalaciones de npm:
  - `latest` -> stable
  - `beta` -> compilación candidata o compilación estable probada primero en beta
  - `dev` -> instantánea de main (opcional)

## Disponibilidad de la app de macOS

Las compilaciones beta y dev pueden **no** incluir una versión de la app de macOS. Eso está bien:

- La etiqueta de git y la etiqueta de distribución de npm todavía pueden publicarse.
- Indica "sin compilación de macOS para esta beta" en las notas de la versión o en el changelog.

## Relacionado

- [Actualizar](/es/install/updating)
- [Internos del instalador](/es/install/installer)
