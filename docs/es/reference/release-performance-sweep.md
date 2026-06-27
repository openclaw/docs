---
read_when:
    - Estás validando la limpieza de rendimiento y tamaño de paquete de mayo de 2026
    - Necesitas los números detrás de la publicación del blog sobre rendimiento y dependencias de OpenClaw
    - Está cambiando los controles de lanzamiento, el shrinkwrap de paquetes o los límites de dependencias de Plugin
summary: Resumen visual y evidencia técnica de la limpieza de rendimiento, tamaño del paquete, dependencias y shrinkwrap de mayo de 2026
title: Barrido de rendimiento de la versión
x-i18n:
    generated_at: "2026-06-27T12:53:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 93438b8037a40ed9e5590854926badfe943d440e4c585e6290d29b54764e861b
    source_path: reference/release-performance-sweep.md
    workflow: 16
---

Esta página recopila la evidencia detrás de la limpieza de rendimiento,
tamaño de paquete, dependencias y shrinkwrap de OpenClaw de mayo de 2026. Es el complemento técnico
de la publicación pública del blog.

Aquí se combinan dos auditorías:

- **Barrido de rendimiento de la versión:** GitHub Releases desde `v2026.5.28` hacia atrás hasta
  la versión estable `v2026.4.23`, usando el flujo de trabajo `OpenClaw Performance`,
  `profile=smoke`, carril de proveedor simulado. La mayoría de las filas de etiquetas son una muestra; las
  filas `v2026.5.27` y `v2026.5.28` usan los artefactos más recientes de rama de versión con repetición 3.
- **Contexto anterior de abril:** líneas base publicadas de proveedor simulado de `clawgrit-reports`
  desde `v2026.4.1` hasta `v2026.5.2`, usadas solo para evitar tratar
  las versiones rotas de finales de abril como la línea base pública de rendimiento.
- **Barrido de huella de instalación:** instalaciones nuevas con `npm install --ignore-scripts`
  en paquetes temporales, con `du -sk node_modules` para el tamaño y un recorrido de
  `node_modules` para los conteos de instancias de paquetes.
- **Barrido de tamaño de paquete npm:** `npm pack openclaw@<version> --dry-run --json`
  para versiones publicadas, registrando el tamaño del tarball comprimido, el tamaño descomprimido y
  el conteo de archivos.

<Warning>
El barrido principal de rendimiento usa una muestra smoke por etiqueta, excepto las
filas `v2026.5.27` y `v2026.5.28`, que usan los artefactos más recientes
de rama de versión con repetición 3. El contexto anterior de abril usa medianas de repetición 3
publicadas de `clawgrit-reports`. Trata las cifras como evidencia de tendencia y
señal para buscar regresiones, no como estadísticas de puerta de lanzamiento.
</Warning>

## Instantánea

Cobertura de rendimiento: **77 versiones solicitadas**, **74 puntos respaldados por artefactos**,
y **3 ejecuciones de CI no disponibles**. Último punto estable medido: `v2026.5.28`.

<CardGroup cols={2}>
  <Card title="Turno estable del agente" icon="gauge">
    **Turno en frío 5,1 veces más rápido**

    - `v2026.4.14`: 9,8 s
    - `v2026.5.28`: 1,9 s

  </Card>
  <Card title="Paquete publicado" icon="package">
    **Tarball de 17,9 MB**

    Último paquete estable, por debajo del pico de tamaño de paquete de marzo de 43,3 MB.

  </Card>
  <Card title="Última instalación estable" icon="hard-drive">
    **Instalación nueva de 361,7 MiB**

    `v2026.5.28` reduce drásticamente el árbol de dependencias anidado de OpenClaw, pero aún
    queda un árbol anidado más pequeño de 259,7 MiB en la auditoría de instalación local.

  </Card>
  <Card title="Grafo de dependencias" icon="boxes">
    **300 paquetes instalados**

    Última versión estable, medida como raíces únicas de nombre/versión de paquete en una
    instalación nueva con scripts deshabilitados.

  </Card>
</CardGroup>

## Cronología de la huella de instalación

<CardGroup cols={2}>
  <Card title="Máximo mensual" icon="triangle-alert">
    **645 dependencias**

    `2026.2.26` fue el máximo mensual de conteo de dependencias en esta muestra.

  </Card>
  <Card title="Shrinkwrap introducido" icon="lock">
    **Instalación de 1020,6 MB**

    `2026.5.22` añadió shrinkwrap raíz y expuso un problema de forma del paquete:
    911,8 MB terminaron bajo `openclaw/node_modules` anidado.

  </Card>
  <Card title="Última estable" icon="tag">
    **Instalación de 361,7 MiB**

    `2026.5.28` reduce el tamaño de instalación nueva en un 52,8 % frente a `2026.5.27`, pero todavía
    instala un árbol anidado de OpenClaw de 259,7 MiB.

  </Card>
  <Card title="Grafo de dependencias" icon="scissors">
    **300 raíces de paquetes**

    `2026.5.28` instala 71 raíces únicas de nombre/versión de paquete menos que
    `2026.5.27`.

  </Card>
</CardGroup>

<Tip>
Shrinkwrap no era el problema por sí solo. La mala forma del paquete sí lo era.
`v2026.5.28` todavía publica shrinkwrap, pero el árbol de dependencias anidado es mucho
más pequeño y el despliegue de canvas para todas las plataformas desapareció en la auditoría local.
</Tip>

## Qué cambió en 5.28

La limpieza entre `v2026.5.27` y `v2026.5.28` redujo el grafo de instalación
predeterminada en lugar de eliminar las capacidades en sí.

<CardGroup cols={2}>
  <Card title="Root default graph" icon="git-branch">
    Las raíces únicas de nombre/versión de paquete bajaron de **371** a **300**.
    Las instancias de paquetes bajaron de **372** a **301**.
  </Card>
  <Card title="Nested tree" icon="unplug">
    El `openclaw/node_modules` anidado bajó de **656.1MiB** a **259.7MiB** en
    la misma auditoría de instalación local.
  </Card>
  <Card title="Native optional cones" icon="cpu">
    El cono de paquetes nativos `@napi-rs/canvas` para todas las plataformas dejó
    de llegar a la instalación predeterminada.
  </Card>
  <Card title="Supply-chain surface" icon="shield">
    Menos paquetes predeterminados significa menos tarballs, mantenedores,
    binarios nativos, comportamientos durante la instalación y rutas de
    actualización transitivas en las que confiar de forma predeterminada.
  </Card>
</CardGroup>

## Cifras principales

No uses las filas rotas de finales de abril como referencias públicas de rendimiento.
`v2026.4.23` y `v2026.4.29` son evidencia útil de regresión, pero los grandes
deltas de estilo `14x` describen principalmente la recuperación de una línea de
versiones defectuosa.

Para la narrativa del blog, usa la referencia publicada de principios de abril como escala:

| Métrica            | Referencia de principios de abril | `v2026.5.28` |                         Delta |
| ------------------ | --------------------------------: | -----------: | ----------------------------: |
| Turno frío de agente |                           9,819ms |      1,908ms | 80.6% menos, 5.1x más rápido |
| Turno cálido de agente |                         7,458ms |      1,870ms | 74.9% menos, 4.0x más rápido |
| RSS pico del agente |                           686.2MB |      581.0MB |                   15.3% menos |

La referencia de principios de abril es `v2026.4.14` de la ejecución publicada
de proveedor simulado de `clawgrit-reports`. Esa ejecución usó repetición 3 y
falló solo porque no se emitió la línea temporal de diagnóstico; las medianas de
frío, cálido y RSS siguen siendo útiles como escala aproximada. Trátalo como
contexto narrativo, no como una estadística de puerta de lanzamiento.

Dentro del barrido de mayo, la fila más reciente de la rama de lanzamiento se movió
de forma material desde `v2026.5.2`:

| Métrica            | `v2026.5.2` | `v2026.5.28` |       Delta |
| ------------------ | ----------: | -----------: | ----------: |
| Turno frío de agente |     3,897ms |      1,908ms | 51.0% menos |
| Turno cálido de agente |    3,610ms |      1,870ms | 48.2% menos |
| RSS pico del agente |     613.7MB |      581.0MB |  5.3% menos |

Comparado con la versión estable anterior:

| Métrica            | `v2026.5.27` | `v2026.5.28` |       Delta |
| ------------------ | -----------: | -----------: | ----------: |
| Turno frío de agente |      2,231ms |      1,908ms | 14.5% menos |
| Turno cálido de agente |     2,226ms |      1,870ms | 16.0% menos |
| RSS pico del agente |      649.0MB |      581.0MB | 10.5% menos |

### Huella de instalación

| Métrica                                             | Referencia | `v2026.5.28` |       Delta |
| --------------------------------------------------- | ---------: | -----------: | ----------: |
| Tamaño de instalación desde el pico de `2026.5.22`  |  1,020.6MB |     361.7MiB | 64.6% menos |
| Tamaño de instalación desde la versión más reciente `2026.5.27` |  767.1MiB |     361.7MiB | 52.8% menos |
| Dependencias desde el máximo mensual `2026.2.26`    |        645 |          300 | 53.5% menos |
| Dependencias desde la versión más reciente `2026.5.27` |      371 |          300 | 19.1% menos |
| `openclaw/node_modules` anidado desde `2026.5.22`   |    911.8MB |     259.7MiB | 71.5% menos |
| `openclaw/node_modules` anidado desde `2026.5.27`   |   656.1MiB |     259.7MiB | 60.4% menos |

### Tamaño del paquete npm

| Versión     | Tarball comprimido | Paquete desempaquetado | Archivos | Notas                                      |
| ----------- | -----------------: | ---------------------: | -------: | ------------------------------------------ |
| `2026.1.30` |             12.8MB |                 33.5MB |    4,607 | paquete renombrado temprano                |
| `2026.2.26` |             23.6MB |                 82.9MB |   10,125 | crecimiento de funciones                   |
| `2026.3.31` |             43.3MB |                182.6MB |   21,037 | punto máximo de tamaño del paquete         |
| `2026.4.29` |             22.9MB |                 74.6MB |    9,309 | poda del paquete visible                   |
| `2026.5.12` |             23.4MB |                 80.1MB |   12,035 | gran separación de plugins externos        |
| `2026.5.22` |             17.2MB |                 76.9MB |   12,386 | docs/assets excluidos del paquete          |
| `2026.5.27` |             17.8MB |                 79.0MB |   12,509 | paquete estable anterior                   |
| `2026.5.28` |             17.9MB |                 81.0MB |    9,082 | paquete estable más reciente               |

`2026.5.12` es el hito visible de extracción de plugins en el registro de cambios:
Amazon Bedrock, Bedrock Mantle, Slack, OpenShell sandbox, Anthropic Vertex,
Matrix y WhatsApp salieron de la ruta de dependencias del núcleo para que sus
conos de dependencias se instalen con esos plugins en lugar de con cada instalación
del núcleo.

## Resumen de turnos del agente Kova

La línea estable de abril contiene dos historias diferentes. Principios de abril
era lenta pero reconocible. Finales de abril se convirtió en un precipicio de
regresión. `v2026.5.2` es donde el carril de proveedor simulado baja por primera
vez al rango de 3-5 s y empieza a pasar de forma constante en el barrido suministrado.

Contexto publicado anterior:

| Lanzamiento  | Kova  | Turno frío | Turno cálido | RSS pico del agente |
| ------------ | ----- | ---------: | -----------: | ------------------: |
| `v2026.4.10` | FALLA |   11,031ms |      7,962ms |             679.0MB |
| `v2026.4.12` | FALLA |   11,965ms |      8,289ms |             713.5MB |
| `v2026.4.14` | FALLA |    9,819ms |      7,458ms |             686.2MB |
| `v2026.4.20` | FALLA |   22,314ms |     18,811ms |             810.8MB |
| `v2026.4.22` | FALLA |    9,630ms |      7,459ms |             743.0MB |

Barrido suministrado:

| Lanzamiento         | Kova    | Turno frío | Turno cálido | RSS pico del agente |
| ------------------- | ------- | ---------: | -----------: | ------------------: |
| `v2026.4.23`        | FALLA   |   47,847ms |      8,010ms |           1,082.7MB |
| `v2026.4.24`        | FALLA   |   48,264ms |     25,483ms |             996.0MB |
| `v2026.4.25`        | FALLA   |   81,080ms |     59,172ms |           1,113.9MB |
| `v2026.4.26`        | FALLA   |   76,771ms |     54,941ms |           1,140.8MB |
| `v2026.4.27`        | FALLA   |   60,902ms |     33,699ms |           1,156.0MB |
| `v2026.4.29`        | FALLA   |   94,031ms |     57,334ms |           3,613.7MB |
| `v2026.5.2`         | APROBADO |   3,897ms |      3,610ms |             613.7MB |
| `v2026.5.7`         | APROBADO |   3,923ms |      3,693ms |             654.1MB |
| `v2026.5.12`        | APROBADO |   7,248ms |      6,629ms |             834.8MB |
| `v2026.5.18`        | APROBADO |   3,301ms |      2,913ms |             630.3MB |
| `v2026.5.20`        | APROBADO |   3,413ms |      2,952ms |             643.2MB |
| `v2026.5.22`        | APROBADO |   4,494ms |      4,093ms |             654.3MB |
| `v2026.5.26`        | APROBADO |   2,626ms |      2,282ms |             660.4MB |
| `v2026.5.27-beta.1` | APROBADO |   2,575ms |      2,217ms |             635.3MB |
| `v2026.5.27`        | APROBADO |   2,231ms |      2,226ms |             649.0MB |
| `v2026.5.28`        | APROBADO |   1,908ms |      1,870ms |             581.0MB |

## Sondeos de fuente

Los sondeos de fuente se omitieron para 17 refs antiguas exitosas porque esos
árboles de fuente aún no tenían los puntos de entrada de sondeo requeridos.
Las métricas de turnos de agente siguen existiendo para esas refs.

Puntos representativos de sondeo de fuente:

| Lanzamiento         | `readyz` p50 predeterminado | `readyz` p50 con 50 plugins | Salud de CLI p50 | RSS máximo del Plugin |
| ------------------- | --------------------------: | --------------------------: | ---------------: | --------------------: |
| `v2026.4.29`        |                     2,819ms |                     2,618ms |          1,679ms |               389.0MB |
| `v2026.5.2`         |                     2,324ms |                     2,013ms |          1,384ms |               377.2MB |
| `v2026.5.7`         |                     1,649ms |                     1,540ms |          1,175ms |               387.6MB |
| `v2026.5.18`        |                     1,942ms |                     1,927ms |            607ms |               426.5MB |
| `v2026.5.20`        |                     1,966ms |                     1,987ms |            621ms |               455.0MB |
| `v2026.5.22`        |                     2,081ms |                     1,884ms |          5,095ms |               444.2MB |
| `v2026.5.26`        |                     1,546ms |                     1,634ms |            656ms |               400.4MB |
| `v2026.5.27-beta.1` |                     1,462ms |                     1,548ms |            548ms |               394.0MB |
| `v2026.5.27`        |                     1,491ms |                     1,571ms |            553ms |               401.5MB |
| `v2026.5.28`        |                     1,457ms |                     1,474ms |            623ms |               386.1MB |

El pico de salud de la CLI de `v2026.5.22` es visible en esta tabla aunque el
carril agent-turn todavía pasó. Conserva las sondas de origen al investigar
regresiones dirigidas de CLI o Gateway.

## Auditoría de huella de instalación

Las muestras de dependencias usan una versión estable por mes, además del evento
de introducción de shrinkwrap de `2026.5.22` y la versión más reciente
`2026.5.28`.

| Punto              | Dependencias instaladas | Instalación nueva | Paquete OpenClaw | `openclaw/node_modules` anidado | Shrinkwrap raíz | Comportamiento de instalación de Canvas      |
| ------------------ | ----------------------: | ----------------: | ---------------: | -------------------------------: | --------------- | -------------------------------------------- |
| Ene `2026.1.30`    |                     605 |           438.4MB |           45.8MB |                            2.4MB | no              | wrapper de nivel superior + `darwin-arm64`   |
| Feb `2026.2.26`    |                     645 |           575.7MB |          110.1MB |                            3.5MB | no              | wrapper de nivel superior + `darwin-arm64`   |
| Mar `2026.3.31`    |                     438 |           584.1MB |          234.8MB |                              0MB | no              | wrapper de nivel superior + `darwin-arm64`   |
| Abr `2026.4.29`    |                     392 |           335.0MB |           97.4MB |                              0MB | no              | ninguno instalado                            |
| `2026.5.22`        |                     401 |         1,020.6MB |        1,020.4MB |                          911.8MB | sí              | anidado: los 12 paquetes `@napi-rs/canvas`   |
| May `2026.5.26`    |                     371 |           767.5MB |          767.4MB |                          656.4MB | sí              | anidado: los 12 paquetes `@napi-rs/canvas`   |
| `2026.5.27`        |                     371 |          767.1MiB |         766.9MiB |                         656.1MiB | sí              | anidado: los 12 paquetes `@napi-rs/canvas`   |
| Última `2026.5.28` |                     300 |          361.7MiB |         361.6MiB |                         259.7MiB | sí              | ninguno instalado                            |

### Límite de shrinkwrap

<CardGroup cols={2}>
  <Card title="Before shrinkwrap" icon="unlock">
    `2026.5.20` no tiene shrinkwrap raíz ni un árbol grande de dependencias
    anidadas de OpenClaw.
  </Card>
  <Card title="Introduced" icon="lock">
    `2026.5.22` añade shrinkwrap raíz e instala 911.8MB bajo el
    `openclaw/node_modules` anidado.
  </Card>
  <Card title="Latest stable" icon="tag">
    `2026.5.28` conserva shrinkwrap y aún instala 259.7MiB bajo el
    `openclaw/node_modules` anidado.
  </Card>
  <Card title="Canvas fanout fixed" icon="check">
    `2026.5.28` ya no instala ningún paquete `@napi-rs/canvas` en la auditoría
    local de instalación nueva.
  </Card>
</CardGroup>

La inspección del tarball publicado verifica el límite:

| Versión     | ¿Estable publicada? | `npm-shrinkwrap.json` raíz | Notas                                      |
| ----------- | ------------------- | -------------------------- | ------------------------------------------ |
| `2026.5.20` | sí                  | no                         | última versión estable antes de shrinkwrap |
| `2026.5.21` | no                  | n/d                        | sin versión npm estable                    |
| `2026.5.22` | sí                  | sí                         | shrinkwrap introducido                     |
| `2026.5.23` | no                  | n/d                        | sin versión npm estable                    |
| `2026.5.24` | no                  | n/d                        | sin versión npm estable                    |
| `2026.5.25` | no                  | n/d                        | sin versión npm estable                    |
| `2026.5.26` | sí                  | sí                         | el árbol de dependencias anidado persiste  |
| `2026.5.27` | sí                  | sí                         | el árbol de dependencias anidado persiste  |
| `2026.5.28` | sí                  | sí                         | árbol de dependencias anidado mucho menor  |

La distinción importante: **shrinkwrap en sí no es el problema**.
`v2026.5.28` todavía distribuye shrinkwrap raíz. El problema era la forma del
paquete, que hacía que npm materializara un gran árbol de dependencias anidadas
de OpenClaw y los 12 paquetes de plataforma `@napi-rs/canvas`. El árbol anidado
es más pequeño en `v2026.5.28`, y el despliegue de plataformas de canvas ya no
aparece en la auditoría local.

Para una explicación en lenguaje claro de shrinkwrap y las comprobaciones de
paquetes a nivel de mantenedor, consulta [npm shrinkwrap](/es/gateway/security/shrinkwrap).

## Interpretación de cadena de suministro

El recuento de dependencias es una métrica de seguridad operativa, no solo una
métrica de tamaño de instalación. Cada paquete amplía el conjunto de
mantenedores, tarballs, actualizaciones transitivas, binarios nativos
opcionales y comportamientos en tiempo de instalación en los que los operadores
deben confiar.

La dirección de limpieza es:

- mantener las capacidades pesadas y opcionales fuera de la instalación
  predeterminada del núcleo
- hacer que los paquetes de plugins sean dueños de su grafo de dependencias de
  runtime
- evitar reparaciones del gestor de paquetes en runtime durante el arranque de
  Gateway
- preservar instalaciones deterministas sin provocar la materialización de
  paquetes nativos para todas las plataformas
- mantener los scripts de instalación deshabilitados en las rutas de aceptación
  y medición de paquetes
- detectar árboles de dependencias anidados y explosiones de dependencias
  opcionales nativas antes de publicar

Documentos relacionados:

- [Resolución de dependencias de Plugin](/es/plugins/dependency-resolution)
- [Inventario de plugins](/es/plugins/plugin-inventory)
- [Validación completa de versión](/es/reference/full-release-validation)
