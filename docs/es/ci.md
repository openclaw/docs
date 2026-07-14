---
read_when:
    - Necesita comprender por qué una tarea de CI se ejecutó o no se ejecutó
    - Está depurando una comprobación fallida de GitHub Actions
    - Está coordinando una ejecución o repetición de la validación de una versión
    - Está cambiando el envío de ClawSweeper o el reenvío de actividad de GitHub
summary: Grafo de trabajos de CI, controles de alcance, conjuntos de procesos de lanzamiento y comandos locales equivalentes
title: Canalización de CI
x-i18n:
    generated_at: "2026-07-14T13:30:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 56332874183aa0cdf2bdf60f68324aef3b5a81bd87510dc75f195cdefe3313b4
    source_path: ci.md
    workflow: 16
---

La CI de OpenClaw se ejecuta con los envíos a `main` (las rutas de Markdown y `docs/**` se ignoran
en el desencadenador), en cada solicitud de incorporación de cambios que no sea un borrador y mediante ejecución manual.
Los envíos canónicos a `main` pasan primero por una ventana de admisión de 90 segundos
en un ejecutor alojado; el grupo de concurrencia `CI` cancela esa ejecución en espera
cuando llega una confirmación más reciente, por lo que cada fusión secuencial no registra una matriz
completa de Blacksmith. Las solicitudes de incorporación de cambios y las ejecuciones manuales omiten la espera. A continuación, el trabajo
`preflight` clasifica las diferencias y desactiva los carriles costosos cuando
solo han cambiado áreas no relacionadas. Las ejecuciones manuales de `workflow_dispatch`
omiten deliberadamente la delimitación inteligente y despliegan el grafo completo para las versiones candidatas y
la validación amplia. Los carriles de Android siguen siendo opcionales mediante `include_android` (o la
entrada `release_gate`). La cobertura de plugins exclusiva de versiones se encuentra en el flujo de trabajo independiente
[`Plugin Prerelease`](#plugin-prerelease) y solo se ejecuta desde
[`Full Release Validation`](#full-release-validation) o mediante una
ejecución manual explícita.

## Descripción general de la canalización

| Trabajo                            | Propósito                                                                                                                                                                                                              | Cuándo se ejecuta                                    |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `preflight`                        | Detectar cambios solo en la documentación, ámbitos modificados y extensiones modificadas, y crear el manifiesto de CI                                                                                                  | Siempre en envíos y solicitudes de incorporación de cambios que no sean borradores |
| `runner-admission`                 | Antirrebote alojado de 90 segundos para los envíos canónicos a `main` antes de registrar el trabajo de Blacksmith                                                                                                   | En cada ejecución de CI; espera solo en envíos canónicos a `main` |
| `security-fast`                    | Detección de claves privadas, auditoría de flujos de trabajo modificados mediante `zizmor` y auditoría del archivo de bloqueo de producción                                                                           | Siempre en envíos y solicitudes de incorporación de cambios que no sean borradores |
| `pnpm-store-warmup`                | Preparar la caché del almacén de pnpm fijada por el archivo de bloqueo sin bloquear los fragmentos de Linux Node                                                                                                        | Cuando se seleccionan los carriles de Node o comprobación de documentación |
| `build-artifacts`                  | Compilar `dist/`, la interfaz de control, realizar comprobaciones rápidas de la CLI compilada, de la memoria de inicio y de los artefactos compilados integrados                                                       | Cambios relevantes para Node                         |
| `control-ui-i18n`                  | Verificar los paquetes de configuración regional generados para la interfaz de control, los metadatos y la memoria de traducción; informativo en ejecuciones automáticas y bloqueante en la CI manual de versiones      | Cambios relevantes para la i18n de la interfaz de control y CI manual |
| `checks-fast-core`                 | Carriles rápidos de corrección en Linux: límite progresivo de líneas de código TypeScript en archivos modificados, componentes integrados + protocolo, iniciador de Bun y tarea rápida de enrutamiento de CI             | Cambios relevantes para Node o TypeScript de producción |
| `qa-smoke-ci-profile`              | Dos partes equilibradas y autocontenidas del conjunto representativo acotado y automático de control de calidad Smoke; la cobertura completa de la taxonomía sigue disponible mediante perfiles explícitos de control de calidad | Cambios relevantes para Node                         |
| `checks-fast-contracts-plugins-*`  | Dos fragmentos ponderados de contratos de plugins                                                                                                                                                                     | Cambios relevantes para Node                         |
| `checks-fast-contracts-channels-*` | Dos fragmentos ponderados de contratos de canales                                                                                                                                                                     | Cambios relevantes para Node                         |
| `checks-node-*`                    | Pruebas de Node para objetivos modificados en solicitudes de incorporación de cambios; fragmentos completos del núcleo en `main`, ejecuciones manuales, versiones y ejecuciones con reserva amplia                   | Cambios relevantes para Node                         |
| `check-*`                          | Equivalente fragmentado de la puerta local principal: protecciones, archivo de dependencias, metadatos de configuración de canales integrados, tipos de producción, lint, dependencias y tipos de pruebas              | Cambios relevantes para Node                         |
| `check-additional-*`               | Franjas de comprobación de límites (incluida la desviación de instantáneas de instrucciones), límites del descriptor de acceso a sesiones, lector de transcripciones y transacciones SQLite, grupos de lint de extensiones, compilación/canario de límites de paquetes y arquitectura de topología de ejecución | Cambios relevantes para Node                         |
| `checks-node-compat-node22`        | Carril de compilación y comprobación rápida de compatibilidad con Node 22                                                                                                                                               | Ejecución manual de CI para versiones                |
| `check-docs`                       | Comprobaciones de formato, lint y enlaces rotos de la documentación                                                                                                                                                    | Cuando cambia la documentación (solicitudes de incorporación de cambios y ejecución manual) |
| `native-i18n`                      | Comprobaciones de inventario de i18n de aplicaciones nativas, Android y Apple                                                                                                                                          | Cambios relevantes para la i18n nativa               |
| `skills-python`                    | Ruff + pytest para Skills respaldadas por Python                                                                                                                                                                      | Cambios relevantes para Skills de Python             |
| `checks-windows`                   | Pruebas de procesos y rutas específicas de Windows, además de regresiones compartidas de especificadores de importación en tiempo de ejecución                                                                         | Cambios relevantes para Windows                      |
| `macos-node`                       | Pruebas específicas de TypeScript para macOS: launchd, Homebrew, rutas de ejecución, scripts de empaquetado y contenedor de grupos de procesos                                                                         | Cambios relevantes para macOS                        |
| `macos-swift`                      | Lint, compilación y pruebas de Swift para la aplicación de macOS                                                                                                                                                       | Cambios relevantes para macOS                        |
| `ios-build`                        | Generación del proyecto Xcode y compilación de la aplicación de iOS para el simulador                                                                                                                                  | Cambios en la aplicación de iOS, el kit compartido de aplicaciones o Swabble |
| `android`                          | Pruebas unitarias de Android para ambas variantes y compilación de un APK de depuración                                                                                                                                | Cambios relevantes para Android                      |
| `openclaw/ci-gate`                 | Agregado final: requiere admisión, comprobaciones previas y seguridad; acepta omisiones solo para los carriles posteriores desactivados por el manifiesto                                                              | Cada ejecución de CI que no sea un borrador          |
| `test-performance-agent`           | Flujo de trabajo independiente: optimización diaria de pruebas lentas de Codex después de actividad de confianza                                                                                                        | Éxito de la CI principal o ejecución manual          |
| `openclaw-performance`             | Flujo de trabajo independiente: informes de rendimiento diarios o bajo demanda del entorno de ejecución Kova con carriles de proveedor simulado, perfilado profundo y GPT 5.6 en vivo                                  | Ejecución programada y manual                        |

Los flujos de trabajo independientes de Periphery exigen que no haya ningún hallazgo de código muerto en las aplicaciones de iOS y macOS. El flujo de trabajo compartido de OpenClawKit analiza ambos consumidores en paralelo e informa de una declaración solo cuando Periphery emite el mismo USR de Swift en ambas compilaciones. Su contrato de esquema `OpenClawProtocol/GatewayModels.swift` generado se conserva como código propiedad del generador, en lugar de tratarse como código muerto local de la aplicación.

## Orden de detención rápida

1. `runner-admission` espera solo en los envíos canónicos a `main`; un envío más reciente cancela la ejecución antes del registro en Blacksmith.
2. `preflight` decide qué carriles existen. La lógica de `docs-scope` y `changed-scope` corresponde a pasos de este trabajo, no a trabajos independientes.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` y `skills-python` fallan rápidamente sin esperar a los trabajos más pesados de la matriz de artefactos y plataformas.
4. `build-artifacts` y la comprobación informativa `control-ui-i18n` se solapan con los carriles rápidos de Linux. La desviación de configuraciones regionales generadas permanece visible mientras el flujo de trabajo independiente de actualización la corrige en segundo plano.
5. Después se despliegan los carriles más pesados de plataformas y entornos de ejecución: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` y `android`.
6. `openclaw/ci-gate` espera a todos los carriles seleccionados. La admisión, las comprobaciones previas y la seguridad deben completarse correctamente; los trabajos posteriores solo pueden omitirse cuando el manifiesto no los ha seleccionado. Un carril seleccionado que falle o se cancele hace que falle el agregado.

El coordinador de fusiones puede reutilizar un resultado correcto y autenticado de `openclaw/ci-gate`
para la misma cabecera de la solicitud de incorporación de cambios durante un máximo de 24 horas. Esto evita reescribir una
rama de colaborador después de cambios no relacionados en `main`. El resultado reutilizable no
sustituye la comprobación independiente y estricta de fusión de prueba, propiedad de la aplicación, con respecto a la versión actual de `main`.
Una ejecución posterior pendiente o fallida no elimina un resultado correcto anterior para
esa cabecera sin cambios durante el periodo de vigencia.

GitHub puede marcar los trabajos reemplazados como `cancelled` cuando se incorpora un push más reciente en la misma PR o referencia `main`. Trátelo como ruido de CI, salvo que la ejecución más reciente de la misma referencia también esté fallando. Los trabajos de matriz usan `fail-fast: false`, y `build-artifacts` informa directamente de los fallos del canal integrado, del límite de soporte del núcleo y de la supervisión del Gateway, en lugar de poner en cola pequeños trabajos de verificación. La clave de concurrencia automática de CI tiene control de versiones (`CI-v7-*`) para que un proceso zombi del lado de GitHub en un grupo de cola antiguo no pueda bloquear indefinidamente ejecuciones más recientes de la rama principal. Las ejecuciones manuales de la suite completa usan `CI-manual-v1-*` y no cancelan las ejecuciones en curso. La comprobación de memoria de inicio de la lista de plugins mantiene un límite de 350 MiB en Blacksmith Linux autohospedado y permite 425 MiB en Linux hospedado por GitHub, cuya referencia de RSS es mayor para la misma CLI compilada.

Use `pnpm ci:timings`, `pnpm ci:timings:recent` o `node scripts/ci-run-timings.mjs <run-id>` para resumir el tiempo total, el tiempo en cola, los trabajos más lentos, los fallos y la barrera de expansión `pnpm-store-warmup` de GitHub Actions. El trabajo `ci-timings-summary` dentro del flujo de trabajo existe en `ci.yml`, pero actualmente está deshabilitado (`if: false`); ejecute en su lugar el auxiliar de tiempos localmente. Para consultar los tiempos de compilación, revise el paso `Build dist` del trabajo `build-artifacts`: `pnpm build:ci-artifacts` imprime `[build-all] phase timings:` e incluye `ui:build`; el trabajo también carga el artefacto `startup-memory`.

## Contexto y evidencias de la PR

Las PR de colaboradores externos ejecutan una comprobación de contexto y evidencias de la PR desde
`.github/workflows/real-behavior-proof.yml`. El flujo de trabajo obtiene la
revisión de confianza del flujo de trabajo (`github.workflow_sha`) y evalúa únicamente el cuerpo de la PR;
no ejecuta código de la rama del colaborador.

La comprobación se aplica a autores de PR que no sean propietarios, miembros,
colaboradores ni bots del repositorio. Se supera cuando el cuerpo de la PR contiene
secciones `What Problem This Solves` y `Evidence` redactadas por el autor. Las evidencias pueden ser una
prueba específica, un resultado de CI, una captura de pantalla, una grabación, una salida de terminal,
una observación en vivo, un registro expurgado o un enlace a un artefacto. El cuerpo proporciona la intención y una validación útil;
los revisores inspeccionan el código, las pruebas y la CI para evaluar la corrección.

Cuando la comprobación falle, actualice el cuerpo de la PR en lugar de enviar otro commit de código.

## Ámbito y direccionamiento

La lógica del ámbito se encuentra en `scripts/ci-changed-scope.mjs` y está cubierta por pruebas unitarias en `src/scripts/ci-changed-scope.test.ts`. La ejecución manual omite la detección del ámbito modificado y hace que el manifiesto de comprobación previa actúe como si todas las áreas delimitadas hubieran cambiado.

Los flujos de trabajo de Periphery independientes para iOS y macOS aplican una política de cero hallazgos de código muerto. Cada uno se ejecuta únicamente cuando una solicitud de incorporación no marcada como borrador modifica su ámbito de análisis nativo o cuando se ejecuta manualmente.

- **Las modificaciones del flujo de trabajo de CI** validan el grafo de CI de Node, el lint de los flujos de trabajo y el carril de Windows (`ci.yml` lo ejecuta), pero no fuerzan por sí solas las compilaciones nativas de iOS, Android o macOS; esos carriles de plataforma permanecen limitados a los cambios en el código fuente de la plataforma.
- **Comprobación de coherencia del flujo de trabajo** ejecuta `actionlint`, `zizmor` en todos los archivos YAML de los flujos de trabajo, la comprobación de interpolación de acciones compuestas y la comprobación de marcadores de conflicto. El trabajo `security-fast`, limitado a la PR, también ejecuta `zizmor` en los archivos de flujo de trabajo modificados para que los hallazgos de seguridad de los flujos de trabajo provoquen un fallo temprano en el grafo principal de CI.
- **La documentación en los push a `main`** se comprueba mediante el flujo de trabajo independiente `Docs` con el mismo espejo de documentación de ClawHub que usa CI, para que los push mixtos de código y documentación no pongan también en cola el fragmento `check-docs` de CI. Las solicitudes de incorporación y la CI manual siguen ejecutando `check-docs` desde CI cuando cambia la documentación.
- **La PTY de TUI** se ejecuta en el fragmento `checks-node-core-runtime-tui-pty` de Linux Node para los cambios de TUI. El fragmento ejecuta `test/vitest/vitest.tui-pty.config.ts` con `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, por lo que abarca tanto el carril determinista de datos de prueba `TuiBackend` como la prueba de humo más lenta `tui --local`, que solo simula el endpoint externo del modelo.
- **Las modificaciones exclusivas del direccionamiento de CI, el pequeño conjunto de datos de prueba del núcleo que ejecuta directamente la tarea rápida y las modificaciones específicas de los auxiliares de contratos de plugins** usan una ruta rápida de manifiesto exclusiva de Node: `preflight`, `security-fast` y únicamente los carriles rápidos afectados por el cambio: una sola tarea de direccionamiento de CI `checks-fast-core`, los dos fragmentos de contratos de plugins o ambos. Esa ruta omite los artefactos de compilación, la compatibilidad con Node 22, los contratos de canales, los fragmentos completos del núcleo, los fragmentos de plugins integrados y las matrices de comprobaciones adicionales.
- **Las comprobaciones de Node en Windows** se limitan a los envoltorios de procesos y rutas específicos de Windows, los auxiliares de ejecución de npm/pnpm/UI, la configuración del gestor de paquetes y las superficies de los flujos de trabajo de CI que ejecutan ese carril; los cambios no relacionados en el código fuente, los plugins, las pruebas de humo de instalación y solo las pruebas permanecen en los carriles de Linux Node.

Las familias de pruebas de Node más lentas se dividen o equilibran para que cada trabajo siga siendo pequeño sin reservar ejecutores en exceso:

- Los contratos de plugins y los contratos de canales se ejecutan cada uno como dos fragmentos ponderados respaldados por Blacksmith, con el ejecutor estándar de GitHub como alternativa.
- Los carriles rápidos y de soporte de las pruebas unitarias del núcleo se ejecutan por separado; la infraestructura de ejecución del núcleo se divide en fragmentos de procesos, compartidos, hooks, secretos y tres dominios de Cron.
- La respuesta automática se ejecuta mediante procesos de trabajo equilibrados, con el subárbol de respuestas dividido en fragmentos de ejecutor de agentes, comandos, despacho, sesión y direccionamiento de estado.
- Las configuraciones del Gateway/servidor agéntico (plano de control) se dividen entre los carriles de chat, autenticación, modelo, HTTP/plugin, ejecución e inicio, en lugar de esperar a los artefactos compilados.
- La CI normal agrupa únicamente los fragmentos aislados de patrones de inclusión de infraestructura en paquetes deterministas de un máximo de 64 archivos de prueba, lo que reduce la matriz de Node sin combinar las suites no aisladas de comandos/Cron, agents-core con estado ni Gateway/servidor. Las suites pesadas fijas permanecen en 8 vCPU, mientras que los carriles agrupados y de menor peso usan 4 vCPU.
- Las solicitudes de incorporación del repositorio canónico reutilizan el solucionador de pruebas modificadas con respecto al diff sintético del árbol fusionado. Los cambios precisos ejecutan un trabajo de Node específico; cada archivo de prueba seleccionado obtiene su propio proceso para mantener intacto el aislamiento de las suites con estado. El planificador combina las pruebas hermanas con las dependientes del grafo de importación y recurre al plan compacto existente de suite completa de 14 trabajos para cambios en paquetes del espacio de trabajo, paquetes/archivo de bloqueo, infraestructura de pruebas compartida, configuración dividida, archivos renombrados o eliminados, cambios públicos en contratos de extensiones, pruebas con configuración especial de fragmentos, objetivos parcialmente resueltos o vacíos, planes de rutas u objetivos demasiado grandes y errores del planificador. Los planes específicos conservan siempre la comprobación completa del límite de artefactos compilados porque sus analizadores del repositorio no pueden derivarse de las importaciones. Los push a `main`, las ejecuciones manuales y las comprobaciones de publicación conservan la matriz completa porque las ejecuciones `main` reemplazadas y canceladas hacen que el diff de un único push sea insuficiente como evidencia de integración.
- La matriz completa de Node admite primero los fragmentos de herramientas en serie y comandos de respuesta automática que son sistemáticamente lentos. Esto mantiene el límite de 28 trabajos y evita que grupos alfabéticos breves desplacen el trabajo de la ruta crítica a una fase posterior.
- Las pruebas amplias de navegador, control de calidad, medios y plugins diversos usan sus configuraciones específicas de Vitest en lugar del grupo general compartido de plugins. Los fragmentos de patrones de inclusión registran entradas de tiempos con el nombre del fragmento de CI, para que `.artifacts/vitest-shard-timings.json` pueda distinguir una configuración completa de un fragmento filtrado.
- `check-additional-*` divide la lista complementaria de comprobaciones de límites (`scripts/run-additional-boundary-checks.mjs`) en un fragmento con uso intensivo de prompts (`check-additional-boundaries-a`, que incluye la comprobación de desviaciones de las instantáneas de prompts de Codex) y un fragmento combinado para las divisiones restantes (`check-additional-boundaries-bcd`); cada uno ejecuta comprobaciones independientes simultáneamente e imprime los tiempos de cada comprobación. El trabajo de compilación/canario de los límites de paquetes permanece unido, y la arquitectura de la topología de ejecución se ejecuta por separado de la cobertura de supervisión del Gateway integrada en `build-artifacts`.
- La supervisión del Gateway, las pruebas de canales y el fragmento de límites de soporte del núcleo se ejecutan simultáneamente dentro de `build-artifacts` después de que `dist/` y `dist-runtime/` ya se hayan compilado.

Una vez admitida, la CI canónica de Linux permite hasta 28 trabajos simultáneos de pruebas de Node y
12 para los carriles rápidos/de comprobación más pequeños; Windows y Android permanecen en dos porque
sus grupos de ejecutores son más limitados. Los lotes compactos de configuraciones completas se ejecutan con un
tiempo de espera por lote de 120 minutos, mientras que los grupos de patrones de inclusión comparten el mismo
presupuesto de trabajo limitado.

La CI de Android ejecuta tanto `testPlayDebugUnitTest` como `testThirdPartyDebugUnitTest` y después compila el APK de depuración de Play. La variante de terceros no tiene un conjunto de código fuente ni un manifiesto independientes; su carril de pruebas unitarias sigue compilando la variante con los indicadores BuildConfig de SMS/registro de llamadas, pero evita un trabajo duplicado de empaquetado del APK de depuración en cada push relevante para Android.

El fragmento `check-dependencies` ejecuta las comprobaciones de producción de Knip para dependencias, archivos sin usar y exportaciones sin usar. La comprobación de archivos sin usar falla cuando una PR añade un nuevo archivo sin usar que no se ha revisado o deja una entrada obsoleta en la lista de permitidos, a la vez que conserva las superficies intencionales de plugins dinámicos, generación, compilación, pruebas en vivo y puentes de paquetes que Knip no puede resolver estáticamente. La comprobación de exportaciones sin usar excluye los archivos de soporte para pruebas y después falla si hay nuevos hallazgos o entradas obligatorias obsoletas en la referencia; tras eliminar las exportaciones muertas, regenere la referencia que solo puede reducirse mediante `pnpm deadcode:exports:update`. Los objetivos históricos ejecutan la comprobación de exportaciones cuando la proporcionan y, de lo contrario, conservan su alternativa anterior para el código muerto.

## Reenvío de actividad de ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` es el puente del lado de destino desde la actividad del repositorio de OpenClaw hacia ClawSweeper. No obtiene ni ejecuta código no confiable de solicitudes de incorporación. El flujo de trabajo crea un token de aplicación de GitHub a partir de `CLAWSWEEPER_APP_PRIVATE_KEY` y después envía cargas útiles compactas `repository_dispatch` a `openclaw/clawsweeper`.

El flujo de trabajo tiene cuatro carriles:

- `clawsweeper_item` para solicitudes exactas de revisión de incidencias y solicitudes de incorporación;
- `clawsweeper_comment` para comandos explícitos de ClawSweeper en comentarios de incidencias;
- `clawsweeper_commit_review` para solicitudes de revisión en el nivel de commit en push a `main`;
- `github_activity` para la actividad general de GitHub que el agente ClawSweeper puede inspeccionar.

El carril `github_activity` reenvía únicamente metadatos normalizados: tipo de evento, acción, actor, repositorio, número del elemento, URL, título, estado y extractos breves de comentarios o revisiones cuando existen. Evita intencionadamente reenviar el cuerpo completo del Webhook. El flujo de trabajo receptor en `openclaw/clawsweeper` es `.github/workflows/github-activity.yml`, que publica el evento normalizado en el hook del Gateway de OpenClaw para el agente ClawSweeper.

La actividad general es observación, no entrega predeterminada. El agente ClawSweeper recibe el destino de Discord en su prompt y solo debe publicar en `#clawsweeper` cuando el evento sea sorprendente, procesable, arriesgado o útil para las operaciones. Las aperturas rutinarias, las modificaciones, la actividad reiterativa de bots, el ruido duplicado de Webhooks y el tráfico normal de revisiones deben dar como resultado `NO_REPLY`.

Trate los títulos, comentarios, cuerpos, textos de revisiones, nombres de ramas y mensajes de commit de GitHub como datos no confiables en toda esta ruta. Constituyen entradas para el resumen y la clasificación, no instrucciones para el flujo de trabajo ni para la ejecución del agente.

## Ejecuciones manuales

Las ejecuciones manuales de CI ejecutan el mismo grafo de trabajos que la CI normal, pero fuerzan la activación de todas las vías con ámbito distinto de Android: fragmentos de Node en Linux, fragmentos de plugins incluidos, fragmentos de contratos de plugins y canales, compatibilidad con Node 22, `check-*`, `check-additional-*`, comprobaciones rápidas de artefactos compilados, comprobaciones de documentación, Skills de Python, Windows, macOS, compilación de iOS e i18n de la interfaz de control. La paridad de configuraciones regionales de la interfaz de control es informativa en las ejecuciones automáticas de PR y `main`, porque el flujo de trabajo independiente de actualización corrige en segundo plano las desviaciones generadas; es bloqueante en la CI manual y, por tanto, en la validación completa de la versión. Las ejecuciones manuales independientes de CI ejecutan Android únicamente con `include_android=true` (la entrada `release_gate` también fuerza Android); el flujo general de la versión completa habilita Android pasando `include_android=true`. Las comprobaciones estáticas de versiones preliminares de plugins, el fragmento exclusivo de versiones `agentic-plugins`, el barrido completo por lotes de extensiones y las vías de Docker para versiones preliminares de plugins quedan excluidos de la CI. El conjunto de versiones preliminares de Docker solo se ejecuta cuando `Full Release Validation` inicia el flujo de trabajo independiente `Plugin Prerelease` con la puerta de validación de versiones habilitada.

Las ejecuciones manuales utilizan un grupo de concurrencia único para que otra ejecución por envío o PR sobre la misma referencia no cancele el conjunto completo de una versión candidata. La entrada opcional `target_ref` permite que un invocador de confianza ejecute ese grafo sobre una rama, etiqueta o SHA completo de una confirmación, usando el archivo de flujo de trabajo de la referencia de ejecución seleccionada. La entrada opcional `loc_base_ref` proporciona un SHA de comparación exacto para ejecuciones manuales independientes. La entrada `release_gate` es una alternativa para mantenedores basada en un SHA exacto cuando la CI de un PR está bloqueada por falta de capacidad: requiere que `target_ref` sea un SHA completo de confirmación que coincida con la cabecera de la rama ejecutada y que `pr_number` identifique la solicitud de incorporación de cambios abierta. El flujo de trabajo autentica la cabecera y la base actuales de ese PR, espera a que GitHub termine de calcular la posibilidad de fusión, fija la confirmación de fusión de prueba indicada, obtiene la referencia sintética de fusión de solicitudes de incorporación de cambios de GitHub, verifica su SHA y ambos progenitores y, a continuación, extrae ese árbol antes de instalar las dependencias y ejecutar el control progresivo de LOC de TypeScript para los archivos modificados. Esto coincide con el árbol fusionado y la implementación de políticas de la CI automática de PR. Las revisiones del flujo de trabajo que pertenecen al destino y no incluyen `pr_number` no pueden proporcionar pruebas equivalentes del árbol de fusión; actualice la cabecera del PR al flujo de trabajo actual y reinicie la prueba de cabecera exacta en lugar de utilizar la alternativa.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

La vía mensual de estabilidad extendida exclusiva de npm es la excepción: ejecute tanto la comprobación preliminar `OpenClaw NPM
Release` como `Full Release Validation` desde la rama exacta
`extended-stable/YYYY.M.33`, conserve sus identificadores de ejecución y pase ambos identificadores a la
ejecución de publicación directa en npm. Consulte [Publicación mensual de estabilidad extendida exclusiva de npm](/es/reference/RELEASING#monthly-npm-only-extended-stable-publication) para conocer
los comandos, los requisitos exactos de identidad, la lectura de comprobación del registro y el procedimiento de
reparación del selector. Esta vía no ejecuta la publicación de plugins, macOS, Windows, GitHub
Release, etiquetas de distribución privadas ni otras plataformas.

## Ejecutores

| Ejecutor                        | Trabajos                                                                                                                                                                                                                                                                          |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | `runner-admission`, `security-fast`, ejecución manual de CI y alternativas para repositorios no canónicos, el agregado de pruebas rápidas de QA, análisis de seguridad y calidad de CodeQL, comprobación de coherencia de flujos de trabajo, etiquetador, respuesta automática, el flujo de trabajo independiente de documentación y todo el flujo de trabajo de pruebas rápidas de instalación |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `pnpm-store-warmup`, `native-i18n`, `checks-fast-core` excepto la CI de pruebas rápidas de QA, fragmentos de contratos de plugins/canales, la mayoría de los fragmentos incluidos/de menor carga de Node en Linux, vías `check-*` excepto `check-lint`, fragmentos seleccionados de `check-additional-*`, `check-docs` y `skills-python` |
| `blacksmith-8vcpu-ubuntu-2404`  | Conjuntos pesados conservados de Node en Linux, fragmentos `check-additional-*` con gran carga de límites/extensiones y `android`                                                                                                                                                  |
| `blacksmith-16vcpu-ubuntu-2404` | Fragmentos automáticos de CI de pruebas rápidas de QA, `build-artifacts` en CI y Testbox, y `check-lint` (lo bastante sensibles a la CPU como para que 8 vCPU costaran más de lo que ahorraban)                                                                                      |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                  |
| `blacksmith-6vcpu-macos-15`     | `macos-node` en `openclaw/openclaw`; las bifurcaciones recurren a `macos-15`                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` y `ios-build` en `openclaw/openclaw`; las bifurcaciones recurren a `macos-26`                                                                                                                                                                                |

## Presupuesto de registros de ejecutores

El grupo actual de registros de ejecutores de GitHub de OpenClaw informa de 10,000 registros de ejecutores
autohospedados por cada 5 minutos en `ghx api rate_limit`. Vuelva a comprobar
`actions_runner_registration` antes de cada ajuste porque GitHub puede modificar
este grupo. El límite se comparte entre todos los registros de ejecutores de Blacksmith en la
organización `openclaw`, por lo que añadir otra instalación de Blacksmith no añade
un nuevo grupo.

Trate las etiquetas de Blacksmith como el recurso escaso para controlar las ráfagas. Los trabajos que
solo enrutan, notifican, resumen, seleccionan fragmentos o ejecutan análisis breves de CodeQL deben
permanecer en ejecutores alojados por GitHub, salvo que tengan necesidades específicas de Blacksmith
demostradas mediante mediciones. Toda nueva matriz de Blacksmith, un valor mayor de `max-parallel` o un flujo de trabajo
de alta frecuencia debe mostrar su número máximo de registros en el peor caso y mantener el objetivo
de la organización por debajo de aproximadamente el 60% del grupo activo. Con el grupo actual de 10,000 registros,
eso supone un objetivo operativo de 6,000 registros, dejando margen para
repositorios simultáneos, reintentos y solapamiento de ráfagas.

El plan de PR basado en destinos modificados reduce la ráfaga habitual de pruebas de Node de 14 registros de Blacksmith a uno. Los PR de riesgo amplio conservan la alternativa compacta de 14 registros, por lo que el peor caso no aumenta.

La CI del repositorio canónico mantiene Blacksmith como vía de ejecución predeterminada para las ejecuciones normales por envío y solicitud de incorporación de cambios. `workflow_dispatch` y las ejecuciones de repositorios no canónicos utilizan ejecutores alojados por GitHub, pero actualmente las ejecuciones canónicas normales no sondean el estado de la cola de Blacksmith ni recurren automáticamente a etiquetas alojadas por GitHub cuando Blacksmith no está disponible.

## Equivalentes locales

```bash
pnpm changed:lanes                            # inspeccionar el clasificador local de vías modificadas para origin/main...HEAD
pnpm check:changed                            # puerta local inteligente de comprobación: formato/typecheck/lint/protecciones modificados por vía de límites
pnpm check                                    # puerta local rápida: tsgo de producción + lint fragmentado + protecciones rápidas en paralelo
pnpm check:test-types
pnpm check:timed                              # la misma puerta con tiempos por etapa
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1 node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts
pnpm test                                     # pruebas de vitest
pnpm test:changed                             # destinos de Vitest modificados, inteligentes y económicos
pnpm test:ui                                  # conjunto de pruebas unitarias/de navegador de la interfaz de control
pnpm ui:i18n:check                            # paridad generada de configuraciones regionales de la interfaz de control (puerta de versión)
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # formato y lint de documentación + enlaces rotos
pnpm build                                    # compilar dist cuando importen las comprobaciones de artefactos/pruebas rápidas de CI
pnpm ios:build                                # generar y compilar el proyecto de la aplicación para iOS
pnpm ci:timings                               # resumir la ejecución de CI más reciente por envío a origin/main
pnpm ci:timings:recent                        # comparar ejecuciones recientes correctas de CI en main
node scripts/ci-run-timings.mjs <run-id>      # resumir el tiempo total, el tiempo en cola y los trabajos más lentos
node scripts/ci-run-timings.mjs --latest-main # ignorar el ruido de incidencias/comentarios y elegir la CI por envío a origin/main
node scripts/ci-run-timings.mjs --recent 10   # comparar ejecuciones recientes correctas de CI en main
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

Normalmente, la ejecución manual evalúa comparativamente la referencia del flujo de trabajo. Establezca `target_ref` para evaluar comparativamente una etiqueta de versión u otra rama con la implementación actual del flujo de trabajo. Las rutas de los informes publicados y los punteros más recientes se indexan por la referencia probada, y cada `index.md` registra la referencia/SHA probado, la referencia/SHA del flujo de trabajo, la referencia de Kova, el perfil, el modo de autenticación de la vía, el modelo, el número de repeticiones y los filtros de escenarios.

El flujo de trabajo instala OCM desde una versión fijada y Kova desde `openclaw/Kova` en la entrada fijada `kova_ref`, y después ejecuta tres vías:

- `mock-provider`: escenarios de diagnóstico de Kova contra un entorno de ejecución compilado localmente con autenticación falsa determinista compatible con OpenAI.
- `mock-deep-profile`: generación de perfiles de CPU/montículo/trazas para puntos críticos del inicio, el Gateway y los turnos del agente. Se ejecuta según la programación o, al iniciarse manualmente, con `deep_profile=true`.
- `live-openai-candidate`: un turno real de agente `openai/gpt-5.6-luna` de OpenAI, omitido cuando `OPENAI_API_KEY` no está disponible. Se ejecuta según la programación o, al iniciarse manualmente, con `live_openai_candidate=true`.

La vía mock-provider también ejecuta sondas de código fuente nativas de OpenClaw después de la pasada de Kova: tiempo de arranque y memoria del Gateway en los casos de inicio predeterminado, con canal omitido, con enlace interno y con cincuenta plugins; RSS de importación de los plugins incluidos, bucles repetidos de saludo mock-OpenAI `channel-chat-baseline`, comandos de inicio de la CLI contra el Gateway arrancado y la sonda de rendimiento básica del estado de SQLite. Cuando está disponible el informe de código fuente de mock-provider publicado anteriormente para la referencia probada, el resumen del código fuente compara los valores actuales de RSS y heap con esa línea base y marca los grandes aumentos de RSS como `watch`. El resumen Markdown de la sonda de código fuente se encuentra en `source/index.md` dentro del paquete del informe, con el JSON sin procesar junto a él.

Cada vía carga su artefacto completo de GitHub, incluidos los paquetes de diagnóstico de CPU, heap, trazas y comprimidos. Un trabajo de publicación independiente descarga y valida esos artefactos y, a continuación, genera un token de corta duración de la GitHub App de ClawSweeper, limitado únicamente al contenido de `openclaw/clawgrit-reports`, y lo pasa solo al paso de Git push. Confirma `report.json`, `report.md`, `index.md`, los artefactos de las sondas de código fuente y los metadatos/sumas de comprobación del paquete bajo `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`; el archivo de diagnóstico completo permanece en el artefacto de Actions enlazado. El publicador rechaza cualquier archivo de informe de más de 50 MB antes de intentar un push. El puntero actual de la referencia probada es `openclaw-performance/<tested-ref>/latest-<lane>.json`. Las ejecuciones programadas y los lanzamientos de `profile=release` fallan si falla la creación del token de la aplicación o la publicación del informe. Los lanzamientos manuales que no son de publicación mantienen la publicación como consultiva y conservan los artefactos de GitHub cuando falla la autenticación o la publicación. La línea base de código fuente anterior se obtiene de forma anónima desde el repositorio público de informes, por lo que obtener correctamente una línea base no demuestra la autenticación del publicador.

## Validación completa de la publicación

`Full Release Validation` es el flujo de trabajo general manual para «ejecutarlo todo antes de la publicación». Acepta una rama, etiqueta o SHA completo de commit, lanza el flujo de trabajo manual `CI` con ese destino (incluido Android), lanza `Plugin Prerelease` para las comprobaciones de plugins/paquetes/recursos estáticos/Docker exclusivas de publicación, lanza `OpenClaw Performance` contra el SHA de destino y lanza `OpenClaw Release Checks` para las vías de comprobación básica de instalación, aceptación de paquetes, comprobaciones de paquetes entre sistemas operativos, paridad de QA Lab, Matrix y Telegram (la generación consultiva de la tabla de madurez se activa opcionalmente mediante `run_maturity_scorecard`). Los perfiles estable y completo siempre incluyen cobertura exhaustiva en vivo/E2E y de carga sostenida de la ruta de publicación de Docker; el perfil beta puede activarla mediante `run_release_soak=true`. La prueba E2E canónica de Telegram para el paquete se ejecuta dentro de Aceptación de paquetes, por lo que un candidato completo no inicia un sondeador en vivo duplicado. Después de publicar, pase `release_package_spec` para reutilizar el paquete npm publicado en las comprobaciones de publicación, Aceptación de paquetes, Docker, pruebas entre sistemas operativos y Telegram sin volver a compilar. Use `npm_telegram_package_spec` solo para volver a ejecutar de forma específica Telegram con el paquete publicado. La vía del paquete en vivo del plugin de Codex utiliza de forma predeterminada el mismo estado seleccionado: el `release_package_spec=openclaw@<tag>` publicado deriva `codex_plugin_spec=npm:@openclaw/codex@<tag>`, mientras que las ejecuciones por SHA/artefacto empaquetan `extensions/codex` desde la referencia seleccionada. Establezca `codex_plugin_spec` explícitamente para fuentes de plugin personalizadas, como las especificaciones `npm:`, `npm-pack:` o `git:`.

Consulte [Validación completa de la publicación](/es/reference/full-release-validation) para conocer la
matriz de etapas, los nombres exactos de los trabajos del flujo de trabajo, las diferencias entre perfiles, los artefactos y
los identificadores para repeticiones específicas.

`OpenClaw Release Publish` es el flujo de trabajo manual que modifica el estado de la publicación. Lance
publicaciones beta y estables normales desde `main` de confianza después de que exista la etiqueta de publicación
y de que haya finalizado correctamente la comprobación preliminar de npm de OpenClaw (la comprobación preliminar ejecuta
`pnpm plugins:sync:check` entre sus comprobaciones). La etiqueta sigue seleccionando el
commit exacto de la publicación, incluido un commit en `release/YYYY.M.PATCH`; las publicaciones alfa
de Tideclaw siguen utilizando su rama alfa correspondiente. Requiere el
`preflight_run_id` guardado y que hayan finalizado correctamente
`full_release_validation_run_id` y su
`full_release_validation_run_attempt` exacto, lanza `Plugin NPM Release` para todos
los paquetes de plugins publicables, lanza `Plugin ClawHub Release` para el mismo
SHA de publicación y solo entonces lanza `OpenClaw NPM Release`. La publicación estable también
requiere un `windows_node_tag` exacto; el flujo de trabajo verifica la publicación del código fuente
de Windows y compara sus instaladores x64/ARM64 con la entrada
`windows_node_installer_digests` aprobada para el candidato antes de cualquier publicación secundaria; después, promueve
y verifica esos mismos resúmenes fijados de instaladores, además del recurso complementario exacto
y el contrato de suma de comprobación, antes de publicar el borrador de la publicación de GitHub.
Las reparaciones específicas solo de plugins utilizan `plugin_publish_scope=selected` con una lista
de paquetes no vacía. Las ejecuciones de `all-publishable` solo de plugins requieren las mismas pruebas
inmutables de la comprobación preliminar de npm y de la Validación completa de la publicación que una publicación del núcleo.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=beta
```

Para comprobar un commit fijado en una rama que cambia rápidamente, use el asistente en lugar de
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Las referencias de lanzamiento de flujos de trabajo de GitHub deben ser ramas o etiquetas, no SHA de commits sin procesar. El
asistente envía una rama temporal `release-ci/<sha>-...` en un SHA de flujo de trabajo `main`
de confianza, pasa el SHA de destino solicitado mediante la entrada `ref` del flujo de trabajo,
reutiliza pruebas estrictas del destino exacto cuando están disponibles, verifica que el
`headSha` de cada flujo de trabajo secundario coincida con el SHA de flujo de trabajo de confianza y elimina la rama
temporal cuando finaliza la ejecución. Pase `-f reuse_evidence=false` para forzar una
validación nueva. El verificador general también falla si algún flujo de trabajo secundario se ejecutó con un
SHA de flujo de trabajo diferente.

`release_profile` controla la amplitud de las pruebas en vivo/de proveedores que se pasa a las comprobaciones de publicación. Los
flujos de trabajo de publicación manuales utilizan `stable` de forma predeterminada; use `full` solo cuando
desee intencionadamente la matriz consultiva amplia de proveedores/medios. Las comprobaciones de publicación
estable y completa siempre ejecutan las pruebas exhaustivas en vivo/E2E y de carga sostenida de la ruta de publicación de Docker;
el perfil beta puede activarlas mediante `run_release_soak=true`.

- `minimum` conserva las vías críticas para la publicación más rápidas de OpenAI/núcleo.
- `stable` añade el conjunto estable de proveedores/backends.
- `full` ejecuta la matriz consultiva amplia de proveedores/medios.

El flujo general registra los identificadores de las ejecuciones secundarias lanzadas, y el trabajo final `Verify full validation` vuelve a comprobar las conclusiones actuales de dichas ejecuciones y añade tablas de los trabajos más lentos de cada una. Si se vuelve a ejecutar un flujo de trabajo secundario y finaliza correctamente, vuelva a ejecutar únicamente el trabajo verificador principal para actualizar el resultado general y el resumen de tiempos.

Para la recuperación, tanto `Full Release Validation` como `OpenClaw Release Checks` aceptan `rerun_group`. Use `all` para un candidato de publicación, `ci` solo para el flujo secundario de CI completa normal, `plugin-prerelease` solo para el flujo secundario de prepublicación de plugins, `performance` solo para el flujo secundario de rendimiento de OpenClaw, `release-checks` para todos los flujos secundarios de publicación o un grupo más reducido: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` o `npm-telegram` en el flujo general. Esto mantiene acotada la repetición de una máquina de publicación que ha fallado tras una corrección específica. Para una vía fallida entre sistemas operativos, combine `rerun_group=cross-os` con `cross_os_suite_filter`, por ejemplo `windows/packaged-upgrade`; los comandos largos entre sistemas operativos emiten líneas de Heartbeat y los resúmenes de actualización empaquetada incluyen tiempos por fase. Las vías de comprobación de publicación de QA son consultivas, excepto la puerta de cobertura estándar de herramientas de ejecución, que bloquea cuando las herramientas dinámicas requeridas de OpenClaw cambian o desaparecen del resumen del nivel estándar.

`OpenClaw Release Checks` utiliza la referencia de flujo de trabajo de confianza para resolver una sola vez la referencia seleccionada en un archivo `release-package-under-test` y, después, pasa ese artefacto a las comprobaciones entre sistemas operativos y a Aceptación de paquetes, además del flujo de trabajo en vivo/E2E de Docker para la ruta de publicación cuando se ejecuta la cobertura de carga sostenida. Esto mantiene uniformes los bytes del paquete entre las máquinas de publicación y evita volver a empaquetar el mismo candidato en varios trabajos secundarios. Para la vía en vivo del plugin npm de Codex, las comprobaciones de publicación pasan una especificación de plugin publicado correspondiente derivada de `release_package_spec`, pasan el valor `codex_plugin_spec` proporcionado por el operador o dejan la entrada en blanco para que el script de Docker empaquete el plugin de Codex del checkout seleccionado.

Las ejecuciones duplicadas de `Full Release Validation` para `ref=main` y `rerun_group=all`
sustituyen al flujo general anterior. El monitor principal cancela cualquier flujo de trabajo secundario que
ya haya lanzado cuando se cancela el principal, para que una validación más reciente de main
no quede detrás de una ejecución obsoleta de comprobaciones de publicación de dos horas. La validación de ramas/etiquetas
de publicación y los grupos de repeticiones específicas conservan `cancel-in-progress: false`.

## Fragmentos en vivo y E2E

El flujo secundario en vivo/E2E de publicación mantiene una amplia cobertura nativa de `pnpm test:live`, pero la ejecuta como fragmentos con nombre mediante `scripts/test-live-shard.mjs` en lugar de un único trabajo en serie:

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

Esto conserva la misma cobertura de archivos y facilita la repetición y el diagnóstico de fallos lentos de proveedores en vivo. Los nombres de fragmentos agregados `native-live-src-gateway`, `native-live-extensions-o-z`, `native-live-extensions-media` y `native-live-extensions-media-music` siguen siendo válidos para repeticiones manuales únicas.

Los fragmentos multimedia nativos en vivo se ejecutan en `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, creado por el flujo de trabajo `Live Media Runner Image`. Esa imagen preinstala `ffmpeg` y `ffprobe`; los trabajos multimedia solo verifican los binarios antes de la configuración. Mantenga las suites en vivo respaldadas por Docker en ejecutores normales de Blacksmith: los trabajos en contenedores no son el lugar adecuado para iniciar pruebas de Docker anidadas.

Los fragmentos de modelos/backends en vivo respaldados por Docker utilizan una imagen compartida `ghcr.io/openclaw/openclaw-live-test:<sha>-<extensions>` independiente por cada commit seleccionado. El flujo de trabajo de publicación en vivo compila y envía esa imagen una vez y, después, los fragmentos del modelo en vivo de Docker, el Gateway dividido por proveedores, el backend de la CLI, el enlace ACP y el arnés de Codex se ejecutan con `OPENCLAW_SKIP_DOCKER_BUILD=1`. Los fragmentos de Docker del Gateway incluyen límites explícitos `timeout` a nivel de script, inferiores al tiempo de espera del trabajo del flujo, para que un contenedor bloqueado o una ruta de limpieza falle rápidamente en lugar de consumir todo el presupuesto de las comprobaciones de publicación. Si esos fragmentos recompilan de forma independiente el destino Docker completo del código fuente, la ejecución de publicación está mal configurada y desperdiciará tiempo real en compilaciones de imágenes duplicadas.

## Aceptación de paquetes

Use `Package Acceptance` cuando la pregunta sea «¿funciona este paquete instalable de OpenClaw como producto?». Es diferente de la CI normal: la CI normal valida el árbol de código fuente, mientras que la aceptación de paquetes valida un único tarball mediante el mismo arnés E2E de Docker que utilizan los usuarios después de instalar o actualizar.

### Trabajos

1. `resolve_package` extrae `workflow_ref`, resuelve un candidato de paquete, escribe `.artifacts/docker-e2e-package/openclaw-current.tgz`, escribe `.artifacts/docker-e2e-package/package-candidate.json`, carga ambos como el artefacto `package-under-test` e imprime el origen, la referencia del flujo de trabajo, la referencia del paquete, la versión, el SHA-256 y el perfil en el resumen del paso de GitHub.
2. `package_integrity` descarga el artefacto `package-under-test` y aplica el contrato del tarball del paquete público con `scripts/check-openclaw-package-tarball.mjs`.
3. `docker_acceptance` llama a `openclaw-live-and-e2e-checks-reusable.yml` con el SHA de origen del paquete resuelto (recurriendo a `workflow_ref`) y `package_artifact_name=package-under-test`. El flujo de trabajo reutilizable descarga ese artefacto, valida el inventario del tarball, prepara imágenes de Docker para el resumen del paquete cuando es necesario y ejecuta las vías de Docker seleccionadas con ese paquete en lugar de empaquetar la copia de trabajo del flujo de trabajo. Cuando un perfil selecciona varios `docker_lanes` específicos, el flujo de trabajo reutilizable prepara una sola vez el paquete y las imágenes compartidas y, a continuación, distribuye esas vías como trabajos de Docker específicos en paralelo con artefactos únicos.
4. `package_telegram` llama opcionalmente a `NPM Telegram Beta E2E`. Se ejecuta cuando `telegram_mode` no es `none` e instala el mismo artefacto `package-under-test` cuando Package Acceptance resolvió uno; la ejecución independiente de Telegram aún puede instalar una especificación publicada de npm.
5. `summary` hace que el flujo de trabajo falle si la resolución del paquete, la integridad, la aceptación de Docker o la vía opcional de Telegram fallaron. La entrada `advisory` rebaja los fallos de aceptación a advertencias para los llamadores consultivos.

### Orígenes de candidatos

- `source=npm` solo acepta `openclaw@extended-stable`, `openclaw@beta`, `openclaw@latest` o una versión exacta de OpenClaw, como `openclaw@2026.4.27-beta.2`. Úselo para la aceptación de versiones publicadas de soporte estable extendido, preliminares o estables.
- `source=ref` empaqueta una rama, etiqueta o SHA de confirmación completo de confianza de `package_ref`. El resolutor obtiene las ramas y etiquetas de OpenClaw, verifica que la confirmación seleccionada sea accesible desde el historial de ramas del repositorio o desde una etiqueta de versión, instala las dependencias en un árbol de trabajo separado y la empaqueta con `scripts/package-openclaw-for-docker.mjs`.
- `source=url` descarga un `.tgz` HTTPS público; se requiere `package_sha256`. Esta ruta rechaza las credenciales en la URL, los puertos HTTPS no predeterminados, los nombres de host o las direcciones IP resueltas que sean privadas, internas o de uso especial, y los redireccionamientos que no cumplan la misma política de seguridad pública.
- `source=trusted-url` descarga un `.tgz` HTTPS desde una política de origen de confianza con nombre en `.github/package-trusted-sources.json`; se requieren `package_sha256` y `trusted_source_id`. Use esta opción únicamente para réplicas empresariales propiedad de los mantenedores o repositorios privados de paquetes que necesiten hosts, puertos, prefijos de ruta, hosts de redireccionamiento o resolución de red privada configurados. Si la política declara autenticación mediante portador, el flujo de trabajo usa el secreto fijo `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; las credenciales incrustadas en la URL siguen rechazándose.
- `source=artifact` descarga un `.tgz` desde `artifact_run_id` y `artifact_name`; `package_sha256` es opcional, pero debe proporcionarse para los artefactos compartidos externamente.

Mantenga `workflow_ref` y `package_ref` por separado. `workflow_ref` es el código de confianza del flujo de trabajo y el entorno de pruebas que ejecuta la prueba. `package_ref` es la confirmación de origen que se empaqueta cuando `source=ref`. Esto permite que el entorno de pruebas actual valide confirmaciones de origen de confianza anteriores sin ejecutar la lógica antigua del flujo de trabajo.

### Perfiles de conjuntos de pruebas

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `root-managed-vps-upgrade`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — el conjunto `package` con cobertura en vivo de `plugins` en lugar de `plugins-offline`, además de `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — segmentos completos de la ruta de lanzamiento de Docker con OpenWebUI
- `custom` — `docker_lanes` exacto; obligatorio cuando `suite_profile=custom`

El perfil `package` usa cobertura de plugins sin conexión para que la validación del paquete publicado no dependa de la disponibilidad en vivo de ClawHub. La vía opcional de Telegram reutiliza el artefacto `package-under-test` en `NPM Telegram Beta E2E`, mientras se mantiene la ruta de especificación publicada de npm para las ejecuciones independientes.

Para consultar la política específica de pruebas de actualizaciones y plugins, incluidos los comandos locales,
las vías de Docker, las entradas de Package Acceptance, los valores predeterminados de lanzamiento y el triaje de fallos,
consulte [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins).

Las comprobaciones de lanzamiento llaman a Package Acceptance con `source=artifact`, el artefacto del paquete de lanzamiento preparado, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape'` y `telegram_mode=mock-openai`. Esto mantiene las pruebas de migración del paquete, actualización, instalación en vivo de Skills desde ClawHub, limpieza de dependencias obsoletas de plugins, reparación de la instalación de plugins configurados, plugins sin conexión, actualización de plugins y Telegram en el mismo tarball de paquete resuelto. Establezca `release_package_spec` en Full Release Validation u OpenClaw Release Checks después de publicar una versión beta para ejecutar la misma matriz con el paquete npm distribuido sin volver a compilarlo; establezca `package_acceptance_package_spec` únicamente cuando Package Acceptance necesite un paquete diferente del resto de la validación del lanzamiento. Las comprobaciones de lanzamiento entre sistemas operativos siguen cubriendo la incorporación, el instalador y el comportamiento específico de cada plataforma; la validación del producto para paquetes y actualizaciones debe comenzar con Package Acceptance.

La vía de Docker `published-upgrade-survivor` valida una referencia publicada de paquete por ejecución en la ruta de lanzamiento bloqueante. En Package Acceptance, el tarball `package-under-test` resuelto siempre es el candidato y `published_upgrade_survivor_baseline` selecciona la referencia publicada alternativa, cuyo valor predeterminado es `openclaw@latest`; los comandos para volver a ejecutar vías fallidas conservan esa referencia. Full Release Validation con `run_release_soak=true` o `release_profile=full` establece `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` y `published_upgrade_survivor_scenarios=reported-issues` para ampliar la cobertura a las cuatro versiones estables más recientes de npm, además de versiones fijadas en los límites de compatibilidad de plugins y casos de prueba basados en incidencias para la configuración de Feishu, los archivos conservados de arranque y personalidad, las instalaciones configuradas de plugins de OpenClaw, las rutas de registro con tilde y las raíces obsoletas de dependencias de plugins heredados. Las selecciones de supervivencia de actualizaciones publicadas con varias referencias se dividen por referencia en trabajos independientes de ejecución específica de Docker. El flujo de trabajo independiente `Update Migration` usa la vía de Docker `update-migration` con referencias `all-since-2026.4.23` y escenarios `plugin-deps-cleanup` cuando se busca una limpieza exhaustiva de actualizaciones publicadas, no la amplitud normal de Full Release CI. Las ejecuciones agregadas locales pueden pasar especificaciones exactas de paquetes con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, conservar una sola vía con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, como `openclaw@2026.4.15`, o establecer `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` para la matriz de escenarios. La vía publicada configura la referencia con una receta de comandos `openclaw config set` integrada, registra los pasos de la receta en `summary.json` y sondea `/healthz`, `/readyz` y el estado de RPC después de iniciar el Gateway. Las vías de instalación nueva mediante paquete e instalador de Windows también verifican que un paquete instalado pueda importar una sustitución del control del navegador desde una ruta absoluta de Windows sin procesar. La prueba de humo de turnos de agente de OpenAI entre sistemas operativos usa de forma predeterminada `OPENCLAW_CROSS_OS_OPENAI_MODEL` cuando está definido y, en caso contrario, `openai/gpt-5.6-luna`, para que la prueba de instalación y del Gateway use el nivel de prueba GPT-5.6 de menor coste.

### Periodos de compatibilidad heredada

Package Acceptance tiene periodos limitados de compatibilidad heredada para paquetes ya publicados. Los paquetes hasta `2026.4.25`, incluido `2026.4.25-beta.*`, pueden usar la ruta de compatibilidad:

- las entradas conocidas de control de calidad privado en `dist/postinstall-inventory.json` pueden apuntar a archivos omitidos del tarball;
- `doctor-switch` puede omitir el subcaso de persistencia `gateway install --wrapper` cuando el paquete no expone esa opción;
- `update-channel-switch` puede eliminar los `patchedDependencies` de pnpm que falten del caso de prueba de Git simulado derivado del tarball y puede registrar la ausencia de `update.channel` persistidos;
- las pruebas de humo de plugins pueden leer ubicaciones heredadas de registros de instalación o aceptar que no se conserven los registros de instalación del marketplace;
- `plugin-update` puede permitir la migración de metadatos de configuración mientras sigue exigiendo que el registro de instalación y el comportamiento sin reinstalación permanezcan sin cambios.

El paquete publicado `2026.4.26` también puede advertir sobre archivos locales de sello de metadatos de compilación que ya se hayan distribuido, y los paquetes hasta `2026.5.20` pueden generar una advertencia en lugar de fallar cuando falta `npm-shrinkwrap.json`. Los paquetes posteriores deben satisfacer los contratos modernos; las mismas condiciones producen un fallo en lugar de una advertencia u omisión.

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

# Valide el paquete publicado de soporte estable extendido con cobertura de paquetes.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@extended-stable \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Empaquete y valide una rama de lanzamiento con el entorno de pruebas actual.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.PATCH \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Valide una URL de tarball. SHA-256 es obligatorio para source=url.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=url \
  -f package_url=https://example.com/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Valide un tarball de una política con nombre para una réplica privada de confianza.
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

Al depurar una ejecución fallida de Package Acceptance, comience por el resumen `resolve_package` para confirmar el origen, la versión y el SHA-256 del paquete. A continuación, inspeccione la ejecución secundaria `docker_acceptance` y sus artefactos de Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, los registros de las vías, los tiempos de las fases y los comandos de repetición. Es preferible volver a ejecutar el perfil de paquete fallido o las vías exactas de Docker en lugar de repetir la validación completa del lanzamiento.

## Prueba de humo de instalación

El flujo de trabajo `Install Smoke` ya no se ejecuta en solicitudes de incorporación de cambios ni en envíos a `main`. Tanto su envoltorio nocturno/manual como la validación de lanzamiento llaman al núcleo de solo lectura `install-smoke-reusable.yml`, y cada ejecución sigue la ruta completa de la prueba de humo de instalación en ejecutores alojados en GitHub:

- La imagen de prueba de humo del Dockerfile raíz se compila una vez por SHA de destino, se vincula a la revisión del flujo de trabajo y al intento del productor en un artefacto inmutable y, a continuación, la cargan la prueba de humo de la CLI, la prueba de humo de la CLI para eliminar agentes en un espacio de trabajo compartido, la prueba E2E de red del Gateway en contenedor y la prueba de humo del argumento de compilación del plugin `matrix` incluido. La prueba del plugin verifica la replicación de la instalación de dependencias en tiempo de ejecución y que el plugin se cargue sin diagnósticos de escape del punto de entrada.
- La instalación del paquete QR y las pruebas de humo de Docker del instalador y la actualización (incluidas las vías del instalador de Rocky Linux y una vía de actualización con una referencia npm configurable `update_baseline_version`) se ejecutan como trabajos independientes para que el trabajo del instalador no tenga que esperar a las pruebas de humo de la imagen raíz.

La prueba de humo lenta del proveedor de imágenes de la instalación global de Bun está controlada por separado mediante `run_bun_global_install_smoke`. Se ejecuta según la programación nocturna, está activada de forma predeterminada para las llamadas al flujo de trabajo desde las comprobaciones de versiones, y los lanzamientos manuales de `Install Smoke` pueden habilitarla. La CI normal de las solicitudes de incorporación de cambios sigue ejecutando la vía rápida de regresión del iniciador de Bun para los cambios relevantes para Node. Las pruebas Docker de QR y del instalador mantienen sus propios Dockerfiles centrados en la instalación.

## E2E local con Docker

`pnpm test:docker:all` precompila una imagen compartida de pruebas en vivo, empaqueta OpenClaw una sola vez como archivo tar de npm y compila dos imágenes compartidas de `scripts/e2e/Dockerfile`:

- un ejecutor básico de Node/Git para las vías de instalador, actualización y dependencias de plugins;
- una imagen funcional que instala el mismo archivo tar en `/app` para las vías de funcionalidad normales.

Las definiciones de las vías de Docker se encuentran en `scripts/lib/docker-e2e-scenarios.mjs`, la lógica del planificador se encuentra en `scripts/lib/docker-e2e-plan.mjs` y el ejecutor solo ejecuta el plan seleccionado. El programador selecciona la imagen por vía con `OPENCLAW_DOCKER_E2E_BARE_IMAGE` y `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, y después ejecuta las vías con `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parámetros ajustables

| Variable                               | Valor predeterminado | Propósito                                                                                       |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Número de espacios del grupo principal para las vías normales.                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Número de espacios del grupo final sensible al proveedor.                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Límite de vías en vivo simultáneas para que los proveedores no apliquen limitación.                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | Límite de vías simultáneas de instalación de npm.                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Límite de vías multiservicio simultáneas.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Intervalo entre inicios de vías para evitar ráfagas de creación del daemon de Docker; establezca `0` para eliminar el intervalo.     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Tiempo de espera alternativo por vía (120 minutos); las vías en vivo/finales seleccionadas usan límites más estrictos.           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | sin definir   | `1` imprime el plan del programador sin ejecutar las vías.                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | sin definir   | Lista exacta de vías separadas por comas; omite la prueba de humo de limpieza para que los agentes puedan reproducir una vía fallida. |

Una vía más pesada que su límite efectivo puede iniciarse igualmente desde un grupo vacío y, después, se ejecuta sola hasta que libera capacidad. El agregado local comprueba previamente Docker, elimina los contenedores E2E obsoletos de OpenClaw, emite el estado de las vías activas, conserva los tiempos de las vías para ordenarlas de mayor a menor duración y, de forma predeterminada, deja de programar nuevas vías agrupadas tras el primer fallo.

### Flujo de trabajo reutilizable en vivo/E2E

El flujo de trabajo reutilizable en vivo/E2E consulta a `scripts/test-docker-all.mjs --plan-json` qué paquete, tipo de imagen, imagen en vivo, vía y cobertura de credenciales se requieren. A continuación, `scripts/docker-e2e.mjs` convierte ese plan en resultados y resúmenes de GitHub. Empaqueta OpenClaw mediante `scripts/package-openclaw-for-docker.mjs`, descarga un artefacto de paquete de la ejecución actual o descarga un artefacto de paquete desde `package_artifact_run_id`, y después valida el inventario del archivo tar. La ruta predeterminada `no-push-artifact` compila imágenes básicas/funcionales etiquetadas con el resumen del paquete mediante la caché de capas Docker de Blacksmith, empaqueta los bytes exactos de la imagen en un artefacto inmutable del flujo de trabajo y hace que cada consumidor verifique y cargue dicho artefacto. `existing-only`, en cambio, requiere referencias GHCR explícitas `docker_e2e_bare_image`/`docker_e2e_functional_image` y nunca compila ni publica. Esas descargas del registro utilizan un tiempo de espera limitado de 180 segundos por intento, de modo que un flujo bloqueado se reintente rápidamente en lugar de consumir la mayor parte de la ruta crítica de CI. Tras una validación programada correcta, `openclaw-scheduled-live-checks.yml` pasa el manifiesto inmutable de imágenes probadas al publicador independiente con permisos de escritura de paquetes; los llamadores de versiones y versiones preliminares de solo lectura nunca pasan por ese proceso de escritura.

### Fragmentos de la ruta de publicación

La cobertura de Docker para publicaciones ejecuta trabajos más pequeños divididos en fragmentos con `OPENCLAW_SKIP_DOCKER_BUILD=1`, de modo que cada fragmento verifique y cargue únicamente el tipo de imagen respaldado por artefactos que necesita (o lo descargue mediante la reutilización explícita de `existing-only`) y ejecute varias vías mediante el mismo programador ponderado:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | openwebui`

Los fragmentos actuales de Docker para publicaciones son `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, desde `plugins-runtime-install-a` hasta `plugins-runtime-install-h` y `openwebui`. `package-update-openai` incluye la vía del paquete del plugin Codex en vivo, que instala el paquete candidato de OpenClaw, instala el plugin Codex desde `codex_plugin_spec` o desde un archivo tar de la misma referencia con aprobación explícita para instalar la CLI de Codex, ejecuta la comprobación previa de la CLI de Codex y después ejecuta varios turnos del agente OpenClaw en la misma sesión con OpenAI. `plugins-runtime-core`, `plugins-runtime` y `plugins-integrations` siguen siendo alias agregados de plugins/entorno de ejecución. El alias de vía `install-e2e` sigue siendo el alias agregado de repetición manual para ambas vías del instalador de proveedores.

OpenWebUI se ejecuta como un fragmento independiente `openwebui` en un ejecutor Blacksmith dedicado con disco de gran capacidad siempre que la cobertura de publicación estable o completa lo solicite, incluso cuando el flujo de trabajo reutilizable dirija los trabajos compatibles a ejecutores alojados en GitHub. Mantener separada la descarga de la imagen externa evita que la imagen grande compita con las imágenes compartidas de paquetes y plugins en `plugins-runtime-services`; los fragmentos agregados heredados de plugins/entorno de ejecución siguen incluyendo OpenWebUI para repeticiones manuales compatibles. Las vías de actualización de canales incluidos realizan un reintento ante fallos transitorios de red de npm.

Cada fragmento carga `.artifacts/docker-tests/` con registros de las vías, tiempos, `summary.json`, `failures.json`, tiempos de las fases, el JSON del plan del programador, tablas de vías lentas y comandos de repetición por vía. La entrada `docker_lanes` del flujo de trabajo ejecuta las vías seleccionadas contra imágenes preparadas para esa ejecución en lugar de usar los trabajos por fragmentos, lo que limita la depuración de vías fallidas a un único trabajo de Docker específico; si una vía seleccionada es una vía de Docker en vivo, el trabajo específico compila localmente la imagen de pruebas en vivo para esa repetición. El asistente de repetición valida el SHA de destino exacto seleccionado del artefacto de fallo, y el lanzamiento manual vuelve a empaquetar esa referencia, ya que la tupla interna del paquete del flujo de trabajo reutilizable no forma parte del esquema `workflow_dispatch`. Los comandos generados incluyen entradas de imágenes preparadas y `shared_image_policy=existing-only` únicamente cuando esas entradas están respaldadas por GHCR; se omiten las etiquetas de artefactos locales del ejecutor para que un ejecutor nuevo vuelva a compilarlas. Una anulación explícita del destino descarta las referencias de imágenes GHCR recuperadas, salvo que el artefacto demuestre que coinciden con la anulación. También se omiten las referencias de definición del flujo de trabajo generadas por artefactos porque se eliminan las ramas temporales de publicación completa; el lanzamiento utiliza la rama predeterminada del repositorio salvo que el operador la anule explícitamente.

```bash
pnpm test:docker:rerun <run-id>      # descargar artefactos de Docker e imprimir comandos de repetición específicos combinados/por vía
pnpm test:docker:timings <summary>   # resúmenes de la ruta crítica de las vías lentas y las fases
```

El flujo de trabajo programado en vivo/E2E ejecuta diariamente el conjunto completo de Docker de la ruta de publicación y, tras completarse correctamente, invoca al publicador explícito para los artefactos exactos de las imágenes probadas.

## Versión preliminar de plugins

`Plugin Prerelease` ofrece una cobertura de producto/paquete más costosa, por lo que es un flujo de trabajo independiente lanzado por `Full Release Validation` o por un operador de forma explícita. Las solicitudes de incorporación de cambios normales, los envíos a `main` y los lanzamientos manuales independientes de CI mantienen desactivado ese conjunto. Equilibra las pruebas de plugins incluidos entre ocho ejecutores de extensiones; esos trabajos de fragmentos de extensiones ejecutan simultáneamente hasta dos grupos de configuración de plugins con un ejecutor de Vitest por grupo y un heap de Node más grande, para que los lotes de plugins con muchas importaciones no creen trabajos adicionales de CI. La ruta Docker de versión preliminar exclusiva de publicaciones (activada mediante la entrada `full_release_validation`) agrupa las vías específicas de Docker en grupos de cuatro para evitar reservar decenas de ejecutores para trabajos de uno a tres minutos. El flujo de trabajo también carga un artefacto informativo `plugin-inspector-advisory` desde `@openclaw/plugin-inspector`; los hallazgos del inspector sirven como datos para la clasificación y no modifican la barrera bloqueante de la versión preliminar de plugins.

## Laboratorio de control de calidad

El laboratorio de control de calidad tiene vías de CI dedicadas fuera del flujo de trabajo principal de alcance inteligente. La paridad de agentes está integrada en los conjuntos amplios de control de calidad y publicación, no en un flujo de trabajo independiente para solicitudes de incorporación de cambios. Use `Full Release Validation` con `rerun_group=qa-parity` cuando la paridad deba incluirse en una ejecución de validación amplia.

- El flujo de trabajo `QA-Lab - All Lanes` se ejecuta cada noche en `main` y mediante lanzamiento manual; distribuye la vía de paridad simulada, la vía de Matrix en vivo y las vías de Telegram y Discord en vivo como trabajos paralelos. Los trabajos en vivo utilizan el entorno `qa-live-shared`, y Telegram/Discord utilizan concesiones de Convex.

Las comprobaciones de publicaciones ejecutan las vías de transporte en vivo de Matrix y Telegram con el proveedor simulado determinista y modelos aptos para simulación (`mock-openai/gpt-5.6-luna` y `mock-openai/gpt-5.6-luna-alt`), para aislar el contrato del canal de la latencia del modelo en vivo y del inicio normal del plugin del proveedor. El Gateway de transporte en vivo desactiva la búsqueda de memoria porque la paridad de control de calidad cubre por separado el comportamiento de la memoria; la conectividad del proveedor está cubierta por los conjuntos independientes de modelos en vivo, proveedores nativos y proveedores Docker.

Matrix utiliza `--profile fast` para las barreras programadas y de publicación, y añade `--fail-fast` únicamente cuando la CLI extraída lo admite. El valor predeterminado de la CLI y la entrada manual del flujo de trabajo siguen siendo `all`; el lanzamiento manual de `matrix_profile=all` siempre divide la cobertura completa de Matrix entre los trabajos `transport`, `media`, `e2ee-smoke`, `e2ee-deep` y `e2ee-cli`.

`OpenClaw Release Checks` también ejecuta las vías críticas para publicaciones del laboratorio de control de calidad antes de aprobar la publicación; su barrera de paridad de control de calidad ejecuta los paquetes candidato y de referencia como trabajos de vías paralelos, y después descarga ambos artefactos en un pequeño trabajo de informe para realizar la comparación final de paridad.

Para las solicitudes de incorporación de cambios normales, siga la evidencia de CI/comprobaciones del ámbito correspondiente en lugar de tratar la paridad como un estado obligatorio.

## CodeQL

El flujo de trabajo `CodeQL` es intencionadamente un escáner de seguridad limitado de primera pasada, no un análisis completo del repositorio. Las ejecuciones diarias, manuales, de envíos a `main` y de protección de solicitudes de incorporación de cambios que no sean borradores analizan el código de los flujos de trabajo de Actions, además de las superficies JavaScript/TypeScript de mayor riesgo, con consultas de seguridad de alta confianza filtradas a `security-severity` altas/críticas.

La protección de las solicitudes de incorporación de cambios se mantiene ligera: solo se inicia para cambios en `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `scripts`, `src` o en rutas de entorno de ejecución de plugins incluidos que administran procesos, y ejecuta la misma matriz de seguridad de alta confianza que el flujo de trabajo programado. CodeQL para Android y macOS queda fuera de los valores predeterminados de las solicitudes de incorporación de cambios.

### Categorías de seguridad

| Categoría                                         | Superficie                                                                                                                              |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Autenticación, secretos, entorno aislado, cron y base de referencia del Gateway                                                         |
| `/codeql-security-high/channel-runtime-boundary`  | Contratos de implementación de canales del núcleo, además del entorno de ejecución de plugins de canal, Gateway, Plugin SDK, secretos y puntos de contacto de auditoría |
| `/codeql-security-high/network-ssrf-boundary`     | Superficies de políticas de SSRF del núcleo, análisis de IP, protección de red, obtención web y SSRF del Plugin SDK                    |
| `/codeql-security-high/mcp-process-tool-boundary` | Servidores MCP, asistentes de ejecución de procesos, entrega saliente y controles de ejecución de herramientas de agentes               |
| `/codeql-security-high/process-exec-boundary`     | Shell local, asistentes de creación de procesos, entornos de ejecución de plugins integrados que gestionan subprocesos y lógica de conexión de scripts de flujo de trabajo |
| `/codeql-security-high/plugin-trust-boundary`     | Superficies de confianza de instalación, cargador, manifiesto, registro, instalación mediante gestor de paquetes, carga de código fuente y contrato de paquetes del Plugin SDK |

### Fragmentos de seguridad específicos de cada plataforma

- `CodeQL Android Critical Security` — fragmento programado de seguridad de Android. Compila manualmente la aplicación de Android para CodeQL en el ejecutor Linux de Blacksmith más pequeño aceptado por la validación del flujo de trabajo. Carga los resultados bajo `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — fragmento de seguridad semanal/manual de macOS. Compila manualmente la aplicación de macOS para CodeQL en Blacksmith macOS, excluye de los archivos SARIF cargados los resultados de compilación de dependencias y los carga bajo `/codeql-critical-security/macos`. Se mantiene fuera de los valores predeterminados diarios porque la compilación de macOS domina el tiempo de ejecución incluso cuando no encuentra problemas.

### Categorías de calidad crítica

`CodeQL Critical Quality` es el fragmento equivalente no relacionado con la seguridad. Ejecuta únicamente consultas de calidad de JavaScript/TypeScript no relacionadas con la seguridad y con gravedad de error sobre superficies limitadas de alto valor en ejecutores Linux alojados en GitHub, para que los análisis de calidad no consuman el presupuesto de registro de ejecutores de Blacksmith. Su control para solicitudes de incorporación de cambios es intencionadamente menor que el perfil programado: las solicitudes que no sean borradores ejecutan solo los fragmentos correspondientes a las superficies que modifican, entre trece fragmentos enrutables para solicitudes de incorporación de cambios: `agent-runtime-boundary`, `channel-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `gateway-runtime-boundary`, `mcp-process-runtime-boundary`, `memory-runtime-boundary`, `network-runtime-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, `plugin-sdk-reply-runtime`, `provider-runtime-boundary` y `session-diagnostics-boundary`. `ui-control-plane` y `web-media-runtime-boundary` quedan fuera de las ejecuciones de solicitudes de incorporación de cambios. Los cambios en la configuración de CodeQL y en el flujo de trabajo de calidad ejecutan el conjunto completo de fragmentos para solicitudes de incorporación de cambios (el fragmento del entorno de ejecución de red se activa en función de sus propios archivos de configuración de CodeQL y de las rutas de código fuente responsables de la red).

La ejecución manual acepta:

```text
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|network-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Los perfiles limitados son mecanismos de aprendizaje e iteración para ejecutar un fragmento de calidad de forma aislada.

| Categoría                                               | Superficie                                                                                                                                                                      |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Código de límites de seguridad de autenticación, secretos, entorno aislado, cron y Gateway                                                                                      |
| `/codeql-critical-quality/config-boundary`              | Contratos de esquema, migración, normalización y E/S de configuración                                                                                                           |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Esquemas del protocolo del Gateway y contratos de métodos del servidor                                                                                                          |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratos de implementación de canales del núcleo y plugins de canal integrados                                                                                                 |
| `/codeql-critical-quality/agent-runtime-boundary`       | Contratos de ejecución de comandos, distribución de modelos/proveedores, distribución y colas de respuesta automática, y entorno de ejecución del plano de control de ACP      |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Servidores MCP y puentes de herramientas, asistentes de supervisión de procesos y contratos de entrega saliente                                                                 |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK del host de memoria, fachadas del entorno de ejecución de memoria, alias de memoria del Plugin SDK, lógica de activación del entorno de ejecución de memoria y comandos de diagnóstico de memoria |
| `/codeql-critical-quality/network-runtime-boundary`     | Paquete de políticas de red, entorno de ejecución de sockets sin procesar y captura de proxy, túnel SSH, bloqueo del Gateway, socket JSONL y superficies de transporte push    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Componentes internos de la cola de respuestas, colas de entrega de sesiones, asistentes de vinculación y entrega de sesiones salientes, superficies de eventos y paquetes de registros de diagnóstico, y contratos de la CLI de diagnóstico de sesiones |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Distribución de respuestas entrantes del Plugin SDK, asistentes de carga útil, fragmentación y entorno de ejecución de respuestas, opciones de respuesta de canales, colas de entrega y asistentes de vinculación de sesiones/hilos |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalización del catálogo de modelos, autenticación y detección de proveedores, registro del entorno de ejecución de proveedores, valores predeterminados y catálogos de proveedores, y registros web, de búsqueda, obtención e incrustaciones |
| `/codeql-critical-quality/ui-control-plane`             | Inicialización de la interfaz de control, persistencia local, flujos de control del Gateway y contratos del entorno de ejecución del plano de control de tareas                |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contratos del entorno de ejecución para obtención y búsqueda web del núcleo, E/S de medios, comprensión de medios, generación de imágenes y generación de medios               |
| `/codeql-critical-quality/plugin-boundary`              | Contratos del cargador, registro, superficie pública y puntos de entrada del Plugin SDK                                                                                         |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Código fuente publicado del Plugin SDK correspondiente al paquete y asistentes de contratos de paquetes de plugins                                                             |

La calidad se mantiene separada de la seguridad para que los hallazgos de calidad puedan programarse, medirse, desactivarse o ampliarse sin ocultar la señal de seguridad. La ampliación de CodeQL para Swift, Python y plugins integrados solo debe volver a añadirse como trabajo posterior delimitado o fragmentado una vez que los perfiles limitados tengan un tiempo de ejecución y una señal estables.

## Flujos de trabajo de mantenimiento

### Agente de documentación

El flujo de trabajo `Docs Agent` es una vía de mantenimiento de Codex controlada por eventos para mantener la documentación existente alineada con los cambios incorporados recientemente. No tiene una programación independiente: una ejecución de CI correcta de un envío no realizado por un bot en `main` puede activarlo, y la ejecución manual puede iniciarlo directamente. Las invocaciones mediante ejecuciones de flujo de trabajo se omiten cuando `main` ha avanzado o cuando se ha creado otra ejecución no omitida del agente de documentación durante la última hora. Cuando se ejecuta, revisa el intervalo de confirmaciones comprendido entre el SHA de origen de la ejecución anterior no omitida del agente de documentación y el `main` actual, por lo que una ejecución por hora puede abarcar todos los cambios de la rama principal acumulados desde la última revisión de documentación.

### Agente de rendimiento de pruebas

El flujo de trabajo `Test Performance Agent` es una vía de mantenimiento de Codex controlada por eventos para pruebas lentas. No tiene una programación independiente: una ejecución de CI correcta de un envío no realizado por un bot en `main` puede activarlo, pero se omite si otra invocación mediante ejecución de flujo de trabajo ya se ejecutó o está en ejecución durante ese día UTC. La ejecución manual omite ese control de actividad diaria. La vía genera un informe agrupado de rendimiento de Vitest para el conjunto completo, permite que Codex realice únicamente pequeñas correcciones del rendimiento de las pruebas que preserven la cobertura, en lugar de refactorizaciones amplias, vuelve a ejecutar el informe del conjunto completo y rechaza los cambios que reduzcan el recuento de referencia de pruebas aprobadas. El informe agrupado registra el tiempo real por configuración y el RSS máximo en Linux y macOS, para que la comparación anterior/posterior muestre las diferencias de memoria de las pruebas junto con las diferencias de duración. Si la referencia tiene pruebas con errores, Codex solo puede corregir errores evidentes y el informe del conjunto completo posterior al agente debe aprobarse antes de confirmar cualquier cambio. Cuando `main` avanza antes de que se complete el envío del bot, la vía reorganiza el parche validado sobre la nueva base, vuelve a ejecutar `pnpm check:changed` y reintenta el envío; los parches obsoletos con conflictos se omiten. Utiliza Ubuntu alojado en GitHub para que la acción de Codex pueda mantener la misma postura de seguridad de eliminación de sudo que el agente de documentación.

### Solicitudes de incorporación de cambios duplicadas después de la fusión

El flujo de trabajo `Duplicate PRs After Merge` es un flujo de trabajo manual para responsables de mantenimiento destinado a limpiar duplicados después de la incorporación. De forma predeterminada, realiza una simulación y solo cierra las solicitudes de incorporación de cambios indicadas explícitamente cuando `apply=true`. Antes de modificar GitHub, verifica que la solicitud incorporada esté fusionada y que cada duplicado tenga un problema referenciado compartido o fragmentos modificados que se solapen.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Controles locales y enrutamiento de cambios

La lógica local de vías modificadas reside en `scripts/changed-lanes.mjs` y se ejecuta mediante `scripts/check-changed.mjs`. Ese control local es más estricto con los límites arquitectónicos que el amplio alcance de plataformas de CI:

- los cambios de producción del núcleo ejecutan la comprobación de tipos de producción y de pruebas del núcleo, además del análisis estático y los controles del núcleo;
- los cambios exclusivos de pruebas del núcleo ejecutan únicamente la comprobación de tipos de pruebas del núcleo, además del análisis estático del núcleo;
- los cambios de producción de extensiones ejecutan la comprobación de tipos de producción y de pruebas de extensiones, además del análisis estático de extensiones;
- los cambios exclusivos de pruebas de extensiones ejecutan la comprobación de tipos de pruebas de extensiones, además del análisis estático de extensiones;
- los cambios públicos del Plugin SDK o de contratos de plugins amplían la comprobación de tipos a las extensiones porque estas dependen de esos contratos del núcleo (los barridos de extensiones de Vitest siguen siendo trabajo de prueba explícito);
- los incrementos de versión que solo afectan a metadatos de publicación ejecutan comprobaciones específicas de versión, configuración y dependencias raíz;
- los cambios desconocidos de raíz o configuración activan de forma segura todas las vías de comprobación.

El enrutamiento local de pruebas modificadas reside en `scripts/test-projects.test-support.mjs` y es intencionadamente menos costoso que `check:changed`: las modificaciones directas de pruebas ejecutan esas mismas pruebas; las modificaciones del código fuente priorizan las asignaciones explícitas y, después, las pruebas relacionadas y los dependientes del grafo de importación. La configuración compartida de entrega en salas de grupo es una de las asignaciones explícitas: los cambios en la configuración de respuestas visibles del grupo, el modo de entrega de respuestas del código fuente o el mensaje del sistema de la herramienta de mensajes se enrutan a través de las pruebas de respuesta del núcleo y las pruebas de regresión de entrega de Discord y Slack, para que un cambio en un valor predeterminado compartido falle antes del primer envío de la solicitud de incorporación de cambios. Utilice `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo cuando el cambio afecte de forma tan amplia a la infraestructura de pruebas que el conjunto asignado de bajo coste no sea una aproximación fiable.

## Validación con Testbox

Crabbox es el contenedor remoto administrado por el repositorio para las verificaciones de mantenimiento en Linux. Las sesiones de
agentes mantienen en local una o unas pocas pruebas específicas y comprobaciones estáticas económicas únicamente para
código fuente de confianza cuando la instalación de dependencias existente está lista. Usan Crabbox para conjuntos de pruebas más grandes y
trabajo intensivo desde el punto de vista computacional, incluidas compilaciones, comprobaciones de tipos, ejecución distribuida de lint,
Docker, flujos de paquetes, E2E, verificación en vivo y paridad con CI. Las verificaciones intensivas de mantenimiento de confianza
usan `blacksmith-testbox` de forma predeterminada, y `.crabbox.yaml` ahora también lo usa de forma predeterminada. Su flujo de trabajo
configurado incorpora credenciales del proveedor y del agente, por lo que el código que no sea de confianza procedente de colaboradores o
forks debe usar en su lugar CI del fork sin secretos o Crabbox directo y saneado en AWS.
Las ejecuciones saneadas en AWS establecen `CRABBOX_ENV_ALLOW=CI`, pasan
`--no-hydrate` y usan un `HOME` remoto temporal nuevo; esto impide que la lista de permitidos
`OPENCLAW_*` del repositorio y los perfiles de autenticación existentes lleguen al código que no es de confianza.
Usan una concesión recién preparada dedicada a ese código fuente que no es de confianza, nunca una
concesión de confianza o previamente provista de credenciales. Inicie un binario de Crabbox de confianza instalado
desde un checkout limpio y de confianza de `main` y obtenga únicamente el PR remoto con
`--fresh-pr`; nunca ejecute localmente el wrapper ni la configuración del checkout que no es de confianza.
Desactive `CRABBOX_AWS_INSTANCE_PROFILE` y proceda de forma segura ante errores salvo que el valor resuelto de
`aws.instanceProfile` esté vacío. Antes de cualquier instalación o prueba, use herramientas de confianza
con rutas absolutas para exigir un token IMDSv2, demostrar que el punto de conexión de credenciales de IAM
devuelve 404 y comparar el valor remoto de `git rev-parse HEAD` con el SHA completo
de la cabecera del PR revisado. Vincule la concesión a ese SHA y deténgala y vuelva a prepararla cuando cambie la cabecera.
Cargue el archivo de confianza `scripts/crabbox-untrusted-bootstrap.sh` desde un `main` limpio
junto con `--fresh-pr`; instala versiones fijadas de Node/pnpm, verifica el SHA y
la versión fijada del gestor de paquetes, aísla `HOME`, instala las dependencias y, a continuación, ejecuta la
prueba solicitada.
Desactive todas las anulaciones de `CRABBOX_TAILSCALE*`, fuerce `--network public
--tailscale=false`, elimine las marcas de nodo de salida/LAN y exija que `crabbox inspect`
informe de una red pública sin estado de Tailscale antes de cargar cualquier script.
La capacidad propia de AWS/Hetzner también sigue siendo la alternativa para interrupciones de Blacksmith,
problemas de cuota o pruebas explícitas con capacidad propia.

Los agentes no realizan una preparación anticipada para trabajo previsto. Adquiera un Testbox cuando
el primer comando intensivo esté listo, reutilice el identificador `tbx_...` devuelto para los comandos intensivos
posteriores, sincronice el checkout actual en cada ejecución y deténgalo antes de la entrega.

Las ejecuciones de Blacksmith respaldadas por Crabbox preparan, reclaman, sincronizan, ejecutan, generan informes y limpian
Testboxes de un solo uso. La comprobación de integridad de sincronización integrada falla de inmediato cuando
`git status --short` en el contenedor sincronizado muestra al menos 200 eliminaciones de archivos bajo seguimiento,
lo que detecta la desaparición de archivos raíz como `pnpm-lock.yaml`. Para PR con
grandes eliminaciones intencionadas, establezca `CRABBOX_ALLOW_MASS_DELETIONS=1` para el comando remoto.

Crabbox también finaliza una invocación local de la CLI de Blacksmith que permanezca en la
fase de sincronización durante más de cinco minutos sin generar salida posterior a la sincronización. Establezca
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` para desactivar esa protección o use un valor mayor
en milisegundos para diferencias locales excepcionalmente grandes.

Antes de una primera ejecución, compruebe el wrapper desde la raíz del repositorio:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

El wrapper del repositorio rechaza un binario obsoleto de Crabbox que no anuncie el proveedor seleccionado, y las ejecuciones respaldadas por Blacksmith requieren Crabbox 0.22.0 o una versión posterior para que el wrapper obtenga el comportamiento actual de sincronización, cola y limpieza de Testbox. En árboles de trabajo de Codex o checkouts vinculados o dispersos, evite el script local `pnpm crabbox:run`, ya que pnpm podría reconciliar las dependencias antes de que se inicie Crabbox; invoque directamente el wrapper de Node:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Cuando use el checkout adyacente, vuelva a compilar el binario local ignorado antes de realizar mediciones o verificaciones:

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

Nueva ejecución de pruebas específicas en Testbox cuando las dependencias locales no están disponibles o el
destino se distribuye:

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
`syncDelegated`, `exitCode`, `commandMs` y `totalMs`. En las ejecuciones delegadas de
Blacksmith Testbox, el código de salida y el resumen JSON del wrapper de Crabbox constituyen el
resultado del comando. La ejecución vinculada de GitHub Actions gestiona la incorporación de credenciales y el mantenimiento de actividad;
puede finalizar como `cancelled` cuando Testbox se detiene externamente después de que el comando SSH
ya haya finalizado. Trátelo como un artefacto de limpieza o estado, salvo que
el valor `exitCode` del wrapper sea distinto de cero o la salida del comando muestre una prueba fallida.
Las ejecuciones de Crabbox de un solo uso respaldadas por Blacksmith deberían detener Testbox automáticamente;
si una ejecución se interrumpe o la limpieza no está clara, inspeccione los contenedores activos y detenga únicamente
los que haya creado:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Use la reutilización únicamente cuando necesite ejecutar intencionadamente varios comandos en el mismo contenedor provisto de credenciales:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --id <tbx_id> --timing-json --shell -- "corepack pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Reutilice la concesión, no código fuente obsoleto. Omita `--no-sync` para que cada ejecución cargue el
checkout actual; úselo únicamente para volver a ejecutar intencionadamente un árbol sin cambios y ya sincronizado.
El código que no sea de confianza procedente de colaboradores o forks debe usar
`CRABBOX_ENV_ALLOW=CI`, `--provider aws --no-hydrate` y un
`HOME` remoto temporal nuevo para cada comando; instale las dependencias dentro de ese
comando saneado antes de realizar las pruebas. Reutilice únicamente una concesión recién preparada y dedicada al
mismo código fuente que no es de confianza; nunca una concesión de confianza o previamente provista de credenciales. Nunca
ejecute localmente el wrapper ni la configuración del checkout que no es de confianza: inicie el binario de Crabbox
de confianza instalado desde un `main` limpio y de confianza y pase `--fresh-pr` en cada
ejecución. Mantenga `CRABBOX_AWS_INSTANCE_PROFILE` sin establecer, rechace un
perfil de instancia resuelto que no esté vacío, exija una verificación IMDS remota de confianza que confirme la ausencia de roles y compruebe el
SHA de cabecera revisado antes de instalar o realizar pruebas. Vincule la concesión a ese SHA; deténgala y
vuelva a prepararla después de cualquier cambio de cabecera. Si no existe un PR remoto, use CI del fork sin secretos.
Nunca seleccione `hydrate-github` ni el flujo de trabajo de Blacksmith provisto de credenciales
para código fuente que no sea de confianza.

Si Crabbox es la capa defectuosa pero Blacksmith funciona, use Blacksmith directamente
solo para diagnósticos como `list`, `status` y la limpieza. Corrija la
ruta de Crabbox antes de considerar una ejecución directa de Blacksmith como verificación de mantenimiento.

Si `blacksmith testbox list --all` y `blacksmith testbox status` funcionan, pero las nuevas
preparaciones permanecen en `queued` sin una IP ni una URL de ejecución de Actions después de un par de minutos,
trátelo como presión del proveedor, la cola, la facturación o los límites de la organización de Blacksmith. Detenga los
identificadores en cola que haya creado, evite iniciar más Testboxes y traslade la verificación a la
ruta de capacidad propia de Crabbox que aparece a continuación mientras alguien comprueba el panel de Blacksmith,
la facturación y los límites de la organización.

Escale a la capacidad propia de Crabbox únicamente cuando Blacksmith esté inactivo, limitado por cuotas, no disponga del entorno necesario o el objetivo sea explícitamente usar capacidad propia:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --provider aws --id <cbx_id-or-slug>
pnpm crabbox:run -- --provider aws --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- --provider aws <cbx_id-or-slug>
```

Cuando AWS esté bajo presión, evite `class=beast` salvo que la tarea realmente necesite una CPU de clase 48xlarge. Una solicitud `beast` comienza con 192 vCPU y es la forma más sencilla de superar la cuota regional de EC2 Spot o Standard bajo demanda. El archivo `.crabbox.yaml` propiedad del repositorio usa de forma predeterminada `class: standard`, el mercado bajo demanda y `capacity.hints: true`, de modo que las concesiones intermediadas de AWS muestran la región y el mercado seleccionados, la presión de cuota, la alternativa Spot y las advertencias de clases de alta presión. Use `fast` para comprobaciones amplias más intensivas, `large` solo cuando standard/fast no sean suficientes y `beast` únicamente para flujos excepcionales con uso intensivo de CPU, como el conjunto completo o las matrices de Docker de todos los plugins, la validación explícita de versiones o bloqueos, o la elaboración de perfiles de rendimiento con muchos núcleos. No use `beast` para `pnpm check:changed`, pruebas específicas, trabajo exclusivamente de documentación, comprobaciones ordinarias de lint o tipos, reproducciones E2E pequeñas ni la clasificación de interrupciones de Blacksmith. Use `--market on-demand` para diagnosticar la capacidad, de modo que la inestabilidad del mercado Spot no se mezcle con la señal.

`.crabbox.yaml` gestiona los valores predeterminados del proveedor, la sincronización y la incorporación de credenciales de GitHub Actions. La sincronización de Crabbox nunca transfiere `.git`, por lo que el checkout de Actions provisto de credenciales conserva sus propios metadatos remotos de Git en lugar de sincronizar los remotos y almacenes de objetos locales del mantenedor, y la configuración del repositorio también excluye los artefactos locales de ejecución o compilación (como `.artifacts` y los informes de pruebas) que nunca deben transferirse. `.github/workflows/crabbox-hydrate.yml` gestiona el checkout, la configuración de Node/pnpm, la obtención de `origin/main` y la transferencia del entorno sin secretos para los comandos `crabbox run --id <cbx_id>` de la nube propia.

## Relacionado

- [Descripción general de la instalación](/es/install)
- [Canales de desarrollo](/es/install/development-channels)
