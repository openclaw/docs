---
read_when:
    - Quieres cambiar entre stable/beta/dev
    - Quieres fijar una versión, etiqueta o SHA específicos
    - Estás etiquetando o publicando versiones preliminares
sidebarTitle: Release Channels
summary: 'Canales estable, beta y dev: semántica, cambio, fijación y etiquetado'
title: Canales de lanzamiento
x-i18n:
    generated_at: "2026-05-06T05:38:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2516165635eb8fbaddf19e07fbb591b659479b5226c2bf467e29247552ababb
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw distribuye tres canales de actualización:

- **stable**: dist-tag de npm `latest`. Recomendado para la mayoría de los usuarios.
- **beta**: dist-tag de npm `beta` cuando está vigente; si beta no existe o es anterior a
  la última versión estable, el flujo de actualización recurre a `latest`.
- **dev**: punta móvil de `main` (git). dist-tag de npm: `dev` (cuando se publica).
  La rama `main` es para experimentación y desarrollo activo. Puede contener
  funcionalidades incompletas o cambios incompatibles. No la uses para gateways de producción.

Normalmente publicamos primero las compilaciones estables en **beta**, las probamos allí y luego ejecutamos un
paso de promoción explícito que mueve la compilación validada a `latest` sin
cambiar el número de versión. Los mantenedores también pueden publicar una versión estable
directamente en `latest` cuando sea necesario. Los dist-tags son la fuente de verdad para las instalaciones de npm.

## Cambiar de canal

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` conserva tu elección en la configuración (`update.channel`) y alinea el
método de instalación:

- **`stable`** (instalaciones de paquete): actualiza mediante el dist-tag de npm `latest`.
- **`beta`** (instalaciones de paquete): prefiere el dist-tag de npm `beta`, pero recurre a
  `latest` cuando `beta` no existe o es anterior al tag estable actual.
- **`stable`** (instalaciones con git): hace checkout del último tag git estable.
- **`beta`** (instalaciones con git): prefiere el último tag git beta, pero recurre al
  último tag git estable cuando beta no existe o es anterior.
- **`dev`**: garantiza un checkout de git (predeterminado `~/openclaw`, sobrescríbelo con
  `OPENCLAW_GIT_DIR`), cambia a `main`, hace rebase sobre upstream, compila e
  instala la CLI global desde ese checkout.

<Tip>
Si quieres stable y dev en paralelo, mantén dos clones y apunta tu Gateway al estable.
</Tip>

## Apuntar a una versión o tag puntual

Usa `--tag` para apuntar a un dist-tag, versión o especificación de paquete específicos para una sola
actualización **sin** cambiar tu canal persistido:

```bash
# Instalar una versión específica
openclaw update --tag 2026.4.1-beta.1

# Instalar desde el dist-tag beta (puntual, no se conserva)
openclaw update --tag beta

# Instalar desde la rama main de GitHub (tarball de npm)
openclaw update --tag main

# Instalar una especificación de paquete npm específica
openclaw update --tag openclaw@2026.4.1-beta.1
```

Notas:

- `--tag` se aplica **solo a instalaciones de paquete (npm)**. Las instalaciones con git lo ignoran.
- El tag no se conserva. Tu siguiente `openclaw update` usa tu canal configurado
  como de costumbre.
- Protección contra degradación: si la versión objetivo es anterior a tu versión actual,
  OpenClaw solicita confirmación (omite esto con `--yes`).
- `--channel beta` es diferente de `--tag beta`: el flujo de canal puede recurrir
  a stable/latest cuando beta no existe o es anterior, mientras que `--tag beta` apunta al
  dist-tag `beta` sin procesar para esa ejecución.

## Simulación

Previsualiza qué haría `openclaw update` sin realizar cambios:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

La simulación muestra el canal efectivo, la versión objetivo, las acciones previstas y
si se requeriría una confirmación de degradación.

## Plugins y canales

Cuando cambias de canal con `openclaw update`, OpenClaw también sincroniza las
fuentes de plugins:

- `dev` prefiere los plugins incluidos desde el checkout de git.
- `stable` y `beta` restauran los paquetes de plugins instalados mediante npm.
- Los plugins instalados mediante npm se actualizan después de que se complete la actualización principal.

## Comprobar el estado actual

```bash
openclaw update status
```

Muestra el canal activo, el tipo de instalación (git o paquete), la versión actual y
la fuente (configuración, tag git, rama git o valor predeterminado).

## Buenas prácticas para tags

- Etiqueta las versiones en las que quieres que terminen los checkouts de git (`vYYYY.M.D` para stable,
  `vYYYY.M.D-beta.N` para beta).
- `vYYYY.M.D.beta.N` también se reconoce por compatibilidad, pero prefiere `-beta.N`.
- Los tags heredados `vYYYY.M.D-<patch>` todavía se reconocen como stable (no beta).
- Mantén los tags inmutables: nunca muevas ni reutilices un tag.
- Los dist-tags de npm siguen siendo la fuente de verdad para las instalaciones de npm:
  - `latest` -> stable
  - `beta` -> compilación candidata o compilación estable publicada primero en beta
  - `dev` -> instantánea de main (opcional)

## Disponibilidad de la app para macOS

Las compilaciones beta y dev pueden **no** incluir una versión de la app para macOS. Eso está bien:

- El tag de git y el dist-tag de npm aún se pueden publicar.
- Indica "no hay compilación para macOS para esta beta" en las notas de versión o el registro de cambios.

## Relacionado

- [Actualizar](/es/install/updating)
- [Detalles internos del instalador](/es/install/installer)
