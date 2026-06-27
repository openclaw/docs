---
read_when:
    - Quieres cambiar entre estable/beta/desarrollo
    - Quieres fijar una versión, etiqueta o SHA específicos
    - Estás etiquetando o publicando versiones preliminares
sidebarTitle: Release Channels
summary: 'Canales stable, beta y dev: semántica, cambio, fijación y etiquetado'
title: Canales de lanzamiento
x-i18n:
    generated_at: "2026-06-27T11:46:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b5b0b8b43dd15b3fdd83d28c5d0292d260594325ad6e6e95533720ba3e59277
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw publica tres canales de actualización:

- **stable**: dist-tag de npm `latest`. Recomendado para la mayoría de los usuarios.
- **beta**: dist-tag de npm `beta` cuando está vigente; si beta falta o es anterior a
  la última versión estable, el flujo de actualización vuelve a `latest`.
- **dev**: punta móvil de `main` (git). dist-tag de npm: `dev` (cuando se publica).
  La rama `main` es para experimentación y desarrollo activo. Puede contener
  funcionalidades incompletas o cambios incompatibles. No la uses para gateways de producción.

Normalmente publicamos primero las compilaciones estables en **beta**, las probamos allí y luego ejecutamos un
paso explícito de promoción que mueve la compilación validada a `latest` sin
cambiar el número de versión. Los mantenedores también pueden publicar una versión estable
directamente en `latest` cuando sea necesario. Los dist-tags son la fuente de verdad para las
instalaciones de npm.

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
  `latest` cuando `beta` falta o es anterior a la etiqueta estable actual.
- **`stable`** (instalaciones de git): extrae la última etiqueta estable de git, excluyendo
  etiquetas de prelanzamiento semver como `-alpha.N`, `-beta.N`, `-rc.N`, `-dev.N`,
  `-next.N`, `-preview.N`, `-canary.N`, `-nightly.N` y otros sufijos de prelanzamiento.
- **`beta`** (instalaciones de git): prefiere la última etiqueta beta de git, pero vuelve a
  la última etiqueta estable de git cuando beta falta o es anterior.
- **`dev`**: asegura un checkout de git (por defecto `~/openclaw`, o
  `$OPENCLAW_HOME/openclaw` cuando `OPENCLAW_HOME` está definido; sobrescribe con
  `OPENCLAW_GIT_DIR`), cambia a `main`, hace rebase sobre upstream, compila e
  instala la CLI global desde ese checkout.

<Tip>
Si quieres stable y dev en paralelo, mantén dos clones y apunta tu gateway al estable.
</Tip>

## Apuntar a una versión o etiqueta puntual

Usa `--tag` para apuntar a un dist-tag, versión o especificación de paquete específicos para una sola
actualización **sin** cambiar tu canal persistido:

```bash
# Instalar una versión específica
openclaw update --tag 2026.4.1-beta.1

# Instalar desde el dist-tag beta (puntual, no se conserva)
openclaw update --tag beta

# Cambiar al checkout móvil de main en GitHub
openclaw update --channel dev

# Instalar una especificación de paquete npm específica
openclaw update --tag openclaw@2026.4.1-beta.1

# Instalar una vez desde main de GitHub sin conservar el canal
openclaw update --tag main
```

Notas:

- `--tag` se aplica solo a **instalaciones de paquete (npm)**. Las instalaciones de git lo ignoran.
- La etiqueta no se conserva. Tu siguiente `openclaw update` usa tu canal configurado
  como de costumbre.
- Para instalaciones de paquete, OpenClaw preempaqueta especificaciones de código fuente de GitHub/git en un
  tarball temporal antes de la instalación npm por etapas. Usa `--channel dev` o
  `--install-method git --version main` cuando quieras el checkout móvil de `main`
  como instalación persistente.
- Protección contra downgrade: si la versión objetivo es anterior a tu versión actual,
  OpenClaw pide confirmación (omítela con `--yes`).
- `--channel beta` es diferente de `--tag beta`: el flujo de canal puede volver
  a estable/latest cuando beta falta o es anterior, mientras que `--tag beta` apunta al
  dist-tag `beta` sin procesar para esa ejecución.

## Simulación

Previsualiza lo que haría `openclaw update` sin hacer cambios:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

La simulación muestra el canal efectivo, la versión objetivo, las acciones planificadas y
si se requeriría una confirmación de downgrade.

## Plugins y canales

Cuando cambias de canal con `openclaw update`, OpenClaw también sincroniza las fuentes de Plugin:

- `dev` prefiere los plugins incluidos desde el checkout de git.
- `stable` y `beta` restauran paquetes de Plugin instalados desde npm.
- Los plugins instalados desde npm se actualizan después de que finaliza la actualización del núcleo.

## Comprobar el estado actual

```bash
openclaw update status
```

Muestra el canal activo, el tipo de instalación (git o paquete), la versión actual y
la fuente (configuración, etiqueta de git, rama de git o valor predeterminado).

## Buenas prácticas de etiquetado

- Etiqueta las versiones en las que quieres que aterricen los checkouts de git (`vYYYY.M.PATCH` para stable,
  `vYYYY.M.PATCH-beta.N` para beta; los sufijos de prelanzamiento semver con nombre como
  `-alpha.N`, `-rc.N` y `-next.N` no son objetivos estables).
- Las etiquetas estables numéricas heredadas como `vYYYY.M.PATCH-1` y `v1.0.1-1` aún
  se reconocen como etiquetas estables de git por compatibilidad.
- `vYYYY.M.PATCH.beta.N` también se reconoce por compatibilidad, pero prefiere `-beta.N`.
- Mantén las etiquetas inmutables: nunca muevas ni reutilices una etiqueta.
- Los dist-tags de npm siguen siendo la fuente de verdad para las instalaciones de npm:
  - `latest` -> stable
  - `beta` -> compilación candidata o compilación estable publicada primero en beta
  - `dev` -> instantánea de main (opcional)

## Disponibilidad de la app de macOS

Las compilaciones beta y dev pueden **no** incluir una publicación de la app de macOS. Eso está bien:

- La etiqueta de git y el dist-tag de npm aún pueden publicarse.
- Menciona "sin compilación de macOS para esta beta" en las notas de la versión o en el changelog.

## Relacionado

- [Actualizar](/es/install/updating)
- [Detalles internos del instalador](/es/install/installer)
