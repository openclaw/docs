---
read_when:
    - Es necesario entender por qué una tarea de CI se ejecutó o no se ejecutó.
    - Estás depurando una comprobación fallida de GitHub Actions
    - Está coordinando una ejecución o repetición de la validación de una versión.
    - Está cambiando el despacho de ClawSweeper o el reenvío de actividad de GitHub
summary: Gráfico de trabajos de CI, controles de alcance, paraguas de lanzamiento y comandos locales equivalentes
title: Pipeline de CI
x-i18n:
    generated_at: "2026-07-22T10:27:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 00e6d48d543001ee40472d14e059a040714ed31ab2d59b83ebd566c6f1e32db1
    source_path: ci.md
    workflow: 16
---

La CI de OpenClaw se ejecuta con los envíos a `main` (las rutas de Markdown y `docs/**` se ignoran
en el desencadenador), en cada pull request que no sea borrador y mediante ejecución manual.
Los envíos canónicos a `main` se ejecutan de uno en uno: el grupo de concurrencia `CI` permite ejecutar
un ciclo completo de integración mientras GitHub conserva únicamente el envío pendiente más reciente.
Las nuevas fusiones reemplazan esa ejecución pendiente en lugar de cancelar el trabajo que ya
haya registrado una matriz de Blacksmith. Los pull requests siguen cancelando los encabezados reemplazados,
y las ejecuciones manuales usan grupos aislados. `preflight` clasifica las diferencias y
desactiva los carriles costosos cuando solo han cambiado áreas no relacionadas. Las ejecuciones manuales
de `workflow_dispatch` omiten intencionadamente el alcance inteligente y despliegan
el grafo completo para candidatos de versión y validaciones amplias. Los carriles de Android siguen
siendo opcionales mediante `include_android` (o la entrada `release_gate`). La cobertura de plugins
exclusiva de las versiones se encuentra en el flujo de trabajo independiente
[`Plugin Prerelease`](#plugin-prerelease) y solo se ejecuta desde
[`Full Release Validation`](#full-release-validation) o mediante una
ejecución manual explícita.

## Descripción general del Pipeline de CI

| Trabajo                            | Propósito                                                                                                                                                                                                             | Cuándo se ejecuta                                     |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `preflight`                 | Detectar los ámbitos modificados y crear el manifiesto de CI; en envíos canónicos a `main` relevantes para Node, actualizar y mantener la instantánea de dependencias antes del despliegue                   | Siempre en envíos y PR que no sean borradores         |
| `security-fast`                 | Detección de claves privadas, auditoría de flujos de trabajo modificados mediante `zizmor` y auditoría del archivo de bloqueo de producción                                                                   | Siempre en envíos y PR que no sean borradores         |
| `pnpm-store-warmup`                 | Preparar la caché de Actions fijada por el archivo de bloqueo para los pull requests y las ejecuciones manuales sin bloquear los fragmentos de Node para Linux                                                          | Cuando se seleccionan carriles de Node o comprobación de documentación fuera de main |
| `build-artifacts`                 | Compilar `dist/`, la interfaz de control, las comprobaciones rápidas de la CLI compilada, la memoria de inicio y las comprobaciones integradas de artefactos compilados                                      | Cambios relevantes para Node                          |
| `control-ui-i18n`                 | Verificar los paquetes de configuración regional generados de la interfaz de control, los metadatos y la memoria de traducción; informativo en ejecuciones automáticas, bloqueante en la CI manual de versiones         | Cambios relevantes para i18n de la interfaz de control y CI manual |
| `checks-fast-core`                 | Carriles rápidos de corrección en Linux: ajuste progresivo del máximo de líneas de la línea base de supresión, componentes incluidos + protocolo, iniciador de Bun y tarea rápida de enrutamiento de CI                  | Cambios relevantes para Node                          |
| `qa-smoke-ci-profile`                 | Dos partes equilibradas y autónomas del conjunto representativo y acotado de QA Smoke automático; la cobertura completa de la taxonomía sigue disponible mediante perfiles explícitos de QA                            | Cambios relevantes para Node                          |
| `checks-fast-contracts-plugins-*`                 | Dos fragmentos ponderados de contratos de plugins                                                                                                                                                                     | Cambios relevantes para Node                          |
| `checks-fast-contracts-channels-*`                 | Dos fragmentos ponderados de contratos de canales                                                                                                                                                                     | Cambios relevantes para Node                          |
| `checks-node-*`                 | Pruebas de Node para objetivos modificados en pull requests; fragmentos completos del núcleo en `main`, ejecuciones manuales, versiones y ejecuciones de reserva amplias                                    | Cambios relevantes para Node                          |
| `check-*`                 | Equivalente fragmentado de la puerta local principal: protecciones, shrinkwrap, metadatos de configuración de canales incluidos, tipos de producción, lint, dependencias y tipos de pruebas                            | Cambios relevantes para Node                          |
| `check-additional-*`                 | Franjas de comprobaciones de límites (incluida la desviación de instantáneas de prompts), límites del descriptor de acceso a sesiones, lector de transcripciones y transacciones de SQLite, grupos de lint de extensiones, compilación/canario de límites de paquetes y arquitectura de topología de ejecución | Cambios relevantes para Node |
| `checks-node-compat-node22`                 | Carril de compilación y comprobación rápida de compatibilidad con Node 22                                                                                                                                               | Ejecución manual de CI para versiones                 |
| `check-docs`                 | Comprobaciones de formato, lint y enlaces rotos de la documentación                                                                                                                                                    | Cuando cambia la documentación (PR y ejecución manual) |
| `native-i18n`                 | Verificar la extracción de fuentes nativas y la seguridad de la localización en PR de código fuente; exigir la paridad completa traducida y generada por plataforma en PR generados y CI manual                        | Cambios relevantes para i18n nativo                   |
| `skills-python`                 | Ruff + pytest para Skills respaldadas por Python                                                                                                                                                                      | Cambios relevantes para Skills de Python              |
| `checks-windows`                 | Pruebas de procesos y rutas específicas de Windows, además de regresiones compartidas de especificadores de importación en tiempo de ejecución                                                                          | Cambios relevantes para Windows                       |
| `macos-node`                 | Pruebas específicas de TypeScript para macOS: launchd, Homebrew, rutas de ejecución, scripts de empaquetado y contenedor de grupos de procesos                                                                          | Cambios relevantes para macOS                         |
| `macos-swift`                 | Lint y compilación de Swift para la aplicación de macOS, además de pruebas de la aplicación y del paquete compartido OpenClawKit                                                                                        | Cambios relevantes para macOS                         |
| `ios-build`                 | Generación del proyecto de Xcode y compilación de la aplicación de iOS para el simulador                                                                                                                               | Cambios en la aplicación de iOS, el kit compartido de aplicaciones o Swabble |
| `android`                 | Pruebas unitarias de Android para ambas variantes y compilación de un APK de depuración                                                                                                                                | Cambios relevantes para Android                       |
| `openclaw/ci-gate`                 | Agregado final: requiere comprobaciones preliminares y seguridad; solo acepta omisiones en carriles posteriores desactivados por el manifiesto                                                                          | Cada ejecución de CI que no sea borrador              |
| `test-performance-agent`                 | Flujo de trabajo independiente: optimización diaria de pruebas lentas de Codex tras actividad de confianza                                                                                                             | CI principal correcta o ejecución manual              |
| `openclaw-performance`                 | Flujo de trabajo independiente: informes diarios o bajo demanda sobre el rendimiento del entorno de ejecución Kova, con carriles de proveedor simulado, perfil profundo y GPT 5.6 en vivo                              | Ejecución programada y manual                         |

Los flujos de trabajo independientes de Periphery exigen que no haya ningún hallazgo de código muerto en las aplicaciones de iOS y macOS. El flujo de trabajo compartido de OpenClawKit analiza ambos consumidores en paralelo y solo informa de una declaración cuando Periphery emite el mismo USR de Swift en ambas compilaciones. Su contrato de esquema `OpenClawProtocol/GatewayModels.swift` generado se conserva como código propiedad del generador en lugar de tratarse como código muerto local de la aplicación.

## Orden de interrupción temprana

1. `preflight` decide qué carriles existen. La lógica de `docs-scope` y `changed-scope` corresponde a pasos dentro de este trabajo, no a trabajos independientes. `main` canónico comienza inmediatamente, pero su grupo de concurrencia solo admite una ejecución completa y combina los envíos posteriores en una única ejecución pendiente con el envío más reciente. Los envíos a main relevantes para Node también serializan aquí el único escritor del disco de dependencias y su mantenimiento de tamaño antes de que los trabajos posteriores puedan montar la clave; Blacksmith puede exponer una confirmación nueva solo a una ejecución posterior del flujo de trabajo, por lo que los consumidores de la misma ejecución conservan la reserva local comprobada mediante marcadores.
2. `security-fast`, `check-*`, `check-additional-*`, `check-docs` y `skills-python` fallan rápidamente sin esperar a los trabajos más pesados de la matriz de artefactos y plataformas.
3. `build-artifacts` y las comprobaciones de configuración regional se solapan con los carriles rápidos de Linux. Los PR de código fuente de la interfaz de control y las aplicaciones nativas excluyen las instantáneas y los recursos de configuración regional generados; sus flujos de actualización serializados reparan y fusionan automáticamente PR generados y aislados en segundo plano. La CI del código fuente sigue bloqueando inventarios de fuentes obsoletos y llamadas de localización inseguras. Los PR generados, la CI manual y la preparación de versiones exigen la paridad completa traducida y generada por plataforma. Las ramas canónicas `release/YYYY.M.PATCH` pueden incluir reparaciones de configuración regional de preparación de versiones junto con el resto de los resultados generados para la versión.
4. A continuación se despliegan los carriles más pesados de plataformas y entornos de ejecución: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` y `android`.
5. `openclaw/ci-gate` espera a todos los carriles seleccionados. Las comprobaciones preliminares y de seguridad deben completarse correctamente; los trabajos posteriores solo pueden omitirse cuando el manifiesto no los haya seleccionado. Un carril seleccionado que falle o se cancele provoca que el agregado falle.

El coordinador de fusiones puede reutilizar un resultado autenticado y correcto de `openclaw/ci-gate`
para el mismo encabezado de pull request durante un máximo de 24 horas. Esto evita reescribir una
rama de colaborador tras cambios no relacionados en `main`. El resultado reutilizable no
reemplaza la comprobación independiente y estricta de fusión de prueba, propiedad de la aplicación, con la versión actual de `main`.
Una ejecución posterior pendiente o fallida no elimina un resultado correcto anterior para
ese encabezado sin cambios durante el periodo de vigencia.

El conjunto de reglas de la rama predeterminada requiere la comprobación `openclaw/ci-gate` gestionada por GitHub Actions. Los mantenedores y administradores del repositorio disponen de una omisión de emergencia auditada, destinada únicamente a integraciones directas firmadas mediante avance rápido; el conjunto de reglas de la organización sigue bloqueando la eliminación y las actualizaciones que no sean de avance rápido. Las integraciones normales de pull requests deben seguir usando la puerta de control en lugar de omitir una Pipeline de CI fallida. La comprobación estricta independiente de integración de pruebas, gestionada por la App, sigue vinculando el encabezado con el `main` actual.

GitHub puede marcar como `cancelled` los trabajos de pull requests reemplazados cuando se integra un encabezado más reciente. Esto debe tratarse como ruido de la Pipeline de CI, salvo que también falle la ejecución más reciente del mismo PR. Las ejecuciones canónicas de `main` no se cancelan tras su admisión; cuando llega tráfico de integración, GitHub sustituye únicamente la ejecución pendiente más antigua por el extremo más reciente. Los trabajos de matriz usan `fail-fast: false`, y `build-artifacts` informa directamente de los fallos del canal integrado, del límite de soporte del núcleo y de la supervisión del Gateway, en lugar de poner en cola pequeños trabajos de verificación. La clave de concurrencia automática de la Pipeline de CI está versionada (`CI-v7-*`) para que un proceso zombi de GitHub en un grupo de cola antiguo no pueda bloquear indefinidamente las ejecuciones más recientes de la rama principal. Las ejecuciones manuales de la suite completa usan `CI-manual-v1-*` y no cancelan las ejecuciones en curso. La protección de memoria de inicio de la lista de plugins mantiene un límite de 350 MiB en Linux Blacksmith autoalojado y permite 425 MiB en Linux alojado por GitHub, cuya referencia de RSS es mayor para la misma CLI compilada.

Use `pnpm ci:timings`, `pnpm ci:timings:recent` o `node scripts/ci-run-timings.mjs <run-id>` para resumir el tiempo transcurrido, el tiempo en cola, los trabajos más lentos, los fallos y la barrera de distribución `pnpm-store-warmup` de GitHub Actions. El trabajo `ci-timings-summary` dentro del flujo existe en `ci.yml`, pero actualmente está deshabilitado (`if: false`); ejecute en su lugar el asistente de tiempos localmente. Para consultar los tiempos de compilación, revise el paso `Build dist` del trabajo `build-artifacts`: `pnpm build:ci-artifacts` imprime `[build-all] phase timings:` e incluye `ui:build`; el trabajo también carga el artefacto `startup-memory`.

## Contexto y evidencias del PR

Los PR de colaboradores externos ejecutan una puerta de contexto y evidencias del PR desde
`.github/workflows/real-behavior-proof.yml`. El flujo de trabajo obtiene la revisión de confianza
del flujo de trabajo (`github.workflow_sha`) y evalúa únicamente el cuerpo del PR;
no ejecuta código de la rama del colaborador.

La puerta se aplica a los autores de PR que no sean propietarios, miembros,
colaboradores ni bots del repositorio. Se supera cuando el cuerpo del PR contiene
las secciones `What Problem This Solves` y `Evidence` redactadas por el autor. Las evidencias pueden ser una
prueba específica, un resultado de la Pipeline de CI, una captura de pantalla, una grabación, una salida del terminal,
una observación en vivo, un registro censurado o un enlace a un artefacto. El cuerpo proporciona la intención y una validación útil;
los revisores inspeccionan el código, las pruebas y la Pipeline de CI para evaluar su corrección.

Cuando la comprobación falle, actualice el cuerpo del PR en lugar de enviar otro commit de código.

## Alcance y enrutamiento

La lógica del alcance se encuentra en `scripts/ci-changed-scope.mjs` y está cubierta por pruebas unitarias en `src/scripts/ci-changed-scope.test.ts`. La ejecución manual omite la detección del alcance modificado y hace que el manifiesto de comprobaciones preliminares actúe como si todas las áreas delimitadas hubieran cambiado.

Los flujos de trabajo independientes de Periphery para iOS y macOS aplican una política de cero hallazgos de código muerto. Cada uno se ejecuta únicamente cuando un pull request que no sea borrador modifica su alcance de análisis nativo o cuando se inicia manualmente.

- **Las modificaciones del flujo de trabajo de la Pipeline de CI** validan el grafo de la Pipeline de CI de Node, el análisis de los flujos de trabajo y la vía de Windows (`ci.yml` la ejecuta), pero no fuerzan por sí solas las compilaciones nativas de iOS, Android o macOS; esas vías de plataforma permanecen limitadas a los cambios en el código fuente de la plataforma.
- **Comprobación de integridad del flujo de trabajo** ejecuta `actionlint`, `zizmor` sobre todos los archivos YAML de los flujos de trabajo, la protección de interpolación de acciones compuestas y la protección contra marcadores de conflicto. El trabajo `security-fast`, limitado al PR, también ejecuta `zizmor` sobre los archivos de flujo de trabajo modificados para que los hallazgos de seguridad del flujo de trabajo produzcan un fallo anticipado en el grafo principal de la Pipeline de CI.
- **La documentación en los envíos a `main`** se comprueba mediante el flujo de trabajo independiente `Docs` con el mismo espejo de documentación de ClawHub que usa la Pipeline de CI, para que los envíos mixtos de código y documentación no pongan también en cola el fragmento `check-docs` de la Pipeline de CI. Los pull requests y la Pipeline de CI manual siguen ejecutando `check-docs` desde la Pipeline de CI cuando cambia la documentación.
- **La PTY de la TUI** se ejecuta en el fragmento `checks-node-core-runtime-tui-pty` de Node para Linux cuando hay cambios en la TUI. El fragmento ejecuta `test/vitest/vitest.tui-pty.config.ts` con `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, por lo que cubre tanto la vía determinista de datos de prueba `TuiBackend` como la prueba de humo más lenta `tui --local`, que simula únicamente el punto de conexión externo del modelo.
- **Las modificaciones exclusivamente de enrutamiento de la Pipeline de CI, el pequeño conjunto de datos de prueba del núcleo que la tarea rápida ejecuta directamente y las modificaciones específicas de los asistentes de contratos de plugins** usan una ruta rápida de manifiesto exclusiva de Node: `preflight`, `security-fast` y únicamente las vías rápidas afectadas por el cambio: una sola tarea de enrutamiento de la Pipeline de CI `checks-fast-core`, los dos fragmentos de contratos de plugins o ambos. Esa ruta omite los artefactos de compilación, la compatibilidad con Node 22, los contratos de canales, todos los fragmentos del núcleo, los fragmentos de plugins integrados y las matrices de protección adicionales.
- **Las comprobaciones de Node para Windows** se limitan a los contenedores de procesos y rutas específicos de Windows, los asistentes de ejecución de npm, pnpm y la interfaz de usuario, la configuración del gestor de paquetes y las superficies del flujo de trabajo de la Pipeline de CI que ejecutan esa vía; los cambios no relacionados en el código fuente, los plugins, las pruebas de humo de instalación y exclusivamente las pruebas permanecen en las vías de Node para Linux.

Las familias de pruebas de Node más lentas se dividen o equilibran para que cada trabajo siga siendo pequeño sin reservar ejecutores en exceso:

- Los contratos de Plugin y los contratos de canal se ejecutan cada uno como dos shards ponderados respaldados por Blacksmith, con el fallback estándar al runner de GitHub.
- Las vías rápidas/de soporte de pruebas unitarias del núcleo se ejecutan por separado; la infraestructura del runtime del núcleo se divide en shards de proceso, compartidos, hooks, secretos y tres dominios de cron.
- La respuesta automática se ejecuta mediante workers equilibrados, con el subárbol de respuestas dividido en shards de agent-runner, comandos, dispatch, sesión y enrutamiento de estado.
- Las configuraciones del Gateway/servidor agéntico (plano de control) se dividen entre vías de chat, autenticación, modelo, HTTP/Plugin, runtime e inicio, en lugar de esperar a los artefactos compilados.
- La CI normal empaqueta únicamente los shards aislados de patrones de inclusión de infraestructura en paquetes deterministas de como máximo 64 archivos de prueba, lo que reduce la matriz de Node sin fusionar las suites no aisladas de comandos/cron, agents-core con estado ni Gateway/servidor. Las suites fijas pesadas permanecen en 8 vCPU, mientras que las vías empaquetadas y de menor peso usan 4 vCPU.
- Los pull requests del repositorio canónico reutilizan el resolutor de pruebas modificadas con el diff sintético del árbol fusionado. Los cambios precisos ejecutan un trabajo de Node dirigido; cada archivo de prueba seleccionado obtiene su propio proceso para mantener intacto el aislamiento de las suites con estado. El planificador combina las pruebas hermanas con los elementos dependientes del grafo de importación y recurre al plan compacto existente de suite completa con 14 trabajos para cambios en paquetes del workspace, paquetes/archivo de bloqueo, harness compartido, configuración dividida, elementos renombrados o eliminados, cambios de contratos públicos de extensiones, pruebas con configuración especial de shards, objetivos parcial o nulamente resueltos, planes de rutas u objetivos sobredimensionados y errores del planificador. Los planes dirigidos conservan siempre la puerta completa de límites de artefactos compilados porque sus escáneres del repositorio no se pueden derivar de las importaciones. Las ejecuciones `main` ejecutan la misma suite compacta completa: los eventos de ejecución intermedios pendientes se pueden agrupar, por lo que la ejecución superviviente más reciente debe validar todo el árbol de integración en lugar de solo el diff de su última ejecución individual. Los dispatches manuales y las puertas de publicación conservan la matriz completa con nombres por shard.
- La matriz completa de Node admite primero las herramientas en serie sistemáticamente lentas, los shards de comandos de respuesta automática y el amplio escritor de caché core-fast. Esto mantiene el límite de 28 trabajos y evita que el trabajo de la ruta crítica y la semilla de transformación de la siguiente ejecución se retrasen hasta una oleada posterior.
- Las pruebas generales de navegador, QA, contenido multimedia y Plugins varios usan sus configuraciones de Vitest dedicadas en lugar del comodín compartido de Plugins. Los shards de patrones de inclusión registran entradas de tiempo mediante el nombre del shard de CI, de modo que `.artifacts/vitest-shard-timings.json` pueda distinguir una configuración completa de un shard filtrado.
- Los trabajos de shards de Node en Linux conservan la caché experimental de módulos del sistema de archivos de Vitest mediante la API de caché de Actions proporcionada upstream, que Blacksmith acelera de forma transparente en sus runners. Todos los shards de CI son solo de restauración y descomprimen la semilla protegida en su propia raíz local del runner; después, el wrapper del shard asigna subdirectorios activos distintos a los procesos simultáneos de Vitest. Solo el calentador diario no cancelable o iniciado explícitamente mediante dispatch guarda un nuevo archivo inmutable, por lo que los pull requests no pueden publicar transformaciones ni crear familias de cachés por PR. Una huella de las entradas de transformación descarta las generaciones incompatibles del archivo de bloqueo, los paquetes, tsconfig y la configuración de Vitest. El escritor protegido examina y reduce su caché al 75 % cuando esta supera los 2 GiB. Vitest genera hashes del identificador del módulo, el contenido fuente, el entorno y la configuración de transformación resuelta, por lo que los cambios parciales ordinarios del código fuente mantienen disponibles las entradas sin cambios, mientras que los módulos modificados producen un fallo de caché seguro. Los prefijos generales de restauración conectan las ejecuciones del workflow; las políticas normales de LRU y expulsión por inactividad de la caché de Actions limitan los archivos inmutables antiguos.
- Los trabajos de Node de confianza en Linux también enlazan el almacén de pnpm y `node_modules` desde un único disco de dependencias protegido por cada línea de Node admitida. Los manifiestos de paquetes, los ajustes de instalación, la plataforma del runner y el parche exacto de Node quedan fuera de la clave del disco; una huella exacta del runtime y las entradas de instalación determina si un trabajo reutiliza el árbol o reinstala y actualiza el mismo disco. Los manifiestos se canonicalizan antes de generar el hash. Los hooks raíz directos auditados conservan únicamente los scripts del ciclo de vida de instalación de pnpm, por lo que los cambios de formato y de scripts ordinarios de prueba/compilación mantienen el árbol de dependencias preparado; los cambios no auditados en hooks del ciclo de vida fallan de forma cerrada hasta que sus entradas de origen se incorporan al contrato de huella. Los cambios de dependencias, gestor de paquetes, código fuente de hooks y archivo de bloqueo siempre invalidan la instantánea. Una huella coincidente es necesaria, pero no suficiente: la configuración también comprueba el archivo de importadores y las sumas de comprobación de los manifiestos y, después, verifica las dependencias del archivo de bloqueo respaldadas por el registro y conservadas por postinstall con los manifiestos de paquetes que Node resuelve desde sus importadores. Si el contenido de los importadores falta o está obsoleto, se recurre a una instalación nueva en lugar de proporcionar el hoist raíz. Un pull request cuya instantánea de solo lectura no se pueda utilizar desvincula el workspace e instala en el almacenamiento local del runner, lo que evita escrituras lentas en un clon que no puede publicar. Las instalaciones frías persistentes desactivan los reintentos internos de obtención de pnpm y realizan hasta tres intentos completos de instalación acotados desde el almacén que se prepara progresivamente; un timeout sigue siendo un fallo. Tras una restauración cuyo contenido se haya validado o una instalación con el archivo de bloqueo congelado, la configuración desactiva la comprobación redundante de dependencias de pnpm previa a la ejecución: el repositorio elimina intencionadamente los `node_modules` locales de los Plugins, que pnpm consideraría obsoletos y repararía mediante instalaciones implícitas simultáneas no seguras durante la distribución en shards. La comprobación previa canónica de main es el único escritor y mide el almacén en cada actualización; ejecuta `pnpm store prune` únicamente después de que las versiones retiradas de paquetes lo eleven por encima de 8 GiB. La publicación de instantáneas de Blacksmith es asíncrona incluso después de que termine un trabajo escritor, por lo que la primera ejecución posterior a una clave o huella nueva puede seguir estando fría; las restauraciones posteriores de marcadores exactos con contenido validado constituyen la prueba del despliegue. Los trabajos de CI obligatorios y los pull requests reciben clones desechables, por lo que los cambios de dependencias no crean discos nuevos, instantáneas competidoras ni un bloqueo de caché que pueda cancelar compilaciones.
- Los trabajos de shards de Node y artefactos de compilación también restauran la caché de compilación portátil en disco de Node mediante cachés inmutables de Actions. Los espacios de nombres independientes `test` y `build` evitan que sus escritores sustituyan los archivos del otro: el calentador de pruebas programado es propietario de la semilla de pruebas protegida, mientras que `build-artifacts` puede publicar como máximo un archivo de compilación protegido por día UTC desde ejecuciones de confianza de `main`. Los trabajos de PR y de pruebas ordinarias solo leen instantáneas protegidas, de modo que el bytecode de las ramas de funcionalidades nunca entra en la semilla compartida y el tráfico de PR no crea archivos de caché. Esto reutiliza el bytecode de V8 para la orquestación cargada por Node, las herramientas de compilación y las dependencias externas entre distintas rutas de checkout, incluso cuando solo cambia una parte del grafo de código fuente. Los procesos secundarios de Vitest desactivan una caché de compilación heredada porque la cobertura puede activarse dentro de configuraciones dinámicas y la cobertura de V8 puede perder precisión en la posición del código fuente cuando los scripts se deserializan desde bytecode.
- El trabajo de artefactos de compilación también conserva las salidas de pasos `build-all` con huellas de contenido. Las declaraciones del SDK de Plugins compiladas por la propia CI generan un hash del grafo completo de código fuente TypeScript/JSON propiedad del repositorio, excluyen los directorios instalados y generados y restauran tanto las declaraciones planas como los puentes de paquetes después de que `tsdown` borre `dist`. Los cambios en documentación, workflows, Plugins y otros elementos fuera de ese grafo pueden reutilizar la instantánea de declaraciones; los cambios en el código fuente la recompilan antes de ejecutar la puerta de exportación.
- Las compilaciones completas de declaraciones dividen `tsdown` en grupos de IA, paquetes del workspace y unificado. Cada grupo almacena en caché solo las declaraciones y, después, sigue recompilando el JavaScript del runtime antes de restaurarlas. Por tanto, los cambios del núcleo o de Plugins solo invalidan el gran grafo unificado, mientras que los cambios de paquetes del workspace invalidan de forma conservadora todos los grupos de declaraciones dependientes. Las compilaciones públicas completas suelen usar una caché inmutable de Actions; las claves generales de restauración preparan los cambios parciales, las huellas de contenido por grupo rechazan los datos obsoletos y la cuota de caché de GitHub expulsa las generaciones antiguas. En cambio, la vía semanal de Node 22 publica un artefacto de 14 días después de ejecuciones correctas de `main` y restaura únicamente los artefactos cuya identidad inmutable de productor se resuelve a ese workflow en `main`, lo que evita la rotación de la cuota sin permitir que el código de los PR escriba en una caché compartida. Las declaraciones de QA privada nunca se conservan en cachés de Actions porque los espacios de nombres de caché no son límites de confidencialidad.
- `check-additional-*` distribuye en franjas la lista complementaria de protecciones de límites (`scripts/run-additional-boundary-checks.mjs`) entre un shard con uso intensivo de prompts (`check-additional-boundaries-a`, que incluye la comprobación de desviaciones de instantáneas de prompts de Codex) y un shard combinado para las franjas restantes (`check-additional-boundaries-bcd`); cada uno ejecuta protecciones independientes simultáneamente e imprime los tiempos de cada comprobación. El trabajo de compilación/canary de límites de paquetes permanece unido y la arquitectura de topología del runtime se ejecuta por separado de la cobertura de observación del Gateway integrada en `build-artifacts`.
- En el runner de compilación autoalojado de 32 vCPU, la observación del Gateway, las pruebas de canales y el shard de límites de soporte del núcleo se inician juntos dentro de `build-artifacts` después de que `dist/` y `dist-runtime/` ya estén compilados. Las ejecuciones de fallback alojadas en GitHub mantienen en serie la observación del Gateway para evitar que la contención con pocos núcleos consuma su plazo de disponibilidad.

Una vez admitida, la CI canónica de Linux permite hasta 28 trabajos simultáneos de pruebas de Node y
12 para las vías rápidas/de comprobación más pequeñas; Windows y Android se mantienen en dos porque
esos grupos de runners son más limitados. Los lotes compactos de configuraciones completas se ejecutan con un
timeout de lote de 120 minutos, mientras que los grupos de patrones de inclusión comparten el mismo
presupuesto de trabajo acotado.

La CI de Android ejecuta tanto `testPlayDebugUnitTest` como `testThirdPartyDebugUnitTest` y después compila el APK de depuración Play. La variante de terceros no tiene un conjunto de código fuente ni un manifiesto independientes; su vía de pruebas unitarias sigue compilando la variante con los indicadores BuildConfig de SMS/registro de llamadas, a la vez que evita un trabajo duplicado de empaquetado del APK de depuración en cada ejecución pertinente para Android. Cada tarea actual de Gradle tiene un disco persistente protegido; los trabajos de PR usan clones desechables, mientras que las ejecuciones protegidas actualizan in situ las entradas de Gradle direccionadas por contenido.

Las claves de discos persistentes de Blacksmith están deliberadamente limitadas por las dimensiones admitidas del runtime o de las tareas, nunca por el número de PR, commit, ejecución, rama o hash de dependencias. Las cachés de transformación y compilación del runtime usan la caché de Actions en lugar de discos persistentes porque los archivos inmutables ofrecen resultados verificables de restauración/guardado y evitan fallos de promoción de instantáneas mutables. Tras una migración de versión de una clave persistente, se deben añadir únicamente las identidades exactas de clave, arquitectura y región obsoletas a `.github/retired-sticky-disks.json`, iniciar mediante dispatch `Sticky Disk Cleanup` desde `main` con las mismas dimensiones y confirmación, verificar la eliminación y, después, retirar esas entradas. El workflow dirige las identidades ARM a un runner ARM, rechaza las discrepancias de región del runner, usa la acción de eliminación por clave exacta de Blacksmith y nunca elimina cachés de constructores Docker ni prefijos comodín. Los archivos de caché de Actions usan las políticas normales de LRU y expulsión por inactividad.

El shard `check-dependencies` ejecuta las comprobaciones de producción de Knip para dependencias, archivos sin usar y exportaciones sin usar. La protección de archivos sin usar falla cuando un PR añade un archivo nuevo sin usar y no revisado o conserva una entrada obsoleta en la lista de permitidos, a la vez que preserva las superficies intencionadas de Plugins dinámicos, elementos generados, compilación, pruebas en vivo y puentes de paquetes que Knip no puede resolver de forma estática. La protección de exportaciones sin usar excluye los archivos de soporte de pruebas y falla con cada exportación de producción sin usar; los consumidores dinámicos intencionados deben modelarse en `config/knip.config.ts`. Los objetivos históricos ejecutan la protección de exportaciones cuando la proporcionan y, de lo contrario, conservan su fallback anterior de código muerto.

## Reenvío de actividad de ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` es el puente del lado de destino que conecta la actividad del repositorio de OpenClaw con ClawSweeper. No descarga ni ejecuta código no confiable de pull requests. El flujo de trabajo crea un token de aplicación de GitHub a partir de `CLAWSWEEPER_APP_PRIVATE_KEY` y, a continuación, envía cargas útiles compactas de `repository_dispatch` a `openclaw/clawsweeper`.

El flujo de trabajo tiene cuatro vías:

- `clawsweeper_item` para solicitudes específicas de revisión de incidencias y pull requests;
- `clawsweeper_comment` para comandos explícitos de ClawSweeper en comentarios de incidencias;
- `clawsweeper_commit_review` para solicitudes de revisión a nivel de commit en envíos de `main`;
- `github_activity` para actividad general de GitHub que el agente ClawSweeper puede inspeccionar.

La vía `github_activity` reenvía únicamente metadatos normalizados: tipo de evento, acción, actor, repositorio, número del elemento, URL, título, estado y extractos breves de comentarios o revisiones cuando están presentes. Evita intencionadamente reenviar el cuerpo completo del Webhook. El flujo de trabajo receptor en `openclaw/clawsweeper` es `.github/workflows/github-activity.yml`, que publica el evento normalizado en el hook del Gateway de OpenClaw para el agente ClawSweeper.

La actividad general es para observación, no para entrega predeterminada. El agente ClawSweeper recibe el destino de Discord en su prompt y solo debe publicar en `#clawsweeper` cuando el evento sea sorprendente, requiera alguna acción, implique un riesgo o resulte útil para las operaciones. Las aperturas y modificaciones rutinarias, la actividad recurrente de bots, el ruido de Webhooks duplicados y el tráfico normal de revisiones deben dar como resultado `NO_REPLY`.

Se deben tratar los títulos, comentarios, cuerpos, textos de revisiones, nombres de ramas y mensajes de commits de GitHub como datos no confiables en todo este recorrido. Son datos de entrada para el resumen y el triaje, no instrucciones para el flujo de trabajo ni para el entorno de ejecución del agente.

## Ejecuciones manuales

Las ejecuciones manuales de CI utilizan el mismo grafo de trabajos que la CI normal, pero activan todas las vías con ámbito distinto de Android: fragmentos de Node en Linux, fragmentos de plugins incluidos, fragmentos de contratos de plugins y canales, compatibilidad con Node 22, `check-*`, `check-additional-*`, comprobaciones rápidas de artefactos compilados, comprobaciones de documentación, Skills de Python, Windows, macOS, compilación de iOS e i18n de la interfaz de control y de la aplicación nativa. Los pull requests automáticos de código fuente verifican el inventario de extracción nativa y la seguridad de la localización de Android y Apple sin exigir resultados traducidos o generados por la plataforma en el mismo pull request. El flujo de trabajo serializado de actualización de configuraciones regionales de aplicaciones nativas vuelve a generar esos artefactos en un único pull request aislado y habilita la fusión automática del commit exacto después de que se superen las comprobaciones obligatorias. La paridad nativa completa sigue siendo obligatoria para los pull requests de artefactos generados, la CI manual, la validación completa de la versión y la preparación de versiones. La paridad de configuraciones regionales de la interfaz de control sigue siendo informativa en los pull requests automáticos y en las ejecuciones de `main`, y obligatoria en la CI manual y de versiones. Las ejecuciones manuales independientes de CI solo ejecutan Android con `include_android=true` (la entrada `release_gate` también fuerza Android); el flujo general de publicación completa habilita Android pasando `include_android=true`. Las comprobaciones estáticas de prepublicación de plugins, el fragmento `agentic-plugins` exclusivo de publicaciones, el barrido completo por lotes de extensiones y las vías de Docker para la prepublicación de plugins quedan excluidos de la CI. El conjunto de prepublicación de Docker solo se ejecuta cuando `Full Release Validation` inicia el flujo de trabajo independiente `Plugin Prerelease` con la puerta de validación de la publicación habilitada.

Las comprobaciones del máximo de líneas de los pull requests derivan la referencia base del árbol de fusión sintético descargado y verifican su commit padre principal con respecto al commit principal del evento. Las ejecuciones manuales utilizan un grupo de simultaneidad único para que otra ejecución de un envío o pull request en la misma referencia no cancele un conjunto completo de pruebas de una versión candidata. La entrada opcional `target_ref` permite que un invocador confiable ejecute ese grafo en una rama, etiqueta o SHA completo de commit mientras utiliza el archivo del flujo de trabajo de la referencia de ejecución seleccionada; la referencia base del máximo de líneas se compara con la base de fusión del destino respecto al commit principal de la rama predeterminada resuelto para esa ejecución. La entrada `release_gate` es una alternativa de mantenimiento mediante SHA exacto para la CI de pull requests bloqueada por falta de capacidad: exige que `target_ref` sea un SHA completo de commit que coincida con el commit principal de la rama ejecutada y que `pull_request_number` identifique el pull request abierto cuyo árbol de fusión se valida.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

La ruta mensual de estabilidad extendida exclusiva de npm es la excepción: se deben ejecutar tanto la comprobación previa `OpenClaw NPM
Release` como `Full Release Validation` desde la rama exacta
`extended-stable/YYYY.M.33`, conservar los identificadores de sus ejecuciones y pasar ambos identificadores a la
ejecución de publicación directa en npm. Consulte [Publicación mensual de estabilidad extendida
exclusiva de npm](/es/reference/RELEASING#monthly-npm-only-extended-stable-publication) para conocer
los comandos, los requisitos exactos de identidad, la lectura de comprobación del registro y el procedimiento
de reparación del selector. Esta ruta no inicia la publicación de plugins, macOS, Windows, GitHub
Release, etiquetas de distribución privadas ni otras plataformas.

## Ejecutores

| Ejecutor                        | Trabajos                                                                                                                                                                                                                                                                          |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | `security-fast`, ejecución manual de CI y alternativas para repositorios no canónicos, agregado de QA Smoke, análisis de seguridad y calidad de CodeQL, validación de flujos de trabajo, etiquetador, respuesta automática, flujo de trabajo independiente de documentación y flujo de trabajo completo de comprobación rápida de instalación |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `pnpm-store-warmup`, `native-i18n`, `checks-fast-core` excepto la CI de QA Smoke, fragmentos de contratos de plugins y canales, la mayoría de los fragmentos de Node en Linux incluidos o de menor peso, vías de `check-*` excepto `check-lint`, fragmentos seleccionados de `check-additional-*`, `check-docs` y `skills-python` |
| `blacksmith-8vcpu-ubuntu-2404`  | Conjuntos pesados conservados de Node en Linux, fragmentos de `check-additional-*` con uso intensivo de límites o extensiones y `android`                                                                                                                                         |
| `blacksmith-16vcpu-ubuntu-2404` | Fragmentos automáticos de CI de QA Smoke, `build-artifacts` en CI y Testbox, y `check-lint` (con suficiente sensibilidad a la CPU como para que 8 vCPU costaran más de lo que ahorraban)                                                                                              |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                  |
| `blacksmith-6vcpu-macos-15`     | `macos-node` en `openclaw/openclaw`; las bifurcaciones recurren a `macos-15`                                                                                                                                                                                                     |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` y `ios-build` en `openclaw/openclaw`; las bifurcaciones recurren a `macos-26`                                                                                                                                                                                |

## Presupuesto de registro de ejecutores

El conjunto actual de registros de ejecutores de GitHub de OpenClaw indica 10,000 registros de ejecutores autohospedados
cada 5 minutos en `ghx api rate_limit`. Se debe volver a comprobar
`actions_runner_registration` antes de cada ajuste porque GitHub puede cambiar
este conjunto. El límite se comparte entre todos los registros de ejecutores de Blacksmith en la
organización `openclaw`, por lo que añadir otra instalación de Blacksmith no añade
un conjunto nuevo.

Las etiquetas de Blacksmith deben tratarse como el recurso escaso para controlar las ráfagas. Los trabajos que
solo enrutan, notifican, resumen, seleccionan fragmentos o ejecutan análisis breves de CodeQL deben
permanecer en ejecutores alojados en GitHub, salvo que tengan necesidades específicas de Blacksmith
comprobadas mediante mediciones. Cualquier nueva matriz de Blacksmith, un `max-parallel` mayor
o un flujo de trabajo de alta frecuencia debe mostrar su cantidad de registros en el peor caso y mantener el
objetivo de toda la organización por debajo de aproximadamente el 60% del conjunto activo. Con el conjunto actual de
10,000 registros, esto supone un objetivo operativo de 6,000 registros, lo que deja margen para
repositorios simultáneos, reintentos y solapamientos de ráfagas.

El plan de pull requests dirigido a los destinos modificados reduce la ráfaga habitual de pruebas de Node de 14 registros de Blacksmith a uno. Los pull requests de riesgo amplio conservan la alternativa compacta de 14 registros, por lo que el peor caso no aumenta.

La CI del repositorio canónico mantiene Blacksmith como ruta predeterminada del ejecutor para las ejecuciones normales de envíos y pull requests. `workflow_dispatch` y las ejecuciones de repositorios no canónicos utilizan ejecutores alojados en GitHub, pero actualmente las ejecuciones normales del repositorio canónico no comprueban el estado de la cola de Blacksmith ni recurren automáticamente a etiquetas alojadas en GitHub cuando Blacksmith no está disponible.

## Límites progresivos de superficies

Dos presupuestos que solo pueden reducirse protegen la superficie de configuración. Ambos hacen que la CI falle si aumentan
hasta que el archivo de presupuesto se actualice deliberadamente en el mismo pull request, y ambos exigen una
reducción del límite cuando una limpieza disminuye la cantidad real.

- `config/env-var-count-budget.txt` limita el número de nombres distintos de `OPENCLAW_*`
  en el código fuente de producción bajo `src/`, `packages/` y `extensions/`
  (se excluyen las pruebas y QA Lab). Lo comprueba `node scripts/check-env-var-count.mjs`.
  Al eliminar variables de entorno: reduzca el número en el mismo pull request. Añadir una es una
  decisión sobre la superficie de configuración; justifíquela en el cuerpo del pull request.
- `docs/.generated/config-baseline.counts.json` limita por tipo
  (núcleo/canal/plugin) la cantidad de entradas del esquema `openclaw.json`. Lo comprueba
  `pnpm config:docs:check`; vuelva a generarlo con `pnpm config:docs:gen` después de cualquier
  cambio en el esquema.

## Equivalentes locales

```bash
pnpm changed:lanes                            # inspecciona el clasificador local de carriles modificados para origin/main...HEAD
pnpm check:changed                            # puerta de comprobación local inteligente: formato/typecheck/lint/guardas modificados por carril de límites
pnpm check                                    # puerta local rápida: tsgo de producción + lint fragmentado + guardas rápidas en paralelo
pnpm check:test-types
pnpm check:timed                              # la misma puerta con tiempos por etapa
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1 node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts
pnpm test                                     # pruebas de vitest
pnpm test:changed                             # objetivos Vitest modificados, económicos e inteligentes
pnpm test:ui                                  # conjunto de pruebas unitarias/de navegador de la interfaz de control
pnpm ui:i18n:check                            # paridad de configuraciones regionales generadas de la interfaz de control (puerta de lanzamiento)
pnpm native:i18n:baseline                     # actualiza el inventario de extracción nativa propiedad del código fuente
pnpm native:i18n:verify                       # inventario del código fuente + seguridad de localización de Android/Apple
pnpm native:i18n:check                        # paridad estricta traducida/generada por plataforma (puerta de lanzamiento)
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # formato de la documentación + lint + enlaces rotos
pnpm build                                    # compila dist cuando importan las comprobaciones de artefactos/smoke de CI
pnpm ios:build                                # genera y compila el proyecto de la aplicación iOS
pnpm ci:timings                               # resume la ejecución de CI más reciente del push a origin/main
pnpm ci:timings:recent                        # compara ejecuciones recientes correctas de CI de main
node scripts/ci-run-timings.mjs <run-id>      # resume el tiempo transcurrido, el tiempo en cola y los trabajos más lentos
node scripts/ci-run-timings.mjs --latest-main # ignora el ruido de incidencias/comentarios y elige el CI del push a origin/main
node scripts/ci-run-timings.mjs --recent 10   # compara ejecuciones recientes correctas de CI de main
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm test:startup:memory
pnpm test:extensions:memory -- --json .artifacts/openclaw-performance/source/mock-provider/extension-memory.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## Rendimiento de OpenClaw

`OpenClaw Performance` es el flujo de trabajo de rendimiento del producto/runtime. Se ejecuta diariamente en `main` y puede iniciarse manualmente:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

La ejecución manual normalmente evalúa el rendimiento de la referencia del flujo de trabajo. Establezca `target_ref` para evaluar una etiqueta de lanzamiento u otra rama con la implementación actual del flujo de trabajo. Las rutas de los informes publicados y los punteros más recientes se indexan por la referencia probada, y cada `index.md` registra la referencia/SHA probada, la referencia/SHA del flujo de trabajo, la referencia de Kova, el perfil, el modo de autenticación del carril, el modelo, el número de repeticiones y los filtros de escenarios.

El flujo de trabajo instala OCM desde una versión fijada y Kova desde `openclaw/Kova` en la entrada fijada `kova_ref`, y después ejecuta tres carriles:

- `mock-provider`: escenarios de diagnóstico de Kova contra un runtime de compilación local con autenticación falsa determinista compatible con OpenAI.
- `mock-deep-profile`: generación de perfiles de CPU/heap/trazas para puntos críticos del inicio, el Gateway y los turnos del agente. Se ejecuta según la programación o, al iniciarse manualmente, con `deep_profile=true`.
- `live-openai-candidate`: un turno real del agente `openai/gpt-5.6-luna` de OpenAI, omitido cuando `OPENAI_API_KEY` no está disponible. Se ejecuta según la programación o, al iniciarse manualmente, con `live_openai_candidate=true`.

El carril del proveedor simulado también ejecuta sondas nativas del código fuente de OpenClaw después de la pasada de Kova: tiempo de arranque y memoria del Gateway en casos de inicio predeterminado, con canal omitido, con hook interno y con cincuenta plugins; RSS de importación de plugins incluidos, bucles repetidos de saludo `channel-chat-baseline` con OpenAI simulado, comandos de inicio de la CLI contra el Gateway arrancado y la sonda de rendimiento smoke del estado de SQLite. Cuando el informe anterior publicado del código fuente del proveedor simulado está disponible para la referencia probada, el resumen del código fuente compara los valores actuales de RSS y heap con esa línea base y marca los aumentos grandes de RSS como `watch`. El resumen Markdown de las sondas del código fuente se encuentra en `source/index.md` dentro del paquete del informe, junto al JSON sin procesar.

Cada carril carga su artefacto completo de GitHub, incluidos los paquetes comprimidos de diagnóstico, CPU, heap y trazas. Un trabajo publicador independiente descarga y valida esos artefactos; después genera un token de corta duración de la GitHub App de ClawSweeper, limitado únicamente al contenido de `openclaw/clawgrit-reports`, y lo pasa exclusivamente al paso de Git push. Confirma `report.json`, `report.md`, `index.md`, los artefactos de las sondas del código fuente y los metadatos/sumas de comprobación del paquete bajo `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`; el archivo de diagnóstico completo permanece en el artefacto de Actions enlazado. El publicador rechaza cualquier archivo de informe que supere 50 MB antes de intentar un push. El puntero actual de la referencia probada es `openclaw-performance/<tested-ref>/latest-<lane>.json`. Las ejecuciones programadas y las ejecuciones manuales `profile=release` fallan si falla la creación del token de la aplicación o la publicación del informe. Las ejecuciones manuales que no son de lanzamiento mantienen la publicación como orientativa y conservan los artefactos de GitHub cuando falla la autenticación o la publicación. La línea base anterior del código fuente se obtiene de forma anónima desde el repositorio público de informes, por lo que obtenerla correctamente no demuestra la autenticación del publicador.

## Validación completa del lanzamiento

`Full Release Validation` es el flujo de trabajo general manual para «ejecutarlo todo antes del lanzamiento». Acepta una rama, una etiqueta o un SHA de commit completo; inicia el flujo de trabajo manual `CI` con ese objetivo (incluido Android), inicia `Plugin Prerelease` para las pruebas exclusivas de lanzamiento de plugins/paquetes/estáticas/Docker, inicia `OpenClaw Performance` contra el SHA objetivo e inicia `OpenClaw Release Checks` para las pruebas smoke de instalación, la aceptación de paquetes, las comprobaciones de paquetes entre sistemas operativos, la paridad de QA Lab, Matrix, Telegram y los carriles sujetos a puerta de Discord, WhatsApp y Slack (la representación orientativa de la tarjeta de puntuación de madurez es opcional mediante `run_maturity_scorecard`). Los perfiles estable y completo siempre incluyen cobertura exhaustiva en vivo/E2E y de pruebas prolongadas de la ruta de lanzamiento de Docker; el perfil beta puede activarla con `run_release_soak=true`. La E2E canónica de Telegram para paquetes se ejecuta dentro de la aceptación de paquetes, por lo que un candidato completo no inicia un sondeador en vivo duplicado. Después de publicar, pase `release_package_spec` para reutilizar el paquete npm distribuido en las comprobaciones de lanzamiento, la aceptación de paquetes, Docker, las comprobaciones entre sistemas operativos y Telegram sin volver a compilar. Use `npm_telegram_package_spec` únicamente para repetir de forma específica la prueba de Telegram del paquete publicado. El carril del paquete en vivo del plugin de Codex usa de manera predeterminada el mismo estado seleccionado: el `release_package_spec=openclaw@<tag>` publicado deriva `codex_plugin_spec=npm:@openclaw/codex@<tag>`, mientras que las ejecuciones de SHA/artefacto empaquetan `extensions/codex` desde la referencia seleccionada. Establezca `codex_plugin_spec` explícitamente para fuentes personalizadas del plugin, como las especificaciones `npm:`, `npm-pack:` o `git:`. Su prueba de agente en vivo envía progreso visible, continúa con lecturas aleatorias del espacio de trabajo y una escritura exacta del artefacto, y después envía la finalización.

Consulte [Validación completa del lanzamiento](/es/reference/full-release-validation) para conocer la
matriz de etapas, los nombres exactos de los trabajos del flujo de trabajo, las diferencias entre perfiles, los artefactos y los
identificadores para repeticiones específicas.

`OpenClaw Release Publish` es el flujo de trabajo manual de lanzamiento con mutaciones. Inicie
las publicaciones beta y estables habituales desde el `main` de confianza después de que exista la etiqueta de lanzamiento
y de que la comprobación previa de npm de OpenClaw haya finalizado correctamente (la comprobación previa ejecuta
`pnpm plugins:sync:check` entre sus comprobaciones). La etiqueta sigue seleccionando el
commit exacto del lanzamiento, incluido un commit en `release/YYYY.M.PATCH`; las publicaciones alfa
de Tideclaw siguen utilizando su rama alfa correspondiente. Requiere el
`preflight_run_id` guardado y un
`full_release_validation_run_id` correcto junto con su
`full_release_validation_run_attempt` exacto, inicia `Plugin NPM Release` para todos
los paquetes de plugins publicables, inicia `Plugin ClawHub Release` para el mismo
SHA de lanzamiento y solo entonces inicia `OpenClaw NPM Release`. La publicación estable también
requiere un `windows_node_tag` exacto; el flujo de trabajo verifica la versión
del código fuente para Windows y compara sus instaladores x64/ARM64 con la entrada
`windows_node_installer_digests` aprobada para el candidato antes de cualquier flujo hijo de publicación; después promociona
y verifica los mismos resúmenes fijados de los instaladores, además del contrato exacto
del recurso complementario y su suma de comprobación, antes de publicar el borrador del lanzamiento de GitHub.
Las reparaciones específicas exclusivas de plugins usan `plugin_publish_scope=selected` con una lista
de paquetes no vacía. Las ejecuciones `all-publishable` exclusivas de plugins requieren las mismas
pruebas inmutables de la comprobación previa de npm y de la validación completa del lanzamiento que una publicación del núcleo.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=beta
```

Para probar un commit fijado en una rama que cambia rápidamente, use el asistente en lugar de
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Las referencias para iniciar flujos de trabajo de GitHub deben ser ramas o etiquetas, no SHA de commits sin procesar. El
asistente envía una rama temporal `release-ci/<sha>-...` en un SHA de flujo de trabajo
`main` de confianza, pasa el SHA objetivo solicitado mediante la entrada `ref` del flujo de trabajo,
reutiliza pruebas estrictas del objetivo exacto cuando están disponibles, verifica que el
`headSha` de cada flujo de trabajo hijo coincida con el SHA del flujo de trabajo de confianza y elimina la rama temporal
cuando finaliza la ejecución. Pase `-f reuse_evidence=false` para forzar una
validación nueva. El verificador general también falla si algún flujo de trabajo hijo se ejecutó con un
SHA de flujo de trabajo diferente.

`release_profile` controla la amplitud de las pruebas en vivo/de proveedores que se pasa a las comprobaciones de lanzamiento. Los
flujos de trabajo manuales de lanzamiento usan de manera predeterminada `stable`; utilice `full` únicamente cuando
se desee intencionadamente la amplia matriz orientativa de proveedores/medios. Las comprobaciones
de lanzamientos estables y completos siempre ejecutan las pruebas exhaustivas en vivo/E2E y las pruebas prolongadas
de la ruta de lanzamiento de Docker; el perfil beta puede activarlas con `run_release_soak=true`.

- `beta` conserva los carriles más rápidos de OpenAI/núcleo críticos para el lanzamiento.
- `stable` añade el conjunto estable de proveedores/backends.
- `full` ejecuta la amplia matriz orientativa de proveedores/medios.

El flujo general registra los identificadores de las ejecuciones hijas iniciadas, y el trabajo final `Verify full validation` vuelve a comprobar las conclusiones actuales de las ejecuciones hijas y añade tablas de los trabajos más lentos de cada ejecución hija. Si un flujo de trabajo hijo se vuelve a ejecutar y pasa a correcto, vuelva a ejecutar únicamente el trabajo verificador principal para actualizar el resultado general y el resumen de tiempos.

Para la recuperación, tanto `Full Release Validation` como `OpenClaw Release Checks` aceptan `rerun_group`. Use `all` para un candidato de lanzamiento, `ci` solo para el proceso hijo normal de CI completa, `plugin-prerelease` solo para el proceso hijo de prelanzamiento de plugins, `performance` solo para el proceso hijo de rendimiento de OpenClaw, `release-checks` para todos los procesos hijos de lanzamiento, o un grupo más específico: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` o `npm-telegram` en el flujo general. Esto mantiene acotada la repetición de una máquina de lanzamiento fallida después de una corrección específica. Para una sola vía fallida entre sistemas operativos, combine `rerun_group=cross-os` con `cross_os_suite_filter`, por ejemplo, `windows/packaged-upgrade`; los comandos largos entre sistemas operativos emiten líneas de Heartbeat y los resúmenes de actualización de paquetes incluyen tiempos por fase. Las vías seleccionadas de control de calidad de Matrix y Telegram bloquean la validación normal del lanzamiento, al igual que la comprobación estándar de cobertura de herramientas del entorno de ejecución. La paridad del control de calidad, la paridad del entorno de ejecución y las vías en vivo controladas de Discord, WhatsApp y Slack son informativas.

`OpenClaw Release Checks` usa la referencia de flujo de trabajo de confianza para resolver una vez la referencia seleccionada en un archivo tar `release-package-under-test` y, a continuación, pasa ese artefacto a las comprobaciones entre sistemas operativos y a la aceptación de paquetes, además del flujo de trabajo de Docker de la ruta de lanzamiento en vivo/E2E cuando se ejecuta la cobertura prolongada. Esto mantiene la uniformidad de los bytes del paquete entre las máquinas de lanzamiento y evita volver a empaquetar el mismo candidato en varios trabajos hijos. Para la vía en vivo del plugin npm de Codex, las comprobaciones de lanzamiento pasan una especificación de plugin publicada coincidente derivada de `release_package_spec`, pasan `codex_plugin_spec` proporcionado por el operador o dejan la entrada en blanco para que el script de Docker empaquete el plugin de Codex del checkout seleccionado.

Las ejecuciones duplicadas de `Full Release Validation` para `ref=main` y `rerun_group=all`
sustituyen al flujo general anterior. El monitor principal cancela cualquier flujo de trabajo hijo que
ya haya iniciado cuando se cancela el principal, por lo que una validación de main más reciente
no queda detrás de una ejecución obsoleta de comprobaciones de lanzamiento de dos horas. La validación de ramas/etiquetas
de lanzamiento y los grupos de repetición específicos conservan `cancel-in-progress: false`.

## Fragmentos en vivo y E2E

El proceso hijo en vivo/E2E del lanzamiento conserva una amplia cobertura nativa de `pnpm test:live`, pero la ejecuta como fragmentos con nombre mediante `scripts/test-live-shard.mjs` en lugar de un único trabajo en serie:

- `native-live-src-agents` y `native-live-src-agents-zai-coding`
- `native-live-src-gateway-core`
- trabajos de `native-live-src-gateway-profiles` filtrados por proveedor
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

Esto conserva la misma cobertura de archivos y facilita la repetición y el diagnóstico de los fallos lentos de proveedores en vivo. Los nombres de fragmentos agregados `native-live-src-gateway`, `native-live-extensions-o-z`, `native-live-extensions-media` y `native-live-extensions-media-music` siguen siendo válidos para repeticiones manuales únicas.

Los fragmentos multimedia nativos en vivo se ejecutan en `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, que genera el flujo de trabajo `Live Media Runner Image`. Esa imagen preinstala `ffmpeg` y `ffprobe`; los trabajos multimedia solo verifican los binarios antes de la configuración. Mantenga los conjuntos de pruebas en vivo respaldados por Docker en ejecutores normales de Blacksmith: los trabajos en contenedores no son el lugar adecuado para iniciar pruebas de Docker anidadas.

Los fragmentos de modelos/backends en vivo respaldados por Docker usan una imagen `ghcr.io/openclaw/openclaw-live-test:<sha>-<extensions>` compartida e independiente para cada commit seleccionado. El flujo de trabajo de lanzamiento en vivo genera y publica esa imagen una vez y, a continuación, los fragmentos de modelo en vivo de Docker, Gateway dividido por proveedores, backend de CLI, enlace de ACP y arnés de Codex se ejecutan con `OPENCLAW_SKIP_DOCKER_BUILD=1`. Los fragmentos de Docker de Gateway incluyen límites explícitos `timeout` en el nivel de script, inferiores al tiempo de espera del trabajo del flujo, para que un contenedor o una ruta de limpieza bloqueados fallen rápidamente en lugar de consumir todo el presupuesto de comprobaciones del lanzamiento. Si esos fragmentos vuelven a generar de forma independiente el destino completo de Docker desde el código fuente, la ejecución del lanzamiento está mal configurada y desperdiciará tiempo real en compilaciones de imágenes duplicadas.

## Aceptación de paquetes

Use `Package Acceptance` cuando la pregunta sea «¿funciona como producto este paquete instalable de OpenClaw?». Es diferente de la CI normal: la CI normal valida el árbol de fuentes, mientras que la aceptación de paquetes valida un único archivo tar mediante el mismo arnés E2E de Docker que utilizan los usuarios después de una instalación o actualización.

### Trabajos

1. `resolve_package` hace checkout de `workflow_ref`, resuelve un candidato de paquete, escribe `.artifacts/docker-e2e-package/openclaw-current.tgz`, escribe `.artifacts/docker-e2e-package/package-candidate.json`, carga ambos como el artefacto `package-under-test` e imprime el origen, la referencia del flujo de trabajo, la referencia del paquete, la versión, el SHA-256 y el perfil en el resumen del paso de GitHub.
2. `package_integrity` descarga el artefacto `package-under-test` y aplica el contrato público del archivo tar del paquete mediante `scripts/check-openclaw-package-tarball.mjs`.
3. `docker_acceptance` llama a `openclaw-live-and-e2e-checks-reusable.yml` con el SHA de origen del paquete resuelto (con `workflow_ref` como alternativa) y `package_artifact_name=package-under-test`. El flujo de trabajo reutilizable descarga ese artefacto, valida el inventario del archivo tar, prepara imágenes de Docker basadas en el resumen del paquete cuando es necesario y ejecuta las vías de Docker seleccionadas con ese paquete en lugar de empaquetar el checkout del flujo de trabajo. Cuando un perfil selecciona varios `docker_lanes` específicos, el flujo de trabajo reutilizable prepara una vez el paquete y las imágenes compartidas y, a continuación, distribuye esas vías como trabajos de Docker específicos en paralelo con artefactos únicos.
4. `package_telegram` llama opcionalmente a `NPM Telegram Beta E2E`. Se ejecuta cuando `telegram_mode` no es `none` e instala el mismo artefacto `package-under-test` cuando la aceptación de paquetes ha resuelto uno; una ejecución independiente de Telegram aún puede instalar una especificación npm publicada.
5. `summary` hace que el flujo de trabajo falle si fallan la resolución del paquete, la integridad, la aceptación de Docker o la vía opcional de Telegram. La entrada `advisory` reduce los fallos de aceptación a advertencias para los invocadores informativos.

### Orígenes de candidatos

- `source=npm` acepta únicamente `openclaw@extended-stable`, `openclaw@beta`, `openclaw@latest` o una versión exacta de lanzamiento de OpenClaw, como `openclaw@2026.4.27-beta.2`. Use esta opción para la aceptación de versiones de soporte estable extendido publicadas, prelanzamientos o versiones estables.
- `source=ref` empaqueta una rama, etiqueta o SHA de commit completo `package_ref` de confianza. El solucionador obtiene las ramas/etiquetas de OpenClaw, verifica que el commit seleccionado sea accesible desde el historial de ramas del repositorio o desde una etiqueta de lanzamiento, instala las dependencias en un árbol de trabajo separado y lo empaqueta con `scripts/package-openclaw-for-docker.mjs`.
- `source=url` descarga un `.tgz` HTTPS público; se requiere `package_sha256`. Esta ruta rechaza credenciales en la URL, puertos HTTPS no predeterminados, nombres de host o direcciones IP resueltas privados, internos o de uso especial, y redirecciones que no cumplan la misma política de seguridad pública.
- `source=trusted-url` descarga un `.tgz` HTTPS desde una política de origen de confianza con nombre en `.github/package-trusted-sources.json`; se requieren `package_sha256` y `trusted_source_id`. Use esta opción solo para espejos empresariales propiedad de los responsables de mantenimiento o repositorios privados de paquetes que necesiten hosts, puertos, prefijos de ruta, hosts de redirección o resolución en redes privadas configurados. Si la política declara autenticación mediante token de portador, el flujo de trabajo usa el secreto fijo `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; las credenciales incluidas en la URL siguen rechazándose.
- `source=artifact` descarga un `.tgz` desde `artifact_run_id` y `artifact_name`; `package_sha256` es opcional, pero debe proporcionarse para artefactos compartidos externamente.

Mantenga `workflow_ref` y `package_ref` separados. `workflow_ref` es el código de confianza del flujo de trabajo/arnés que ejecuta la prueba. `package_ref` es el commit de origen que se empaqueta cuando `source=ref`. Esto permite que el arnés de pruebas actual valide commits de origen de confianza anteriores sin ejecutar lógica antigua del flujo de trabajo.

### Perfiles de conjuntos de pruebas

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `root-managed-vps-upgrade`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — el conjunto `package` con cobertura en vivo de `plugins` en lugar de `plugins-offline`, además de `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — fragmentos completos de la ruta de lanzamiento de Docker con OpenWebUI
- `custom` — `docker_lanes` exacto; obligatorio cuando `suite_profile=custom`

El perfil `package` usa cobertura de plugins sin conexión para que la validación de paquetes publicados no dependa de la disponibilidad en vivo de ClawHub. La vía opcional de Telegram reutiliza el artefacto `package-under-test` en `NPM Telegram Beta E2E`, mientras que la ruta de especificación npm publicada se conserva para las ejecuciones independientes.

Para consultar la política específica de pruebas de actualizaciones y plugins, incluidos los comandos locales,
las vías de Docker, las entradas de aceptación de paquetes, los valores predeterminados del lanzamiento y el diagnóstico de fallos,
consulte [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins).

Las comprobaciones de lanzamiento invocan la aceptación de paquetes con `source=artifact`, el artefacto de paquete de lanzamiento preparado, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape'` y `telegram_mode=mock-openai`. Esto mantiene la migración del paquete, la actualización, la instalación en vivo de Skills de ClawHub, la limpieza de dependencias obsoletas de plugins, la reparación de la instalación de plugins configurados, el plugin sin conexión, la actualización de plugins y la prueba de Telegram en el mismo archivo tar del paquete resuelto. Establezca `release_package_spec` en la validación completa del lanzamiento o en las comprobaciones de lanzamiento de OpenClaw después de publicar una versión beta para ejecutar la misma matriz con el paquete npm distribuido sin volver a generarlo; establezca `package_acceptance_package_spec` únicamente cuando la aceptación de paquetes necesite un paquete diferente del resto de la validación del lanzamiento. Las comprobaciones de lanzamiento entre sistemas operativos siguen cubriendo la incorporación, el instalador y el comportamiento específico de cada plataforma y sistema operativo; la validación del producto respecto al paquete y la actualización debe comenzar con la aceptación de paquetes.

La vía de Docker `published-upgrade-survivor` valida una referencia de paquete publicado por ejecución en la ruta de lanzamiento bloqueante. En la aceptación de paquetes, el archivo tar `package-under-test` resuelto siempre es el candidato y `published_upgrade_survivor_baseline` selecciona la referencia publicada alternativa, cuyo valor predeterminado es `openclaw@latest`; los comandos de repetición de vías fallidas conservan esa referencia. La validación completa del lanzamiento con `run_release_soak=true` o `release_profile=full` establece `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` y `published_upgrade_survivor_scenarios=reported-issues` para ampliar la cobertura a las cuatro versiones estables más recientes de npm, además de las versiones fijadas que delimitan la compatibilidad de plugins y los casos de prueba basados en incidencias para la configuración de Feishu, los archivos conservados de arranque/persona, las instalaciones configuradas de plugins de OpenClaw, las rutas de registro con virgulilla y las raíces obsoletas de dependencias de plugins heredados. Las selecciones supervivientes de actualización publicada con varias referencias se dividen por referencia en trabajos separados de ejecutores de Docker específicos. El flujo de trabajo independiente `Update Migration` usa la vía de Docker `update-migration` con referencias `all-since-2026.4.23` y escenarios `plugin-deps-cleanup` cuando se requiere una limpieza exhaustiva de actualizaciones publicadas, no la amplitud normal de la CI completa del lanzamiento. Las ejecuciones agregadas locales pueden pasar especificaciones exactas de paquetes mediante `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, conservar una sola vía con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, como `openclaw@2026.4.15`, o establecer `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` para la matriz de escenarios. La vía publicada configura la referencia con una receta de comandos `openclaw config set` integrada, registra los pasos de la receta en `summary.json` y comprueba `/healthz`, `/readyz` y el estado de RPC después de iniciar Gateway. Las vías nuevas de paquetes e instaladores de Windows también verifican que un paquete instalado pueda importar una sustitución del control del navegador desde una ruta absoluta sin procesar de Windows. La prueba rápida de turnos del agente de OpenAI entre sistemas operativos usa de forma predeterminada `OPENCLAW_CROSS_OS_OPENAI_MODEL` cuando está establecido; de lo contrario, usa `openai/gpt-5.6-luna`, para que la prueba de instalación y Gateway utilice el nivel de pruebas GPT-5.6 de menor coste.

### Periodos de compatibilidad heredada

La Aceptación de paquetes tiene ventanas acotadas de compatibilidad con versiones heredadas para paquetes ya publicados. Los paquetes hasta `2026.4.25`, incluido `2026.4.25-beta.*`, pueden usar la ruta de compatibilidad:

- las entradas de QA privadas conocidas en `dist/postinstall-inventory.json` pueden apuntar a archivos omitidos del tarball;
- `doctor-switch` puede omitir el subcaso de persistencia `gateway install --wrapper` cuando el paquete no expone ese indicador;
- `update-channel-switch` puede eliminar del fixture de git falso derivado del tarball los `patchedDependencies` de pnpm que falten y puede registrar los `update.channel` persistidos que falten;
- las pruebas de humo de plugins pueden leer ubicaciones heredadas de registros de instalación o aceptar que no se persista el registro de instalación del marketplace;
- `plugin-update` puede permitir la migración de metadatos de configuración mientras sigue exigiendo que el registro de instalación y el comportamiento sin reinstalación permanezcan sin cambios.

El paquete `2026.4.26` publicado también puede emitir advertencias por archivos locales de sello de metadatos de compilación que ya se distribuyeron, y los paquetes hasta `2026.5.20` pueden advertir en lugar de fallar cuando falta `npm-shrinkwrap.json`. Los paquetes posteriores deben satisfacer los contratos modernos; las mismas condiciones provocan un fallo en lugar de una advertencia u omisión.

### Ejemplos

```bash
# Validar el paquete beta actual con cobertura a nivel de producto.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# Validar el paquete estable extendido publicado con cobertura de paquetes.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@extended-stable \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Empaquetar y validar una rama de lanzamiento con el harness actual.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.PATCH \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Validar la URL de un tarball. SHA-256 es obligatorio para source=url.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=url \
  -f package_url=https://example.com/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Validar un tarball procedente de una política de réplica privada de confianza con nombre.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Reutilizar un tarball cargado por otra ejecución de Actions.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

Al depurar una ejecución fallida de aceptación de paquetes, empezar por el resumen de `resolve_package` para confirmar el origen, la versión y el SHA-256 del paquete. Después, inspeccionar la ejecución secundaria de `docker_acceptance` y sus artefactos de Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, registros de los carriles, tiempos de las fases y comandos de repetición. Es preferible volver a ejecutar el perfil de paquete fallido o los carriles de Docker exactos en lugar de repetir la validación completa del lanzamiento.

## Prueba de humo de instalación

El flujo de trabajo `Install Smoke` ya no se ejecuta en pull requests ni en pushes de `main`. Tanto su contenedor nocturno/manual como la validación de lanzamiento llaman al núcleo de solo lectura `install-smoke-reusable.yml`, y cada ejecución recorre la ruta completa de prueba de humo de instalación en ejecutores alojados en GitHub:

- La imagen de prueba de humo del Dockerfile raíz se compila una vez por SHA de destino, se vincula a la revisión del flujo de trabajo y al intento del productor en un artefacto inmutable y, después, la cargan la prueba de humo de la CLI, la prueba de humo de la CLI para que los agentes eliminen el espacio de trabajo compartido, el E2E de red del Gateway del contenedor y la prueba de humo del argumento de compilación del Plugin `matrix` incluido. La prueba de humo del Plugin verifica la réplica de la instalación de dependencias de ejecución y que el Plugin se carga sin diagnósticos de escape del punto de entrada.
- La instalación del paquete QR y las pruebas de humo de Docker del instalador y la actualización (incluidos los carriles del instalador de Rocky Linux y un carril de actualización respecto a una referencia npm configurable `update_baseline_version`) se ejecutan como trabajos independientes para que el trabajo del instalador no tenga que esperar detrás de las pruebas de humo de la imagen raíz.

La lenta prueba de humo del proveedor de imágenes con instalación global de Bun se controla por separado mediante `run_bun_global_install_smoke`. Se ejecuta según la programación nocturna, está activada de forma predeterminada para las llamadas al flujo de trabajo procedentes de las comprobaciones de lanzamiento y los envíos manuales de `Install Smoke` pueden habilitarla. La CI normal de pull requests sigue ejecutando el carril rápido de regresión del iniciador de Bun para los cambios relacionados con Node. Las pruebas de Docker de QR y del instalador conservan sus propios Dockerfiles centrados en la instalación.

## E2E local de Docker

`pnpm test:docker:all` precompila una imagen compartida de pruebas en vivo, empaqueta OpenClaw una vez como tarball de npm y compila dos imágenes compartidas `scripts/e2e/Dockerfile`:

- un ejecutor básico de Node/Git para los carriles de instalación, actualización y dependencias de plugins;
- una imagen funcional que instala el mismo tarball en `/app` para los carriles de funcionalidad normales.

Las definiciones de carriles de Docker se encuentran en `scripts/lib/docker-e2e-scenarios.mjs`, la lógica del planificador se encuentra en `scripts/lib/docker-e2e-plan.mjs` y el ejecutor solo ejecuta el plan seleccionado. El programador selecciona la imagen de cada carril mediante `OPENCLAW_DOCKER_E2E_BARE_IMAGE` y `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` y, después, ejecuta los carriles con `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parámetros ajustables

| Variable                               | Valor predeterminado | Propósito                                                                                       |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Número de espacios del grupo principal para carriles normales.                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Número de espacios del grupo final sensible al proveedor.                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Límite de carriles en vivo simultáneos para que los proveedores no apliquen limitación.                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | Límite de carriles simultáneos de instalación de npm.                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Límite de carriles simultáneos con varios servicios.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Intervalo escalonado entre inicios de carriles para evitar avalanchas de creación en el daemon de Docker; establecer `0` para eliminar el intervalo.     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Tiempo de espera de respaldo por carril (120 minutos); los carriles en vivo/finales seleccionados usan límites más estrictos.           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` imprime el plan del programador sin ejecutar los carriles.                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | Lista separada por comas de carriles exactos; omite la prueba de humo de limpieza para que los agentes puedan reproducir un carril fallido. |

Un carril más pesado que su límite efectivo aún puede iniciarse desde un grupo vacío y, después, se ejecuta en solitario hasta que libera capacidad. El agregador local comprueba previamente Docker, elimina los contenedores E2E obsoletos de OpenClaw, emite el estado de los carriles activos, conserva los tiempos de los carriles para ordenarlos del más largo al más corto y, de forma predeterminada, deja de programar nuevos carriles agrupados después del primer fallo.

### Flujo de trabajo reutilizable en vivo/E2E

El flujo de trabajo reutilizable en vivo/E2E consulta a `scripts/test-docker-all.mjs --plan-json` qué paquete, tipo de imagen, imagen en vivo, carril y cobertura de credenciales se requieren. Después, `scripts/docker-e2e.mjs` convierte ese plan en salidas y resúmenes de GitHub. Empaqueta OpenClaw mediante `scripts/package-openclaw-for-docker.mjs`, descarga un artefacto de paquete de la ejecución actual o descarga un artefacto de paquete desde `package_artifact_run_id` y, después, valida el inventario del tarball. La ruta predeterminada `no-push-artifact` compila imágenes básicas/funcionales etiquetadas con el resumen del paquete mediante la caché de capas de Docker de Blacksmith, empaqueta los bytes exactos de la imagen en un artefacto inmutable del flujo de trabajo y hace que cada consumidor verifique y cargue ese artefacto. En cambio, `existing-only` exige referencias explícitas de GHCR `docker_e2e_bare_image`/`docker_e2e_functional_image` y nunca compila ni publica. Esas descargas del registro usan un tiempo de espera acotado de 180 segundos por intento, de modo que un flujo bloqueado se reintenta rápidamente en lugar de consumir la mayor parte de la ruta crítica de CI. Tras una validación programada correcta, `openclaw-scheduled-live-checks.yml` pasa el manifiesto inmutable de imágenes probadas al publicador independiente con permisos de escritura de paquetes; los llamadores de lanzamiento y prelanzamiento de solo lectura nunca atraviesan ese proceso de escritura.

### Fragmentos de la ruta de lanzamiento

La cobertura de Docker del lanzamiento ejecuta trabajos fragmentados más pequeños con `OPENCLAW_SKIP_DOCKER_BUILD=1` para que cada fragmento verifique y cargue solo el tipo de imagen respaldado por artefactos que necesita (o lo descargue con la reutilización explícita de `existing-only`) y ejecute varios carriles mediante el mismo programador ponderado:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | openwebui`

Los fragmentos actuales de Docker del lanzamiento son `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, desde `plugins-runtime-install-a` hasta `plugins-runtime-install-h` y `openwebui`. `package-update-openai` incluye el carril en vivo del paquete del Plugin de Codex, que instala el paquete candidato de OpenClaw, instala el Plugin de Codex desde `codex_plugin_spec` o desde un tarball de la misma referencia con aprobación explícita para instalar la CLI de Codex, ejecuta la comprobación previa de la CLI de Codex y turnos del agente en la misma sesión y, después, ejecuta un turno sin reintentos y con razonamiento medio que envía el progreso, lee entradas aleatorias del espacio de trabajo, escribe su artefacto exacto y envía la finalización. `plugins-runtime-core`, `plugins-runtime` y `plugins-integrations` siguen siendo alias agregados del Plugin y del entorno de ejecución. El alias de carril `install-e2e` sigue siendo el alias agregado de repetición manual para ambos carriles del instalador del proveedor.

OpenWebUI se ejecuta como un fragmento independiente `openwebui` en un ejecutor Blacksmith dedicado con disco de gran capacidad siempre que la cobertura estable o completa de la ruta de lanzamiento lo solicite, incluso cuando el flujo de trabajo reutilizable dirige los trabajos compatibles a ejecutores alojados en GitHub. Mantener separada la descarga de la imagen externa evita que la imagen grande compita con las imágenes compartidas del paquete y los plugins en `plugins-runtime-services`; los fragmentos agregados heredados de plugins y entornos de ejecución siguen incluyendo OpenWebUI para repeticiones manuales compatibles. Los carriles de actualización de canales incluidos reintentan una vez los fallos transitorios de red de npm.

Cada fragmento carga `.artifacts/docker-tests/` con registros de los carriles, tiempos, `summary.json`, `failures.json`, tiempos de las fases, el JSON del plan del programador, tablas de carriles lentos y comandos de repetición por carril. La entrada `docker_lanes` del flujo de trabajo ejecuta los carriles seleccionados respecto a las imágenes preparadas para esa ejecución en lugar de usar los trabajos de fragmentos, lo que limita la depuración de carriles fallidos a un único trabajo específico de Docker; si un carril seleccionado es un carril de Docker en vivo, el trabajo específico compila localmente la imagen de pruebas en vivo para esa repetición. El asistente de repetición valida el SHA de destino seleccionado exacto del artefacto del fallo y el envío manual vuelve a empaquetar esa referencia, porque la tupla interna del paquete del flujo de trabajo reutilizable no forma parte del esquema de `workflow_dispatch`. Los comandos generados incluyen las entradas de imágenes preparadas y `shared_image_policy=existing-only` solo cuando esas entradas están respaldadas por GHCR; las etiquetas de artefactos locales del ejecutor se omiten para que un ejecutor nuevo vuelva a compilarlas. Una sustitución explícita del destino descarta las referencias recuperadas de imágenes de GHCR salvo que el artefacto demuestre que coinciden con la sustitución. También se omiten las referencias a definiciones de flujo de trabajo generadas por artefactos porque se eliminan las ramas temporales del lanzamiento completo; el envío usa la rama predeterminada del repositorio salvo que el operador la sustituya explícitamente.

```bash
pnpm test:docker:rerun <run-id>      # descargar los artefactos de Docker e imprimir los comandos específicos de repetición combinados y por carril
pnpm test:docker:timings <summary>   # resúmenes de carriles lentos y de la ruta crítica de las fases
```

El flujo de trabajo programado en vivo/E2E ejecuta diariamente la suite completa de Docker de la ruta de lanzamiento y, después de completarse correctamente, invoca el publicador explícito para los artefactos exactos de las imágenes probadas.

## Prelanzamiento del Plugin

`Plugin Prerelease` ofrece una cobertura de producto/paquete más costosa, por lo que es un flujo de trabajo independiente que inicia `Full Release Validation` o un operador de forma explícita. Las pull requests normales, los pushes de `main` y las ejecuciones manuales independientes de CI mantienen esa suite desactivada. Distribuye las pruebas de plugins incluidos entre ocho workers de extensiones; esos trabajos de fragmentos de extensiones ejecutan hasta dos grupos de configuración de plugins a la vez, con un worker de Vitest por grupo y un heap de Node más grande, para que los lotes de plugins con muchas importaciones no creen trabajos de CI adicionales. La ruta de prelanzamiento de Docker exclusiva para lanzamientos (habilitada mediante la entrada `full_release_validation`) agrupa las rutas de Docker seleccionadas de cuatro en cuatro para evitar reservar decenas de runners para trabajos de entre uno y tres minutos. El flujo de trabajo también carga un artefacto informativo `plugin-inspector-advisory` desde `@openclaw/plugin-inspector`; los hallazgos del inspector sirven como información para el triaje y no modifican la puerta bloqueante de prelanzamiento de plugins.

## QA Lab

QA Lab tiene rutas de CI dedicadas fuera del flujo de trabajo principal con alcance inteligente. La paridad agéntica está integrada en los arneses generales de QA y lanzamiento, no en un flujo de trabajo independiente para pull requests. Se debe usar `Full Release Validation` con `rerun_group=qa-parity` cuando la paridad deba formar parte de una ejecución de validación general.

- El flujo de trabajo `QA-Lab - All Lanes` se ejecuta cada noche en `main` y mediante ejecución manual; distribuye trabajos de paridad simulada y trabajos en vivo de Matrix, Telegram, Discord, WhatsApp y Slack. Los trabajos en vivo usan el entorno `qa-live-shared`; Telegram, Discord, WhatsApp y Slack usan concesiones de Convex, mientras que Matrix aprovisiona credenciales locales desechables.

Las comprobaciones de lanzamiento ejecutan rutas de transporte en vivo de Matrix y Telegram con el proveedor simulado determinista y modelos aptos para simulación (`mock-openai/gpt-5.6-luna` y `mock-openai/gpt-5.6-luna-alt`), de modo que el contrato del canal quede aislado de la latencia de los modelos en vivo y del inicio normal de los plugins de proveedores. El Gateway de transporte en vivo desactiva la búsqueda en memoria porque la paridad de QA cubre por separado el comportamiento de la memoria; la conectividad de los proveedores se cubre mediante las suites independientes de modelos en vivo, proveedores nativos y proveedores de Docker.

Las puertas programadas y de lanzamiento de Matrix usan el host compartido de la suite de QA Lab y el adaptador en vivo con los escenarios de lanzamiento. El valor predeterminado de la CLI y la entrada manual del flujo de trabajo siguen siendo `all`; las ejecuciones manuales de `all` distribuyen los perfiles `transport`, `media`, `e2ee-smoke`, `e2ee-deep` y `e2ee-cli`, para que la prueba de 93 escenarios se mantenga dentro de los tiempos de espera por trabajo. Las ejecuciones manuales específicas seleccionan `fast`, `release` o `transport` en un solo trabajo.

`OpenClaw Release Checks` también ejecuta las rutas de QA Lab críticas para el lanzamiento antes de aprobarlo; su puerta de paridad de QA ejecuta los paquetes candidato y de referencia como trabajos de rutas paralelos y, después, descarga ambos artefactos en un pequeño trabajo de informes para realizar la comparación final de paridad.

Para las pull requests normales, se deben seguir las pruebas de CI y comprobaciones específicas del alcance en lugar de tratar la paridad como un estado obligatorio.

## CodeQL

El flujo de trabajo `CodeQL` es deliberadamente un escáner de seguridad limitado de primera pasada, no un análisis completo del repositorio. Las ejecuciones diarias, manuales, por push de `main` y de protección de pull requests que no sean borradores analizan el código de los flujos de trabajo de Actions y las superficies de JavaScript/TypeScript de mayor riesgo mediante consultas de seguridad de alta confianza filtradas por `security-severity` alto/crítico.

La protección de pull requests se mantiene ligera: solo se inicia para cambios en `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `scripts`, `src` o en rutas de tiempo de ejecución de plugins incluidos que sean propietarias de procesos, y ejecuta la misma matriz de seguridad de alta confianza que el flujo de trabajo programado. CodeQL para Android y macOS queda fuera de los valores predeterminados de las pull requests.

### Categorías de seguridad

| Categoría                                          | Superficie                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Base de autenticación, secretos, entorno aislado, cron y Gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Contratos de implementación de los canales principales, además del tiempo de ejecución de plugins de canal, Gateway, SDK de plugins, secretos y puntos de contacto de auditoría              |
| `/codeql-security-high/network-ssrf-boundary`     | Superficies principales de políticas de SSRF, análisis de IP, protección de red, obtención web y SSRF del SDK de plugins                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | Servidores MCP, utilidades de ejecución de procesos, entrega saliente y puertas de ejecución de herramientas de agentes                                           |
| `/codeql-security-high/process-exec-boundary`     | Shell local, utilidades de creación de procesos, tiempos de ejecución de plugins incluidos propietarios de subprocesos y código de enlace de scripts de flujos de trabajo                             |
| `/codeql-security-high/plugin-trust-boundary`     | Superficies de confianza de instalación, cargador, manifiesto, registro, instalación mediante gestores de paquetes, carga de código fuente y contratos de paquetes del SDK de plugins |

### Fragmentos de seguridad específicos de plataformas

- `CodeQL Android Critical Security` — fragmento de seguridad programado para Android. Compila manualmente la aplicación de Android para CodeQL en el runner de Linux de Blacksmith más pequeño aceptado por la comprobación de coherencia del flujo de trabajo. Carga los resultados en `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — fragmento de seguridad semanal/manual para macOS. Compila manualmente la aplicación de macOS para CodeQL en Blacksmith macOS, excluye de los archivos SARIF cargados los resultados de compilación de dependencias y carga los resultados en `/codeql-critical-security/macos`. Se mantiene fuera de los valores predeterminados diarios porque la compilación de macOS domina el tiempo de ejecución incluso cuando no hay problemas.

### Categorías de calidad crítica

`CodeQL Critical Quality` es el fragmento equivalente no relacionado con la seguridad. Ejecuta únicamente consultas de calidad de JavaScript/TypeScript no relacionadas con la seguridad y con gravedad de error sobre superficies limitadas de alto valor en runners de Linux alojados por GitHub, para que los análisis de calidad no consuman el presupuesto de registro de runners de Blacksmith. Su protección de pull requests es deliberadamente más reducida que el perfil programado: las pull requests que no sean borradores ejecutan únicamente los fragmentos correspondientes a las superficies que modifican, entre trece fragmentos direccionables para pull requests: `agent-runtime-boundary`, `channel-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `gateway-runtime-boundary`, `mcp-process-runtime-boundary`, `memory-runtime-boundary`, `network-runtime-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, `plugin-sdk-reply-runtime`, `provider-runtime-boundary` y `session-diagnostics-boundary`. `ui-control-plane` y `web-media-runtime-boundary` quedan fuera de las ejecuciones de pull requests. Los cambios en la configuración de CodeQL y en el flujo de trabajo de calidad ejecutan el conjunto completo de fragmentos para pull requests (el fragmento del tiempo de ejecución de red se activa según sus propios archivos de configuración de CodeQL y las rutas de código fuente propietarias de la red).

La ejecución manual acepta:

```text
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|network-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Los perfiles limitados son mecanismos de aprendizaje e iteración para ejecutar un fragmento de calidad de forma aislada.

| Categoría                                                | Superficie                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Código de límites de seguridad de autenticación, secretos, entorno aislado, cron y Gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Contratos de esquema, migración, normalización y E/S de configuración                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Esquemas de protocolo de Gateway y contratos de métodos del servidor                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratos de implementación de canales principales y plugins de canal incluidos                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Ejecución de comandos, envío a modelos/proveedores, envío y colas de respuestas automáticas, y contratos de tiempo de ejecución del plano de control de ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Servidores MCP y puentes de herramientas, utilidades de supervisión de procesos y contratos de entrega saliente                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK del host de memoria, fachadas del tiempo de ejecución de memoria, alias de memoria del SDK de plugins, código de activación del tiempo de ejecución de memoria y comandos de diagnóstico de memoria                                    |
| `/codeql-critical-quality/network-runtime-boundary`     | Paquete de políticas de red, tiempo de ejecución de sockets sin procesar y captura de proxy, túnel SSH, bloqueo de Gateway, socket JSONL y superficies de transporte push                                 |
| `/codeql-critical-quality/session-diagnostics-boundary` | Componentes internos de la cola de respuestas, colas de entrega de sesiones, utilidades de vinculación y entrega de sesiones salientes, superficies de paquetes de eventos y registros de diagnóstico, y contratos de la CLI de diagnóstico de sesiones |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Envío de respuestas entrantes del SDK de plugins, utilidades de carga útil, fragmentación y tiempo de ejecución de respuestas, opciones de respuesta de canales, colas de entrega y utilidades de vinculación de sesiones e hilos             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalización del catálogo de modelos, autenticación y descubrimiento de proveedores, registro del tiempo de ejecución de proveedores, valores predeterminados y catálogos de proveedores, y registros de web, búsqueda, obtención e incrustaciones    |
| `/codeql-critical-quality/ui-control-plane`             | Inicio de la interfaz de control, persistencia local, flujos de control del Gateway y contratos del tiempo de ejecución del plano de control de tareas                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contratos principales de tiempo de ejecución de obtención y búsqueda web, E/S multimedia, comprensión multimedia, generación de imágenes y generación multimedia                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Contratos de cargador, registro, superficie pública y puntos de entrada del SDK de plugins                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Código fuente publicado del SDK de plugins del lado del paquete y utilidades de contratos de paquetes de plugins                                                                                      |

La calidad se mantiene separada de la seguridad para que los hallazgos de calidad puedan programarse, medirse, desactivarse o ampliarse sin ocultar la señal de seguridad. La ampliación de CodeQL para Swift, Python y plugins incluidos solo debe reincorporarse como trabajo de seguimiento específico o fragmentado después de que los perfiles limitados tengan un tiempo de ejecución y una señal estables.

## Flujos de trabajo de mantenimiento

### Agente de documentación

El flujo de trabajo `Docs Agent` es una ruta de mantenimiento de Codex basada en eventos para mantener la documentación existente alineada con los cambios integrados recientemente. No tiene una programación propia: una ejecución correcta de CI por push de un usuario que no sea un bot en `main` puede activarlo, y una ejecución manual puede iniciarlo directamente. Las invocaciones por ejecución de flujo de trabajo se omiten cuando `main` ha avanzado o cuando se ha creado otra ejecución no omitida del Agente de documentación durante la última hora. Cuando se ejecuta, revisa el intervalo de commits desde el SHA de origen del anterior Agente de documentación no omitido hasta el `main` actual, de modo que una ejecución por hora pueda cubrir todos los cambios de la rama principal acumulados desde la última revisión de la documentación.

### Agente de rendimiento de pruebas

El flujo de trabajo `Test Performance Agent` es una vía de mantenimiento de Codex basada en eventos para pruebas lentas. No tiene una programación pura: una ejecución correcta de CI por un push que no sea de un bot en `main` puede activarlo, pero se omite si otra invocación por ejecución de flujo de trabajo ya se ejecutó o se está ejecutando ese día UTC. La ejecución manual omite esa condición de actividad diaria. La vía genera un informe de rendimiento de Vitest agrupado para la suite completa, permite que Codex realice únicamente pequeñas correcciones de rendimiento de pruebas que preserven la cobertura, en lugar de refactorizaciones amplias, vuelve a ejecutar el informe de la suite completa y rechaza los cambios que reduzcan el recuento de referencia de pruebas aprobadas. El informe agrupado registra el tiempo de reloj por configuración y el RSS máximo en Linux y macOS, por lo que la comparación anterior/posterior muestra las diferencias de memoria de las pruebas junto a las diferencias de duración. Si la referencia tiene pruebas fallidas, Codex solo puede corregir fallos evidentes y el informe de la suite completa posterior al agente debe aprobarse antes de confirmar cualquier cambio. Cuando `main` avanza antes de que llegue el push del bot, la vía reorganiza el parche validado sobre la nueva base, vuelve a ejecutar `pnpm check:changed` y reintenta el push; los parches obsoletos con conflictos se omiten. Utiliza Ubuntu alojado en GitHub para que la acción de Codex pueda mantener la misma postura de seguridad de eliminación de sudo que el agente de documentación.

### PR duplicados después de la fusión

El flujo de trabajo `Duplicate PRs After Merge` es un flujo de trabajo manual para mantenedores destinado a limpiar duplicados después de integrar cambios. De manera predeterminada, realiza una ejecución de prueba y solo cierra los PR indicados explícitamente cuando `apply=true`. Antes de modificar GitHub, verifica que el PR integrado esté fusionado y que cada duplicado tenga un issue referenciado compartido o fragmentos modificados que se superpongan.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Condiciones de comprobación locales y enrutamiento de cambios

### Ajuste progresivo del recuento de referencia de configuración

`pnpm config:docs:check` rechaza el crecimiento no documentado de la superficie de configuración y las instantáneas de recuentos dañadas u obsoletas. Cuando un cambio de producto revisado añada intencionadamente rutas de esquema, ejecute `pnpm config:docs:gen`, inspeccione las diferencias de recuento del núcleo, los canales y los plugins, así como los archivos SHA-256 generados, y confirme el aumento consciente de la referencia junto con el esquema, la ayuda, las etiquetas, la migración y las pruebas. No edite manualmente el archivo de recuentos para eludir el ajuste progresivo.

Quienes creen configuraciones también deben asignar niveles a las nuevas hojas para Ajustes. Añada `advanced: false` o
`advanced: true` a la hoja, o coloque la clave bajo un antecesor cuyo nivel
deban heredar todos los descendientes. Las raíces sin clasificar hacen que falle la prueba de calidad
del esquema con fragmentos listos para copiar y pegar; las rutas sin un antecesor se consideran avanzadas de forma predeterminada.
La instantánea seleccionada de hojas comunes permite ver en la
revisión los cambios intencionados de nivel.

La lógica local de vías modificadas se encuentra en `scripts/changed-lanes.mjs` y la ejecuta `scripts/check-changed.mjs`. Esa condición de comprobación local es más estricta con los límites de arquitectura que el amplio alcance de la plataforma de CI:

- los cambios de producción del núcleo ejecutan la comprobación de tipos de producción y pruebas del núcleo, además del lint y las protecciones del núcleo;
- los cambios únicamente en pruebas del núcleo ejecutan solo la comprobación de tipos de pruebas del núcleo y el lint del núcleo;
- los cambios de producción de extensiones ejecutan la comprobación de tipos de producción y pruebas de extensiones, además del lint de extensiones;
- los cambios únicamente en pruebas de extensiones ejecutan la comprobación de tipos de pruebas de extensiones y el lint de extensiones;
- los cambios en el SDK público de plugins o en contratos de plugins amplían la comprobación de tipos a las extensiones porque estas dependen de esos contratos del núcleo (los barridos de extensiones de Vitest siguen siendo trabajo de pruebas explícito);
- los incrementos de versión que solo afectan a metadatos de versiones ejecutan comprobaciones específicas de versión, configuración y dependencias raíz;
- los cambios desconocidos de raíz o configuración adoptan un comportamiento seguro y ejecutan todas las vías de comprobación.

El enrutamiento local de pruebas modificadas se encuentra en `scripts/test-projects.test-support.mjs` y es intencionadamente más económico que `check:changed`: las modificaciones directas de pruebas ejecutan esas mismas pruebas; las modificaciones del código fuente prefieren asignaciones explícitas y, después, pruebas hermanas y dependientes del grafo de importaciones. La configuración compartida de entrega en salas de grupo es una de las asignaciones explícitas: los cambios en la configuración de respuestas visibles del grupo, el modo de entrega de respuestas del código fuente o el prompt del sistema de la herramienta de mensajes se enrutan por las pruebas principales de respuestas y las regresiones de entrega de Discord y Slack para que un cambio predeterminado compartido falle antes del primer push del PR. Use `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo cuando el cambio abarque tanto el arnés que el conjunto económico asignado no sea un indicador fiable.

## Validación con Testbox

Crabbox es el contenedor de cajas remotas del repositorio para las pruebas de Linux de los mantenedores. Las sesiones
de agentes mantienen localmente una o pocas pruebas específicas y comprobaciones estáticas económicas únicamente para
código fuente de confianza cuando la instalación de dependencias existente está lista. Utilizan Crabbox para suites más grandes y
trabajos de alta carga computacional, como compilaciones, comprobaciones de tipos, distribución del lint,
Docker, vías de paquetes, E2E, pruebas en vivo y paridad con CI. Las pruebas pesadas de mantenedores
de confianza utilizan `blacksmith-testbox` de forma predeterminada, y `.crabbox.yaml` ahora también lo utiliza de forma predeterminada. Su flujo de trabajo
configurado incorpora las credenciales del proveedor y del agente, por lo que el código no confiable de colaboradores o
forks debe utilizar CI de forks sin secretos o Crabbox directo y saneado en AWS.
Las ejecuciones saneadas en AWS establecen `CRABBOX_ENV_ALLOW=CI`, pasan
`--no-hydrate` y utilizan un `HOME` remoto temporal nuevo; esto impide que la lista de permitidos
`OPENCLAW_*` del repositorio y los perfiles de autenticación existentes lleguen al código no confiable.
Utilizan un arrendamiento recién preparado dedicado a ese código no confiable, nunca un
arrendamiento de confianza o previamente provisto de credenciales. Inicie un binario Crabbox de confianza instalado
desde un checkout limpio y de confianza de `main`, y obtenga únicamente el PR remoto con
`--fresh-pr`; nunca ejecute localmente el contenedor ni la configuración del checkout no confiable.
Desestablezca `CRABBOX_AWS_INSTANCE_PROFILE` y adopte un comportamiento cerrado y seguro salvo que el valor resuelto de
`aws.instanceProfile` esté vacío. Antes de cualquier instalación o prueba, utilice herramientas de confianza
con rutas absolutas para exigir un token IMDSv2, demostrar que el endpoint de credenciales
de IAM devuelve 404 y comparar el valor remoto de `git rev-parse HEAD` con el SHA completo
de la cabecera del PR revisado. Vincule el arrendamiento a ese SHA y deténgalo o vuelva a prepararlo cuando cambie la cabecera.
Cargue `scripts/crabbox-untrusted-bootstrap.sh` de confianza desde un `main` limpio
junto con `--fresh-pr`; instala las versiones fijadas de Node/pnpm, verifica el SHA y
la versión fijada del gestor de paquetes, aísla `HOME`, instala las dependencias y después ejecuta la
prueba solicitada.
Desestablezca todas las sobrescrituras de `CRABBOX_TAILSCALE*`, fuerce `--network public
--tailscale=false`, borre las opciones de nodo de salida/LAN y exija que `crabbox inspect`
informe de redes públicas sin estado de Tailscale antes de cargar cualquier script.
La capacidad propia de AWS/Hetzner también sigue siendo la alternativa para interrupciones de Blacksmith,
problemas de cuota o pruebas explícitas con capacidad propia.

Los agentes no realizan una preparación anticipada para trabajo previsto. Adquiera una Testbox de forma diferida cuando esté
listo el primer comando pesado, reutilice el identificador `tbx_...` devuelto para los comandos pesados
posteriores, sincronice el checkout actual en cada ejecución y deténgala antes de la entrega.

Las ejecuciones de Blacksmith respaldadas por Crabbox preparan, reclaman, sincronizan, ejecutan, informan y limpian
Testboxes de un solo uso. La comprobación de coherencia de sincronización integrada falla rápidamente cuando
`git status --short` en la caja sincronizada muestra al menos 200 eliminaciones de archivos con seguimiento,
lo que detecta la desaparición de archivos raíz como `pnpm-lock.yaml`. Para PR con
grandes eliminaciones intencionadas, establezca `CRABBOX_ALLOW_MASS_DELETIONS=1` para el comando remoto.

Crabbox también finaliza una invocación local de la CLI de Blacksmith que permanezca en la
fase de sincronización durante más de cinco minutos sin salida posterior a la sincronización. Establezca
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` para desactivar esa protección o utilice un valor mayor
en milisegundos para diferencias locales inusualmente grandes.

Antes de una primera ejecución, compruebe el contenedor desde la raíz del repositorio:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

El contenedor del repositorio rechaza un binario Crabbox obsoleto que no anuncie el proveedor seleccionado, y las ejecuciones respaldadas por Blacksmith requieren Crabbox 0.22.0 o posterior para que el contenedor obtenga el comportamiento actual de sincronización, cola y limpieza de Testbox. En worktrees de Codex o checkouts vinculados o dispersos, evite el script local `pnpm crabbox:run` porque pnpm podría reconciliar las dependencias antes de que se inicie Crabbox; en su lugar, invoque directamente el contenedor de Node:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Cuando utilice el checkout hermano, vuelva a compilar el binario local ignorado antes de realizar trabajos de medición o pruebas:

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

El bloque `blacksmith:` de `.crabbox.yaml` ya fija los valores predeterminados de organización, flujo de trabajo, tarea y referencia, por lo que las opciones explícitas siguientes son opcionales. Condición de cambios:

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

Nueva ejecución de una prueba específica en Testbox cuando las dependencias locales no estén disponibles o el
objetivo se distribuya:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm test <path-or-filter>"
```

Suite completa:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm test"
```

Lea el resumen JSON final. Los campos útiles son `provider`, `leaseId`,
`syncDelegated`, `exitCode`, `commandMs` y `totalMs`. Para las ejecuciones delegadas
de Blacksmith Testbox, el código de salida del contenedor Crabbox y el resumen JSON constituyen el
resultado del comando. La ejecución vinculada de GitHub Actions gestiona el aprovisionamiento de credenciales y el mantenimiento de actividad; puede
finalizar como `cancelled` cuando la Testbox se detiene externamente después de que el comando SSH
ya haya regresado. Trátelo como un artefacto de limpieza o estado, salvo que
`exitCode` del contenedor sea distinto de cero o que la salida del comando muestre una prueba fallida.
Las ejecuciones de Crabbox de un solo uso respaldadas por Blacksmith deberían detener la Testbox automáticamente;
si una ejecución se interrumpe o la limpieza no está clara, inspeccione las cajas activas y detenga únicamente
las que haya creado:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Utilice la reutilización únicamente cuando necesite intencionadamente varios comandos en la misma caja con credenciales incorporadas:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --id <tbx_id> --timing-json --shell -- "corepack pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Reutilice el arrendamiento, no el código fuente obsoleto. Omita `--no-sync` para que cada ejecución cargue el
checkout actual; utilícelo únicamente para volver a ejecutar intencionadamente un árbol sin cambios y ya sincronizado.
El código no confiable de colaboradores o forks debe utilizar
`CRABBOX_ENV_ALLOW=CI`, `--provider aws --no-hydrate` y un `HOME` remoto
temporal nuevo para cada comando; instale las dependencias dentro de ese comando saneado antes de realizar las pruebas.
Reutilice únicamente un arrendamiento recién preparado dedicado al mismo código fuente no confiable; nunca uno de confianza
o previamente provisto de credenciales. Nunca ejecute localmente el contenedor ni la configuración del checkout no confiable:
inicie el binario Crabbox de confianza instalado desde un `main` limpio y de confianza, y pase `--fresh-pr` en cada
ejecución. Mantenga `CRABBOX_AWS_INSTANCE_PROFILE` sin establecer, rechace un perfil de instancia resuelto que no esté vacío,
exija una prueba remota de confianza de IMDS sin rol y verifique el SHA de la cabecera
revisada antes de la instalación o las pruebas. Vincule el arrendamiento a ese SHA; deténgalo y
vuelva a prepararlo después de cualquier cambio de cabecera. Si no existe un PR remoto, utilice CI de forks sin secretos.
Nunca seleccione `hydrate-github` ni el flujo de trabajo de Blacksmith con credenciales incorporadas
para código fuente no confiable.

Si Crabbox es la capa averiada pero Blacksmith funciona, utilice Blacksmith directamente
solo para diagnósticos como `list`, `status` y la limpieza. Corrija la
ruta de Crabbox antes de considerar una ejecución directa de Blacksmith como prueba de mantenedor.

Si `blacksmith testbox list --all` y `blacksmith testbox status` funcionan, pero los nuevos
calentamientos permanecen `queued` sin IP ni URL de ejecución de Actions tras un par de minutos,
trátelo como presión del proveedor Blacksmith, de la cola, de la facturación o de los límites de la organización. Detenga los
identificadores en cola que haya creado, evite iniciar más Testboxes y traslade la prueba a la
ruta de capacidad propia de Crabbox indicada a continuación mientras alguien comprueba el panel de Blacksmith,
la facturación y los límites de la organización.

Escale a la capacidad propia de Crabbox únicamente cuando Blacksmith no esté disponible, tenga limitaciones de cuota, carezca del entorno necesario o el objetivo sea explícitamente usar capacidad propia:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --provider aws --id <cbx_id-or-slug>
pnpm crabbox:run -- --provider aws --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- --provider aws <cbx_id-or-slug>
```

Si AWS está sometido a presión, evite `class=beast` salvo que la tarea realmente necesite una CPU de clase 48xlarge. Una solicitud `beast` comienza con 192 vCPU y es la forma más fácil de alcanzar la cuota regional de EC2 Spot o Standard bajo demanda. El valor `.crabbox.yaml` propiedad del repositorio usa de forma predeterminada `class: standard`, el mercado bajo demanda y `capacity.hints: true`, de modo que los arrendamientos intermediados de AWS muestran la región y el mercado seleccionados, la presión de cuota, la alternativa de Spot y las advertencias sobre clases de alta presión. Use `fast` para comprobaciones amplias más exigentes, `large` solo cuando standard/fast no sean suficientes y `beast` únicamente para procesos excepcionales con uso intensivo de CPU, como matrices de Docker de la suite completa o de todos los plugins, validaciones explícitas de versiones o bloqueos, o análisis de rendimiento con un gran número de núcleos. No use `beast` para `pnpm check:changed`, pruebas específicas, trabajo exclusivo de documentación, lint/typecheck ordinarios, reproducciones E2E pequeñas ni clasificación de interrupciones de Blacksmith. Use `--market on-demand` para el diagnóstico de capacidad, de modo que la variación del mercado Spot no se mezcle con la señal.

`.crabbox.yaml` controla los valores predeterminados del proveedor, la sincronización y la hidratación de GitHub Actions. La sincronización de Crabbox nunca transfiere `.git`, por lo que el checkout hidratado de Actions conserva sus propios metadatos remotos de Git en lugar de sincronizar los remotos y almacenes de objetos locales de los mantenedores; además, la configuración del repositorio excluye los artefactos locales de ejecución y compilación (como `.artifacts` y los informes de pruebas) que nunca deben transferirse. `.github/workflows/crabbox-hydrate.yml` controla el checkout, la configuración de Node/pnpm, la obtención de `origin/main` y la transferencia del entorno sin secretos para los comandos `crabbox run --id <cbx_id>` de la nube propia.

## Relacionado

- [Descripción general de la instalación](/es/install)
- [Canales de desarrollo](/es/install/development-channels)
