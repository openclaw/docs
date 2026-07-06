---
read_when:
    - Desea cambiar entre stable/extended-stable/beta/dev
    - Quieres fijar una versión, etiqueta o SHA específicos
    - Estás etiquetando o publicando versiones preliminares
sidebarTitle: Release Channels
summary: 'Canales estable, estable extendido, beta y dev: semántica, cambio, fijación y etiquetado'
title: Canales de lanzamiento
x-i18n:
    generated_at: "2026-07-06T10:50:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 00b35a9dd74a2a5ffad67b28538d0e210634fa474b70b65aeba49a09c0a73368
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw distribuye cuatro canales de actualización:

- **stable**: dist-tag de npm `latest`. Recomendado para la mayoría de los usuarios.
- **extended-stable**: dist-tag de npm `extended-stable`. Un canal de paquetes totalmente nuevo,
  retrasado por mes con soporte. En esta versión es solo para paquetes y solo en primer plano.
- **beta**: dist-tag de npm `beta`. Recurre a `latest` cuando `beta` falta
  o es anterior a la versión estable actual.
- **dev**: punta móvil de `main` (git). dist-tag de npm `dev` cuando se publica. `main`
  es para experimentación y desarrollo activo; puede contener funciones incompletas
  o cambios incompatibles. No lo use para Gateways de producción.

Las compilaciones estables suelen publicarse primero en **beta**, validarse allí y luego
promocionarse a **latest** sin incrementar la versión. Los mantenedores también pueden publicar
directamente en `latest`. Los dist-tags son la fuente de referencia para las instalaciones de npm.

## Cambiar de canal

```bash
openclaw update --channel stable
openclaw update --channel extended-stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` conserva la elección en `update.channel` dentro de la configuración e impulsa ambas
rutas de instalación:

| Canal             | instalaciones de npm/paquete                                                                                                                                                          | instalaciones de git                                                                                                                                               |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `stable`          | dist-tag `latest`                                                                                                                                                                      | última etiqueta git estable (excluye `-alpha.N`, `-beta.N`, `-rc.N`, `-dev.N`, `-next.N`, `-preview.N`, `-canary.N`, `-nightly.N` y otros sufijos de prelanzamiento con nombre) |
| `extended-stable` | resuelve el selector público de npm `extended-stable`, verifica el paquete exacto seleccionado e instala esa versión exacta. Falla de forma cerrada sin recurrir a `latest`, `beta` ni `dev`. | no compatible: OpenClaw deja el checkout sin cambios y le pide usar una instalación de paquete                                                                     |
| `beta`            | dist-tag `beta`, con respaldo a `latest` cuando `beta` falta o es anterior                                                                                                              | última etiqueta git beta, con respaldo a la última etiqueta git estable cuando beta falta o es anterior                                                           |
| `dev`             | dist-tag `dev` (poco frecuente; la mayoría de usuarios de dev usan instalaciones de git)                                                                                                | obtiene cambios, aplica rebase del checkout sobre la rama upstream `main`, compila y reinstala la CLI global                                                      |

Para instalaciones git de `dev`, el checkout predeterminado es `~/openclaw` (o
`$OPENCLAW_HOME/openclaw` cuando `OPENCLAW_HOME` está definido); reemplácelo con
`OPENCLAW_GIT_DIR`.

<Tip>
Para mantener stable y dev en paralelo, use dos checkouts separados y apunte cada Gateway al suyo.
</Tip>

## Apuntar a una versión o etiqueta puntual

Use `--tag` para apuntar a un dist-tag, una versión o una especificación de paquete específicos para una
sola actualización **sin** cambiar el canal conservado:

```bash
# Install a specific version
openclaw update --tag 2026.4.1-beta.1

# Install from the beta dist-tag (one-off, does not persist)
openclaw update --tag beta

# Switch to the moving GitHub main checkout (persistent)
openclaw update --channel dev

# Install a specific npm package spec
openclaw update --tag openclaw@2026.4.1-beta.1

# Install from GitHub main once without persisting the channel
openclaw update --tag main
```

Notas:

- `--tag` se aplica **solo a instalaciones de paquete (npm)**; las instalaciones de git lo ignoran.
- La etiqueta no se conserva; el siguiente `openclaw update` usa el canal configurado.
- `--tag main` se asigna a la especificación compatible con npm `github:openclaw/openclaw#main`
  para esa ejecución. Para una instalación persistente de `main` móvil, use
  `openclaw update --channel dev` (las instalaciones de paquete cambian a un checkout de git)
  o reinstale con el método git del instalador:
  `curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --version main`.
  La ruta de instalación de npm rechaza directamente los destinos de origen GitHub/git y lo dirige
  al método git en su lugar.
- Protección contra versiones anteriores: si la versión de destino es anterior a la versión actual,
  OpenClaw solicita confirmación (omítala con `--yes`).
- Extended-stable siempre usa su destino de paquete exacto verificado. No es un alias puntual
  de `--tag extended-stable`, y `--tag` no puede combinarse con un canal extended-stable efectivo.
- `--channel beta` difiere de `--tag beta`: el flujo del canal puede recurrir a stable/latest
  cuando beta falta o es anterior, mientras que `--tag beta` siempre apunta al dist-tag `beta`
  sin procesar para esa ejecución.

## Ensayo

Previsualice qué haría `openclaw update` sin realizar cambios:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

El ensayo informa el canal efectivo, la versión de destino, las acciones planificadas
y si sería necesaria una confirmación de instalación de una versión anterior.

## Plugins y canales

Cambiar de canal con `openclaw update` también sincroniza las fuentes de plugins:

- `dev` cambia los plugins instalados que tienen una contraparte incluida de vuelta a
  su fuente incluida (checkout de git).
- `stable` y `beta` restauran paquetes de plugins instalados desde npm o ClawHub.
- `extended-stable` resuelve plugins oficiales de npm elegibles con intención desnuda/predeterminada
  o `latest` a la versión exacta del núcleo instalada. No consulta etiquetas
  `@extended-stable` de plugins en tiempo de ejecución.
- Los plugins instalados desde npm se actualizan después de que finaliza la actualización del núcleo.

## Comprobar el estado actual

```bash
openclaw update status
```

Muestra el canal activo (con la fuente que lo decidió: configuración, etiqueta git,
rama git, versión instalada o valor predeterminado), el tipo de instalación (git o paquete),
la versión actual y la disponibilidad de actualizaciones.

## Prácticas recomendadas de etiquetado

- Etiquete las versiones en las que quiere que aterricen los checkouts de git: `vYYYY.M.PATCH` para stable,
  `vYYYY.M.PATCH-beta.N` para beta. Los sufijos de prelanzamiento con nombre, como
  `-alpha.N`, `-rc.N` y `-next.N`, no son destinos stable ni beta.
- Las etiquetas estables numéricas heredadas, como `vYYYY.M.PATCH-1` y `v1.0.1-1`, siguen
  reconociéndose como etiquetas git estables por compatibilidad.
- `vYYYY.M.PATCH.beta.N` (separado por puntos) también se reconoce por compatibilidad;
  prefiera `-beta.N`.
- Mantenga las etiquetas inmutables: nunca mueva ni reutilice una etiqueta.
- Los dist-tags de npm siguen siendo la fuente de referencia para las instalaciones de npm:
  - `latest` -> stable
  - `extended-stable` -> versión de paquete retrasada por mes con soporte
  - `beta` -> compilación candidata o compilación estable publicada primero en beta
  - `dev` -> instantánea de main (opcional)

## Disponibilidad de la app para macOS

Las compilaciones beta y dev pueden **no** incluir una versión de la app para macOS. Eso está bien:

- La etiqueta git y el dist-tag de npm aún pueden publicarse por sí solos.
- Indique "sin compilación para macOS para esta beta" en las notas de la versión o el changelog.

## Relacionado

- [Actualización](/es/install/updating)
- [Funcionamiento interno del instalador](/es/install/installer)
