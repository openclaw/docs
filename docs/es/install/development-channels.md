---
read_when:
    - Quieres cambiar entre estable/estable extendida/beta/desarrollo
    - Quieres fijar una versión, etiqueta o SHA específicos
    - Estás etiquetando o publicando versiones preliminares
sidebarTitle: Release Channels
summary: 'Canales estable, estable con soporte extendido, beta y de desarrollo: semántica, cambio, fijación y etiquetado'
title: Canales de lanzamiento
x-i18n:
    generated_at: "2026-07-11T23:12:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a99e31f5121c0ab8696e638cb10a7ce16e8f32c81e4b2bef1f703eef71191494
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw se distribuye en cuatro canales de actualización:

- **estable**: dist-tag de npm `latest`. Recomendado para la mayoría de los usuarios.
- **estable extendido**: dist-tag de npm `extended-stable`. Un canal de paquetes
  totalmente nuevo para un mes anterior aún compatible. Solo está disponible
  como paquete y la instalación se realiza únicamente en primer plano. Una
  selección almacenada recibe avisos de actualización de solo lectura cuando
  `update.checkOnStart` está habilitado, pero nunca se aplica automáticamente.
- **beta**: dist-tag de npm `beta`. Recurre a `latest` cuando `beta` no existe
  o es anterior a la versión estable actual.
- **desarrollo**: estado más reciente y cambiante de `main` (git). Dist-tag de
  npm `dev` cuando se publica. `main` está destinado a la experimentación y al
  desarrollo activo; puede contener funciones incompletas o cambios
  incompatibles. No lo ejecute en gateways de producción.

Las compilaciones estables suelen publicarse primero en **beta**, se validan
allí y después se promueven a **latest** sin incrementar la versión. Los
mantenedores también pueden publicar directamente en `latest`. Los dist-tags
son la fuente de referencia para las instalaciones mediante npm.

## Cambio de canal

```bash
openclaw update --channel stable
openclaw update --channel extended-stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` guarda la elección en `update.channel` dentro de la configuración y
controla ambas rutas de instalación:

| Canal             | Instalaciones mediante npm/paquetes                                                                                                                                                                                          | Instalaciones mediante git                                                                                                                                                                  |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stable`          | dist-tag `latest`                                                                                                                                                                                                             | etiqueta estable de git más reciente (excluye `-alpha.N`, `-beta.N`, `-rc.N`, `-dev.N`, `-next.N`, `-preview.N`, `-canary.N`, `-nightly.N` y otros sufijos de versión preliminar con nombre) |
| `extended-stable` | resuelve el selector público `extended-stable` de npm, verifica el paquete exacto seleccionado e instala esa versión exacta. Falla de forma segura sin recurrir a `latest`, `beta` ni `dev`.                                    | no compatible: OpenClaw deja el checkout sin cambios y le pide que use una instalación mediante paquete                                                                                    |
| `beta`            | dist-tag `beta`, con recurso a `latest` cuando `beta` no existe o es anterior                                                                                                                                                  | etiqueta beta de git más reciente, con recurso a la etiqueta estable de git más reciente cuando la beta no existe o es anterior                                                            |
| `dev`             | dist-tag `dev` (poco frecuente; la mayoría de los usuarios de desarrollo utilizan instalaciones mediante git)                                                                                                                 | obtiene los cambios, reorganiza mediante rebase el checkout sobre la rama `main` del repositorio remoto, compila y reinstala la CLI global                                                  |

Para las instalaciones de desarrollo mediante git, el checkout predeterminado
es `~/openclaw` (o `$OPENCLAW_HOME/openclaw` cuando se define `OPENCLAW_HOME`);
puede sustituirlo mediante `OPENCLAW_GIT_DIR`.

<Tip>
Para mantener las versiones estable y de desarrollo en paralelo, utilice dos checkouts separados y dirija cada gateway al suyo.
</Tip>

## Selección puntual de una versión o etiqueta

Use `--tag` para seleccionar un dist-tag, una versión o una especificación de
paquete concretos en una sola actualización **sin** cambiar el canal guardado:

```bash
# Instalar una versión específica
openclaw update --tag 2026.4.1-beta.1

# Instalar desde el dist-tag beta (una sola vez, no se guarda)
openclaw update --tag beta

# Cambiar al checkout cambiante de main en GitHub (persistente)
openclaw update --channel dev

# Instalar una especificación de paquete npm específica
openclaw update --tag openclaw@2026.4.1-beta.1

# Instalar una vez desde main en GitHub sin guardar el canal
openclaw update --tag main
```

Notas:

- `--tag` se aplica **solo a las instalaciones mediante paquetes (npm)**; las
  instalaciones mediante git lo ignoran.
- La etiqueta no se guarda; la siguiente ejecución de `openclaw update` utiliza
  el canal configurado.
- `--tag main` se asigna a la especificación compatible con npm
  `github:openclaw/openclaw#main` para esa única ejecución. Para una instalación
  persistente y cambiante de `main`, use `openclaw update --channel dev` (las
  instalaciones mediante paquetes cambian a un checkout de git) o reinstale
  mediante el método git del instalador:
  `curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --version main`.
  La ruta de instalación mediante npm rechaza directamente los destinos de
  origen de GitHub/git y le indica que utilice en su lugar el método git.
- Protección frente a versiones anteriores: si la versión de destino es
  anterior a la actual, OpenClaw solicita confirmación (omítala con `--yes`).
- El canal estable extendido siempre utiliza su destino de paquete exacto
  verificado. No es un alias puntual de `--tag extended-stable`, y `--tag` no
  puede combinarse con un canal estable extendido efectivo.
- `--channel beta` difiere de `--tag beta`: el flujo del canal puede recurrir a
  estable/`latest` cuando la beta no existe o es anterior, mientras que
  `--tag beta` siempre selecciona el dist-tag `beta` sin procesar para esa única
  ejecución.

## Simulación

Obtenga una vista previa de lo que haría `openclaw update` sin realizar cambios:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

La simulación informa del canal efectivo, la versión de destino, las acciones
planificadas y si sería necesaria una confirmación para instalar una versión
anterior.

## Plugins y canales

El cambio de canal mediante `openclaw update` también sincroniza los orígenes
de los plugins:

- `dev` devuelve los plugins instalados que tengan un equivalente incluido a
  su origen incluido (checkout de git).
- `stable` y `beta` restauran los paquetes de plugins instalados mediante npm o
  ClawHub.
- `extended-stable` resuelve los plugins oficiales de npm aptos con una
  intención básica/predeterminada o `latest` a la versión exacta del núcleo
  instalada. No consulta las etiquetas `@extended-stable` de los plugins
  durante la ejecución.
- Los plugins instalados mediante npm se actualizan después de que finalice la
  actualización del núcleo.

## Consulta del estado actual

```bash
openclaw update status
```

Muestra el canal activo (con el origen que lo determinó: configuración,
etiqueta de git, rama de git, versión instalada o valor predeterminado), el tipo
de instalación (git o paquete), la versión actual y la disponibilidad de
actualizaciones.

## Prácticas recomendadas para las etiquetas

- Etiquete las versiones en las que quiera que se sitúen los checkouts de git:
  `vYYYY.M.PATCH` para estable y `vYYYY.M.PATCH-beta.N` para beta. Los sufijos
  de versiones preliminares con nombre, como `-alpha.N`, `-rc.N` y `-next.N`,
  no son destinos estables ni beta.
- Las etiquetas estables numéricas heredadas, como `vYYYY.M.PATCH-1` y
  `v1.0.1-1`, siguen reconociéndose como etiquetas estables de git por
  compatibilidad.
- `vYYYY.M.PATCH.beta.N` (separado por puntos) también se reconoce por
  compatibilidad; se recomienda `-beta.N`.
- Mantenga inmutables las etiquetas: nunca mueva ni reutilice una etiqueta.
- Los dist-tags de npm siguen siendo la fuente de referencia para las
  instalaciones mediante npm:
  - `latest` -> estable
  - `extended-stable` -> versión de paquete del mes anterior aún compatible
  - `beta` -> compilación candidata o compilación estable publicada primero como beta
  - `dev` -> instantánea de main (opcional)

## Disponibilidad de la aplicación para macOS

Las compilaciones beta y de desarrollo pueden **no** incluir una versión de la
aplicación para macOS. No hay ningún problema:

- La etiqueta de git y el dist-tag de npm pueden publicarse igualmente por
  separado.
- Indique «no hay compilación para macOS en esta beta» en las notas de la
  versión o en el registro de cambios.

## Contenido relacionado

- [Actualización](/es/install/updating)
- [Funcionamiento interno del instalador](/es/install/installer)
