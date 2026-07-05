---
read_when:
    - Estás validando la limpieza de rendimiento y tamaño de paquete de mayo de 2026
    - Necesitas los números detrás de la publicación del blog sobre rendimiento y dependencias de OpenClaw
    - Estás cambiando las puertas de lanzamiento, el shrinkwrap de paquetes o los límites de dependencias de plugins
summary: Resumen visual y evidencia técnica de la limpieza de rendimiento, tamaño de paquete, dependencias y shrinkwrap de mayo de 2026
title: Barrido de rendimiento de lanzamiento
x-i18n:
    generated_at: "2026-07-05T11:41:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e98ffc9d63e14e078a19368917eb4278695e1426048dc21942f928af145d5e1
    source_path: reference/release-performance-sweep.md
    workflow: 16
---

Esta página recopila la evidencia detrás de la limpieza de rendimiento,
tamaño de paquete, dependencias y shrinkwrap de OpenClaw de mayo de 2026. Es el complemento técnico
de la publicación pública del blog.

Aquí se combinan dos auditorías:

- **Barrido de rendimiento de la versión:** GitHub Releases desde `v2026.5.28` hacia atrás hasta
  la estable `v2026.4.23`, usando el flujo de trabajo `OpenClaw Performance`,
  `profile=smoke`, carril de proveedor simulado. La mayoría de las filas de etiquetas son una muestra; las
  filas `v2026.5.27` y `v2026.5.28` usan los artefactos más recientes de la rama de versión
  con repetición de 3.
- **Contexto anterior de abril:** líneas base publicadas de `clawgrit-reports` con proveedor simulado
  desde `v2026.4.1` hasta `v2026.5.2`, usadas solo para evitar tratar
  las versiones rotas de finales de abril como la línea base pública de rendimiento.
- **Barrido de huella de instalación:** instalaciones nuevas con `npm install --ignore-scripts`
  en paquetes temporales, con `du -sk node_modules` para el tamaño y un
  recorrido de `node_modules` para los recuentos de instancias de paquetes.
- **Barrido de tamaño del paquete npm:** `npm pack openclaw@<version> --dry-run --json`
  para versiones publicadas, registrando el tamaño del tarball comprimido, el tamaño
  descomprimido y el recuento de archivos.

<Warning>
El barrido principal de rendimiento usa una muestra smoke por etiqueta, excepto las
filas `v2026.5.27` y `v2026.5.28`, que usan los artefactos más recientes de la rama de versión
con repetición de 3. El contexto anterior de abril usa medianas publicadas con repetición de 3
de `clawgrit-reports`. Trata los números como evidencia de tendencia y
señal para buscar regresiones, no como estadísticas de puerta de versión.
</Warning>

## Instantánea

Cobertura de rendimiento: **77 versiones solicitadas**, **74 puntos respaldados por artefactos**
y **3 ejecuciones de CI no disponibles**. Último punto estable medido: `v2026.5.28`.

<CardGroup cols={2}>
  <Card title="Stable agent turn" icon="gauge">
    **Turno frío 5.1 veces más rápido**

    - `v2026.4.14`: 9.8s
    - `v2026.5.28`: 1.9s

  </Card>
  <Card title="Published package" icon="package">
    **Tarball de 17.9 MB**

    Último paquete estable, por debajo del pico de tamaño de paquete de marzo de 43.3 MB.

  </Card>
  <Card title="Latest stable install" icon="hard-drive">
    **Instalación nueva de 361.7 MiB**

    Recorta drásticamente el árbol de dependencias anidadas de OpenClaw desde el pico de
    introducción de shrinkwrap de `2026.5.22`, aunque en la auditoría local de instalación
    aún queda un árbol anidado más pequeño de 259.7 MiB.

  </Card>
  <Card title="Dependency graph" icon="boxes">
    **300 paquetes instalados**

    Medido como raíces únicas de nombre/versión de paquete en una instalación nueva con
    scripts deshabilitados; 71 raíces menos que la versión estable anterior.

  </Card>
</CardGroup>

## Qué Cambió En 5.28

La limpieza entre `v2026.5.27` y `v2026.5.28` redujo el grafo de instalación predeterminada
en lugar de eliminar las capacidades en sí.

<CardGroup cols={2}>
  <Card title="Root default graph" icon="git-branch">
    Las raíces únicas de nombre/versión de paquete cayeron de **371** a **300**. Las instancias de paquetes
    cayeron de **372** a **301**.
  </Card>
  <Card title="Nested tree" icon="unplug">
    El `openclaw/node_modules` anidado cayó de **656.1 MiB** a **259.7 MiB** en
    la misma auditoría local de instalación.
  </Card>
  <Card title="Native optional cones" icon="cpu">
    El cono de paquete nativo multiplataforma `@napi-rs/canvas` dejó de aterrizar en
    la instalación predeterminada.
  </Card>
  <Card title="Supply-chain surface" icon="shield">
    Menos paquetes predeterminados significan menos tarballs, mantenedores, binarios nativos,
    comportamientos en tiempo de instalación y rutas de actualización transitivas en las que confiar por defecto.
  </Card>
</CardGroup>

<Tip>
Shrinkwrap no era el problema por sí mismo. La mala forma del paquete lo era.
`v2026.5.28` aún envía shrinkwrap, pero el árbol de dependencias anidadas es mucho
más pequeño y el fanout de canvas multiplataforma desapareció en la auditoría local.
</Tip>

## Números Principales

No uses las filas rotas de finales de abril como líneas base públicas de rendimiento.
`v2026.4.23` y `v2026.4.29` son evidencia útil de regresión, pero los grandes
deltas de estilo `14x` describen principalmente la recuperación de una línea de versiones mala.

Para la narrativa del blog, usa la línea base publicada de principios de abril como escala.
La línea base es `v2026.4.14` de la ejecución publicada de `clawgrit-reports`
con proveedor simulado (repetición 3; esa ejecución falló solo porque no se emitió
la línea temporal de diagnóstico, así que las medianas de frío, cálido y RSS aún son útiles
como escala aproximada). Trata esto como contexto narrativo, no como una estadística
de puerta de versión.

| Métrica         | Línea base anterior de abril | `v2026.5.28` |                         Delta |
| --------------- | ---------------------------: | -----------: | ----------------------------: |
| Turno frío del agente |                   9,819ms |      1,908ms | 80.6% menor, 5.1 veces más rápido |
| Turno cálido del agente |                  7,458ms |      1,870ms | 74.9% menor, 4.0 veces más rápido |
| RSS pico del agente |                    686.2MB |      581.0MB |                    15.3% menor |

Dentro del barrido de mayo, la última fila de la rama de versión se movió materialmente desde
`v2026.5.2`:

| Métrica         | `v2026.5.2` | `v2026.5.28` |       Delta |
| --------------- | ----------: | -----------: | ----------: |
| Turno frío del agente |     3,897ms |      1,908ms | 51.0% menor |
| Turno cálido del agente |    3,610ms |      1,870ms | 48.2% menor |
| RSS pico del agente |       613.7MB |      581.0MB |  5.3% menor |

Comparado con la versión estable anterior:

| Métrica         | `v2026.5.27` | `v2026.5.28` |       Delta |
| --------------- | -----------: | -----------: | ----------: |
| Turno frío del agente |      2,231ms |      1,908ms | 14.5% menor |
| Turno cálido del agente |     2,226ms |      1,870ms | 16.0% menor |
| RSS pico del agente |        649.0MB |      581.0MB | 10.5% menor |

### Huella de instalación

| Métrica                                         | Línea base | `v2026.5.28` |       Delta |
| ----------------------------------------------- | ---------: | -----------: | ----------: |
| Tamaño de instalación desde el pico de `2026.5.22` | 1,020.6MB |     361.7MiB | 64.6% menor |
| Tamaño de instalación desde la última versión `2026.5.27` |  767.1MiB |     361.7MiB | 52.8% menor |
| Dependencias desde el máximo mensual `2026.2.26` |       645 |          300 | 53.5% menor |
| Dependencias desde la última versión `2026.5.27` |       371 |          300 | 19.1% menor |
| `openclaw/node_modules` anidado desde `2026.5.22` |   911.8MB |     259.7MiB | 71.5% menor |
| `openclaw/node_modules` anidado desde `2026.5.27` |  656.1MiB |     259.7MiB | 60.4% menor |

### Tamaño del paquete npm

| Versión     | Tarball comprimido | Paquete descomprimido | Archivos | Notas                                   |
| ----------- | -----------------: | --------------------: | -------: | --------------------------------------- |
| `2026.1.30` |             12.8MB |                33.5MB |    4,607 | paquete temprano con cambio de marca    |
| `2026.2.26` |             23.6MB |                82.9MB |   10,125 | crecimiento de funcionalidades          |
| `2026.3.31` |             43.3MB |               182.6MB |   21,037 | punto máximo de tamaño de paquete       |
| `2026.4.29` |             22.9MB |                74.6MB |    9,309 | poda de paquete visible                 |
| `2026.5.12` |             23.4MB |                80.1MB |   12,035 | gran división de plugins externos       |
| `2026.5.22` |             17.2MB |                76.9MB |   12,386 | docs/recursos excluidos del paquete     |
| `2026.5.27` |             17.8MB |                79.0MB |   12,509 | paquete estable anterior                |
| `2026.5.28` |             17.9MB |                81.0MB |    9,082 | último paquete estable                  |

`2026.5.12` es el hito visible de extracción de plugins en el changelog:
Amazon Bedrock, Bedrock Mantle, Slack, OpenShell sandbox, Anthropic Vertex,
Matrix y WhatsApp salieron de la ruta de dependencias del núcleo para que sus conos
de dependencias se instalen con esos plugins en lugar de con cada instalación del núcleo.

## Resumen de turnos del agente Kova

La línea estable de abril contiene dos historias diferentes. Principios de abril era lento
pero reconocible. Finales de abril se convirtió en un precipicio de regresión. `v2026.5.2` es donde
el carril de proveedor simulado cae por primera vez al rango de 3-5s y empieza a aprobar
de forma consistente en el barrido suministrado.

Contexto publicado anterior:

| Versión      | Kova | Turno frío | Turno cálido | RSS pico del agente |
| ------------ | ---- | ---------: | -----------: | ------------------: |
| `v2026.4.10` | FALLÓ |  11,031ms |   7,962ms |             679.0MB |
| `v2026.4.12` | FALLÓ |  11,965ms |   8,289ms |             713.5MB |
| `v2026.4.14` | FALLÓ |   9,819ms |   7,458ms |             686.2MB |
| `v2026.4.20` | FALLÓ |  22,314ms |  18,811ms |             810.8MB |
| `v2026.4.22` | FALLÓ |   9,630ms |   7,459ms |             743.0MB |

Barrido suministrado:

| Versión             | Kova | Turno frío | Turno cálido | RSS pico del agente |
| ------------------- | ---- | ---------: | -----------: | ------------------: |
| `v2026.4.23`        | FALLÓ |  47,847ms |   8,010ms |           1,082.7MB |
| `v2026.4.24`        | FALLÓ |  48,264ms |  25,483ms |             996.0MB |
| `v2026.4.25`        | FALLÓ |  81,080ms |  59,172ms |           1,113.9MB |
| `v2026.4.26`        | FALLÓ |  76,771ms |  54,941ms |           1,140.8MB |
| `v2026.4.27`        | FALLÓ |  60,902ms |  33,699ms |           1,156.0MB |
| `v2026.4.29`        | FALLÓ |  94,031ms |  57,334ms |           3,613.7MB |
| `v2026.5.2`         | APROBÓ |   3,897ms |   3,610ms |             613.7MB |
| `v2026.5.7`         | APROBÓ |   3,923ms |   3,693ms |             654.1MB |
| `v2026.5.12`        | APROBÓ |   7,248ms |   6,629ms |             834.8MB |
| `v2026.5.18`        | APROBÓ |   3,301ms |   2,913ms |             630.3MB |
| `v2026.5.20`        | APROBÓ |   3,413ms |   2,952ms |             643.2MB |
| `v2026.5.22`        | APROBÓ |   4,494ms |   4,093ms |             654.3MB |
| `v2026.5.26`        | APROBÓ |   2,626ms |   2,282ms |             660.4MB |
| `v2026.5.27-beta.1` | APROBÓ |   2,575ms |   2,217ms |             635.3MB |
| `v2026.5.27`        | APROBÓ |   2,231ms |   2,226ms |             649.0MB |
| `v2026.5.28`        | APROBÓ |   1,908ms |   1,870ms |             581.0MB |

## Sondas de origen

Las sondas de origen se omitieron para 17 refs antiguos exitosos porque esos árboles de origen
aún no tenían los puntos de entrada de sonda requeridos. Las métricas de turnos del agente aún
existen para esos refs.

Puntos representativos de sondas de origen:

| Versión             | `readyz` p50 predeterminado | `readyz` p50 con 50 plugins | Salud de CLI p50 | RSS máximo del Plugin |
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

El pico de salud de CLI de `v2026.5.22` es visible en esta tabla aunque el
carril de turnos del agente aún aprobó. Conserva las sondas de origen cuando investigues
regresiones dirigidas de CLI o Gateway.

## Auditoría de huella de instalación

Las muestras de dependencias usan una versión estable por mes, más el evento de
introducción de shrinkwrap de `2026.5.22` y la última versión `2026.5.28`.

| Punto              | Dependencias instaladas | Instalación nueva | Paquete OpenClaw | `openclaw/node_modules` anidado | Shrinkwrap raíz | Comportamiento de instalación de Canvas   |
| ------------------ | ----------------------: | ----------------: | ---------------: | ------------------------------: | --------------- | ----------------------------------------- |
| Ene `2026.1.30`    |                     605 |           438.4MB |           45.8MB |                           2.4MB | no              | contenedor de nivel superior + `darwin-arm64` |
| Feb `2026.2.26`    |                     645 |           575.7MB |          110.1MB |                           3.5MB | no              | contenedor de nivel superior + `darwin-arm64` |
| Mar `2026.3.31`    |                     438 |           584.1MB |          234.8MB |                             0MB | no              | contenedor de nivel superior + `darwin-arm64` |
| Abr `2026.4.29`    |                     392 |           335.0MB |           97.4MB |                             0MB | no              | nada instalado                            |
| `2026.5.22`        |                     401 |         1,020.6MB |        1,020.4MB |                         911.8MB | sí              | anidado: los 12 paquetes `@napi-rs/canvas` |
| May `2026.5.26`    |                     371 |           767.5MB |          767.4MB |                         656.4MB | sí              | anidado: los 12 paquetes `@napi-rs/canvas` |
| `2026.5.27`        |                     371 |          767.1MiB |         766.9MiB |                        656.1MiB | sí              | anidado: los 12 paquetes `@napi-rs/canvas` |
| Última `2026.5.28` |                     300 |          361.7MiB |         361.6MiB |                        259.7MiB | sí              | nada instalado                            |

### Límite de shrinkwrap

`2026.5.20` se publicó sin shrinkwrap raíz y sin un árbol grande de
dependencias anidadas de OpenClaw. `2026.5.22` introdujo el shrinkwrap raíz e
instaló 911.8MB bajo `openclaw/node_modules` anidado. `2026.5.28` conserva el
shrinkwrap y todavía instala 259.7MiB bajo `openclaw/node_modules` anidado, pero
ya no instala ningún paquete `@napi-rs/canvas` en la auditoría local de
instalación nueva.

La inspección del tarball publicado verifica el límite:

| Versión     | ¿Estable publicada? | `npm-shrinkwrap.json` raíz | Notas                                 |
| ----------- | ------------------- | -------------------------- | ------------------------------------- |
| `2026.5.20` | sí                  | no                         | última versión estable antes del shrinkwrap |
| `2026.5.21` | no                  | n/a                        | sin versión estable en npm            |
| `2026.5.22` | sí                  | sí                         | shrinkwrap introducido                |
| `2026.5.23` | no                  | n/a                        | sin versión estable en npm            |
| `2026.5.24` | no                  | n/a                        | sin versión estable en npm            |
| `2026.5.25` | no                  | n/a                        | sin versión estable en npm            |
| `2026.5.26` | sí                  | sí                         | el árbol de dependencias anidado sigue presente |
| `2026.5.27` | sí                  | sí                         | el árbol de dependencias anidado sigue presente |
| `2026.5.28` | sí                  | sí                         | árbol de dependencias anidado mucho más pequeño |

La distinción importante: **el shrinkwrap en sí no es el problema**.
`v2026.5.28` todavía incluye shrinkwrap raíz. El problema era la forma del
paquete que hacía que npm materializara un gran árbol de dependencias anidadas
de OpenClaw y los 12 paquetes de plataforma `@napi-rs/canvas`. El árbol anidado
es más pequeño en `v2026.5.28`, y la expansión de plataformas de canvas ya no
aparece en la auditoría local.

Para ver una explicación en lenguaje sencillo de shrinkwrap y las
comprobaciones de paquetes a nivel de mantenedor, consulta [npm shrinkwrap](/es/gateway/security/shrinkwrap).

## Interpretación de cadena de suministro

El recuento de dependencias es una métrica de seguridad operativa, no solo una
métrica de tamaño de instalación. Cada paquete amplía el conjunto de
mantenedores, tarballs, actualizaciones transitivas, binarios nativos
opcionales y comportamientos durante la instalación en los que los operadores
deben confiar.

La dirección de limpieza es:

- mantener las capacidades pesadas y opcionales fuera de la instalación predeterminada del núcleo
- hacer que los paquetes Plugin sean dueños de su grafo de dependencias de ejecución
- evitar la reparación del gestor de paquetes en tiempo de ejecución durante el inicio del Gateway
- preservar instalaciones deterministas sin causar la materialización de paquetes
  nativos para todas las plataformas
- mantener los scripts de instalación deshabilitados en las rutas de aceptación y medición de paquetes
- detectar árboles de dependencias anidados y explosiones de dependencias nativas opcionales antes
  de publicar

Documentos relacionados:

- [Resolución de dependencias de Plugin](/es/plugins/dependency-resolution)
- [Inventario de Plugin](/es/plugins/plugin-inventory)
- [Validación completa de la versión](/es/reference/full-release-validation)
