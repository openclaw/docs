---
read_when:
    - Necesitas entender por qué un trabajo de CI se ejecutó o no se ejecutó
    - Estás depurando una comprobación fallida de GitHub Actions
    - Está coordinando una ejecución o repetición de la validación de una versión
    - Estás cambiando el despacho de ClawSweeper o el reenvío de actividad de GitHub
summary: Gráfico de trabajos de CI, controles de alcance, flujos globales de lanzamiento y comandos locales equivalentes
title: Canalización de CI
x-i18n:
    generated_at: "2026-07-12T14:21:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a8ff447c56fabf3148d4368567c2365e6940f00aded8b7212ae3d232a777d92a
    source_path: ci.md
    workflow: 16
---

La CI de OpenClaw se ejecuta en los envíos a `main` (las rutas de Markdown y `docs/**` se ignoran
en el desencadenador), en las solicitudes de incorporación de cambios que no sean borradores (se ignoran las diferencias que solo afectan a CHANGELOG)
y mediante ejecución manual. Los envíos canónicos a `main` pasan primero por una ventana de admisión de 90 segundos
en un ejecutor alojado; el grupo de concurrencia `CI` cancela esa ejecución en espera
cuando llega una confirmación más reciente, de modo que cada fusión secuencial no registra una matriz
completa de Blacksmith. Las solicitudes de incorporación de cambios y las ejecuciones manuales omiten la espera. A continuación, el trabajo
`preflight` clasifica las diferencias y desactiva los flujos costosos cuando
solo han cambiado áreas no relacionadas. Las ejecuciones manuales de `workflow_dispatch` omiten
intencionadamente la delimitación inteligente del alcance y despliegan el grafo completo para las versiones candidatas y
la validación exhaustiva. Los flujos de Android siguen siendo opcionales mediante `include_android` (o la
entrada `release_gate`). La cobertura de plugins exclusiva de versiones se encuentra en el flujo de trabajo independiente
[`Plugin Prerelease`](#plugin-prerelease) y solo se ejecuta desde
[`Full Release Validation`](#full-release-validation) o mediante una ejecución manual
explícita.

## Descripción general del pipeline

| Tarea                              | Propósito                                                                                                                                                                                                                  | Cuándo se ejecuta                                           |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `preflight`                        | Detectar cambios exclusivos de la documentación, ámbitos modificados y extensiones modificadas, y generar el manifiesto de CI                                                                                              | Siempre en envíos y PR que no sean borradores               |
| `runner-admission`                 | Espera de 90 segundos en el ejecutor alojado para los envíos canónicos a `main` antes de registrar el trabajo de Blacksmith                                                                                                | En cada ejecución de CI; espera solo en envíos canónicos a `main` |
| `security-fast`                    | Detección de claves privadas, auditoría de flujos de trabajo modificados mediante `zizmor` y auditoría del archivo de bloqueo de producción                                                                                | Siempre en envíos y PR que no sean borradores               |
| `pnpm-store-warmup`                | Preparar la caché del almacén de pnpm fijada por el archivo de bloqueo sin bloquear los fragmentos de Node en Linux                                                                                                        | Cuando se seleccionan carriles de Node o comprobación de documentación |
| `build-artifacts`                  | Compilar `dist/` y la interfaz de Control, realizar comprobaciones rápidas de la CLI compilada, comprobar la memoria de inicio y verificar los artefactos compilados integrados                                            | Cambios relevantes para Node                                |
| `control-ui-i18n`                  | Verificar los paquetes de configuración regional, los metadatos y la memoria de traducción generados para la interfaz de Control; es informativo en ejecuciones automáticas y bloqueante en la CI de versión manual         | Cambios relevantes para la i18n de la interfaz de Control y CI manual |
| `checks-fast-core`                 | Carriles rápidos de corrección en Linux: componentes incluidos + protocolo, iniciador de Bun y tarea rápida de enrutamiento de CI                                                                                        | Cambios relevantes para Node                                |
| `qa-smoke-ci-profile`              | Dos partes equilibradas y autosuficientes del conjunto representativo y acotado de QA Smoke automático; la cobertura taxonómica completa sigue disponible mediante perfiles explícitos de QA                              | Cambios relevantes para Node                                |
| `checks-fast-contracts-plugins-*`  | Dos fragmentos ponderados de contratos de plugins                                                                                                                                                                         | Cambios relevantes para Node                                |
| `checks-fast-contracts-channels-*` | Dos fragmentos ponderados de contratos de canales                                                                                                                                                                         | Cambios relevantes para Node                                |
| `checks-node-*`                    | Fragmentos de pruebas principales de Node, excluidos los carriles de canales, componentes incluidos, contratos y extensiones                                                                                             | Cambios relevantes para Node                                |
| `check-*`                          | Equivalente fragmentado de la comprobación local principal: protecciones, shrinkwrap, metadatos de configuración de canales incluidos, tipos de producción, lint, dependencias y tipos de pruebas                           | Cambios relevantes para Node                                |
| `check-additional-*`               | Franjas de comprobación de límites (incluida la desviación de instantáneas de prompts), límites del descriptor de acceso de sesión, lector de transcripciones y transacciones SQLite, grupos de lint de extensiones, compilación/canario de límites de paquetes y arquitectura de topología de ejecución | Cambios relevantes para Node                                |
| `checks-node-compat-node22`        | Carril de compilación y comprobación rápida de compatibilidad con Node 22                                                                                                                                                | Ejecución manual de CI para versiones                       |
| `check-docs`                       | Comprobaciones de formato, lint y enlaces rotos de la documentación                                                                                                                                                       | Cuando cambia la documentación (PR y ejecución manual)      |
| `native-i18n`                      | Comprobaciones del inventario de i18n de aplicaciones nativas, Android y Apple                                                                                                                                           | Cambios relevantes para la i18n nativa                      |
| `skills-python`                    | Ruff + pytest para Skills basadas en Python                                                                                                                                                                               | Cambios relevantes para Skills de Python                    |
| `checks-windows`                   | Pruebas de procesos y rutas específicas de Windows, además de regresiones compartidas de especificadores de importación en tiempo de ejecución                                                                            | Cambios relevantes para Windows                             |
| `macos-node`                       | Pruebas específicas de TypeScript en macOS: launchd, Homebrew, rutas de ejecución, scripts de empaquetado y contenedor de grupos de procesos                                                                               | Cambios relevantes para macOS                               |
| `macos-swift`                      | Lint, compilación y pruebas de Swift para la aplicación de macOS                                                                                                                                                          | Cambios relevantes para macOS                               |
| `ios-build`                        | Generación del proyecto de Xcode y compilación de la aplicación iOS para el simulador                                                                                                                                     | Cambios en la aplicación iOS, el kit compartido de aplicaciones o Swabble |
| `android`                          | Pruebas unitarias de Android para ambas variantes y compilación de un APK de depuración                                                                                                                                   | Cambios relevantes para Android                             |
| `test-performance-agent`           | Flujo de trabajo independiente: optimización diaria de las pruebas lentas de Codex después de actividad de confianza                                                                                                      | Ejecución correcta de la CI principal o ejecución manual    |
| `openclaw-performance`             | Flujo de trabajo independiente: informes diarios o bajo demanda del rendimiento de ejecución de Kova con carriles de proveedor simulado, perfilado profundo y GPT 5.6 en vivo                                             | Ejecución programada y manual                               |

## Orden de interrupción rápida

1. `runner-admission` espera únicamente los envíos canónicos a `main`; un envío más reciente cancela la ejecución antes del registro en Blacksmith.
2. `preflight` decide qué vías existen. La lógica de `docs-scope` y `changed-scope` corresponde a pasos dentro de este trabajo, no a trabajos independientes.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` y `skills-python` fallan rápidamente sin esperar a los trabajos más pesados de artefactos y de la matriz de plataformas.
4. `build-artifacts` y la comprobación informativa `control-ui-i18n` se solapan con las vías rápidas de Linux. Las desviaciones de las configuraciones regionales generadas permanecen visibles mientras el flujo de trabajo independiente de actualización las corrige en segundo plano.
5. Después, las vías más pesadas de plataformas y entornos de ejecución se distribuyen en paralelo: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` y `android`.

GitHub puede marcar los trabajos reemplazados como `cancelled` cuando se incorpora un push más reciente en la misma referencia de PR o de `main`. Trátelo como ruido de CI, salvo que la ejecución más reciente para la misma referencia también esté fallando. Los trabajos de la matriz usan `fail-fast: false`, y `build-artifacts` informa directamente de los fallos de canal integrado, del límite de compatibilidad del núcleo y de gateway-watch, en lugar de poner en cola pequeños trabajos de verificación. La clave automática de concurrencia de CI tiene versión (`CI-v7-*`), de modo que un proceso zombi del lado de GitHub en un grupo de cola antiguo no pueda bloquear indefinidamente las ejecuciones más recientes de main. Las ejecuciones manuales del conjunto completo usan `CI-manual-v1-*` y no cancelan las ejecuciones en curso. La protección de memoria al iniciar la lista de plugins mantiene un límite de 350 MiB en Linux Blacksmith autoalojado y permite 425 MiB en Linux alojado en GitHub, cuya línea base de RSS es mayor para la misma CLI compilada.

Use `pnpm ci:timings`, `pnpm ci:timings:recent` o `node scripts/ci-run-timings.mjs <run-id>` para resumir el tiempo transcurrido, el tiempo en cola, los trabajos más lentos, los fallos y la barrera de distribución `pnpm-store-warmup` de GitHub Actions. El trabajo `ci-timings-summary` dentro del flujo de trabajo existe en `ci.yml`, pero actualmente está deshabilitado (`if: false`); ejecute en su lugar el asistente de temporización localmente. Para consultar los tiempos de compilación, revise el paso `Build dist` del trabajo `build-artifacts`: `pnpm build:ci-artifacts` muestra `[build-all] phase timings:` e incluye `ui:build`; el trabajo también carga el artefacto `startup-memory`.

## Contexto y evidencia del PR

Los PR de colaboradores externos ejecutan una comprobación de contexto y evidencia del PR desde
`.github/workflows/real-behavior-proof.yml`. El flujo de trabajo obtiene la
revisión de confianza del flujo de trabajo (`github.workflow_sha`) y evalúa únicamente
el cuerpo del PR; no ejecuta código de la rama del colaborador.

La comprobación se aplica a los autores de PR que no sean propietarios, miembros,
colaboradores ni bots del repositorio. Se supera cuando el cuerpo del PR contiene
las secciones redactadas `What Problem This Solves` y `Evidence`. La evidencia puede ser una
prueba específica, un resultado de CI, una captura de pantalla, una grabación, una salida del terminal,
una observación en vivo, un registro censurado o un enlace a un artefacto. El cuerpo proporciona la intención y una validación útil;
los revisores inspeccionan el código, las pruebas y CI para evaluar la corrección.

Cuando la comprobación falle, actualice el cuerpo del PR en lugar de enviar otro commit de código.

## Alcance y enrutamiento

La lógica del alcance se encuentra en `scripts/ci-changed-scope.mjs` y está cubierta por pruebas unitarias en `src/scripts/ci-changed-scope.test.ts`. La ejecución manual omite la detección del alcance de los cambios y hace que el manifiesto de comprobación preliminar actúe como si hubieran cambiado todas las áreas incluidas en el alcance.

- **Las ediciones de flujos de trabajo de CI** validan el grafo de CI de Node, el lint de los flujos de trabajo y la vía de Windows (`ci.yml` la ejecuta), pero por sí solas no fuerzan compilaciones nativas de iOS, Android o macOS; esas vías de plataforma permanecen limitadas a los cambios en el código fuente de la plataforma.
- **Workflow Sanity** ejecuta `actionlint`, `zizmor` sobre todos los archivos YAML de flujos de trabajo, la protección contra interpolación de acciones compuestas y la protección contra marcadores de conflicto. El trabajo `security-fast`, limitado al PR, también ejecuta `zizmor` sobre los archivos de flujos de trabajo modificados para que los hallazgos de seguridad de los flujos de trabajo provoquen un error con antelación en el grafo principal de CI.
- **La documentación en los envíos a `main`** se comprueba mediante el flujo de trabajo independiente `Docs` con el mismo espejo de documentación de ClawHub que utiliza CI, por lo que los envíos mixtos de código y documentación no ponen también en cola el fragmento `check-docs` de CI. Las solicitudes de incorporación de cambios y las ejecuciones manuales de CI siguen ejecutando `check-docs` desde CI cuando cambia la documentación.
- **TUI PTY** se ejecuta en el fragmento de Node para Linux `checks-node-core-runtime-tui-pty` cuando hay cambios en TUI. El fragmento ejecuta `test/vitest/vitest.tui-pty.config.ts` con `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, por lo que cubre tanto la vía determinista de accesorios de `TuiBackend` como la prueba de humo más lenta `tui --local`, que simula únicamente el punto de conexión externo del modelo.
- **Las ediciones exclusivamente de enrutamiento de CI, el pequeño conjunto de accesorios de pruebas del núcleo que la tarea rápida ejecuta directamente y las ediciones específicas de los auxiliares de contratos de plugins** utilizan una ruta rápida de manifiesto exclusiva de Node: `preflight`, `security-fast` y únicamente las vías rápidas afectadas por el cambio: una sola tarea de enrutamiento de CI `checks-fast-core`, los dos fragmentos de contratos de plugins o ambos. Esa ruta omite los artefactos de compilación, la compatibilidad con Node 22, los contratos de canales, los fragmentos completos del núcleo, los fragmentos de plugins integrados y las matrices de protecciones adicionales.
- **Las comprobaciones de Node en Windows** se limitan a los envoltorios de procesos y rutas específicos de Windows, los auxiliares de ejecutores de npm/pnpm/UI, la configuración del gestor de paquetes y las superficies de los flujos de trabajo de CI que ejecutan esa vía; los cambios no relacionados en el código fuente, los plugins, las pruebas de humo de instalación y exclusivamente las pruebas permanecen en las vías de Node para Linux.

Las familias de pruebas de Node más lentas se dividen o equilibran para que cada trabajo sea pequeño sin reservar ejecutores en exceso:

- Los contratos de plugins y los contratos de canales se ejecutan cada uno como dos fragmentos ponderados respaldados por Blacksmith, con el ejecutor estándar de GitHub como alternativa.
- Las vías rápidas y de soporte de las pruebas unitarias del núcleo se ejecutan por separado; la infraestructura de ejecución del núcleo se divide en fragmentos de procesos, recursos compartidos, hooks, secretos y tres dominios de cron.
- La respuesta automática se ejecuta mediante trabajadores equilibrados, con el subárbol de respuestas dividido en fragmentos de ejecución de agentes, comandos, despacho, sesión y enrutamiento de estado.
- Las configuraciones del Gateway/servidor agéntico (plano de control) se dividen en vías de chat, autenticación, modelo, HTTP/plugins, entorno de ejecución e inicio, en lugar de esperar a los artefactos compilados.
- La CI normal agrupa únicamente los fragmentos aislados de patrones de inclusión de infraestructura en paquetes deterministas de un máximo de 64 archivos de prueba, lo que reduce la matriz de Node sin combinar conjuntos no aislados de comandos/cron, del núcleo de agentes con estado o del Gateway/servidor. Los conjuntos fijos pesados permanecen en 8 vCPU, mientras que las vías agrupadas y de menor peso utilizan 4 vCPU.
- Las solicitudes de incorporación de cambios en el repositorio canónico utilizan un plan de admisión compacto: los mismos grupos por configuración se ejecutan en subprocesos aislados; actualmente son 19 trabajos de pruebas de Node en lugar de la matriz completa de 74 trabajos. Un único lote de configuración completa se distribuye entre los trabajos compactos existentes con el mismo ejecutor, manteniendo su tiempo de espera de 120 minutos, y la configuración de herramientas en serie se distribuye entre tres grupos exclusivos de PR; los envíos a `main`, las ejecuciones manuales y las comprobaciones de publicación conservan la matriz completa.
- Las pruebas generales de navegador, QA, medios y plugins diversos utilizan sus configuraciones específicas de Vitest en lugar del conjunto genérico compartido de plugins. Los fragmentos de patrones de inclusión registran entradas de tiempo mediante el nombre del fragmento de CI, de modo que `.artifacts/vitest-shard-timings.json` pueda distinguir una configuración completa de un fragmento filtrado.
- `check-additional-*` distribuye la lista suplementaria de protecciones de límites (`scripts/run-additional-boundary-checks.mjs`) en un fragmento con alta carga de prompts (`check-additional-boundaries-a`, que incluye la comprobación de desviaciones de instantáneas de prompts de Codex) y un fragmento combinado para las vías restantes (`check-additional-boundaries-bcd`); cada uno ejecuta protecciones independientes simultáneamente e imprime los tiempos de cada comprobación. El trabajo de compilación/comprobación controlada de los límites de paquetes permanece agrupado, y la arquitectura de la topología del entorno de ejecución se ejecuta por separado de la cobertura de supervisión del Gateway integrada en `build-artifacts`.
- La supervisión del Gateway, las pruebas de canales y el fragmento de límites de soporte del núcleo se ejecutan simultáneamente dentro de `build-artifacts` después de que `dist/` y `dist-runtime/` ya se hayan compilado.

Una vez admitida, la CI canónica de Linux permite hasta 28 trabajos simultáneos de pruebas de Node y
12 para las vías rápidas/de comprobación más pequeñas; Windows y Android permanecen en dos porque
esos grupos de ejecutores son más limitados. Los lotes compactos de configuraciones completas se ejecutan con un
tiempo de espera de lote de 120 minutos, mientras que los grupos de patrones de inclusión comparten el mismo presupuesto
limitado de trabajos.

La CI de Android ejecuta tanto `testPlayDebugUnitTest` como `testThirdPartyDebugUnitTest` y después compila el APK de depuración de Play. La variante de terceros no tiene un conjunto de fuentes ni un manifiesto independientes; su vía de pruebas unitarias sigue compilando la variante con los indicadores de BuildConfig para SMS/registros de llamadas, a la vez que evita un trabajo duplicado de empaquetado del APK de depuración en cada envío relevante para Android.

El fragmento `check-dependencies` ejecuta `pnpm deadcode:dependencies` (una ejecución de producción de Knip limitada exclusivamente a dependencias y fijada a una versión exacta de Knip, con la antigüedad mínima de publicación de pnpm desactivada para la instalación mediante `dlx`) y `pnpm deadcode:unused-files`, que compara los hallazgos de archivos sin usar en producción de Knip con `scripts/deadcode-unused-files.allowlist.mjs`, además de un informe consultivo `pnpm deadcode:report:ci:ts-unused` cargado como artefacto `deadcode-reports`. La protección de archivos sin usar falla cuando un PR añade un nuevo archivo sin usar que no se ha revisado o deja una entrada obsoleta en la lista de permitidos, a la vez que conserva las superficies intencionales de plugins dinámicos, generación, compilación, pruebas en vivo y puentes de paquetes que Knip no puede resolver estáticamente.

## Reenvío de actividad de ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` es el puente del lado de destino desde la actividad del repositorio de OpenClaw hacia ClawSweeper. No extrae ni ejecuta código no confiable de solicitudes de incorporación de cambios. El flujo de trabajo crea un token de GitHub App a partir de `CLAWSWEEPER_APP_PRIVATE_KEY` y, a continuación, envía cargas compactas de `repository_dispatch` a `openclaw/clawsweeper`.

El flujo de trabajo tiene cuatro vías:

- `clawsweeper_item` para solicitudes de revisión específicas de incidencias y solicitudes de incorporación de cambios;
- `clawsweeper_comment` para comandos explícitos de ClawSweeper en comentarios de incidencias;
- `clawsweeper_commit_review` para solicitudes de revisión a nivel de commit en envíos a `main`;
- `github_activity` para la actividad general de GitHub que el agente de ClawSweeper puede inspeccionar.

La vía `github_activity` reenvía únicamente metadatos normalizados: tipo de evento, acción, actor, repositorio, número de elemento, URL, título, estado y extractos breves de comentarios o revisiones cuando están presentes. Evita intencionadamente reenviar el cuerpo completo del Webhook. El flujo de trabajo receptor en `openclaw/clawsweeper` es `.github/workflows/github-activity.yml`, que publica el evento normalizado en el hook del Gateway de OpenClaw para el agente de ClawSweeper.

La actividad general es observación, no entrega de manera predeterminada. El agente de ClawSweeper recibe el destino de Discord en su prompt y solo debe publicar en `#clawsweeper` cuando el evento sea sorprendente, permita actuar, implique un riesgo o sea útil desde el punto de vista operativo. Las aperturas y ediciones rutinarias, la actividad automática de bots, el ruido de Webhooks duplicados y el tráfico normal de revisiones deben producir `NO_REPLY`.

Trate los títulos, comentarios, cuerpos, textos de revisión, nombres de ramas y mensajes de commits de GitHub como datos no confiables durante toda esta ruta. Son entradas para el resumen y la clasificación, no instrucciones para el flujo de trabajo ni para el entorno de ejecución del agente.

## Ejecuciones manuales

Las ejecuciones manuales de CI utilizan el mismo grafo de trabajos que la CI normal, pero fuerzan la activación de todas las vías con alcance que no sean de Android: fragmentos de Node para Linux, fragmentos de plugins integrados, fragmentos de contratos de plugins y canales, compatibilidad con Node 22, `check-*`, `check-additional-*`, pruebas de humo de artefactos compilados, comprobaciones de documentación, Skills de Python, Windows, macOS, compilación de iOS e i18n de Control UI. La paridad de configuraciones regionales de Control UI es consultiva en las ejecuciones automáticas de PR y `main`, porque el flujo de trabajo de actualización independiente corrige en segundo plano las desviaciones generadas; es bloqueante en la CI manual y, por tanto, en la validación completa de la publicación. Las ejecuciones manuales independientes de CI solo ejecutan Android con `include_android=true` (la entrada `release_gate` también fuerza Android); el flujo general de publicación completa habilita Android pasando `include_android=true`. Las comprobaciones estáticas previas a la publicación de plugins, el fragmento exclusivo de publicación `agentic-plugins`, la ejecución completa por lotes de extensiones y las vías de Docker previas a la publicación de plugins se excluyen de CI. El conjunto de Docker previo a la publicación solo se ejecuta cuando `Full Release Validation` inicia el flujo de trabajo independiente `Plugin Prerelease` con la comprobación de validación de publicación habilitada.

Las ejecuciones manuales utilizan un grupo de concurrencia único para que un conjunto completo de candidato a publicación no se cancele debido a otro envío o ejecución de PR en la misma referencia. La entrada opcional `target_ref` permite que un invocador de confianza ejecute ese grafo sobre una rama, etiqueta o SHA completo de commit, usando el archivo del flujo de trabajo de la referencia de ejecución seleccionada. La entrada `release_gate` es una alternativa para mantenedores basada en un SHA exacto cuando la CI del PR está bloqueada por falta de capacidad: requiere que `target_ref` sea un SHA completo de commit que coincida con la cabecera de la rama desde la que se ejecutó.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

La ruta mensual de versión estable extendida exclusiva de npm es la excepción: ejecute tanto la comprobación preliminar `OpenClaw NPM
Release` como `Full Release Validation` desde la rama exacta
`extended-stable/YYYY.M.33`, conserve los identificadores de sus ejecuciones y pase ambos identificadores a la
ejecución de publicación directa en npm. Consulte [Publicación mensual de la versión estable extendida
exclusiva de npm](/es/reference/RELEASING#monthly-npm-only-extended-stable-publication) para conocer
los comandos, los requisitos exactos de identidad, la verificación de lectura del registro y el procedimiento de
reparación del selector. Esta ruta no inicia publicaciones de plugins, macOS, Windows, GitHub
Release, etiquetas de distribución privadas ni otras plataformas.

## Ejecutores

| Ejecutor                        | Trabajos                                                                                                                                                                                                                                                                                            |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | Ejecución manual de CI y alternativas para repositorios no canónicos, el agregado QA Smoke, análisis de seguridad y calidad de CodeQL, comprobación de coherencia de los flujos de trabajo, etiquetador, respuesta automática, el flujo de trabajo independiente de documentación y todo el flujo de trabajo Install Smoke |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, `pnpm-store-warmup`, `native-i18n`, `checks-fast-core` excepto QA Smoke CI, fragmentos de contratos de plugins/canales, la mayoría de los fragmentos incluidos/de menor carga de Linux Node, vías `check-*` excepto `check-lint`, fragmentos `check-additional-*` seleccionados, `check-docs` y `skills-python` |
| `blacksmith-8vcpu-ubuntu-2404`  | Suites pesadas de Linux Node conservadas, fragmentos `check-additional-*` con mayor carga de límites/extensiones y `android`                                                                                                                                                                         |
| `blacksmith-16vcpu-ubuntu-2404` | Fragmentos automáticos de QA Smoke CI, `build-artifacts` en CI y Testbox, y `check-lint` (lo bastante sensible a la CPU como para que 8 vCPU costaran más de lo que ahorraban)                                                                                                                        |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                    |
| `blacksmith-6vcpu-macos-15`     | `macos-node` en `openclaw/openclaw`; las bifurcaciones recurren a `macos-15`                                                                                                                                                                                                                         |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` e `ios-build` en `openclaw/openclaw`; las bifurcaciones recurren a `macos-26`                                                                                                                                                                                                         |

## Presupuesto de registro de ejecutores

El grupo actual de registro de ejecutores de GitHub de OpenClaw informa de 10,000
registros de ejecutores autohospedados cada 5 minutos en `ghx api rate_limit`. Vuelva a comprobar
`actions_runner_registration` antes de cada ajuste, ya que GitHub puede cambiar
este grupo. El límite se comparte entre todos los registros de ejecutores de Blacksmith en la
organización `openclaw`, por lo que añadir otra instalación de Blacksmith no añade
un grupo nuevo.

Trate las etiquetas de Blacksmith como el recurso escaso para controlar las ráfagas. Los trabajos que
solo enrutan, notifican, resumen, seleccionan fragmentos o ejecutan análisis breves de CodeQL deben
permanecer en ejecutores alojados en GitHub, a menos que tengan necesidades específicas de Blacksmith
medidas. Toda matriz nueva de Blacksmith, un `max-parallel` mayor o un flujo de trabajo
de alta frecuencia debe mostrar su número de registros en el peor caso y mantener el objetivo
a nivel de organización por debajo de aproximadamente el 60% del grupo activo. Con el grupo actual de
10,000 registros, esto supone un objetivo operativo de 6,000 registros, dejando margen para
repositorios simultáneos, reintentos y solapamiento de ráfagas.

La CI del repositorio canónico mantiene Blacksmith como ruta de ejecución predeterminada para las ejecuciones normales de inserciones y solicitudes de incorporación de cambios. `workflow_dispatch` y las ejecuciones de repositorios no canónicos usan ejecutores alojados en GitHub, pero las ejecuciones canónicas normales no sondean actualmente el estado de la cola de Blacksmith ni recurren automáticamente a etiquetas alojadas en GitHub cuando Blacksmith no está disponible.

## Equivalentes locales

```bash
pnpm changed:lanes                            # inspecciona el clasificador local de vías modificadas para origin/main...HEAD
pnpm check:changed                            # puerta de comprobación local inteligente: formato/comprobación de tipos/lint/guardas modificados según la vía de límites
pnpm check                                    # puerta local rápida: tsgo de producción + lint fragmentado + guardas rápidas en paralelo
pnpm check:test-types
pnpm check:timed                              # misma puerta con tiempos por etapa
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1 node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts
pnpm test                                     # pruebas de vitest
pnpm test:changed                             # objetivos Vitest modificados, económicos e inteligentes
pnpm test:ui                                  # suite unitaria/de navegador de la interfaz de control
pnpm ui:i18n:check                            # paridad de configuraciones regionales generadas de la interfaz de control (puerta de lanzamiento)
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # formato de documentación + lint + enlaces rotos
pnpm build                                    # compila dist cuando importan las comprobaciones de artefactos/humo de CI
pnpm ios:build                                # genera y compila el proyecto de la aplicación iOS
pnpm ci:timings                               # resume la ejecución de CI más reciente de una inserción en origin/main
pnpm ci:timings:recent                        # compara ejecuciones recientes correctas de CI en main
node scripts/ci-run-timings.mjs <run-id>      # resume el tiempo total, el tiempo en cola y los trabajos más lentos
node scripts/ci-run-timings.mjs --latest-main # ignora el ruido de incidencias/comentarios y elige la CI de inserción en origin/main
node scripts/ci-run-timings.mjs --recent 10   # compara ejecuciones recientes correctas de CI en main
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm test:startup:memory
pnpm test:extensions:memory -- --json .artifacts/openclaw-performance/source/mock-provider/extension-memory.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## Rendimiento de OpenClaw

`OpenClaw Performance` es el flujo de trabajo de rendimiento del producto/entorno de ejecución. Se ejecuta diariamente en `main` y puede iniciarse manualmente:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

La ejecución manual normalmente evalúa el rendimiento de la referencia del flujo de trabajo. Establezca `target_ref` para evaluar una etiqueta de lanzamiento u otra rama con la implementación actual del flujo de trabajo. Las rutas de informes publicados y los punteros más recientes se organizan según la referencia probada, y cada `index.md` registra la referencia/SHA probada, la referencia/SHA del flujo de trabajo, la referencia de Kova, el perfil, el modo de autenticación de la vía, el modelo, el número de repeticiones y los filtros de escenarios.

El flujo de trabajo instala OCM desde una versión fijada y Kova desde `openclaw/Kova` en la entrada fijada `kova_ref`, y después ejecuta tres vías:

- `mock-provider`: escenarios de diagnóstico de Kova contra un entorno de ejecución compilado localmente con autenticación falsa determinista compatible con OpenAI.
- `mock-deep-profile`: perfilado de CPU/montículo/trazas para puntos críticos del inicio, el Gateway y los turnos del agente. Se ejecuta según la programación o manualmente con `deep_profile=true`.
- `live-openai-candidate`: un turno real del agente OpenAI `openai/gpt-5.6-luna`, omitido cuando `OPENAI_API_KEY` no está disponible. Se ejecuta según la programación o manualmente con `live_openai_candidate=true`.

La vía mock-provider también ejecuta sondeos de código fuente nativos de OpenClaw después de la pasada de Kova: tiempo de arranque y memoria del Gateway en los casos de inicio predeterminado, con canales omitidos, con enlace interno y con cincuenta plugins; RSS de importación de plugins incluidos, bucles de saludo repetidos de `channel-chat-baseline` con OpenAI simulado, comandos de inicio de la CLI contra el Gateway arrancado y el sondeo de rendimiento de humo del estado de SQLite. Cuando está disponible el informe de código fuente de mock-provider publicado anteriormente para la referencia probada, el resumen del código fuente compara los valores actuales de RSS y montículo con esa referencia y marca los aumentos grandes de RSS como `watch`. El resumen Markdown de los sondeos de código fuente se encuentra en `source/index.md` dentro del paquete de informes, junto a los datos JSON sin procesar.

Cada vía carga su artefacto completo de GitHub, incluidos los paquetes de CPU, montículo, trazas y diagnóstico comprimido. Un trabajo de publicación independiente descarga y valida esos artefactos y, a continuación, genera un token de corta duración de la GitHub App ClawSweeper limitado únicamente al contenido de `openclaw/clawgrit-reports`, y lo pasa solo al paso de inserción de Git. Confirma `report.json`, `report.md`, `index.md`, los artefactos de los sondeos de código fuente y los metadatos/sumas de comprobación del paquete en `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`; el archivo de diagnóstico completo permanece en el artefacto de Actions enlazado. El publicador rechaza cualquier archivo de informe de más de 50 MB antes de intentar una inserción. El puntero actual de la referencia probada es `openclaw-performance/<tested-ref>/latest-<lane>.json`. Las ejecuciones programadas y las ejecuciones manuales con `profile=release` fallan si falla la creación del token de la aplicación o la publicación del informe. En las ejecuciones manuales que no son de lanzamiento, la publicación sigue siendo informativa y se conservan los artefactos de GitHub cuando falla la autenticación o la publicación. La referencia de código fuente anterior se obtiene de forma anónima desde el repositorio público de informes, por lo que obtenerla correctamente no demuestra la autenticación del publicador.

## Validación completa del lanzamiento

`Full Release Validation` es el flujo de trabajo general manual para «ejecutarlo todo antes del lanzamiento». Acepta una rama, una etiqueta o un SHA de confirmación completo; ejecuta el flujo de trabajo manual `CI` con ese objetivo (incluido Android); ejecuta `Plugin Prerelease` para las pruebas exclusivas de lanzamiento de plugins/paquetes/elementos estáticos/Docker; ejecuta `OpenClaw Performance` contra el SHA objetivo; y ejecuta `OpenClaw Release Checks` para pruebas de humo de instalación, aceptación de paquetes, comprobaciones de paquetes entre sistemas operativos, paridad de QA Lab, Matrix y las vías de Telegram (la representación informativa de la tarjeta de madurez es opcional mediante `run_maturity_scorecard`). Los perfiles estable y completo siempre incluyen cobertura exhaustiva en vivo/E2E y de resistencia de la ruta de lanzamiento de Docker; el perfil beta puede incluirla con `run_release_soak=true`. La E2E canónica de Telegram del paquete se ejecuta dentro de Package Acceptance, por lo que un candidato completo no inicia un sondeador en vivo duplicado. Después de publicar, pase `release_package_spec` para reutilizar el paquete npm publicado en las comprobaciones de lanzamiento, Package Acceptance, Docker, sistemas operativos y Telegram sin volver a compilarlo. Use `npm_telegram_package_spec` solo para repetir de forma específica la prueba de Telegram de un paquete publicado. La vía de paquete en vivo del plugin Codex usa de forma predeterminada el mismo estado seleccionado: con `release_package_spec=openclaw@<tag>` publicado se deriva `codex_plugin_spec=npm:@openclaw/codex@<tag>`, mientras que las ejecuciones por SHA/artefacto empaquetan `extensions/codex` desde la referencia seleccionada. Establezca `codex_plugin_spec` explícitamente para fuentes de plugins personalizadas, como especificaciones `npm:`, `npm-pack:` o `git:`.

Consulte [Validación completa del lanzamiento](/es/reference/full-release-validation) para conocer la
matriz de etapas, los nombres exactos de los trabajos del flujo de trabajo, las diferencias entre perfiles, los artefactos y los
controles para repeticiones específicas.

`OpenClaw Release Publish` es el flujo de trabajo manual de publicación de versiones que realiza cambios. Inicie
las publicaciones beta y estables habituales desde un `main` de confianza después de que exista la etiqueta de versión
y de que la comprobación preliminar de npm de OpenClaw haya finalizado correctamente (la comprobación preliminar ejecuta
`pnpm plugins:sync:check` entre sus verificaciones). La etiqueta sigue seleccionando el commit exacto
de la versión, incluido un commit en `release/YYYY.M.PATCH`; las publicaciones alfa de Tideclaw
siguen utilizando su rama alfa correspondiente. Requiere el
`preflight_run_id` guardado, un
`full_release_validation_run_id` correcto y su
`full_release_validation_run_attempt` exacto; inicia `Plugin NPM Release` para todos
los paquetes de Plugin publicables, inicia `Plugin ClawHub Release` para el mismo
SHA de la versión y, solo entonces, inicia `OpenClaw NPM Release`. La publicación estable también
requiere un `windows_node_tag` exacto; el flujo de trabajo verifica la versión
fuente de Windows y compara sus instaladores x64/ARM64 con la entrada
`windows_node_installer_digests` aprobada para el candidato antes de iniciar cualquier publicación secundaria; después, promueve
y verifica esos mismos resúmenes de instaladores fijados, además del contrato exacto del recurso
complementario y de la suma de comprobación, antes de publicar el borrador de la versión de GitHub.
Las reparaciones específicas solo de plugins utilizan `plugin_publish_scope=selected` con una lista
de paquetes no vacía. Las ejecuciones `all-publishable` solo de plugins requieren las mismas pruebas inmutables de
la comprobación preliminar de npm y de Full Release Validation que una publicación del núcleo.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=beta
```

Para obtener pruebas de un commit fijado en una rama que cambia rápidamente, utilice el auxiliar en lugar de
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Las referencias de inicio de flujos de trabajo de GitHub deben ser ramas o etiquetas, no SHA de commits sin procesar. El
auxiliar envía una rama temporal `release-ci/<sha>-...` en un SHA de flujo de trabajo
de `main` de confianza, pasa el SHA de destino solicitado mediante la entrada `ref` del flujo de trabajo,
reutiliza pruebas estrictas del destino exacto cuando están disponibles, verifica que el
`headSha` de cada flujo de trabajo secundario coincida con el SHA del flujo de trabajo de confianza y elimina la rama temporal
cuando finaliza la ejecución. Pase `-f reuse_evidence=false` para forzar una
validación nueva. El verificador general también falla si algún flujo de trabajo secundario se ejecutó con un
SHA de flujo de trabajo diferente.

`release_profile` controla la amplitud de los proveedores y las pruebas en vivo que se pasa a las comprobaciones de la versión. Los
flujos de trabajo manuales de versión utilizan `stable` de forma predeterminada; utilice `full` solo cuando
desee intencionadamente la amplia matriz consultiva de proveedores y medios. Las comprobaciones de versiones
estables y completas siempre ejecutan las pruebas exhaustivas en vivo/E2E y la prueba prolongada de la ruta de publicación
en Docker; el perfil beta puede habilitarlas con `run_release_soak=true`.

- `minimum` conserva las vías críticas para la versión de OpenAI y del núcleo que se ejecutan con mayor rapidez.
- `stable` añade el conjunto estable de proveedores y backends.
- `full` ejecuta la amplia matriz consultiva de proveedores y medios.

El flujo general registra los identificadores de ejecución de los procesos secundarios iniciados, y el trabajo final `Verify full validation` vuelve a comprobar las conclusiones actuales de las ejecuciones secundarias y añade tablas de los trabajos más lentos para cada ejecución secundaria. Si un flujo de trabajo secundario se vuelve a ejecutar y finaliza correctamente, vuelva a ejecutar únicamente el trabajo de verificación principal para actualizar el resultado general y el resumen de tiempos.

Para la recuperación, tanto `Full Release Validation` como `OpenClaw Release Checks` aceptan `rerun_group`. Utilice `all` para un candidato de versión, `ci` solo para el proceso secundario habitual de CI completa, `plugin-prerelease` solo para el proceso secundario de versión preliminar de plugins, `performance` solo para el proceso secundario OpenClaw Performance, `release-checks` para todos los procesos secundarios de la versión o un grupo más específico: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` o `npm-telegram` en el flujo general. Esto mantiene acotada la repetición de una máquina de versión fallida después de una corrección específica. Para una única vía fallida entre sistemas operativos, combine `rerun_group=cross-os` con `cross_os_suite_filter`, por ejemplo, `windows/packaged-upgrade`; los comandos prolongados entre sistemas operativos emiten líneas de Heartbeat y los resúmenes de actualización empaquetada incluyen tiempos por fase. Las vías de comprobación de versión de control de calidad son consultivas, salvo la puerta estándar de cobertura de herramientas del entorno de ejecución, que bloquea cuando las herramientas dinámicas obligatorias de OpenClaw cambian o desaparecen del resumen del nivel estándar.

`OpenClaw Release Checks` utiliza la referencia de flujo de trabajo de confianza para resolver una vez la referencia seleccionada en un archivo tar `release-package-under-test` y, a continuación, pasa ese artefacto a las comprobaciones entre sistemas operativos y a Package Acceptance, además del flujo de trabajo de Docker para la ruta de versión en vivo/E2E cuando se ejecuta la cobertura de pruebas prolongadas. Esto mantiene uniformes los bytes del paquete entre las máquinas de versión y evita volver a empaquetar el mismo candidato en varios trabajos secundarios. Para la vía en vivo del plugin npm de Codex, las comprobaciones de la versión pasan una especificación de plugin publicado coincidente derivada de `release_package_spec`, pasan el valor `codex_plugin_spec` proporcionado por el operador o dejan la entrada vacía para que el script de Docker empaquete el plugin de Codex del checkout seleccionado.

Las ejecuciones duplicadas de `Full Release Validation` para `ref=main` y `rerun_group=all`
sustituyen al flujo general anterior. El monitor principal cancela cualquier flujo de trabajo secundario que
ya haya iniciado cuando se cancela el principal, por lo que una validación más reciente de main
no queda esperando detrás de una ejecución obsoleta de dos horas de comprobación de la versión. La validación de
ramas/etiquetas de versión y los grupos de repetición específicos mantienen `cancel-in-progress: false`.

## Fragmentos en vivo y E2E

El proceso secundario en vivo/E2E de la versión conserva una amplia cobertura nativa de `pnpm test:live`, pero la ejecuta como fragmentos con nombre mediante `scripts/test-live-shard.mjs` en lugar de un único trabajo en serie:

- `native-live-src-agents` y `native-live-src-agents-zai-coding`
- `native-live-src-gateway-core`
- trabajos `native-live-src-gateway-profiles` filtrados por proveedor
- `native-live-src-gateway-backends`
- `native-live-src-infra`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-moonshot`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- fragmentos separados de audio/vídeo multimedia y fragmentos de música filtrados por proveedor

Esto mantiene la misma cobertura de archivos y facilita volver a ejecutar y diagnosticar los fallos lentos de proveedores en vivo. Los nombres de fragmentos agregados `native-live-src-gateway`, `native-live-extensions-o-z`, `native-live-extensions-media` y `native-live-extensions-media-music` siguen siendo válidos para repeticiones manuales únicas.

Los fragmentos nativos de multimedia en vivo se ejecutan en `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, creado por el flujo de trabajo `Live Media Runner Image`. Esa imagen preinstala `ffmpeg` y `ffprobe`; los trabajos multimedia solo verifican los binarios antes de la configuración. Mantenga las suites en vivo basadas en Docker en ejecutores normales de Blacksmith: los trabajos en contenedores no son el lugar adecuado para iniciar pruebas Docker anidadas.

Los fragmentos de modelos/backends en vivo basados en Docker utilizan una imagen compartida independiente `ghcr.io/openclaw/openclaw-live-test:<sha>-<extensions>` por cada commit seleccionado. El flujo de trabajo de publicación en vivo crea y publica esa imagen una sola vez; después, los fragmentos de modelos Docker en vivo, Gateway divididos por proveedor, backend de la CLI, enlace ACP y entorno de pruebas de Codex se ejecutan con `OPENCLAW_SKIP_DOCKER_BUILD=1`. Los fragmentos Docker de Gateway incluyen límites explícitos de `timeout` a nivel de script, inferiores al tiempo de espera del trabajo del flujo de trabajo, para que un contenedor o una ruta de limpieza bloqueados fallen rápidamente en lugar de consumir todo el presupuesto de las comprobaciones de publicación. Si esos fragmentos vuelven a crear de forma independiente el destino Docker completo desde el código fuente, la ejecución de publicación está mal configurada y desperdiciará tiempo real en creaciones duplicadas de imágenes.

## Aceptación de paquetes

Use `Package Acceptance` cuando la pregunta sea «¿funciona como producto este paquete instalable de OpenClaw?». Es diferente de la CI normal: la CI normal valida el árbol de código fuente, mientras que la aceptación de paquetes valida un único tarball mediante el mismo entorno de pruebas E2E de Docker que utilizan los usuarios después de instalar o actualizar.

### Trabajos

1. `resolve_package` extrae `workflow_ref`, resuelve un candidato de paquete, escribe `.artifacts/docker-e2e-package/openclaw-current.tgz`, escribe `.artifacts/docker-e2e-package/package-candidate.json`, carga ambos como el artefacto `package-under-test` e imprime el origen, la referencia del flujo de trabajo, la referencia del paquete, la versión, el SHA-256 y el perfil en el resumen del paso de GitHub.
2. `package_integrity` descarga el artefacto `package-under-test` y aplica el contrato público del tarball del paquete mediante `scripts/check-openclaw-package-tarball.mjs`.
3. `docker_acceptance` llama a `openclaw-live-and-e2e-checks-reusable.yml` con el SHA de origen del paquete resuelto (o `workflow_ref` como alternativa) y `package_artifact_name=package-under-test`. El flujo de trabajo reutilizable descarga ese artefacto, valida el inventario del tarball, prepara imágenes Docker basadas en el resumen del paquete cuando es necesario y ejecuta las vías Docker seleccionadas con ese paquete, en lugar de empaquetar el código extraído por el flujo de trabajo. Cuando un perfil selecciona varias `docker_lanes` específicas, el flujo de trabajo reutilizable prepara una sola vez el paquete y las imágenes compartidas y, después, distribuye esas vías como trabajos Docker específicos en paralelo con artefactos únicos.
4. `package_telegram` llama opcionalmente a `NPM Telegram Beta E2E`. Se ejecuta cuando `telegram_mode` no es `none` e instala el mismo artefacto `package-under-test` cuando la aceptación de paquetes ha resuelto uno; una ejecución independiente de Telegram aún puede instalar una especificación publicada de npm.
5. `summary` hace que el flujo de trabajo falle si la resolución del paquete, la integridad, la aceptación de Docker o la vía opcional de Telegram han fallado. La entrada `advisory` rebaja los fallos de aceptación a advertencias para los invocadores de carácter informativo.

### Orígenes de candidatos

- `source=npm` solo acepta `openclaw@extended-stable`, `openclaw@beta`, `openclaw@latest` o una versión exacta de publicación de OpenClaw, como `openclaw@2026.4.27-beta.2`. Úselo para la aceptación de versiones publicadas de soporte estable extendido, versiones preliminares o estables.
- `source=ref` empaqueta una rama, etiqueta o SHA completo de commit de confianza de `package_ref`. El resolutor obtiene las ramas/etiquetas de OpenClaw, verifica que el commit seleccionado sea accesible desde el historial de ramas del repositorio o una etiqueta de publicación, instala las dependencias en un árbol de trabajo separado y lo empaqueta mediante `scripts/package-openclaw-for-docker.mjs`.
- `source=url` descarga un `.tgz` HTTPS público; se requiere `package_sha256`. Esta ruta rechaza credenciales en la URL, puertos HTTPS no predeterminados, nombres de host o direcciones IP resueltas privadas, internas o de uso especial, y redirecciones que queden fuera de la misma política de seguridad pública.
- `source=trusted-url` descarga un `.tgz` HTTPS desde una política de origen de confianza con nombre definida en `.github/package-trusted-sources.json`; se requieren `package_sha256` y `trusted_source_id`. Úselo únicamente para réplicas empresariales administradas por mantenedores o repositorios de paquetes privados que necesiten hosts, puertos, prefijos de ruta, hosts de redirección o resolución de red privada configurados. Si la política declara autenticación mediante token de portador, el flujo de trabajo utiliza el secreto fijo `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; las credenciales integradas en la URL siguen siendo rechazadas.
- `source=artifact` descarga un `.tgz` de `artifact_run_id` y `artifact_name`; `package_sha256` es opcional, pero debe proporcionarse para artefactos compartidos externamente.

Mantenga `workflow_ref` y `package_ref` separados. `workflow_ref` es el código de confianza del flujo de trabajo/entorno de pruebas que ejecuta la prueba. `package_ref` es el commit de origen que se empaqueta cuando `source=ref`. Esto permite que el entorno de pruebas actual valide commits de origen de confianza más antiguos sin ejecutar lógica antigua del flujo de trabajo.

### Perfiles de suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `root-managed-vps-upgrade`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — el conjunto `package` con cobertura de `plugins` en vivo en lugar de `plugins-offline`, además de `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — fragmentos completos de la ruta de publicación de Docker con OpenWebUI
- `custom` — valores exactos de `docker_lanes`; obligatorio cuando `suite_profile=custom`

El perfil `package` usa cobertura de plugins sin conexión para que la validación del paquete publicado no dependa de la disponibilidad de ClawHub en vivo. La fase opcional de Telegram reutiliza el artefacto `package-under-test` en `NPM Telegram Beta E2E`, y la ruta de especificación npm publicada se conserva para ejecuciones independientes.

Para consultar la política específica de pruebas de actualizaciones y plugins, incluidos los comandos locales,
las fases de Docker, las entradas de Package Acceptance, los valores predeterminados de la versión y la clasificación de errores,
consulte [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins).

Las comprobaciones de la versión invocan Package Acceptance con `source=artifact`, el artefacto del paquete de la versión preparado, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape'` y `telegram_mode=mock-openai`. Esto mantiene la migración del paquete, la actualización, la instalación en vivo de Skills desde ClawHub, la limpieza de dependencias obsoletas de plugins, la reparación de la instalación de plugins configurados, el plugin sin conexión, la actualización de plugins y la prueba de Telegram en el mismo tarball de paquete resuelto. Establezca `release_package_spec` en Full Release Validation u OpenClaw Release Checks después de publicar una versión beta para ejecutar la misma matriz con el paquete npm distribuido sin volver a compilarlo; establezca `package_acceptance_package_spec` solo cuando Package Acceptance necesite un paquete distinto del resto de la validación de la versión. Las comprobaciones de versiones entre sistemas operativos siguen cubriendo la incorporación, el instalador y el comportamiento específico de cada plataforma; la validación del producto relativa al paquete y la actualización debe comenzar con Package Acceptance.

La fase de Docker `published-upgrade-survivor` valida una referencia de paquete publicado por ejecución en la ruta de publicación bloqueante. En Package Acceptance, el tarball `package-under-test` resuelto siempre es el candidato y `published_upgrade_survivor_baseline` selecciona la referencia publicada alternativa, cuyo valor predeterminado es `openclaw@latest`; los comandos de repetición de fases fallidas conservan esa referencia. Full Release Validation con `run_release_soak=true` o `release_profile=full` establece `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` y `published_upgrade_survivor_scenarios=reported-issues` para ampliar la cobertura a las cuatro versiones estables más recientes de npm, además de versiones fijadas de los límites de compatibilidad de plugins y accesorios basados en incidencias para la configuración de Feishu, los archivos de arranque y personalidad conservados, las instalaciones configuradas de plugins de OpenClaw, las rutas de registros con virgulilla y las raíces obsoletas de dependencias de plugins heredados. Las selecciones de supervivencia a actualizaciones publicadas con varias referencias se fragmentan por referencia en trabajos independientes y específicos del ejecutor de Docker. El flujo de trabajo independiente `Update Migration` usa la fase de Docker `update-migration` con referencias `all-since-2026.4.23` y escenarios `plugin-deps-cleanup` cuando se necesita una limpieza exhaustiva de actualizaciones publicadas, no la amplitud habitual de Full Release CI. Las ejecuciones agregadas locales pueden proporcionar especificaciones exactas de paquetes mediante `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, conservar una única fase con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, como `openclaw@2026.4.15`, o establecer `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` para la matriz de escenarios. La fase publicada configura la referencia mediante una receta de comandos `openclaw config set` incorporada, registra los pasos de la receta en `summary.json` y sondea `/healthz`, `/readyz` y el estado de RPC después de iniciar el Gateway. Las fases desde cero del paquete y el instalador de Windows también verifican que un paquete instalado pueda importar una anulación del control del navegador desde una ruta absoluta de Windows sin procesar. La prueba rápida de turnos del agente de OpenAI entre sistemas operativos usa de forma predeterminada `OPENCLAW_CROSS_OS_OPENAI_MODEL` cuando está establecido; de lo contrario, usa `openai/gpt-5.6-luna`, de modo que la prueba de instalación y Gateway utilice el nivel de prueba GPT-5.6 de menor costo.

### Ventanas de compatibilidad heredada

Package Acceptance tiene ventanas acotadas de compatibilidad heredada para paquetes ya publicados. Los paquetes hasta `2026.4.25`, incluidos los de `2026.4.25-beta.*`, pueden usar la ruta de compatibilidad:

- las entradas privadas conocidas de control de calidad en `dist/postinstall-inventory.json` pueden apuntar a archivos omitidos del tarball;
- `doctor-switch` puede omitir el subcaso de persistencia `gateway install --wrapper` cuando el paquete no expone esa opción;
- `update-channel-switch` puede eliminar `patchedDependencies` de pnpm que falten en el accesorio de Git falso derivado del tarball y puede registrar la ausencia de `update.channel` persistido;
- las pruebas rápidas de plugins pueden leer ubicaciones heredadas de registros de instalación o aceptar que no se conserven los registros de instalación del catálogo;
- `plugin-update` puede permitir la migración de metadatos de configuración, pero sigue exigiendo que el registro de instalación y el comportamiento sin reinstalación permanezcan sin cambios.

El paquete publicado `2026.4.26` también puede emitir advertencias por archivos de sello de metadatos de compilación local que ya se hayan distribuido, y los paquetes hasta `2026.5.20` pueden emitir una advertencia en lugar de fallar cuando falta `npm-shrinkwrap.json`. Los paquetes posteriores deben cumplir los contratos modernos; las mismas condiciones provocan un error en lugar de una advertencia u omisión.

### Ejemplos

```bash
# Valide el paquete beta actual con cobertura a nivel de producto.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# Valide el paquete estable ampliado publicado con cobertura de paquete.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@extended-stable \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Empaquete y valide una rama de versión con el arnés actual.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.PATCH \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Valide la URL de un tarball. SHA-256 es obligatorio para source=url.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=url \
  -f package_url=https://example.com/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Valide un tarball de una política con nombre para un espejo privado de confianza.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Reutilice un tarball cargado por otra ejecución de Actions.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

Al depurar una ejecución fallida de aceptación de paquetes, comience por el resumen `resolve_package` para confirmar el origen, la versión y el SHA-256 del paquete. Después, inspeccione la ejecución secundaria `docker_acceptance` y sus artefactos de Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, los registros de las fases, los tiempos de las etapas y los comandos de repetición. Es preferible volver a ejecutar el perfil de paquete fallido o las fases exactas de Docker en lugar de repetir la validación completa de la versión.

## Prueba rápida de instalación

El flujo de trabajo `Install Smoke` ya no se ejecuta en solicitudes de incorporación de cambios ni en envíos a `main`. Tanto su contenedor nocturno/manual como la validación de la versión invocan el núcleo de solo lectura `install-smoke-reusable.yml`, y cada ejecución sigue la ruta completa de pruebas rápidas de instalación en ejecutores alojados en GitHub:

- La imagen de prueba rápida del Dockerfile raíz se compila una vez por cada SHA de destino, se vincula a la revisión del flujo de trabajo y al intento del productor en un artefacto inmutable, y después se carga en la prueba rápida de la CLI, la prueba rápida de la CLI para la eliminación de agentes en un espacio de trabajo compartido, la prueba E2E de la red del Gateway del contenedor y la prueba rápida del argumento de compilación del plugin `matrix` incluido. La prueba rápida del plugin verifica la réplica de la instalación de dependencias en tiempo de ejecución y que el plugin se cargue sin diagnósticos de escape del punto de entrada.
- La instalación del paquete QR y las pruebas rápidas de Docker del instalador y la actualización —incluidas las fases del instalador de Rocky Linux y una fase de actualización con una referencia npm configurable mediante `update_baseline_version`— se ejecutan como trabajos independientes para que el trabajo del instalador no espere detrás de las pruebas rápidas de la imagen raíz.

La prueba rápida lenta del proveedor de imágenes con instalación global de Bun se controla por separado mediante `run_bun_global_install_smoke`. Se ejecuta con la programación nocturna, está activada de forma predeterminada para las llamadas al flujo de trabajo desde las comprobaciones de la versión y las ejecuciones manuales de `Install Smoke` pueden habilitarla. La CI normal de las solicitudes de incorporación de cambios sigue ejecutando la fase rápida de regresión del lanzador de Bun para cambios relevantes para Node. Las pruebas de Docker de QR y del instalador conservan sus propios Dockerfiles centrados en la instalación.

## E2E local de Docker

`pnpm test:docker:all` precompila una imagen compartida de pruebas en vivo, empaqueta OpenClaw una vez como tarball de npm y compila dos imágenes compartidas de `scripts/e2e/Dockerfile`:

- un ejecutor básico de Node/Git para las fases de instalador, actualización y dependencias de plugins;
- una imagen funcional que instala el mismo tarball en `/app` para las fases de funcionalidad normales.

Las definiciones de las fases de Docker se encuentran en `scripts/lib/docker-e2e-scenarios.mjs`, la lógica del planificador se encuentra en `scripts/lib/docker-e2e-plan.mjs` y el ejecutor solo ejecuta el plan seleccionado. El programador selecciona la imagen de cada fase mediante `OPENCLAW_DOCKER_E2E_BARE_IMAGE` y `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, y después ejecuta las fases con `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parámetros ajustables

| Variable                               | Valor predeterminado | Propósito                                                                                                         |
| -------------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10                   | Número de espacios del grupo principal para las fases normales.                                                   |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10                   | Número de espacios del grupo final para fases sensibles al proveedor.                                             |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9                    | Límite de fases en vivo simultáneas para que los proveedores no restrinjan el tráfico.                            |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5                    | Límite de fases simultáneas de instalación de npm.                                                                |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7                    | Límite de fases simultáneas con varios servicios.                                                                 |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000                 | Intervalo escalonado entre inicios de fases para evitar picos de creación del daemon de Docker; use `0` para desactivarlo. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000              | Tiempo de espera alternativo por fase (120 minutos); las fases en vivo/finales seleccionadas usan límites más estrictos. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | sin establecer       | `1` imprime el plan del programador sin ejecutar las fases.                                                       |
| `OPENCLAW_DOCKER_ALL_LANES`            | sin establecer       | Lista separada por comas de fases exactas; omite la prueba rápida de limpieza para que los agentes puedan reproducir una fase fallida. |

Una fase con un peso superior a su límite efectivo puede iniciarse de todos modos desde un grupo vacío y, a continuación, se ejecuta sola hasta liberar capacidad. El agregado local comprueba previamente Docker, elimina los contenedores E2E obsoletos de OpenClaw, muestra el estado de las fases activas, conserva los tiempos de las fases para ordenarlas de mayor a menor duración y, de forma predeterminada, deja de programar nuevas fases agrupadas después del primer error.

### Flujo de trabajo reutilizable en vivo/E2E

El flujo de trabajo reutilizable en vivo/E2E consulta a `scripts/test-docker-all.mjs --plan-json` qué paquete, tipo de imagen, imagen en vivo, carril y cobertura de credenciales se requieren. A continuación, `scripts/docker-e2e.mjs` convierte ese plan en salidas y resúmenes de GitHub. Empaqueta OpenClaw mediante `scripts/package-openclaw-for-docker.mjs`, descarga un artefacto de paquete de la ejecución actual o descarga un artefacto de paquete desde `package_artifact_run_id`, y después valida el inventario del archivo tar. La ruta predeterminada `no-push-artifact` compila imágenes básicas/funcionales etiquetadas con el resumen del paquete mediante la caché de capas de Docker de Blacksmith, empaqueta los bytes exactos de la imagen en un artefacto inmutable del flujo de trabajo y hace que cada consumidor verifique y cargue ese artefacto. En cambio, `existing-only` requiere referencias explícitas de GHCR en `docker_e2e_bare_image`/`docker_e2e_functional_image` y nunca compila ni publica imágenes. Esas extracciones del registro usan un tiempo de espera limitado de 180 segundos por intento, de modo que un flujo bloqueado se reintente rápidamente en lugar de consumir la mayor parte de la ruta crítica de CI. Tras una validación programada correcta, `openclaw-scheduled-live-checks.yml` pasa el manifiesto inmutable de la imagen probada al publicador independiente con permisos de escritura de paquetes; los invocadores de versiones y versiones preliminares de solo lectura nunca pasan por ese proceso de escritura.

### Fragmentos de la ruta de publicación

La cobertura de Docker para publicaciones ejecuta trabajos fragmentados más pequeños con `OPENCLAW_SKIP_DOCKER_BUILD=1`, de modo que cada fragmento verifica y carga únicamente el tipo de imagen respaldado por artefactos que necesita (o lo extrae mediante una reutilización explícita con `existing-only`) y ejecuta varios carriles mediante el mismo planificador ponderado:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | openwebui`

Los fragmentos actuales de Docker para publicaciones son `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, desde `plugins-runtime-install-a` hasta `plugins-runtime-install-h` y `openwebui`. `package-update-openai` incluye el carril de paquete del Plugin de Codex en vivo, que instala el paquete candidato de OpenClaw, instala el Plugin de Codex desde `codex_plugin_spec` o un archivo tar de la misma referencia con aprobación explícita para instalar la CLI de Codex, ejecuta la comprobación previa de la CLI de Codex y después ejecuta varios turnos del agente de OpenClaw en la misma sesión con OpenAI. `plugins-runtime-core`, `plugins-runtime` y `plugins-integrations` siguen siendo alias agregados de plugins/entorno de ejecución. El alias de carril `install-e2e` sigue siendo el alias agregado de repetición manual para ambos carriles del instalador de proveedores.

OpenWebUI se ejecuta como un fragmento `openwebui` independiente en un ejecutor de Blacksmith dedicado con disco de gran capacidad siempre que la cobertura estable o completa de la ruta de publicación lo solicite, incluso cuando el flujo de trabajo reutilizable dirige los trabajos compatibles a ejecutores alojados en GitHub. Mantener separada la extracción de la imagen externa evita que la imagen de gran tamaño compita con las imágenes compartidas de paquetes y plugins en `plugins-runtime-services`; los fragmentos agregados heredados de plugins/entorno de ejecución siguen incluyendo OpenWebUI para repeticiones manuales compatibles. Los carriles de actualización de canales incluidos vuelven a intentarlo una vez ante fallos transitorios de red de npm.

Cada fragmento carga `.artifacts/docker-tests/` con registros de carriles, tiempos, `summary.json`, `failures.json`, tiempos de fases, el JSON del plan del planificador, tablas de carriles lentos y comandos de repetición por carril. La entrada `docker_lanes` del flujo de trabajo ejecuta los carriles seleccionados con las imágenes preparadas para esa ejecución en lugar de los trabajos de fragmentos, lo que limita la depuración de carriles fallidos a un único trabajo específico de Docker; si un carril seleccionado es un carril de Docker en vivo, el trabajo específico compila localmente la imagen de pruebas en vivo para esa repetición. El asistente de repetición valida el SHA de destino seleccionado exacto del artefacto de fallos y la ejecución manual vuelve a empaquetar esa referencia, porque la tupla de paquetes del flujo de trabajo reutilizable interno no forma parte del esquema de `workflow_dispatch`. Los comandos generados incluyen entradas de imágenes preparadas y `shared_image_policy=existing-only` únicamente cuando esas entradas están respaldadas por GHCR; las etiquetas de artefactos locales del ejecutor se omiten para que un ejecutor nuevo vuelva a compilarlas. Una sustitución explícita del destino descarta las referencias recuperadas de imágenes de GHCR, salvo que el artefacto demuestre que coinciden con la sustitución. También se omiten las referencias de definiciones de flujos de trabajo generadas por artefactos porque se eliminan las ramas temporales de la publicación completa; la ejecución usa la rama predeterminada del repositorio, salvo que el operador la sustituya explícitamente.

```bash
pnpm test:docker:rerun <run-id>      # descarga los artefactos de Docker e imprime comandos de repetición específicos combinados y por carril
pnpm test:docker:timings <summary>   # resúmenes de los carriles lentos y de la ruta crítica por fases
```

El flujo de trabajo programado en vivo/E2E ejecuta diariamente el conjunto completo de Docker de la ruta de lanzamiento y, tras completarse correctamente, invoca al publicador explícito para los artefactos de imagen exactos que se probaron.

## Versión preliminar de plugins

`Plugin Prerelease` ofrece una cobertura más costosa del producto y los paquetes, por lo que es un flujo de trabajo independiente que inicia `Full Release Validation` o un operador de forma explícita. Las solicitudes de incorporación de cambios normales, los envíos a `main` y las ejecuciones manuales independientes de CI mantienen desactivado ese conjunto. Distribuye las pruebas de plugins incluidos entre ocho ejecutores de extensiones; esos trabajos de fragmentos de extensiones ejecutan simultáneamente hasta dos grupos de configuración de plugins, con un ejecutor de Vitest por grupo y un montón de memoria de Node más grande, para que los lotes de plugins con muchas importaciones no creen trabajos de CI adicionales. La ruta de versión preliminar de Docker exclusiva para lanzamientos (habilitada mediante la entrada `full_release_validation`) agrupa los carriles específicos de Docker en grupos de cuatro para evitar reservar decenas de ejecutores para trabajos de uno a tres minutos. El flujo de trabajo también carga un artefacto informativo `plugin-inspector-advisory` de `@openclaw/plugin-inspector`; los hallazgos del inspector sirven como información para la clasificación y no modifican la comprobación bloqueante de Plugin Prerelease.

## Laboratorio de control de calidad

El laboratorio de control de calidad tiene carriles de CI dedicados fuera del flujo de trabajo principal con alcance inteligente. La paridad agéntica está integrada en los conjuntos amplios de control de calidad y lanzamiento, y no constituye un flujo de trabajo independiente para solicitudes de incorporación de cambios. Utilice `Full Release Validation` con `rerun_group=qa-parity` cuando la paridad deba formar parte de una ejecución de validación amplia.

- El flujo de trabajo `QA-Lab - All Lanes` se ejecuta cada noche en `main` y mediante ejecución manual; distribuye el carril de paridad simulada, el carril de Matrix en vivo y los carriles de Telegram y Discord en vivo como trabajos paralelos. Los trabajos en vivo utilizan el entorno `qa-live-shared`, y Telegram/Discord utilizan concesiones de Convex.

Las comprobaciones de lanzamiento ejecutan carriles de transporte en vivo de Matrix y Telegram con el proveedor simulado determinista y modelos designados como simulados (`mock-openai/gpt-5.6-luna` y `mock-openai/gpt-5.6-luna-alt`), de modo que el contrato del canal quede aislado de la latencia del modelo en vivo y del inicio normal del plugin del proveedor. El Gateway de transporte en vivo deshabilita la búsqueda en memoria porque la paridad de control de calidad cubre por separado el comportamiento de la memoria; la conectividad del proveedor está cubierta por los conjuntos independientes de modelo en vivo, proveedor nativo y proveedor de Docker.

Matrix usa `--profile fast` para las puertas programadas y de lanzamiento, y añade `--fail-fast` solo cuando la CLI que se ha extraído lo admite. El valor predeterminado de la CLI y la entrada del flujo de trabajo manual siguen siendo `all`; el despacho manual con `matrix_profile=all` siempre divide la cobertura completa de Matrix en los trabajos `transport`, `media`, `e2ee-smoke`, `e2ee-deep` y `e2ee-cli`.

`OpenClaw Release Checks` también ejecuta las líneas de QA Lab críticas para el lanzamiento antes de su aprobación; su puerta de paridad de QA ejecuta los paquetes candidato y de referencia como trabajos de línea paralelos y, después, descarga ambos artefactos en un pequeño trabajo de informe para realizar la comparación final de paridad.

Para las PR normales, se deben seguir las pruebas de CI/comprobaciones específicas del ámbito en lugar de tratar la paridad como un estado obligatorio.

## CodeQL

El flujo de trabajo `CodeQL` está diseñado intencionadamente como un escáner de seguridad de primera pasada y alcance reducido, no como el análisis completo del repositorio. Las ejecuciones diarias, manuales, por envío a `main` y de protección de solicitudes de cambios que no sean borradores analizan el código de los flujos de trabajo de Actions y las superficies JavaScript/TypeScript de mayor riesgo mediante consultas de seguridad de alta confianza filtradas por `security-severity` alta/crítica.

La protección de solicitudes de cambios se mantiene ligera: solo se inicia con cambios en `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `scripts`, `src` o rutas del entorno de ejecución de Plugins incluidos que sean propietarias de procesos, y ejecuta la misma matriz de seguridad de alta confianza que el flujo de trabajo programado. CodeQL para Android y macOS queda fuera de los valores predeterminados de las PR.

### Categorías de seguridad

| Categoría                                         | Superficie                                                                                                                                              |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Base de autenticación, secretos, entorno aislado, cron y gateway                                                                                         |
| `/codeql-security-high/channel-runtime-boundary`  | Contratos de implementación de canales del núcleo, además del entorno de ejecución del Plugin de canal, gateway, SDK de Plugins, secretos y puntos de auditoría |
| `/codeql-security-high/network-ssrf-boundary`     | Superficies de políticas SSRF del núcleo, análisis de IP, protección de red, obtención web y SDK de Plugins                                               |
| `/codeql-security-high/mcp-process-tool-boundary` | Servidores MCP, auxiliares de ejecución de procesos, entrega saliente y puertas de ejecución de herramientas del agente                                  |
| `/codeql-security-high/process-exec-boundary`     | Shell local, auxiliares para iniciar procesos, entornos de ejecución de Plugins incluidos propietarios de subprocesos y código de enlace de scripts de flujos de trabajo |
| `/codeql-security-high/plugin-trust-boundary`     | Superficies de confianza de instalación, cargador, manifiesto, registro, instalación mediante gestor de paquetes, carga de fuentes y contrato de paquete del SDK de Plugins |

### Particiones de seguridad específicas de la plataforma

- `CodeQL Android Critical Security` — partición de seguridad programada para Android. Compila manualmente la aplicación para Android con CodeQL en el ejecutor Linux de Blacksmith más pequeño que acepte la comprobación de coherencia del flujo de trabajo. Carga los resultados en `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — partición de seguridad semanal/manual para macOS. Compila manualmente la aplicación para macOS con CodeQL en Blacksmith macOS, excluye de los archivos SARIF cargados los resultados de compilación de dependencias y carga los resultados en `/codeql-critical-security/macos`. Se mantiene fuera de los valores predeterminados diarios porque la compilación de macOS domina el tiempo de ejecución incluso cuando no detecta problemas.

### Categorías de calidad crítica

`CodeQL Critical Quality` es la partición equivalente no relacionada con la seguridad. Ejecuta únicamente consultas de calidad JavaScript/TypeScript no relacionadas con la seguridad y con gravedad de error sobre superficies reducidas de alto valor en ejecutores Linux alojados en GitHub, para que los análisis de calidad no consuman el presupuesto de registro de ejecutores de Blacksmith. Su protección de solicitudes de cambios es intencionadamente menor que el perfil programado: las PR que no sean borradores ejecutan únicamente las particiones correspondientes a las superficies que modifican, de entre trece particiones que pueden asignarse a PR: `agent-runtime-boundary`, `channel-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `gateway-runtime-boundary`, `mcp-process-runtime-boundary`, `memory-runtime-boundary`, `network-runtime-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, `plugin-sdk-reply-runtime`, `provider-runtime-boundary` y `session-diagnostics-boundary`. `ui-control-plane` y `web-media-runtime-boundary` quedan fuera de las ejecuciones de PR. Los cambios en la configuración de CodeQL y en el flujo de trabajo de calidad ejecutan el conjunto completo de particiones para PR (la partición del entorno de ejecución de red se activa según sus propios archivos de configuración de CodeQL y las rutas de código fuente propietarias de la red).

El despacho manual acepta:

```text
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|network-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Los perfiles reducidos son mecanismos de aprendizaje e iteración para ejecutar una sola partición de calidad de forma aislada.

| Categoría                                               | Superficie                                                                                                                                                                                                 |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Código del límite de seguridad de autenticación, secretos, entorno aislado, Cron y Gateway                                                                                                                |
| `/codeql-critical-quality/config-boundary`              | Contratos de esquema de configuración, migración, normalización y E/S                                                                                                                                      |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Esquemas del protocolo del Gateway y contratos de métodos del servidor                                                                                                                                     |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratos de implementación de los canales del núcleo y los plugins de canal incluidos                                                                                                                    |
| `/codeql-critical-quality/agent-runtime-boundary`       | Contratos de ejecución de comandos, envío a modelos/proveedores, envío y colas de respuestas automáticas, y entorno de ejecución del plano de control de ACP                                              |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Contratos de servidores MCP y puentes de herramientas, auxiliares de supervisión de procesos y entrega saliente                                                                                           |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK del host de memoria, fachadas del entorno de ejecución de memoria, alias del Plugin SDK de memoria, código de integración para activar el entorno de ejecución de memoria y comandos de diagnóstico de memoria |
| `/codeql-critical-quality/network-runtime-boundary`     | Paquete de políticas de red, entorno de ejecución de sockets sin procesar y captura de proxy, túnel SSH, bloqueo del Gateway, socket JSONL y superficies de transporte push                               |
| `/codeql-critical-quality/session-diagnostics-boundary` | Componentes internos de la cola de respuestas, colas de entrega de sesiones, auxiliares de vinculación/entrega de sesiones salientes, superficies de paquetes de eventos/registros de diagnóstico y contratos de la CLI de diagnóstico de sesiones |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Envío de respuestas entrantes del Plugin SDK, auxiliares de carga útil/fragmentación/entorno de ejecución de respuestas, opciones de respuesta de canales, colas de entrega y auxiliares de vinculación de sesiones/hilos |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalización del catálogo de modelos, autenticación y descubrimiento de proveedores, registro del entorno de ejecución de proveedores, valores predeterminados/catálogos de proveedores y registros web/búsqueda/obtención/embeddings |
| `/codeql-critical-quality/ui-control-plane`             | Inicialización de la interfaz de control, persistencia local, flujos de control del Gateway y contratos del entorno de ejecución del plano de control de tareas                                           |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contratos del entorno de ejecución del núcleo para obtención/búsqueda web, E/S multimedia, comprensión multimedia, generación de imágenes y generación multimedia                                        |
| `/codeql-critical-quality/plugin-boundary`              | Contratos del cargador, registro, superficie pública y puntos de entrada del Plugin SDK                                                                                                                   |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Código fuente publicado del Plugin SDK correspondiente al paquete y auxiliares de contratos de paquetes de plugins                                                                                        |

La calidad se mantiene separada de la seguridad para que los hallazgos de calidad puedan programarse, medirse, deshabilitarse o ampliarse sin ocultar la señal de seguridad. La ampliación de CodeQL para Swift, Python y los plugins incluidos solo debe volver a añadirse como trabajo posterior con alcance delimitado o dividido en fragmentos una vez que los perfiles reducidos tengan un entorno de ejecución y una señal estables.

## Flujos de trabajo de mantenimiento

### Agente de documentación

El flujo de trabajo `Docs Agent` es una vía de mantenimiento de Codex basada en eventos para mantener la documentación existente alineada con los cambios incorporados recientemente. No tiene una programación exclusivamente temporal: una ejecución de CI correcta de un push no realizado por un bot en `main` puede activarlo, y el despacho manual puede ejecutarlo directamente. Las invocaciones mediante ejecuciones de flujo de trabajo se omiten cuando `main` ha avanzado o cuando se creó otra ejecución no omitida de Docs Agent durante la última hora. Cuando se ejecuta, revisa el intervalo de commits desde el SHA de origen de la ejecución anterior no omitida de Docs Agent hasta el `main` actual, de modo que una ejecución cada hora puede abarcar todos los cambios de main acumulados desde la última revisión de documentación.

### Agente de rendimiento de pruebas

El flujo de trabajo `Test Performance Agent` es una vía de mantenimiento de Codex basada en eventos para pruebas lentas. No tiene una programación exclusivamente temporal: una ejecución de CI correcta de un push no realizado por un bot en `main` puede activarlo, pero se omite si otra invocación mediante ejecución de flujo de trabajo ya se ejecutó o está ejecutándose ese día UTC. El despacho manual omite ese control de actividad diaria. La vía genera un informe de rendimiento de Vitest agrupado para la suite completa, permite que Codex realice únicamente pequeñas correcciones de rendimiento de las pruebas que conserven la cobertura, en lugar de refactorizaciones amplias, luego vuelve a ejecutar el informe de la suite completa y rechaza los cambios que reduzcan el número base de pruebas aprobadas. El informe agrupado registra el tiempo transcurrido por configuración y el RSS máximo en Linux y macOS, por lo que la comparación del antes y el después muestra las diferencias de memoria de las pruebas junto a las diferencias de duración. Si la línea base tiene pruebas fallidas, Codex solo puede corregir fallos evidentes y el informe de la suite completa posterior al agente debe aprobarse antes de confirmar cualquier cambio. Cuando `main` avanza antes de que se incorpore el push del bot, la vía reorganiza el parche validado sobre la nueva base, vuelve a ejecutar `pnpm check:changed` y reintenta el push; los parches obsoletos con conflictos se omiten. Utiliza Ubuntu alojado en GitHub para que la acción de Codex pueda mantener la misma postura de seguridad de eliminación de sudo que el agente de documentación.

### PR duplicadas después de la fusión

El flujo de trabajo `Duplicate PRs After Merge` es un flujo de trabajo manual para responsables de mantenimiento destinado a limpiar duplicados después de la incorporación. De forma predeterminada, realiza una ejecución de prueba y solo cierra las PR enumeradas explícitamente cuando `apply=true`. Antes de modificar GitHub, verifica que la PR incorporada esté fusionada y que cada duplicado tenga un incidente referenciado en común o fragmentos modificados que se solapen.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Controles locales y enrutamiento de cambios

La lógica local de vías modificadas se encuentra en `scripts/changed-lanes.mjs` y la ejecuta `scripts/check-changed.mjs`. Ese control local es más estricto con los límites arquitectónicos que el alcance amplio de la plataforma de CI:

- los cambios de producción del núcleo ejecutan la comprobación de tipos de producción y pruebas del núcleo, además del análisis estático y los controles del núcleo;
- los cambios que solo afectan a pruebas del núcleo ejecutan únicamente la comprobación de tipos de pruebas del núcleo, además del análisis estático del núcleo;
- los cambios de producción de extensiones ejecutan la comprobación de tipos de producción y pruebas de extensiones, además del análisis estático de extensiones;
- los cambios que solo afectan a pruebas de extensiones ejecutan la comprobación de tipos de pruebas de extensiones, además del análisis estático de extensiones;
- los cambios públicos del Plugin SDK o de contratos de plugins amplían la comprobación de tipos a las extensiones porque estas dependen de esos contratos del núcleo (las pasadas de Vitest para extensiones siguen siendo trabajo de pruebas explícito);
- los incrementos de versión que solo afectan a metadatos de lanzamiento ejecutan comprobaciones específicas de versión/configuración/dependencias raíz;
- los cambios desconocidos de raíz/configuración adoptan una postura segura y ejecutan todas las vías de comprobación.

El enrutamiento local de pruebas modificadas se encuentra en `scripts/test-projects.test-support.mjs` y es intencionadamente menos costoso que `check:changed`: las modificaciones directas de pruebas ejecutan esas mismas pruebas; las modificaciones del código fuente prefieren asignaciones explícitas y, después, pruebas relacionadas y dependientes del grafo de importación. La configuración compartida de entrega en salas de grupo es una de las asignaciones explícitas: los cambios en la configuración de respuestas visibles del grupo, el modo de entrega de respuestas del código fuente o el prompt del sistema de la herramienta de mensajes se enrutan por las pruebas de respuestas del núcleo y las regresiones de entrega de Discord y Slack, para que un cambio de valor predeterminado compartido falle antes del primer push de la PR. Use `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo cuando el cambio tenga un alcance tan amplio en el arnés de pruebas que el conjunto asignado de bajo coste no sea una aproximación fiable.

## Validación con Testbox

Crabbox es el envoltorio de cajas remotas propiedad del repositorio para la
verificación en Linux de los responsables de mantenimiento. Las sesiones de los
agentes lo utilizan de forma predeterminada para pruebas y trabajos con uso
intensivo de recursos informáticos, incluidas compilaciones, comprobaciones de
tipos, ejecución paralela del análisis estático, Docker, vías de paquetes, E2E,
verificación en vivo y paridad con CI. El código de confianza de los
responsables de mantenimiento utiliza `blacksmith-testbox` de forma
predeterminada, y `.crabbox.yaml` ahora también lo utiliza de forma
predeterminada. Su flujo de trabajo configurado aprovisiona credenciales de
proveedores y agentes, por lo que el código no fiable de colaboradores o forks
debe utilizar CI sin secretos para forks o, en su lugar, Crabbox directo y
saneado en AWS. Las ejecuciones saneadas en AWS establecen
`CRABBOX_ENV_ALLOW=CI`, pasan `--no-hydrate` y utilizan un `HOME` remoto
temporal nuevo; esto impide que la lista de permitidos `OPENCLAW_*` del
repositorio y los perfiles de autenticación existentes lleguen al código no
fiable. Utilizan una concesión recién preparada dedicada a ese código fuente no
fiable, nunca una concesión de confianza o aprovisionada previamente. Inicie un
binario de Crabbox de confianza ya instalado desde un checkout limpio y de
confianza de `main`, y obtenga únicamente la PR remota con `--fresh-pr`; nunca
ejecute localmente el envoltorio ni la configuración del checkout no fiable.
Anule `CRABBOX_AWS_INSTANCE_PROFILE` y adopte una postura segura de fallo salvo
que el valor resuelto de `aws.instanceProfile` esté vacío. Antes de cualquier
instalación/prueba, use herramientas de ruta absoluta de confianza para exigir
un token IMDSv2, demostrar que el punto de conexión de credenciales de IAM
devuelve 404 y comparar el valor remoto de `git rev-parse HEAD` con el SHA
completo de la cabecera de la PR revisada. Vincule la concesión a ese SHA y
deténgala/vuelva a prepararla cuando cambie la cabecera. Cargue el script de
confianza `scripts/crabbox-untrusted-bootstrap.sh` desde un `main` limpio junto
con `--fresh-pr`; instala las versiones fijadas de Node/pnpm, verifica el SHA y
la versión fijada del gestor de paquetes, aísla `HOME`, instala las dependencias
y después ejecuta la prueba solicitada.
Anule todas las variables de sustitución `CRABBOX_TAILSCALE*`, fuerce `--network public
--tailscale=false`, borre las opciones de nodo de salida/LAN y exija que
`crabbox inspect` informe de una red pública sin estado de Tailscale antes de
cargar cualquier script. La capacidad propia de AWS/Hetzner también sigue
siendo la alternativa para interrupciones de Blacksmith, problemas de cuota o
pruebas explícitas con capacidad propia.

Al inicio de una tarea de código de confianza que probablemente necesite
pruebas o verificaciones intensivas, los agentes deben comenzar a preparar el
entorno inmediatamente en una sesión de comandos en segundo plano, continuar
la inspección y edición mientras se realiza el aprovisionamiento, reutilizar el
id `tbx_...` devuelto, sincronizar el checkout actual en cada ejecución y
detenerlo antes de la entrega:

```bash
node scripts/crabbox-wrapper.mjs warmup --provider blacksmith-testbox --keep --timing-json
```

Las ejecuciones de Blacksmith respaldadas por Crabbox preparan, reclaman,
sincronizan, ejecutan, generan informes y limpian Testboxes de un solo uso. La
comprobación de coherencia de sincronización integrada falla rápidamente cuando
`git status --short` en la caja sincronizada muestra al menos 200 eliminaciones
de archivos con seguimiento, lo que detecta la desaparición de archivos raíz
como `pnpm-lock.yaml`. Para las PR con grandes eliminaciones intencionadas,
establezca `CRABBOX_ALLOW_MASS_DELETIONS=1` para el comando remoto.

Crabbox también finaliza una invocación local de la CLI de Blacksmith que
permanezca en la fase de sincronización durante más de cinco minutos sin
producir salida posterior a la sincronización. Establezca
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` para deshabilitar esa protección, o use
un valor mayor en milisegundos para diferencias locales inusualmente grandes.

Antes de una primera ejecución, compruebe el envoltorio desde la raíz del repositorio:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

El envoltorio del repositorio rechaza un binario obsoleto de Crabbox que no anuncie el proveedor seleccionado, y las ejecuciones respaldadas por Blacksmith requieren Crabbox 0.22.0 o posterior para que el envoltorio obtenga el comportamiento actual de sincronización, cola y limpieza de Testbox. En los árboles de trabajo de Codex o en checkouts vinculados/dispersos, evite el script local `pnpm crabbox:run` porque pnpm puede conciliar las dependencias antes de que se inicie Crabbox; en su lugar, invoque directamente el envoltorio de Node:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Cuando utilice el checkout relacionado, vuelva a compilar el binario local ignorado antes de realizar mediciones de tiempo o trabajos de verificación:

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

El bloque `blacksmith:` de `.crabbox.yaml` ya fija los valores predeterminados de organización, flujo de trabajo, trabajo y referencia, por lo que las marcas explícitas siguientes son opcionales. Comprobación de cambios:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm check:changed"
```

Reejecución de prueba específica:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm test <path-or-filter>"
```

Conjunto completo:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm test"
```

Lea el resumen JSON final. Los campos útiles son `provider`, `leaseId`,
`syncDelegated`, `exitCode`, `commandMs` y `totalMs`. Para las ejecuciones
delegadas de Blacksmith Testbox, el código de salida del contenedor de Crabbox y
el resumen JSON constituyen el resultado del comando. La ejecución enlazada de
GitHub Actions se encarga de la preparación y del mantenimiento de actividad;
puede finalizar como `cancelled` cuando Testbox se detiene externamente después
de que el comando SSH ya haya regresado. Trátelo como un artefacto de
limpieza/estado, salvo que el valor `exitCode` del contenedor sea distinto de
cero o que la salida del comando muestre una prueba fallida. Las ejecuciones
únicas de Crabbox respaldadas por Blacksmith deberían detener Testbox
automáticamente; si una ejecución se interrumpe o la limpieza no está clara,
inspeccione las máquinas activas y detenga únicamente las que haya creado:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Use la reutilización únicamente cuando necesite ejecutar intencionadamente varios comandos en la misma máquina preparada:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --id <tbx_id> --timing-json --shell -- "corepack pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Reutilice el arrendamiento, no código fuente obsoleto. Omita `--no-sync` para que
cada ejecución cargue el directorio de trabajo actual; úselo únicamente para
volver a ejecutar intencionadamente un árbol sin cambios que ya esté
sincronizado. El código de colaboradores o bifurcaciones que no sea de confianza
debe usar `CRABBOX_ENV_ALLOW=CI`, `--provider aws --no-hydrate` y un `HOME`
remoto temporal nuevo para cada comando; instale las dependencias dentro de ese
comando saneado antes de realizar las pruebas. Reutilice únicamente un
arrendamiento recién preparado y dedicado al mismo código fuente que no sea de
confianza; nunca uno de confianza o preparado previamente. Nunca ejecute
localmente el contenedor ni la configuración del directorio de trabajo que no
sea de confianza: inicie el binario Crabbox de confianza instalado desde un
`main` limpio y de confianza, y pase `--fresh-pr` en cada ejecución. Mantenga
`CRABBOX_AWS_INSTANCE_PROFILE` sin definir, rechace un perfil de instancia
resuelto que no esté vacío, exija una prueba remota de confianza de IMDS sin rol
y verifique el SHA de la cabecera revisada antes de instalar o probar. Vincule
el arrendamiento a ese SHA; deténgalo y vuelva a prepararlo después de cualquier
cambio en la cabecera. Si no existe una PR remota, use la CI de la bifurcación
sin secretos. Nunca seleccione `hydrate-github` ni el flujo de trabajo de
Blacksmith preparado con credenciales para código fuente que no sea de
confianza.

Si Crabbox es la capa averiada, pero Blacksmith funciona, use Blacksmith
directamente solo para diagnósticos como `list`, `status` y limpieza. Corrija la
ruta de Crabbox antes de considerar una ejecución directa de Blacksmith como
prueba para mantenedores.

Si `blacksmith testbox list --all` y `blacksmith testbox status` funcionan, pero
las nuevas preparaciones permanecen en `queued` sin IP ni URL de ejecución de
Actions después de un par de minutos, trátelo como presión del proveedor, la
cola, la facturación o los límites de la organización de Blacksmith. Detenga los
identificadores en cola que haya creado, evite iniciar más Testboxes y traslade
la prueba a la ruta de capacidad propia de Crabbox que se indica a continuación
mientras alguien comprueba el panel de Blacksmith, la facturación y los límites
de la organización.

Escale a la capacidad propia de Crabbox únicamente cuando Blacksmith no esté disponible, tenga la cuota limitada, carezca del entorno necesario o la capacidad propia sea explícitamente el objetivo:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --provider aws --id <cbx_id-or-slug>
pnpm crabbox:run -- --provider aws --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- --provider aws <cbx_id-or-slug>
```

Cuando AWS esté bajo presión, evite `class=beast` salvo que la tarea realmente necesite una CPU de clase 48xlarge. Una solicitud `beast` comienza con 192 vCPU y es la forma más fácil de superar la cuota regional de EC2 Spot o estándar bajo demanda. El `.crabbox.yaml` propio del repositorio usa de forma predeterminada `class: standard`, el mercado bajo demanda y `capacity.hints: true`, para que los arrendamientos de AWS gestionados por un intermediario muestren la región y el mercado seleccionados, la presión sobre la cuota, la alternativa a Spot y las advertencias de clases con alta presión. Use `fast` para comprobaciones generales más exigentes, `large` solo cuando standard/fast no sean suficientes y `beast` únicamente para procesos excepcionales que requieran mucha CPU, como conjuntos completos o matrices de Docker para todos los plugins, validaciones explícitas de versiones o bloqueos, o generación de perfiles de rendimiento con muchos núcleos. No use `beast` para `pnpm check:changed`, pruebas específicas, trabajo solo de documentación, lint o comprobaciones de tipos ordinarios, reproducciones E2E pequeñas ni el diagnóstico de interrupciones de Blacksmith. Use `--market on-demand` para diagnosticar la capacidad, de modo que la volatilidad del mercado Spot no se mezcle con la señal.

`.crabbox.yaml` controla los valores predeterminados del proveedor, la sincronización y la preparación mediante GitHub Actions. La sincronización de Crabbox nunca transfiere `.git`, por lo que el directorio de trabajo preparado por Actions conserva sus propios metadatos remotos de Git en lugar de sincronizar los remotos y almacenes de objetos locales del mantenedor; además, la configuración del repositorio excluye los artefactos locales de ejecución y compilación (como `.artifacts` y los informes de pruebas) que nunca deben transferirse. `.github/workflows/crabbox-hydrate.yml` controla la extracción del código, la configuración de Node/pnpm, la obtención de `origin/main` y la transferencia del entorno sin secretos para los comandos `crabbox run --id <cbx_id>` en la nube propia.

## Relacionado

- [Descripción general de la instalación](/es/install)
- [Canales de desarrollo](/es/install/development-channels)
