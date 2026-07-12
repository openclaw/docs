---
read_when:
    - Estás validando la optimización del rendimiento y del tamaño del paquete de mayo de 2026
    - Necesitas las cifras que respaldan la publicación del blog sobre el rendimiento y las dependencias de OpenClaw
    - Estás cambiando los controles de lanzamiento, el archivo de versiones exactas del paquete o los límites de dependencias de los plugins
summary: Resumen visual y evidencia técnica de la optimización de rendimiento, tamaño de paquete, dependencias y shrinkwrap de mayo de 2026
title: Revisión de rendimiento de la versión
x-i18n:
    generated_at: "2026-07-11T23:32:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e98ffc9d63e14e078a19368917eb4278695e1426048dc21942f928af145d5e1
    source_path: reference/release-performance-sweep.md
    workflow: 16
---

Esta página recoge las pruebas que respaldan la limpieza de rendimiento,
tamaño del paquete, dependencias y shrinkwrap de OpenClaw de mayo de 2026.
Es el complemento técnico de la publicación pública del blog.

Aquí se combinan dos auditorías:

- **Revisión de rendimiento de versiones:** versiones de GitHub desde `v2026.5.28`
  hasta la versión estable `v2026.4.23`, mediante el flujo de trabajo
  `OpenClaw Performance`, `profile=smoke` y la vía de proveedor simulado. La
  mayoría de las filas de etiquetas corresponden a una muestra; las filas
  `v2026.5.27` y `v2026.5.28` utilizan los artefactos más recientes de las
  ramas de versión con 3 repeticiones.
- **Contexto anterior de abril:** líneas base publicadas del proveedor simulado
  de `clawgrit-reports`, desde `v2026.4.1` hasta `v2026.5.2`, utilizadas
  únicamente para evitar considerar las versiones defectuosas de finales de
  abril como línea base pública de rendimiento.
- **Revisión de la huella de instalación:** instalaciones nuevas con
  `npm install --ignore-scripts` en paquetes temporales, usando
  `du -sk node_modules` para el tamaño y un recorrido de `node_modules` para
  contar las instancias de paquetes.
- **Revisión del tamaño del paquete npm:** `npm pack openclaw@<version> --dry-run --json`
  para las versiones publicadas, registrando el tamaño del archivo tar
  comprimido, el tamaño descomprimido y el número de archivos.

<Warning>
La revisión principal de rendimiento utiliza una muestra de humo por etiqueta,
excepto las filas `v2026.5.27` y `v2026.5.28`, que utilizan los artefactos más
recientes de las ramas de versión con 3 repeticiones. El contexto anterior de
abril utiliza las medianas publicadas de 3 repeticiones de
`clawgrit-reports`. Considere las cifras como pruebas de tendencias y señales
para detectar regresiones, no como estadísticas de los criterios de aprobación
de versiones.
</Warning>

## Resumen

Cobertura de rendimiento: **77 versiones solicitadas**, **74 puntos respaldados
por artefactos** y **3 ejecuciones de CI no disponibles**. Último punto estable
medido: `v2026.5.28`.

<CardGroup cols={2}>
  <Card title="Turno estable del agente" icon="gauge">
    **Turno en frío 5,1 veces más rápido**

    - `v2026.4.14`: 9,8s
    - `v2026.5.28`: 1,9s

  </Card>
  <Card title="Paquete publicado" icon="package">
    **Archivo tar de 17,9MB**

    Último paquete estable, por debajo del máximo de tamaño de paquete de marzo,
    de 43,3MB.

  </Card>
  <Card title="Última instalación estable" icon="hard-drive">
    **Instalación nueva de 361,7MiB**

    Reduce drásticamente el árbol anidado de dependencias de OpenClaw respecto
    al máximo de introducción de shrinkwrap de `2026.5.22`, aunque en la
    auditoría de instalación local aún permanece un árbol anidado más pequeño,
    de 259,7MiB.

  </Card>
  <Card title="Grafo de dependencias" icon="boxes">
    **300 paquetes instalados**

    Medidos como raíces únicas de nombre y versión de paquete en una instalación
    nueva con los scripts deshabilitados; 71 raíces menos que en la versión
    estable anterior.

  </Card>
</CardGroup>

## Qué cambió en 5.28

La limpieza entre `v2026.5.27` y `v2026.5.28` redujo el grafo de instalación
predeterminado en lugar de eliminar las propias capacidades.

<CardGroup cols={2}>
  <Card title="Grafo raíz predeterminado" icon="git-branch">
    Las raíces únicas de nombre y versión de paquete se redujeron de **371** a
    **300**. Las instancias de paquetes se redujeron de **372** a **301**.
  </Card>
  <Card title="Árbol anidado" icon="unplug">
    El árbol anidado `openclaw/node_modules` se redujo de **656,1MiB** a
    **259,7MiB** en la misma auditoría de instalación local.
  </Card>
  <Card title="Conos nativos opcionales" icon="cpu">
    El cono de paquetes nativos para todas las plataformas de
    `@napi-rs/canvas` dejó de incluirse en la instalación predeterminada.
  </Card>
  <Card title="Superficie de la cadena de suministro" icon="shield">
    Menos paquetes predeterminados implican menos archivos tar, mantenedores,
    binarios nativos, comportamientos durante la instalación y rutas de
    actualización transitivas en las que confiar de forma predeterminada.
  </Card>
</CardGroup>

<Tip>
Shrinkwrap no era el problema por sí solo. El problema era la estructura
deficiente del paquete. `v2026.5.28` sigue distribuyendo shrinkwrap, pero el
árbol anidado de dependencias es mucho más pequeño y la distribución en abanico
de canvas para todas las plataformas ha desaparecido en la auditoría local.
</Tip>

## Cifras principales

No utilice las filas defectuosas de finales de abril como líneas base públicas
de rendimiento. `v2026.4.23` y `v2026.4.29` son pruebas útiles de regresión,
pero las grandes diferencias del tipo `14x` describen principalmente la
recuperación de una serie de versiones deficiente.

Para la narrativa del blog, utilice como escala la línea base publicada de
principios de abril. La línea base es `v2026.4.14`, procedente de la ejecución
publicada del proveedor simulado de `clawgrit-reports` (3 repeticiones; esa
ejecución solo falló porque no se emitió la cronología de diagnóstico, por lo
que las medianas en frío, en caliente y de RSS siguen siendo útiles como escala
aproximada). Considérelo contexto narrativo, no una estadística de los criterios
de aprobación de versiones.

| Métrica                | Línea base de principios de abril | `v2026.5.28` |                         Diferencia |
| ---------------------- | --------------------------------: | -----------: | ---------------------------------: |
| Turno del agente en frío |                           9.819ms |      1.908ms | 80,6% menor, 5,1 veces más rápido |
| Turno del agente en caliente |                        7.458ms |      1.870ms | 74,9% menor, 4,0 veces más rápido |
| RSS máximo del agente  |                            686,2MB |      581,0MB |                         15,3% menor |

Dentro de la revisión de mayo, la fila más reciente de la rama de versión
cambió sustancialmente respecto a `v2026.5.2`:

| Métrica                     | `v2026.5.2` | `v2026.5.28` | Diferencia |
| --------------------------- | ----------: | -----------: | ---------: |
| Turno del agente en frío    |     3.897ms |      1.908ms | 51,0% menor |
| Turno del agente en caliente |    3.610ms |      1.870ms | 48,2% menor |
| RSS máximo del agente       |     613,7MB |      581,0MB |  5,3% menor |

En comparación con la versión estable anterior:

| Métrica                     | `v2026.5.27` | `v2026.5.28` | Diferencia |
| --------------------------- | -----------: | -----------: | ---------: |
| Turno del agente en frío    |      2.231ms |      1.908ms | 14,5% menor |
| Turno del agente en caliente |     2.226ms |      1.870ms | 16,0% menor |
| RSS máximo del agente       |      649,0MB |      581,0MB | 10,5% menor |

### Huella de instalación

| Métrica                                         | Línea base | `v2026.5.28` | Diferencia |
| ----------------------------------------------- | ---------: | -----------: | ---------: |
| Tamaño de instalación desde el máximo de `2026.5.22` | 1.020,6MB |     361,7MiB | 64,6% menor |
| Tamaño de instalación desde la última versión `2026.5.27` | 767,1MiB |     361,7MiB | 52,8% menor |
| Dependencias desde el máximo mensual de `2026.2.26` |       645 |          300 | 53,5% menor |
| Dependencias desde la última versión `2026.5.27` |       371 |          300 | 19,1% menor |
| `openclaw/node_modules` anidado desde `2026.5.22` | 911,8MB |     259,7MiB | 71,5% menor |
| `openclaw/node_modules` anidado desde `2026.5.27` | 656,1MiB |     259,7MiB | 60,4% menor |

### Tamaño del paquete npm

| Versión     | Archivo tar comprimido | Paquete descomprimido | Archivos | Notas                                      |
| ----------- | ----------------------: | --------------------: | -------: | ------------------------------------------ |
| `2026.1.30` |                  12,8MB |                33,5MB |    4.607 | paquete inicial con nueva marca            |
| `2026.2.26` |                  23,6MB |                82,9MB |   10.125 | crecimiento de funcionalidades             |
| `2026.3.31` |                  43,3MB |               182,6MB |   21.037 | máximo del tamaño del paquete              |
| `2026.4.29` |                  22,9MB |                74,6MB |    9.309 | reducción visible del paquete              |
| `2026.5.12` |                  23,4MB |                80,1MB |   12.035 | separación importante de plugins externos |
| `2026.5.22` |                  17,2MB |                76,9MB |   12.386 | documentación y recursos excluidos del paquete |
| `2026.5.27` |                  17,8MB |                79,0MB |   12.509 | paquete estable anterior                   |
| `2026.5.28` |                  17,9MB |                81,0MB |    9.082 | último paquete estable                     |

`2026.5.12` es el hito visible de extracción de plugins en el registro de
cambios: Amazon Bedrock, Bedrock Mantle, Slack, el entorno aislado OpenShell,
Anthropic Vertex, Matrix y WhatsApp salieron de la ruta de dependencias del
núcleo, por lo que sus conos de dependencias se instalan con esos plugins en
lugar de hacerlo con cada instalación del núcleo.

## Resumen de turnos del agente Kova

La serie estable de abril contiene dos historias diferentes. A principios de
abril era lenta, pero reconocible. A finales de abril se convirtió en un
precipicio de regresión. En `v2026.5.2`, la vía del proveedor simulado baja por
primera vez al intervalo de 3 a 5 segundos y empieza a completarse correctamente
de forma consistente en la revisión proporcionada.

Contexto publicado anteriormente:

| Versión      | Kova  | Turno en frío | Turno en caliente | RSS máximo del agente |
| ------------ | ----- | -------------: | ----------------: | --------------------: |
| `v2026.4.10` | FALLO |       11.031ms |           7.962ms |               679,0MB |
| `v2026.4.12` | FALLO |       11.965ms |           8.289ms |               713,5MB |
| `v2026.4.14` | FALLO |        9.819ms |           7.458ms |               686,2MB |
| `v2026.4.20` | FALLO |       22.314ms |          18.811ms |               810,8MB |
| `v2026.4.22` | FALLO |        9.630ms |           7.459ms |               743,0MB |

Revisión proporcionada:

| Versión             | Kova  | Turno en frío | Turno en caliente | RSS máximo del agente |
| ------------------- | ----- | -------------: | ----------------: | --------------------: |
| `v2026.4.23`        | FALLO |       47.847ms |           8.010ms |             1.082,7MB |
| `v2026.4.24`        | FALLO |       48.264ms |          25.483ms |               996,0MB |
| `v2026.4.25`        | FALLO |       81.080ms |          59.172ms |             1.113,9MB |
| `v2026.4.26`        | FALLO |       76.771ms |          54.941ms |             1.140,8MB |
| `v2026.4.27`        | FALLO |       60.902ms |          33.699ms |             1.156,0MB |
| `v2026.4.29`        | FALLO |       94.031ms |          57.334ms |             3.613,7MB |
| `v2026.5.2`         | ÉXITO |        3.897ms |           3.610ms |               613,7MB |
| `v2026.5.7`         | ÉXITO |        3.923ms |           3.693ms |               654,1MB |
| `v2026.5.12`        | ÉXITO |        7.248ms |           6.629ms |               834,8MB |
| `v2026.5.18`        | ÉXITO |        3.301ms |           2.913ms |               630,3MB |
| `v2026.5.20`        | ÉXITO |        3.413ms |           2.952ms |               643,2MB |
| `v2026.5.22`        | ÉXITO |        4.494ms |           4.093ms |               654,3MB |
| `v2026.5.26`        | ÉXITO |        2.626ms |           2.282ms |               660,4MB |
| `v2026.5.27-beta.1` | ÉXITO |        2.575ms |           2.217ms |               635,3MB |
| `v2026.5.27`        | ÉXITO |        2.231ms |           2.226ms |               649,0MB |
| `v2026.5.28`        | ÉXITO |        1.908ms |           1.870ms |               581,0MB |

## Pruebas del código fuente

Se omitieron las pruebas del código fuente en 17 referencias antiguas correctas
porque esos árboles de código fuente todavía no tenían los puntos de entrada
necesarios para las pruebas. Las métricas de los turnos del agente siguen
existiendo para esas referencias.

Puntos representativos de las pruebas del código fuente:

| Versión             | p50 predeterminado de `readyz` | p50 de `readyz` con 50 plugins | p50 de estado de la CLI | RSS máximo de plugins |
| ------------------- | -----------------------------: | ------------------------------: | --------------------: | ---------------------: |
| `v2026.4.29`        |                        2.819ms |                         2.618ms |               1.679ms |                389,0MB |
| `v2026.5.2`         |                        2.324ms |                         2.013ms |               1.384ms |                377,2MB |
| `v2026.5.7`         |                        1.649ms |                         1.540ms |               1.175ms |                387,6MB |
| `v2026.5.18`        |                        1.942ms |                         1.927ms |                 607ms |                426,5MB |
| `v2026.5.20`        |                        1.966ms |                         1.987ms |                 621ms |                455,0MB |
| `v2026.5.22`        |                        2.081ms |                         1.884ms |               5.095ms |                444,2MB |
| `v2026.5.26`        |                        1.546ms |                         1.634ms |                 656ms |                400,4MB |
| `v2026.5.27-beta.1` |                        1.462ms |                         1.548ms |                 548ms |                394,0MB |
| `v2026.5.27`        |                        1.491ms |                         1.571ms |                 553ms |                401,5MB |
| `v2026.5.28`        |                        1.457ms |                         1.474ms |                 623ms |                386,1MB |

El pico de estado de la CLI de `v2026.5.22` es visible en esta tabla, aunque la
vía de turnos del agente se completó correctamente. Conserve las pruebas del
código fuente al investigar regresiones específicas de la CLI o del Gateway.

## Auditoría de la huella de instalación

Las muestras de dependencias utilizan una versión estable por mes, además del
evento de introducción de shrinkwrap de `2026.5.22` y la versión más reciente,
`2026.5.28`.

| Punto             | Dependencias instaladas | Instalación nueva | Paquete OpenClaw | `openclaw/node_modules` anidado | Shrinkwrap raíz | Comportamiento de instalación de Canvas                    |
| ----------------- | ----------------------: | ----------------: | ---------------: | --------------------------------: | --------------- | ---------------------------------------------------------- |
| Ene. `2026.1.30`  |                     605 |           438.4MB |           45.8MB |                             2.4MB | no              | envoltorio de nivel superior + `darwin-arm64`               |
| Feb. `2026.2.26`  |                     645 |           575.7MB |          110.1MB |                             3.5MB | no              | envoltorio de nivel superior + `darwin-arm64`               |
| Mar. `2026.3.31`  |                     438 |           584.1MB |          234.8MB |                               0MB | no              | envoltorio de nivel superior + `darwin-arm64`               |
| Abr. `2026.4.29`  |                     392 |           335.0MB |           97.4MB |                               0MB | no              | ninguno instalado                                           |
| `2026.5.22`       |                     401 |         1,020.6MB |        1,020.4MB |                           911.8MB | sí              | anidados: los 12 paquetes de `@napi-rs/canvas`              |
| May. `2026.5.26`  |                     371 |           767.5MB |          767.4MB |                           656.4MB | sí              | anidados: los 12 paquetes de `@napi-rs/canvas`              |
| `2026.5.27`       |                     371 |          767.1MiB |         766.9MiB |                          656.1MiB | sí              | anidados: los 12 paquetes de `@napi-rs/canvas`              |
| Última `2026.5.28`|                     300 |          361.7MiB |         361.6MiB |                          259.7MiB | sí              | ninguno instalado                                           |

### Límite del shrinkwrap

`2026.5.20` se publicó sin shrinkwrap raíz y sin un gran árbol de dependencias
anidado de OpenClaw. `2026.5.22` introdujo el shrinkwrap raíz e instaló 911.8MB
en `openclaw/node_modules` anidado. `2026.5.28` conserva el shrinkwrap y aún
instala 259.7MiB en `openclaw/node_modules` anidado, pero ya no instala
ningún paquete de `@napi-rs/canvas` en la auditoría local de instalación nueva.

La inspección del tarball publicado verifica el límite:

| Versión     | ¿Publicación estable? | `npm-shrinkwrap.json` raíz | Notas                                             |
| ----------- | --------------------- | -------------------------- | ------------------------------------------------- |
| `2026.5.20` | sí                    | no                         | última versión estable anterior al shrinkwrap     |
| `2026.5.21` | no                    | no aplicable               | no hubo una versión estable en npm                |
| `2026.5.22` | sí                    | sí                         | se introdujo el shrinkwrap                         |
| `2026.5.23` | no                    | no aplicable               | no hubo una versión estable en npm                |
| `2026.5.24` | no                    | no aplicable               | no hubo una versión estable en npm                |
| `2026.5.25` | no                    | no aplicable               | no hubo una versión estable en npm                |
| `2026.5.26` | sí                    | sí                         | el árbol de dependencias anidado aún está presente |
| `2026.5.27` | sí                    | sí                         | el árbol de dependencias anidado aún está presente |
| `2026.5.28` | sí                    | sí                         | el árbol de dependencias anidado es mucho menor    |

La distinción importante: **el shrinkwrap en sí no es el problema**.
`v2026.5.28` aún incluye el shrinkwrap raíz. El problema era la estructura del
paquete que hacía que npm materializara un gran árbol de dependencias anidado de
OpenClaw y los 12 paquetes de plataforma de `@napi-rs/canvas`. El árbol anidado
es menor en `v2026.5.28` y la expansión a todas las plataformas de Canvas ya no
aparece en la auditoría local.

Para consultar una explicación sencilla del shrinkwrap y las comprobaciones de
paquetes para mantenedores, consulte [shrinkwrap de npm](/es/gateway/security/shrinkwrap).

## Interpretación de la cadena de suministro

El recuento de dependencias es una métrica de seguridad operativa, no solo una
métrica del tamaño de instalación. Cada paquete amplía el conjunto de
mantenedores, tarballs, actualizaciones transitivas, binarios nativos opcionales
y comportamientos durante la instalación en los que deben confiar los
operadores.

La dirección de la depuración es:

- mantener las capacidades pesadas y opcionales fuera de la instalación
  predeterminada del núcleo
- hacer que los paquetes de los plugins sean responsables de su propio grafo de
  dependencias de ejecución
- evitar la reparación mediante el gestor de paquetes durante el inicio del Gateway
- conservar instalaciones deterministas sin provocar la materialización de
  paquetes nativos para todas las plataformas
- mantener deshabilitados los scripts de instalación en las rutas de aceptación
  y medición de paquetes
- detectar los árboles de dependencias anidados y las explosiones de dependencias
  nativas opcionales antes de publicar

Documentación relacionada:

- [Resolución de dependencias de plugins](/es/plugins/dependency-resolution)
- [Inventario de plugins](/es/plugins/plugin-inventory)
- [Validación completa de la versión](/es/reference/full-release-validation)
