---
read_when:
    - Quieres cambiar entre stable/extended-stable/beta/dev
    - Quieres fijar una versión, etiqueta o SHA específicos
    - Estás etiquetando o publicando versiones preliminares
sidebarTitle: Release Channels
summary: 'Canales estable, estable extendido, beta y dev: semántica, cambio, fijación y etiquetado'
title: Canales de lanzamiento
x-i18n:
    generated_at: "2026-07-05T11:27:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 51ae160723558722c5a39d25d63b844f761b8f1127957bafe833d047e173e8b6
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw ofrece cuatro canales de actualización:

- **stable**: dist-tag de npm `latest`. Recomendado para la mayoría de los usuarios.
- **extended-stable**: dist-tag de npm `extended-stable`. Un canal de paquetes completamente nuevo, con soporte de mes retrasado. En esta versión es solo de paquete y solo en primer plano.
- **beta**: dist-tag de npm `beta`. Recurre a `latest` cuando `beta` falta o es anterior a la versión estable actual.
- **dev**: punta móvil de `main` (git). dist-tag de npm `dev` cuando se publica. `main` es para experimentación y desarrollo activo; puede contener funcionalidades incompletas o cambios incompatibles. No lo ejecutes en gateways de producción.

Las compilaciones estables suelen enviarse primero a **beta**, se validan allí y luego se promocionan a **latest** sin incrementar la versión. Los mantenedores también pueden publicar directamente en `latest`. Los dist-tags son la fuente de verdad para las instalaciones de npm.

## Cambiar de canal

```bash
openclaw update --channel stable
openclaw update --channel extended-stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` conserva la elección en `update.channel` dentro de la configuración y controla ambas rutas de instalación:

| Canal             | instalaciones npm/paquete                                                                                                                                                                | instalaciones git                                                                                                                                                       |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stable`          | dist-tag `latest`                                                                                                                                                                         | última etiqueta git estable (excluye `-alpha.N`, `-beta.N`, `-rc.N`, `-dev.N`, `-next.N`, `-preview.N`, `-canary.N`, `-nightly.N` y otros sufijos de preversión nombrados) |
| `extended-stable` | resuelve el selector público npm `extended-stable`, verifica el paquete exacto seleccionado e instala esa versión exacta. Falla cerrado sin recurrir a `latest`, `beta` ni `dev`.          | no compatible: OpenClaw deja el checkout sin cambios y te pide usar una instalación de paquete                                                                           |
| `beta`            | dist-tag `beta`, recurriendo a `latest` cuando `beta` falta o es anterior                                                                                                                 | última etiqueta git beta, recurriendo a la última etiqueta git estable cuando beta falta o es anterior                                                                    |
| `dev`             | dist-tag `dev` (raro; la mayoría de usuarios dev ejecutan instalaciones git)                                                                                                              | obtiene cambios, rebasea el checkout sobre la rama upstream `main`, compila y reinstala la CLI global                                                                    |

Para instalaciones git de `dev`, el checkout predeterminado es `~/openclaw` (o
`$OPENCLAW_HOME/openclaw` cuando `OPENCLAW_HOME` está definido); sobrescríbelo con
`OPENCLAW_GIT_DIR`.

<Tip>
Para mantener stable y dev en paralelo, usa dos checkouts separados y apunta cada gateway al suyo.
</Tip>

## Apuntar a una versión o etiqueta puntual

Usa `--tag` para apuntar a un dist-tag, versión o especificación de paquete concretos para una sola actualización **sin** cambiar el canal conservado:

```bash
# Instalar una versión específica
openclaw update --tag 2026.4.1-beta.1

# Instalar desde el dist-tag beta (puntual, no se conserva)
openclaw update --tag beta

# Cambiar al checkout móvil main de GitHub (persistente)
openclaw update --channel dev

# Instalar una especificación concreta de paquete npm
openclaw update --tag openclaw@2026.4.1-beta.1

# Instalar desde GitHub main una vez sin conservar el canal
openclaw update --tag main
```

Notas:

- `--tag` se aplica **solo a instalaciones de paquete (npm)**; las instalaciones git lo ignoran.
- La etiqueta no se conserva; el siguiente `openclaw update` usa el canal configurado.
- `--tag main` se asigna a la especificación compatible con npm `github:openclaw/openclaw#main` para esa ejecución. Para una instalación móvil persistente de `main`, usa `openclaw update --channel dev` (las instalaciones de paquete cambian a un checkout git) o reinstala con el método git del instalador: `curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --version main`. La ruta de instalación npm rechaza directamente los destinos de origen GitHub/git y te dirige al método git en su lugar.
- Protección contra degradación: si la versión de destino es anterior a la versión actual, OpenClaw pide confirmación (omítela con `--yes`).
- Extended-stable siempre usa su destino de paquete exacto verificado. No es un alias puntual de `--tag extended-stable`, y `--tag` no se puede combinar con un canal extended-stable efectivo.
- `--channel beta` difiere de `--tag beta`: el flujo de canal puede recurrir a stable/latest cuando beta falta o es anterior, mientras que `--tag beta` siempre apunta al dist-tag `beta` sin procesar para esa ejecución.

## Simulación

Previsualiza lo que haría `openclaw update` sin hacer cambios:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

La simulación informa del canal efectivo, la versión de destino, las acciones planificadas y si se requeriría una confirmación de degradación.

## Plugins y canales

Cambiar de canal con `openclaw update` también sincroniza las fuentes de plugins:

- `dev` cambia los plugins instalados que tienen una contraparte incluida de vuelta a su fuente incluida (checkout git).
- `stable` y `beta` restauran paquetes de plugin instalados desde npm o desde ClawHub.
- `extended-stable` actualmente usa la línea de plugins stable/latest existente después de que el paquete core se complete correctamente. Los selectores oficiales de plugin `@extended-stable` aún no se consultan.
- Los plugins instalados desde npm se actualizan después de que se completa la actualización core.

## Comprobar el estado actual

```bash
openclaw update status
```

Muestra el canal activo (con la fuente que lo decidió: configuración, etiqueta git, rama git, versión instalada o valor predeterminado), el tipo de instalación (git o paquete), la versión actual y la disponibilidad de actualizaciones.

## Prácticas recomendadas para etiquetar

- Etiqueta las versiones en las que quieres que caigan los checkouts git: `vYYYY.M.PATCH` para estable, `vYYYY.M.PATCH-beta.N` para beta. Los sufijos de preversión nombrados como `-alpha.N`, `-rc.N` y `-next.N` no son destinos stable ni beta.
- Las etiquetas estables numéricas heredadas como `vYYYY.M.PATCH-1` y `v1.0.1-1` aún se reconocen como etiquetas git estables por compatibilidad.
- `vYYYY.M.PATCH.beta.N` (separado por puntos) también se reconoce por compatibilidad; prefiere `-beta.N`.
- Mantén las etiquetas inmutables: nunca muevas ni reutilices una etiqueta.
- Los dist-tags de npm siguen siendo la fuente de verdad para las instalaciones npm:
  - `latest` -> stable
  - `extended-stable` -> versión de paquete con soporte de mes retrasado
  - `beta` -> compilación candidata o compilación estable primero en beta
  - `dev` -> snapshot de main (opcional)

## Disponibilidad de la app para macOS

Las compilaciones beta y dev pueden **no** incluir una versión de la app para macOS. Eso está bien:

- La etiqueta git y el dist-tag npm aún pueden publicarse por sí solos.
- Indica "sin compilación de macOS para esta beta" en las notas de versión o el changelog.

## Relacionado

- [Actualizar](/es/install/updating)
- [Internos del instalador](/es/install/installer)
