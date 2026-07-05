---
read_when:
    - Quieres cambiar entre stable/extended-stable/beta/dev
    - Quieres fijar una versión, etiqueta o SHA específicos
    - Estás etiquetando o publicando versiones preliminares
sidebarTitle: Release Channels
summary: 'Canales stable, extended-stable, beta y dev: semántica, cambio, fijación y etiquetado'
title: Canales de lanzamiento
x-i18n:
    generated_at: "2026-07-05T01:57:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0bfe2efcd25c74dc165759a8a26f9bebce58a4fdb9711a94713c2ae294172894
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw distribuye cuatro canales de actualización:

- **stable**: npm dist-tag `latest`. Recomendado para la mayoría de los usuarios.
- **extended-stable**: npm dist-tag `extended-stable`. Un canal de paquetes nuevo con
  meses de soporte retrasados. En esta versión solo funciona en primer plano.
- **beta**: npm dist-tag `beta` cuando está actualizado; si beta falta o es anterior a
  la última versión stable, el flujo de actualización vuelve a `latest`.
- **dev**: punta móvil de `main` (git). npm dist-tag: `dev` (cuando se publica).
  La rama `main` es para experimentación y desarrollo activo. Puede contener
  funciones incompletas o cambios incompatibles. No la uses para gateways de producción.

Normalmente publicamos primero las compilaciones stable en **beta**, las probamos allí y luego ejecutamos un
paso explícito de promoción que mueve la compilación validada a `latest` sin
cambiar el número de versión. Los mantenedores también pueden publicar una versión stable
directamente en `latest` cuando sea necesario. Los dist-tags son la fuente de verdad para las
instalaciones de npm.

## Cambiar de canal

```bash
openclaw update --channel stable
openclaw update --channel extended-stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` conserva tu elección en la configuración (`update.channel`) y alinea el
método de instalación:

- **`stable`** (instalaciones de paquetes): actualiza mediante el npm dist-tag `latest`.
- **`extended-stable`** (solo instalaciones de paquetes): resuelve el selector público de npm
  `extended-stable`, verifica la versión exacta del paquete seleccionado e
  instala esa versión exacta. La resolución falla de forma cerrada sin volver a
  `latest`, `beta` ni `dev`.
- **`beta`** (instalaciones de paquetes): prefiere el npm dist-tag `beta`, pero vuelve a
  `latest` cuando `beta` falta o es anterior al tag stable actual.
- **`stable`** (instalaciones de git): extrae el último tag stable de git, excluyendo
  tags semver de versión preliminar como `-alpha.N`, `-beta.N`, `-rc.N`, `-dev.N`,
  `-next.N`, `-preview.N`, `-canary.N`, `-nightly.N` y otros sufijos de versión preliminar.
- **`beta`** (instalaciones de git): prefiere el último tag beta de git, pero vuelve al
  último tag stable de git cuando beta falta o es anterior.
- **`extended-stable`** (instalaciones de git): no compatible. OpenClaw deja el
  checkout sin cambios y te pide que uses una instalación de paquete.
- **`dev`**: asegura un checkout de git (predeterminado `~/openclaw`, o
  `$OPENCLAW_HOME/openclaw` cuando `OPENCLAW_HOME` está definido; sobrescribe con
  `OPENCLAW_GIT_DIR`), cambia a `main`, hace rebase sobre upstream, compila e
  instala la CLI global desde ese checkout.

<Tip>
Si quieres stable y dev en paralelo, mantén dos clones y apunta tu gateway al stable.
</Tip>

## Destinar una versión o tag puntual

Usa `--tag` para apuntar a un dist-tag, versión o especificación de paquete específicos para una sola
actualización **sin** cambiar tu canal persistido:

```bash
# Install a specific version
openclaw update --tag 2026.4.1-beta.1

# Install from the beta dist-tag (one-off, does not persist)
openclaw update --tag beta

# Switch to the moving GitHub main checkout
openclaw update --channel dev

# Install a specific npm package spec
openclaw update --tag openclaw@2026.4.1-beta.1

# Install from GitHub main once without persisting the channel
openclaw update --tag main
```

Notas:

- `--tag` se aplica **solo a instalaciones de paquetes (npm)**. Las instalaciones de git lo ignoran.
- El tag no se conserva. Tu próximo `openclaw update` usa tu canal configurado
  como de costumbre.
- Para instalaciones de paquetes, OpenClaw preempaqueta las especificaciones de código fuente de GitHub/git en un
  tarball temporal antes de la instalación npm preparada. Usa `--channel dev` o
  `--install-method git --version main` cuando quieras que el checkout móvil de `main`
  sea tu instalación persistente.
- Protección contra degradación: si la versión de destino es anterior a tu versión actual,
  OpenClaw solicita confirmación (omítela con `--yes`).
- Extended-stable siempre usa su destino de paquete exacto verificado. No es un
  alias puntual para `--tag extended-stable`, y `--tag` no se puede combinar
  con un canal extended-stable efectivo.
- `--channel beta` es distinto de `--tag beta`: el flujo del canal puede volver
  a stable/latest cuando beta falta o es anterior, mientras que `--tag beta` apunta al
  dist-tag `beta` sin procesar para esa ejecución única.

## Simulación

Previsualiza lo que haría `openclaw update` sin aplicar cambios:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

La simulación muestra el canal efectivo, la versión de destino, las acciones planificadas y
si se requeriría una confirmación de degradación.

## Plugins y canales

Cuando cambias de canal con `openclaw update`, OpenClaw también sincroniza las fuentes de plugins:

- `dev` prefiere los plugins incluidos del checkout de git.
- `stable` y `beta` restauran paquetes de plugins instalados desde npm.
- `extended-stable` actualmente usa la línea existente de plugins stable/latest después de que
  el paquete principal se completa correctamente. Los selectores oficiales de plugin `@extended-stable` aún
  no se consultan.
- Los plugins instalados desde npm se actualizan después de que se complete la actualización principal.

## Comprobar el estado actual

```bash
openclaw update status
```

Muestra el canal activo, el tipo de instalación (git o paquete), la versión actual y
la fuente (configuración, tag de git, rama de git o valor predeterminado).

## Buenas prácticas de etiquetado

- Etiqueta las versiones en las que quieres que aterricen los checkouts de git (`vYYYY.M.PATCH` para stable,
  `vYYYY.M.PATCH-beta.N` para beta; los sufijos semver de versión preliminar con nombre como
  `-alpha.N`, `-rc.N` y `-next.N` no son destinos stable).
- Los tags stable numéricos heredados como `vYYYY.M.PATCH-1` y `v1.0.1-1` todavía
  se reconocen como tags stable de git por compatibilidad.
- `vYYYY.M.PATCH.beta.N` también se reconoce por compatibilidad, pero prefiere `-beta.N`.
- Mantén los tags inmutables: nunca muevas ni reutilices un tag.
- Los npm dist-tags siguen siendo la fuente de verdad para las instalaciones de npm:
  - `latest` -> stable
  - `extended-stable` -> versión de paquete de meses de soporte retrasados
  - `beta` -> compilación candidata o compilación stable que pasa primero por beta
  - `dev` -> instantánea de main (opcional)

## Disponibilidad de la app para macOS

Las compilaciones beta y dev pueden **no** incluir una versión de la app para macOS. Está bien:

- El tag de git y el npm dist-tag aún pueden publicarse.
- Indica "no hay compilación de macOS para esta beta" en las notas de versión o el changelog.

## Relacionado

- [Actualizar](/es/install/updating)
- [Aspectos internos del instalador](/es/install/installer)
