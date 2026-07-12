---
read_when:
    - Quieres cambiar entre estable/estable extendida/beta/desarrollo
    - Quieres fijar una versión, etiqueta o SHA específicos
    - Estás etiquetando o publicando versiones preliminares
sidebarTitle: Release Channels
summary: 'Canales estable, estable ampliado, beta y de desarrollo: semántica, cambio, fijación y etiquetado'
title: Canales de lanzamiento
x-i18n:
    generated_at: "2026-07-12T14:32:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a99e31f5121c0ab8696e638cb10a7ce16e8f32c81e4b2bef1f703eef71191494
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw incluye cuatro canales de actualización:

- **stable**: etiqueta de distribución de npm `latest`. Recomendado para la mayoría de los usuarios.
- **extended-stable**: etiqueta de distribución de npm `extended-stable`. Un canal de paquetes
  nuevo con un mes de soporte rezagado. Solo admite paquetes y la instalación
  se realiza únicamente en primer plano. Una selección almacenada recibe avisos de actualización de solo lectura cuando
  `update.checkOnStart` está habilitado, pero nunca se aplican automáticamente.
- **beta**: etiqueta de distribución de npm `beta`. Recurre a `latest` cuando falta `beta`
  o es anterior a la versión estable actual.
- **dev**: versión más reciente de `main` (git). Etiqueta de distribución de npm `dev` cuando se publica. `main`
  está destinado a la experimentación y el desarrollo activo; puede contener
  funciones incompletas o cambios incompatibles. No lo ejecute para gateways de producción.

Las compilaciones estables suelen publicarse primero en **beta**, se validan allí y después se
promueven a **latest** sin incrementar la versión. Los mantenedores también pueden publicar
directamente en `latest`. Las etiquetas de distribución son la fuente de verdad para las instalaciones mediante npm.

## Cambio de canal

```bash
openclaw update --channel stable
openclaw update --channel extended-stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` conserva la elección en `update.channel` dentro de la configuración y controla ambas
rutas de instalación:

| Canal             | Instalaciones mediante npm/paquetes                                                                                                                                                     | Instalaciones mediante git                                                                                                                                         |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `stable`          | etiqueta de distribución `latest`                                                                                                                                                       | última etiqueta estable de git (excluye `-alpha.N`, `-beta.N`, `-rc.N`, `-dev.N`, `-next.N`, `-preview.N`, `-canary.N`, `-nightly.N` y otros sufijos de prelanzamiento con nombre) |
| `extended-stable` | resuelve el selector público de npm `extended-stable`, verifica el paquete seleccionado exacto e instala esa versión exacta. Falla de forma cerrada sin recurrir a `latest`, `beta` ni `dev`. | no compatible: OpenClaw deja el checkout sin cambios y solicita utilizar una instalación mediante paquetes                                                         |
| `beta`            | etiqueta de distribución `beta`, recurriendo a `latest` cuando falta `beta` o es anterior                                                                                               | última etiqueta beta de git, recurriendo a la última etiqueta estable de git cuando falta la beta o es anterior                                                     |
| `dev`             | etiqueta de distribución `dev` (poco frecuente; la mayoría de los usuarios de desarrollo utilizan instalaciones mediante git)                                                          | obtiene los cambios, reorganiza el checkout sobre la rama `main` del repositorio remoto, compila y reinstala la CLI global                                          |

Para las instalaciones de git de `dev`, el checkout predeterminado es `~/openclaw` (o
`$OPENCLAW_HOME/openclaw` cuando se establece `OPENCLAW_HOME`); se puede sobrescribir con
`OPENCLAW_GIT_DIR`.

<Tip>
Para mantener stable y dev en paralelo, use dos checkouts independientes y dirija cada Gateway al suyo propio.
</Tip>

## Selección puntual de una versión o etiqueta

Use `--tag` para seleccionar una etiqueta de distribución, versión o especificación de paquete concreta para una
sola actualización **sin** cambiar el canal persistente:

```bash
# Instalar una versión específica
openclaw update --tag 2026.4.1-beta.1

# Instalar desde la etiqueta de distribución beta (puntual, no persiste)
openclaw update --tag beta

# Cambiar al checkout dinámico de la rama main de GitHub (persistente)
openclaw update --channel dev

# Instalar una especificación concreta de paquete npm
openclaw update --tag openclaw@2026.4.1-beta.1

# Instalar una vez desde la rama main de GitHub sin conservar el canal
openclaw update --tag main
```

Notas:

- `--tag` se aplica **solo a las instalaciones de paquetes (npm)**; las instalaciones de git lo ignoran.
- La etiqueta no persiste; la siguiente ejecución de `openclaw update` usa el canal
  configurado.
- `--tag main` se asigna a la especificación compatible con npm `github:openclaw/openclaw#main`
  para esa única ejecución. Para una instalación persistente que siga la rama `main`, use
  `openclaw update --channel dev` (las instalaciones de paquetes cambian a un checkout de git)
  o reinstale con el método git del instalador:
  `curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --version main`.
  La ruta de instalación mediante npm rechaza directamente los destinos de origen de GitHub/git y, en su lugar,
  indica que se use el método git.
- Protección contra versiones anteriores: si la versión de destino es anterior a la versión
  actual, OpenClaw solicita confirmación (omítala con `--yes`).
- El canal extended-stable siempre usa su destino de paquete exacto verificado. No es un
  alias puntual de `--tag extended-stable`, y `--tag` no se puede combinar
  con un canal extended-stable efectivo.
- `--channel beta` difiere de `--tag beta`: el flujo del canal puede recurrir
  a stable/latest cuando beta no está disponible o es anterior, mientras que `--tag beta` siempre
  selecciona la etiqueta de distribución `beta` sin procesar para esa única ejecución.

## Simulación

Previsualiza lo que haría `openclaw update` sin realizar cambios:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

La ejecución de prueba informa del canal efectivo, la versión de destino, las acciones previstas
y si sería necesaria una confirmación para cambiar a una versión anterior.

## Plugins y canales

Cambiar de canal con `openclaw update` también sincroniza las fuentes de los plugins:

- `dev` cambia los plugins instalados que tienen una contraparte incluida de nuevo a
  su fuente incluida (checkout de git).
- `stable` y `beta` restauran los paquetes de plugins instalados desde npm o
  ClawHub.
- `extended-stable` resuelve los plugins oficiales de npm aptos con intención
  básica/predeterminada o `latest` a la versión exacta instalada del núcleo. No consulta
  las etiquetas `@extended-stable` de los plugins en tiempo de ejecución.
- Los plugins instalados desde npm se actualizan después de que finalice la actualización del núcleo.

## Comprobar el estado actual

```bash
openclaw update status
```

Muestra el canal activo (con la fuente que lo determinó: configuración, etiqueta de git,
rama de git, versión instalada o valor predeterminado), el tipo de instalación (git o paquete),
la versión actual y la disponibilidad de actualizaciones.

## Prácticas recomendadas para el etiquetado

- Etiqueta las versiones en las que quieres que se sitúen los checkouts de git: `vYYYY.M.PATCH` para estable,
  `vYYYY.M.PATCH-beta.N` para beta. Los sufijos de versiones preliminares con nombre, como
  `-alpha.N`, `-rc.N` y `-next.N`, no son destinos estables ni beta.
- Las etiquetas estables numéricas heredadas, como `vYYYY.M.PATCH-1` y `v1.0.1-1`, todavía
  se reconocen como etiquetas estables de git por compatibilidad.
- `vYYYY.M.PATCH.beta.N` (separado por puntos) también se reconoce por compatibilidad;
  se prefiere `-beta.N`.
- Mantén las etiquetas inmutables: nunca muevas ni reutilices una etiqueta.
- Las dist-tags de npm siguen siendo la fuente de verdad para las instalaciones de npm:
  - `latest` -> estable
  - `extended-stable` -> versión del paquete correspondiente al último mes compatible
  - `beta` -> compilación candidata o compilación estable publicada primero como beta
  - `dev` -> instantánea de la rama principal (opcional)

## Disponibilidad de la aplicación para macOS

Es posible que las compilaciones beta y dev **no** incluyan una versión de la aplicación para macOS. No hay problema:

- La etiqueta de git y la dist-tag de npm pueden publicarse igualmente de forma independiente.
- Indica "no hay compilación para macOS en esta beta" en las notas de la versión o el registro de cambios.

## Contenido relacionado

- [Actualización](/es/install/updating)
- [Funcionamiento interno del instalador](/es/install/installer)
