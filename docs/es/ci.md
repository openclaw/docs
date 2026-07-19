---
read_when:
    - Necesita comprender por qué una tarea de CI se ejecutó o no se ejecutó.
    - Estás depurando una comprobación fallida de GitHub Actions
    - Está coordinando una ejecución o repetición de la validación de una versión
    - Está cambiando el despacho de ClawSweeper o el reenvío de actividad de GitHub
summary: Gráfico de trabajos de CI, controles de alcance, grupos de lanzamiento y comandos locales equivalentes
title: Pipeline de CI
x-i18n:
    generated_at: "2026-07-19T01:50:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5c633517ef09e7348033bb9fbf57f95376095967979f53d05921899c8b8cde3d
    source_path: ci.md
    workflow: 16
---

La CI de OpenClaw se ejecuta en los envíos a `main` (las rutas de Markdown y `docs/**` se ignoran
en el desencadenador), en cada pull request que no sea borrador y mediante activación manual.
Los envíos canónicos a `main` se ejecutan de uno en uno: el grupo de concurrencia `CI` permite que se ejecute
un ciclo de integración completo mientras GitHub conserva únicamente el envío pendiente más reciente.
Las nuevas fusiones sustituyen esa ejecución pendiente en lugar de cancelar el trabajo que ya
registró una matriz de Blacksmith. Los pull requests siguen cancelando los encabezados reemplazados,
y las activaciones manuales usan grupos aislados. `preflight` clasifica las diferencias y
desactiva los carriles costosos cuando solo han cambiado áreas no relacionadas. Las ejecuciones manuales
de `workflow_dispatch` omiten intencionadamente la delimitación inteligente y despliegan
el grafo completo para candidatos de lanzamiento y validaciones amplias. Los carriles de Android siguen
siendo opcionales mediante `include_android` (o la entrada `release_gate`). La cobertura de plugins
exclusiva de lanzamientos reside en el flujo de trabajo independiente
[`Plugin Prerelease`](#plugin-prerelease) y solo se ejecuta desde
[`Full Release Validation`](#full-release-validation) o mediante una activación manual
explícita.

## Descripción general del Pipeline

| Trabajo                            | Propósito                                                                                                                                                                                                             | Cuándo se ejecuta                                      |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `preflight`                        | Detectar los ámbitos modificados y crear el manifiesto de CI; en `main` canónicos relevantes para Node, actualizar y mantener la instantánea de dependencias antes del despliegue                                | Siempre en envíos y PR que no sean borradores          |
| `security-fast`                    | Detección de claves privadas, auditoría de flujos de trabajo modificados mediante `zizmor` y auditoría del archivo de bloqueo de producción                                                                         | Siempre en envíos y PR que no sean borradores          |
| `pnpm-store-warmup`                | Preparar la caché de Actions fijada por el archivo de bloqueo para los pull requests y las ejecuciones manuales sin bloquear los fragmentos de Node en Linux                                                            | Cuando se seleccionan carriles de Node o comprobación de documentación fuera de main |
| `build-artifacts`                  | Compilar `dist/`, la interfaz de control, las comprobaciones rápidas de la CLI compilada, la memoria de inicio y las comprobaciones integradas de artefactos compilados                                         | Cambios relevantes para Node                           |
| `control-ui-i18n`                  | Verificar los paquetes de configuración regional, los metadatos y la memoria de traducción generados de la interfaz de control; informativo en ejecuciones automáticas y bloqueante en la CI manual de lanzamiento      | Cambios relevantes para la i18n de la interfaz de control y CI manual |
| `checks-fast-core`                 | Carriles rápidos de corrección en Linux: límite progresivo de líneas máximas de la base de referencia de supresiones, componentes incluidos + protocolo, iniciador de Bun y tarea rápida de enrutamiento de CI           | Cambios relevantes para Node                           |
| `qa-smoke-ci-profile`              | Dos partes equilibradas y autónomas del conjunto representativo acotado de pruebas rápidas automáticas de control de calidad; la cobertura completa de la taxonomía sigue disponible mediante perfiles de QA explícitos | Cambios relevantes para Node                           |
| `checks-fast-contracts-plugins-*`  | Dos fragmentos ponderados de contratos de plugins                                                                                                                                                                     | Cambios relevantes para Node                           |
| `checks-fast-contracts-channels-*` | Dos fragmentos ponderados de contratos de canales                                                                                                                                                                     | Cambios relevantes para Node                           |
| `checks-node-*`                    | Pruebas de Node para objetivos modificados en pull requests; fragmentos completos del núcleo en `main`, ejecuciones manuales, lanzamientos y ejecuciones con reserva amplia                                     | Cambios relevantes para Node                           |
| `check-*`                          | Equivalente fragmentado de la barrera local principal: protecciones, shrinkwrap, metadatos de configuración de canales incluidos, tipos de producción, lint, dependencias y tipos de pruebas                           | Cambios relevantes para Node                           |
| `check-additional-*`               | Franjas de comprobación de límites (incluida la desviación de instantáneas de prompts), límites del descriptor de acceso de sesión, lector de transcripciones y transacciones de SQLite, grupos de lint de extensiones, compilación/canario de límites de paquetes y arquitectura de topología del entorno de ejecución | Cambios relevantes para Node                           |
| `checks-node-compat-node22`        | Carril de compilación y comprobación rápida de compatibilidad con Node 22                                                                                                                                              | Activación manual de CI para lanzamientos              |
| `check-docs`                       | Comprobaciones de formato, lint y enlaces rotos de la documentación                                                                                                                                                   | Cuando cambia la documentación (PR y activación manual) |
| `native-i18n`                      | Comprobaciones de inventario de i18n de aplicaciones nativas, Android y Apple                                                                                                                                          | Cambios relevantes para la i18n nativa                 |
| `skills-python`                    | Ruff + pytest para Skills respaldadas por Python                                                                                                                                                                      | Cambios relevantes para Skills de Python               |
| `checks-windows`                   | Pruebas de procesos y rutas específicas de Windows, además de regresiones compartidas de especificadores de importación del entorno de ejecución                                                                       | Cambios relevantes para Windows                        |
| `macos-node`                       | Pruebas de TypeScript específicas de macOS: launchd, Homebrew, rutas del entorno de ejecución, scripts de empaquetado y envoltorio de grupos de procesos                                                             | Cambios relevantes para macOS                          |
| `macos-swift`                      | Lint y compilación de Swift para la aplicación de macOS, además de pruebas de la aplicación y del paquete compartido OpenClawKit                                                                                      | Cambios relevantes para macOS                          |
| `ios-build`                        | Generación del proyecto de Xcode y compilación de la aplicación de iOS para el simulador                                                                                                                             | Cambios en la aplicación de iOS, el kit de aplicaciones compartido o Swabble |
| `android`                          | Pruebas unitarias de Android para ambas variantes y una compilación de APK de depuración                                                                                                                             | Cambios relevantes para Android                        |
| `openclaw/ci-gate`                 | Agregado final: requiere la comprobación previa y la seguridad; solo acepta omisiones en los carriles posteriores deshabilitados por el manifiesto                                                                      | Cada ejecución de CI que no sea borrador               |
| `test-performance-agent`           | Flujo de trabajo independiente: optimización diaria de pruebas lentas de Codex tras actividad de confianza                                                                                                             | Éxito de la CI principal o activación manual           |
| `openclaw-performance`             | Flujo de trabajo independiente: informes diarios o bajo demanda del rendimiento del entorno de ejecución Kova con carriles de proveedor simulado, perfilado profundo y GPT 5.6 en vivo                                | Activación programada y manual                         |

Los flujos de trabajo independientes de Periphery exigen que no haya hallazgos de código muerto en las aplicaciones de iOS y macOS. El flujo de trabajo compartido de OpenClawKit analiza ambos consumidores en paralelo y solo informa de una declaración cuando Periphery emite el mismo USR de Swift desde ambas compilaciones. Su contrato de esquema `OpenClawProtocol/GatewayModels.swift` generado se conserva como código propiedad del generador en lugar de tratarse como código muerto local de la aplicación.

## Orden de fallo rápido

1. `preflight` decide qué carriles existen. La lógica de `docs-scope` y `changed-scope` son pasos dentro de este trabajo, no trabajos independientes. `main` canónico comienza de inmediato, pero su grupo de concurrencia solo admite una ejecución completa y agrupa los envíos posteriores en una única ejecución pendiente, la más reciente. Los envíos a main relevantes para Node también serializan aquí el único proceso que escribe en el disco de dependencias y el mantenimiento de su tamaño antes de que los trabajos posteriores puedan montar la clave; Blacksmith puede exponer una confirmación nueva únicamente a una ejecución posterior del flujo de trabajo, por lo que los consumidores de la misma ejecución conservan la alternativa local verificada mediante marcadores.
2. `security-fast`, `check-*`, `check-additional-*`, `check-docs` y `skills-python` fallan rápidamente sin esperar a los trabajos más pesados de artefactos y matrices de plataformas.
3. `build-artifacts` y la comprobación informativa `control-ui-i18n` se solapan con los carriles rápidos de Linux. Los PR de código fuente excluyen las instantáneas de configuración regional generadas; el flujo de trabajo independiente de actualización repara y fusiona automáticamente en segundo plano un PR generado y aislado. Las ramas canónicas `release/YYYY.M.PATCH` pueden incluir reparaciones de configuración regional para preparar el lanzamiento junto con los demás resultados generados del lanzamiento.
4. Después, los carriles más pesados de plataformas y entornos de ejecución se despliegan: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` y `android`.
5. `openclaw/ci-gate` espera a todos los carriles seleccionados. La comprobación previa y la seguridad deben completarse correctamente; los trabajos posteriores solo pueden omitirse cuando el manifiesto no los ha seleccionado. Un carril seleccionado que falle o se cancele provoca el fallo del agregado.

El coordinador de fusiones puede reutilizar un `openclaw/ci-gate` autenticado y correcto
para el mismo encabezado del pull request durante un máximo de 24 horas. Esto evita reescribir una
rama del colaborador tras cambios no relacionados de `main`. El resultado reutilizable no
sustituye la comprobación de fusión de prueba independiente, estricta y propiedad de la aplicación con el `main` actual.
Una repetición posterior pendiente o fallida no elimina un resultado correcto anterior para
ese encabezado sin cambios durante el periodo de vigencia.

El conjunto de reglas de la rama predeterminada requiere la comprobación `openclaw/ci-gate` gestionada por GitHub Actions. Los responsables de mantenimiento y administradores del repositorio disponen de una omisión de emergencia auditada, destinada únicamente a integraciones directas firmadas mediante avance rápido; el conjunto de reglas de la organización sigue bloqueando la eliminación y las actualizaciones que no sean de avance rápido. Las fusiones normales de pull requests deben seguir utilizando la puerta de control en lugar de omitir una Pipeline de CI fallida. La comprobación estricta independiente de fusión de prueba, gestionada por la aplicación, sigue vinculando la cabecera con el `main` actual.

GitHub puede marcar como `cancelled` los trabajos de pull requests reemplazados cuando se integra una cabecera más reciente. Esto debe tratarse como ruido de la Pipeline de CI, salvo que también esté fallando la ejecución más reciente del mismo PR. Las ejecuciones canónicas de `main` no se cancelan después de su admisión; cuando llega tráfico de fusiones, GitHub sustituye únicamente la ejecución pendiente anterior por la punta más reciente. Los trabajos de matriz utilizan `fail-fast: false`, y `build-artifacts` informa directamente de los fallos del canal integrado, del límite de compatibilidad del núcleo y de la supervisión del Gateway, en lugar de poner en cola pequeños trabajos de verificación. La clave de concurrencia automática de la Pipeline de CI tiene versión (`CI-v7-*`), de modo que un proceso zombi de GitHub en un grupo de cola antiguo no pueda bloquear indefinidamente las ejecuciones más recientes de main. Las ejecuciones manuales de la suite completa utilizan `CI-manual-v1-*` y no cancelan las ejecuciones en curso. La protección de memoria de inicio de la lista de plugins mantiene un límite máximo de 350 MiB en Blacksmith Linux autoalojado y permite 425 MiB en Linux alojado por GitHub, cuya referencia de RSS es mayor para la misma CLI compilada.

Utilice `pnpm ci:timings`, `pnpm ci:timings:recent` o `node scripts/ci-run-timings.mjs <run-id>` para resumir el tiempo transcurrido, el tiempo en cola, los trabajos más lentos, los fallos y la barrera de distribución `pnpm-store-warmup` de GitHub Actions. El trabajo `ci-timings-summary` del flujo existe en `ci.yml`, pero actualmente está deshabilitado (`if: false`); ejecute en su lugar el auxiliar de medición de tiempos localmente. Para consultar los tiempos de compilación, revise el paso `Build dist` del trabajo `build-artifacts`: `pnpm build:ci-artifacts` muestra `[build-all] phase timings:` e incluye `ui:build`; el trabajo también carga el artefacto `startup-memory`.

## Contexto y evidencias del PR

Los PR de colaboradores externos ejecutan una puerta de control de contexto y evidencias del PR desde
`.github/workflows/real-behavior-proof.yml`. El flujo de trabajo obtiene la
revisión de confianza del flujo de trabajo (`github.workflow_sha`) y evalúa únicamente el cuerpo del PR;
no ejecuta código de la rama del colaborador.

La puerta de control se aplica a los autores de PR que no sean propietarios, miembros,
colaboradores o bots del repositorio. Se supera cuando el cuerpo del PR contiene secciones
`What Problem This Solves` y `Evidence` redactadas por el autor. Las evidencias pueden ser una prueba
específica, un resultado de la Pipeline de CI, una captura de pantalla, una grabación, una salida del terminal,
una observación en directo, un registro redactado o un enlace a un artefacto. El cuerpo proporciona la intención y una validación útil;
los revisores inspeccionan el código, las pruebas y la Pipeline de CI para evaluar su corrección.

Cuando la comprobación falle, actualice el cuerpo del PR en lugar de enviar otro commit de código.

## Alcance y enrutamiento

La lógica de alcance reside en `scripts/ci-changed-scope.mjs` y está cubierta por pruebas unitarias en `src/scripts/ci-changed-scope.test.ts`. La ejecución manual omite la detección del alcance modificado y hace que el manifiesto de comprobaciones preliminares actúe como si hubieran cambiado todas las áreas con alcance definido.

Los flujos de trabajo independientes de Periphery para iOS y macOS aplican una política de cero hallazgos de código muerto. Cada uno se ejecuta únicamente cuando un pull request que no sea borrador afecta a su alcance de análisis nativo o cuando se inicia manualmente.

- **Las modificaciones del flujo de trabajo de la Pipeline de CI** validan el grafo de la Pipeline de CI de Node, el análisis de los flujos de trabajo y el carril de Windows (`ci.yml` lo ejecuta), pero no fuerzan por sí solas las compilaciones nativas de iOS, Android o macOS; esos carriles de plataforma permanecen limitados a los cambios en el código fuente de la plataforma.
- **Comprobación de coherencia del flujo de trabajo** ejecuta `actionlint`, `zizmor` sobre todos los archivos YAML de flujos de trabajo, la protección de interpolación de acciones compuestas y la protección contra marcadores de conflicto. El trabajo `security-fast`, limitado al PR, también ejecuta `zizmor` sobre los archivos de flujo de trabajo modificados para que los hallazgos de seguridad del flujo de trabajo produzcan un fallo temprano en el grafo principal de la Pipeline de CI.
- **La documentación en los envíos a `main`** se comprueba mediante el flujo de trabajo independiente `Docs` con el mismo reflejo de documentación de ClawHub que utiliza la Pipeline de CI, de modo que los envíos combinados de código y documentación no pongan también en cola el fragmento `check-docs` de la Pipeline de CI. Los pull requests y la Pipeline de CI manual siguen ejecutando `check-docs` desde la Pipeline de CI cuando ha cambiado la documentación.
- **PTY de la TUI** se ejecuta en el fragmento `checks-node-core-runtime-tui-pty` de Node para Linux cuando hay cambios en la TUI. El fragmento ejecuta `test/vitest/vitest.tui-pty.config.ts` con `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, por lo que cubre tanto el carril determinista de recursos de prueba `TuiBackend` como la prueba de humo más lenta `tui --local`, que simula únicamente el endpoint externo del modelo.
- **Las modificaciones exclusivas del enrutamiento de la Pipeline de CI, el pequeño conjunto de recursos de pruebas del núcleo que la tarea rápida ejecuta directamente y las modificaciones específicas de auxiliares de contratos de plugins** utilizan una ruta rápida de manifiesto exclusiva de Node: `preflight`, `security-fast` y únicamente los carriles rápidos afectados por el cambio: una sola tarea de enrutamiento de la Pipeline de CI `checks-fast-core`, los dos fragmentos de contratos de plugins o ambos. Esa ruta omite los artefactos de compilación, la compatibilidad con Node 22, los contratos de canales, todos los fragmentos del núcleo, los fragmentos de plugins integrados y las matrices de protección adicionales.
- **Las comprobaciones de Node para Windows** se limitan a los contenedores de procesos y rutas específicos de Windows, los auxiliares de ejecución de npm/pnpm/UI, la configuración del gestor de paquetes y las superficies del flujo de trabajo de la Pipeline de CI que ejecutan ese carril; los cambios no relacionados en el código fuente, plugins, pruebas de humo de instalación y cambios exclusivos de pruebas permanecen en los carriles de Node para Linux.

Las familias de pruebas de Node más lentas se dividen o equilibran para que cada trabajo siga siendo pequeño sin reservar ejecutores en exceso:

- Los contratos de Plugin y los contratos de canal se ejecutan cada uno como dos fragmentos ponderados respaldados por Blacksmith, con la alternativa estándar del runner de GitHub.
- Las vías rápidas/de soporte de las pruebas unitarias del núcleo se ejecutan por separado; la infraestructura de runtime del núcleo se divide en fragmentos de proceso, compartidos, hooks, secretos y tres dominios de cron.
- La respuesta automática se ejecuta mediante workers equilibrados, con el subárbol de respuestas dividido en fragmentos de agent-runner, comandos, despacho, sesión y enrutamiento de estado.
- Las configuraciones del gateway/servidor agéntico (plano de control) se dividen en vías de chat, autenticación, modelo, HTTP/plugin, runtime e inicio, en lugar de esperar los artefactos compilados.
- La Pipeline de CI normal empaqueta únicamente fragmentos aislados de infraestructura basados en patrones de inclusión en paquetes deterministas de un máximo de 64 archivos de prueba, lo que reduce la matriz de Node sin fusionar los conjuntos no aislados de comandos/cron, agents-core con estado ni gateway/servidor. Los conjuntos fijos pesados permanecen en 8 vCPU, mientras que las vías empaquetadas y de menor peso usan 4 vCPU.
- Los pull requests del repositorio canónico reutilizan el selector de pruebas modificadas con el diff sintético del árbol fusionado. Los cambios precisos ejecutan un trabajo de Node dirigido; cada archivo de prueba seleccionado obtiene su propio proceso para mantener intacto el aislamiento de los conjuntos con estado. El planificador combina las pruebas hermanas con los dependientes del grafo de importación y recurre al plan compacto existente de conjunto completo con 14 trabajos para cambios en paquetes del workspace, paquetes/archivo de bloqueo, arnés compartido, configuración dividida, archivos renombrados o eliminados, contratos públicos de extensiones, pruebas con configuración especial de fragmentos, objetivos resueltos parcialmente o vacíos, planes de rutas u objetivos sobredimensionados y errores del planificador. Los planes dirigidos siempre conservan la comprobación completa del límite de artefactos compilados porque sus escáneres del repositorio no pueden derivarse de las importaciones. Las inserciones de `main` ejecutan el mismo conjunto compacto completo: los eventos de inserción intermedios pendientes pueden combinarse, por lo que la ejecución superviviente más reciente debe validar todo el árbol de integración, no solo el diff de su última inserción individual. Los despachos manuales y las comprobaciones de publicación conservan la matriz completa con nombre por fragmento.
- La matriz completa de Node admite primero las herramientas seriales que son sistemáticamente lentas, los fragmentos de comandos de respuesta automática y el escritor amplio de caché de core-fast. Esto mantiene el límite de 28 trabajos y evita que el trabajo de la ruta crítica y la semilla de transformación de la siguiente ejecución pasen a una oleada posterior.
- Las pruebas amplias de navegador, QA, multimedia y plugins diversos usan sus configuraciones de Vitest específicas en lugar del conjunto general compartido de plugins. Los fragmentos basados en patrones de inclusión registran entradas de tiempo con el nombre del fragmento de la Pipeline de CI, de modo que `.artifacts/vitest-shard-timings.json` pueda distinguir una configuración completa de un fragmento filtrado.
- Los trabajos de fragmentos de Node en Linux conservan la caché experimental de módulos en el sistema de archivos de Vitest mediante la API de caché de Actions upstream, que Blacksmith acelera de forma transparente en sus runners. Cada fragmento de la Pipeline de CI es exclusivamente de restauración y descomprime la semilla protegida en su propia raíz local del runner; después, el contenedor del fragmento asigna subdirectorios activos separados a los procesos simultáneos de Vitest. Solo el calentador diario que no se cancela o el despachado explícitamente guarda un nuevo archivo inmutable, por lo que los pull requests no pueden publicar transformaciones ni crear familias de caché por PR. Una huella de las entradas de transformación elimina las generaciones incompatibles del archivo de bloqueo, los paquetes, tsconfig y la configuración de Vitest. El escritor protegido examina y reduce su caché al 75 % cuando supera 2 GiB. Vitest calcula hashes del id del módulo, el contenido del código fuente, el entorno y la configuración de transformación resuelta, por lo que los cambios parciales ordinarios del código fuente mantienen calientes las entradas sin cambios, mientras que los módulos modificados producen fallos de caché de forma segura. Los prefijos generales de restauración conectan distintas ejecuciones del workflow; la LRU normal de la caché de Actions y el desalojo por inactividad limitan los archivos inmutables antiguos.
- Los trabajos de confianza de Node en Linux también vinculan el almacén de pnpm y `node_modules` desde un único disco de dependencias protegido por cada línea de Node compatible. Los manifiestos de paquetes, la configuración de instalación, la plataforma del runner y el parche exacto de Node quedan fuera de la clave del disco; una huella exacta del runtime y de las entradas de instalación determina si un trabajo reutiliza el árbol o reinstala y actualiza el mismo disco. Los manifiestos se canonizan antes de calcular el hash. Los hooks raíz directos auditados conservan únicamente los scripts del ciclo de vida de instalación de pnpm, por lo que los cambios de formato y de scripts ordinarios de prueba/compilación mantienen caliente el árbol de dependencias; cualquier desviación no auditada de los hooks del ciclo de vida hace que el proceso falle de forma segura hasta que sus entradas de código fuente se incorporen al contrato de la huella. Los cambios en dependencias, gestor de paquetes, código fuente de hooks y archivo de bloqueo siempre invalidan la instantánea. Un pull request cuya instantánea de solo lectura tenga una huella diferente desvincula el workspace e instala en el almacenamiento local del runner, lo que evita escrituras lentas en un clon que no puede publicar. Las instalaciones en frío en discos persistentes desactivan los reintentos internos de descarga de pnpm y realizan hasta tres intentos completos de instalación acotados desde el almacén calentado progresivamente; un tiempo de espera agotado sigue siendo un fallo. Tras una restauración exacta o una instalación con archivo de bloqueo congelado, la configuración desactiva la comprobación redundante de dependencias previa a la ejecución de pnpm: el repositorio elimina intencionadamente `node_modules` locales de plugins, que pnpm consideraría obsoletos y repararía mediante instalaciones implícitas simultáneas no seguras durante la distribución de fragmentos. La comprobación previa canónica de main es la única escritora y mide el almacén en cada actualización; ejecuta `pnpm store prune` solo después de que las versiones retiradas de paquetes lo eleven por encima de 8 GiB. La publicación de instantáneas de Blacksmith es asíncrona incluso después de finalizar un trabajo escritor, por lo que la primera ejecución tras una clave o huella nueva puede seguir en frío; las restauraciones posteriores con marcador exacto constituyen la prueba del despliegue. Los trabajos requeridos de la Pipeline de CI y los pull requests reciben clones desechables, por lo que los cambios de dependencias no crean discos nuevos, instantáneas competidoras ni un bloqueo de caché capaz de cancelar compilaciones.
- Los trabajos de fragmentos de Node y artefactos de compilación también restauran la caché de compilación portátil en disco de Node mediante cachés inmutables de Actions. Los espacios de nombres independientes `test` y `build` impiden que sus escritores reemplacen los archivos del otro: el calentador de pruebas programado controla la semilla protegida de pruebas, mientras que `build-artifacts` puede publicar como máximo un archivo protegido de compilación por día UTC a partir de inserciones de confianza de `main`. Los PR y los trabajos de pruebas ordinarios solo leen instantáneas protegidas, por lo que el bytecode de las ramas de funcionalidad nunca entra en la semilla compartida y el tráfico de PR no crea archivos de caché. Esto reutiliza el bytecode de V8 para la orquestación cargada por Node, las herramientas de compilación y las dependencias externas entre distintas rutas de checkout, incluso cuando solo cambia una parte del grafo de código fuente. Los procesos secundarios de Vitest desactivan la caché de compilación heredada porque la cobertura puede habilitarse dentro de configuraciones dinámicas y la cobertura de V8 puede perder precisión en las posiciones del código fuente cuando los scripts se deserializan desde bytecode.
- El trabajo de artefactos de compilación también conserva las salidas de pasos de `build-all` con huella de contenido. Las declaraciones del SDK de plugins compiladas por la propia Pipeline de CI calculan un hash del grafo completo de código fuente TypeScript/JSON propiedad del repositorio, excluyen los directorios instalados y generados, y restauran tanto las declaraciones planas como los puentes de paquetes después de que `tsdown` elimine `dist`. La documentación, los workflows, los plugins y otros cambios fuera de ese grafo pueden reutilizar la instantánea de declaraciones; los cambios del código fuente vuelven a compilarla antes de ejecutar la comprobación de exportaciones.
- Las compilaciones completas de declaraciones dividen `tsdown` en grupos de IA, paquetes del workspace y unificado. Cada grupo almacena en caché únicamente las declaraciones y, aun así, vuelve a compilar el JavaScript del runtime antes de restaurarlas. Por tanto, los cambios del núcleo o de plugins solo invalidan el gran grafo unificado, mientras que los cambios en paquetes del workspace invalidan de forma conservadora todos los grupos de declaraciones dependientes. Las compilaciones públicas completas suelen usar una caché inmutable de Actions; las claves generales de restauración sirven de semilla para cambios parciales, las huellas de contenido por grupo rechazan los datos obsoletos y la cuota de caché de GitHub desaloja las generaciones antiguas. En cambio, la vía semanal de Node 22 publica un artefacto de 14 días después de ejecuciones satisfactorias de `main` y solo restaura artefactos cuya identidad inmutable del productor se resuelve a ese workflow en `main`, lo que evita la rotación de la cuota sin permitir que el código de PR escriba en una caché compartida. Las declaraciones de QA privada nunca se conservan en cachés de Actions porque los espacios de nombres de caché no son límites de confidencialidad.
- `check-additional-*` distribuye en franjas la lista suplementaria de comprobaciones de límites (`scripts/run-additional-boundary-checks.mjs`) en un fragmento con uso intensivo de prompts (`check-additional-boundaries-a`, que incluye la comprobación de desviaciones de la instantánea de prompts de Codex) y un fragmento combinado para las franjas restantes (`check-additional-boundaries-bcd`); cada uno ejecuta comprobaciones independientes simultáneamente e imprime los tiempos de cada una. El trabajo de compilación/canario de límites de paquetes permanece unido, y la arquitectura de topología del runtime se ejecuta por separado de la cobertura de supervisión del Gateway integrada en `build-artifacts`.
- En el runner de compilación autoalojado de 32 vCPU, la supervisión del Gateway, las pruebas de canales y el fragmento de límites de soporte del núcleo se inician juntos dentro de `build-artifacts` después de que `dist/` y `dist-runtime/` ya estén compilados. Las ejecuciones alternativas alojadas en GitHub mantienen serializada la supervisión del Gateway para que la contención con pocos núcleos no consuma su plazo de disponibilidad.

Una vez admitida, la Pipeline de CI canónica de Linux permite hasta 28 trabajos simultáneos de pruebas de Node y
12 para las vías rápidas/de comprobación más pequeñas; Windows y Android permanecen en dos porque
esos grupos de runners son más limitados. Los lotes compactos de configuraciones completas se ejecutan con un
tiempo de espera de lote de 120 minutos, mientras que los grupos basados en patrones de inclusión comparten el mismo
presupuesto de trabajos acotado.

La Pipeline de CI de Android ejecuta tanto `testPlayDebugUnitTest` como `testThirdPartyDebugUnitTest` y después compila el APK de depuración de Play. La variante de terceros no tiene un conjunto de código fuente ni un manifiesto independientes; su vía de pruebas unitarias sigue compilando la variante con los indicadores BuildConfig de SMS/registro de llamadas, a la vez que evita un trabajo duplicado de empaquetado del APK de depuración en cada inserción relevante para Android. Cada tarea actual de Gradle tiene un disco persistente protegido; los trabajos de PR usan clones desechables, mientras que las ejecuciones protegidas actualizan en el mismo lugar las entradas de Gradle direccionadas por contenido.

Las claves de discos persistentes de Blacksmith están deliberadamente limitadas por las dimensiones compatibles del runtime o de la tarea, nunca por el número de PR, commit, ejecución, rama o hash de dependencias. Las cachés de transformación y compilación del runtime usan la caché de Actions en lugar de discos persistentes porque los archivos inmutables ofrecen resultados verificables de restauración/guardado y evitan fallos de promoción de instantáneas mutables. Tras una migración de versión de claves persistentes, añada únicamente las identidades exactas de clave, arquitectura y región obsoletas a `.github/retired-sticky-disks.json`, despache `Sticky Disk Cleanup` desde `main` con las mismas dimensiones y confirmación, verifique la eliminación y después retire esas entradas. El workflow dirige las identidades ARM a un runner ARM, rechaza las discrepancias de región del runner, usa la acción de eliminación por clave exacta de Blacksmith y nunca elimina cachés del constructor de Docker ni prefijos comodín. Los archivos de caché de Actions usan la LRU normal y el desalojo por inactividad.

El fragmento `check-dependencies` ejecuta las comprobaciones de producción de Knip para dependencias, archivos sin usar y exportaciones sin usar. La comprobación de archivos sin usar falla cuando un PR añade un archivo nuevo sin usar y sin revisar o deja una entrada obsoleta en la lista de permitidos, mientras conserva las superficies intencionales de plugins dinámicos, código generado, compilación, pruebas en vivo y puentes de paquetes que Knip no puede resolver estáticamente. La comprobación de exportaciones sin usar excluye los archivos de soporte de pruebas y falla con cada exportación de producción sin usar; los consumidores dinámicos intencionales deben modelarse en `config/knip.config.ts`. Los objetivos históricos ejecutan la comprobación de exportaciones cuando la proporcionan y, en caso contrario, conservan su alternativa anterior de detección de código muerto.

## Reenvío de actividad de ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` es el puente del lado de destino desde la actividad del repositorio de OpenClaw hacia ClawSweeper. No realiza checkout ni ejecuta código no confiable de pull requests. El workflow crea un token de GitHub App a partir de `CLAWSWEEPER_APP_PRIVATE_KEY` y después despacha cargas útiles compactas de `repository_dispatch` a `openclaw/clawsweeper`.

El workflow tiene cuatro vías:

- `clawsweeper_item` para solicitudes de revisión de incidencias y pull requests concretas;
- `clawsweeper_comment` para comandos explícitos de ClawSweeper en comentarios de incidencias;
- `clawsweeper_commit_review` para solicitudes de revisión a nivel de commit en envíos `main`;
- `github_activity` para la actividad general de GitHub que el agente ClawSweeper puede inspeccionar.

El carril `github_activity` reenvía únicamente metadatos normalizados: tipo de evento, acción, actor, repositorio, número de elemento, URL, título, estado y extractos breves de comentarios o revisiones cuando están presentes. Evita intencionadamente reenviar el cuerpo completo del webhook. El flujo de trabajo receptor en `openclaw/clawsweeper` es `.github/workflows/github-activity.yml`, que publica el evento normalizado en el hook del Gateway de OpenClaw para el agente ClawSweeper.

La actividad general es observación, no entrega de forma predeterminada. El agente ClawSweeper recibe el destino de Discord en su prompt y solo debe publicar en `#clawsweeper` cuando el evento sea sorprendente, procesable, arriesgado o útil para las operaciones. Las aperturas y ediciones rutinarias, la actividad repetitiva de bots, el ruido de webhooks duplicados y el tráfico normal de revisiones deben dar como resultado `NO_REPLY`.

Los títulos, comentarios, cuerpos, textos de revisión, nombres de ramas y mensajes de commit de GitHub deben tratarse como datos no confiables en toda esta ruta. Son entradas para el resumen y la clasificación, no instrucciones para el flujo de trabajo ni para el entorno de ejecución del agente.

## Ejecuciones manuales

Las ejecuciones manuales de CI ejecutan el mismo grafo de trabajos que la CI normal, pero fuerzan la activación de todos los carriles con ámbito distinto de Android: fragmentos de Node para Linux, fragmentos de plugins incluidos, fragmentos de contratos de plugins y canales, compatibilidad con Node 22, `check-*`, `check-additional-*`, comprobaciones rápidas de artefactos compilados, comprobaciones de documentación, Skills de Python, Windows, macOS, compilación de iOS e i18n de la interfaz de control. La paridad de configuraciones regionales de la interfaz de control es informativa en las ejecuciones automáticas de PR y `main`, porque el flujo de trabajo independiente de actualización corrige en segundo plano las desviaciones generadas; es bloqueante en la CI manual y, por tanto, en la validación completa de la versión. La preparación de la versión ejecuta la misma sincronización de configuraciones regionales antes de inmovilizar el SHA del código y, a continuación, verifica el estado estricto sin valores de respaldo. Las ejecuciones manuales independientes de CI solo ejecutan Android con `include_android=true` (la entrada `release_gate` también fuerza Android); el flujo general de la versión completa habilita Android pasando `include_android=true`. Las comprobaciones estáticas de prepublicación de plugins, el fragmento exclusivo de versión `agentic-plugins`, el barrido completo por lotes de extensiones y los carriles de Docker para la prepublicación de plugins se excluyen de la CI. El conjunto de prepublicación de Docker solo se ejecuta cuando `Full Release Validation` lanza el flujo de trabajo independiente `Plugin Prerelease` con la puerta de validación de la versión habilitada.

Las comprobaciones del máximo de líneas de los PR obtienen la referencia base del árbol de fusión sintético extraído y verifican su padre principal con respecto al encabezado del evento. Las ejecuciones manuales usan un grupo de concurrencia único para que otro envío o ejecución de PR en la misma referencia no cancele un conjunto completo de candidato de versión. La entrada opcional `target_ref` permite que un invocador de confianza ejecute ese grafo sobre una rama, una etiqueta o un SHA de commit completo mientras usa el archivo del flujo de trabajo de la referencia de ejecución seleccionada; la referencia base del máximo de líneas se compara con la base de fusión del destino respecto al encabezado de la rama predeterminada resuelto para esa ejecución. La entrada `release_gate` es una alternativa exacta basada en SHA para mantenedores cuando la CI del PR está bloqueada por falta de capacidad: requiere que `target_ref` sea un SHA de commit completo que coincida con el encabezado de la rama ejecutada y que `pull_request_number` identifique el PR abierto cuyo árbol de fusión se valida.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

La ruta mensual de estabilidad extendida exclusiva de npm es la excepción: se deben ejecutar tanto la comprobación previa `OpenClaw NPM
Release` como `Full Release Validation` desde la rama exacta
`extended-stable/YYYY.M.33`, conservar sus identificadores de ejecución y pasar ambos identificadores a la
ejecución de publicación directa en npm. Consulte [Publicación mensual de estabilidad extendida
exclusiva de npm](/es/reference/RELEASING#monthly-npm-only-extended-stable-publication) para conocer
los comandos, los requisitos exactos de identidad, la lectura de comprobación del registro y el procedimiento
de reparación del selector. Esta ruta no ejecuta la publicación de plugins, macOS, Windows, GitHub
Release, etiquetas de distribución privadas ni otras plataformas.

## Ejecutores

| Ejecutor                          | Trabajos                                                                                                                                                                                                                                                                              |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | `security-fast`, ejecución manual de CI y alternativas para repositorios no canónicos, la agregación de pruebas rápidas de QA, análisis de seguridad y calidad de CodeQL, comprobación de coherencia de los flujos de trabajo, etiquetado, respuesta automática, el flujo de trabajo independiente de documentación y el flujo de trabajo completo de pruebas rápidas de instalación                                |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `pnpm-store-warmup`, `native-i18n`, `checks-fast-core` excepto la CI de pruebas rápidas de QA, fragmentos de contratos de plugins/canales, la mayoría de los fragmentos de Node para Linux incluidos o de menor peso, carriles `check-*` excepto `check-lint`, fragmentos seleccionados de `check-additional-*`, `check-docs` y `skills-python` |
| `blacksmith-8vcpu-ubuntu-2404`  | Conjuntos pesados conservados de Node para Linux, fragmentos `check-additional-*` con un uso intensivo de límites/extensiones y `android`                                                                                                                                                                             |
| `blacksmith-16vcpu-ubuntu-2404` | Fragmentos automáticos de CI de pruebas rápidas de QA, `build-artifacts` en CI y Testbox, y `check-lint` (lo bastante sensibles a la CPU como para que 8 vCPU costaran más de lo que ahorraban)                                                                                                                                  |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                  |
| `blacksmith-6vcpu-macos-15`     | `macos-node` en `openclaw/openclaw`; los forks recurren a `macos-15`                                                                                                                                                                                                                |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` y `ios-build` en `openclaw/openclaw`; los forks recurren a `macos-26`                                                                                                                                                                                               |

## Presupuesto de registro de ejecutores

El segmento actual de registro de ejecutores de GitHub de OpenClaw informa de 10,000 registros de
ejecutores autohospedados cada 5 minutos en `ghx api rate_limit`. Vuelva a comprobar
`actions_runner_registration` antes de cada ajuste, ya que GitHub puede cambiar
este segmento. El límite se comparte entre todos los registros de ejecutores de Blacksmith en la
organización `openclaw`, por lo que añadir otra instalación de Blacksmith no añade
un nuevo segmento.

Las etiquetas de Blacksmith deben tratarse como el recurso escaso para controlar las ráfagas. Los trabajos que
solo enrutan, notifican, resumen, seleccionan fragmentos o ejecutan análisis breves de CodeQL deben
permanecer en ejecutores alojados en GitHub, salvo que tengan necesidades específicas de Blacksmith
demostradas mediante mediciones. Cualquier matriz nueva de Blacksmith, un `max-parallel` mayor
o un flujo de trabajo de alta frecuencia debe mostrar su número de registros en el peor caso y mantener el objetivo
de toda la organización por debajo de aproximadamente el 60% del segmento activo. Con el segmento actual de 10,000 registros,
esto supone un objetivo operativo de 6,000 registros, lo que deja margen para
repositorios simultáneos, reintentos y superposición de ráfagas.

El plan de PR orientado a los destinos modificados reduce la ráfaga habitual de pruebas de Node de 14 registros de Blacksmith a uno. Los PR de riesgo amplio conservan la alternativa compacta de 14 registros, por lo que el peor caso no aumenta.

La CI del repositorio canónico mantiene Blacksmith como ruta predeterminada del ejecutor para las ejecuciones normales de envíos y pull requests. `workflow_dispatch` y las ejecuciones de repositorios no canónicos usan ejecutores alojados en GitHub, pero actualmente las ejecuciones canónicas normales no comprueban el estado de la cola de Blacksmith ni recurren automáticamente a etiquetas alojadas en GitHub cuando Blacksmith no está disponible.

## Equivalentes locales

```bash
pnpm changed:lanes                            # inspeccionar el clasificador local de carriles modificados para origin/main...HEAD
pnpm check:changed                            # puerta inteligente de comprobación local: formato/typecheck/lint/protecciones modificados por carril de límites
pnpm check                                    # puerta local rápida: tsgo de producción + lint fragmentado + protecciones rápidas en paralelo
pnpm check:test-types
pnpm check:timed                              # la misma puerta con tiempos por etapa
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1 node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts
pnpm test                                     # pruebas de vitest
pnpm test:changed                             # destinos de Vitest modificados, económicos e inteligentes
pnpm test:ui                                  # conjunto de pruebas unitarias/de navegador de la interfaz de control
pnpm ui:i18n:check                            # paridad de configuraciones regionales generadas de la interfaz de control (puerta de versión)
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # formato y lint de documentación + enlaces rotos
pnpm build                                    # compilar dist cuando importan las comprobaciones de artefactos/pruebas rápidas de CI
pnpm ios:build                                # generar y compilar el proyecto de la aplicación iOS
pnpm ci:timings                               # resumir la ejecución de CI del último envío a origin/main
pnpm ci:timings:recent                        # comparar ejecuciones recientes y correctas de CI de main
node scripts/ci-run-timings.mjs <run-id>      # resumir el tiempo transcurrido, el tiempo en cola y los trabajos más lentos
node scripts/ci-run-timings.mjs --latest-main # ignorar el ruido de incidencias/comentarios y elegir la CI del envío a origin/main
node scripts/ci-run-timings.mjs --recent 10   # comparar ejecuciones recientes y correctas de CI de main
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm test:startup:memory
pnpm test:extensions:memory -- --json .artifacts/openclaw-performance/source/mock-provider/extension-memory.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## Rendimiento de OpenClaw

`OpenClaw Performance` es el flujo de trabajo de rendimiento del producto/entorno de ejecución. Se ejecuta a diario en `main` y se puede ejecutar manualmente:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

La ejecución manual normalmente mide el rendimiento de la referencia del flujo de trabajo. Establezca `target_ref` para medir el rendimiento de una etiqueta de versión u otra rama con la implementación actual del flujo de trabajo. Las rutas de los informes publicados y los punteros más recientes se identifican mediante la referencia probada, y cada `index.md` registra la referencia/SHA probado, la referencia/SHA del flujo de trabajo, la referencia de Kova, el perfil, el modo de autenticación del carril, el modelo, el número de repeticiones y los filtros de escenarios.

El flujo de trabajo instala OCM desde una versión fijada y Kova desde `openclaw/Kova` en la entrada fijada `kova_ref` y, a continuación, ejecuta tres carriles:

- `mock-provider`: escenarios de diagnóstico de Kova con un entorno de ejecución compilado localmente y autenticación falsa determinista compatible con OpenAI.
- `mock-deep-profile`: generación de perfiles de CPU, heap y trazas para puntos críticos del inicio, el Gateway y los turnos del agente. Se ejecuta según la programación o mediante lanzamiento manual con `deep_profile=true`.
- `live-openai-candidate`: un turno real de agente `openai/gpt-5.6-luna` de OpenAI, omitido cuando `OPENAI_API_KEY` no está disponible. Se ejecuta según la programación o mediante lanzamiento manual con `live_openai_candidate=true`.

La vía del proveedor simulado también ejecuta sondeos de código fuente nativos de OpenClaw después de la pasada de Kova: tiempo de arranque y memoria del Gateway en los casos de inicio predeterminado, con canal omitido, con enlace interno y con cincuenta plugins; RSS de importación de los plugins incluidos, bucles de saludo repetidos con `channel-chat-baseline` de OpenAI simulado, comandos de inicio de la CLI contra el Gateway arrancado y el sondeo rápido de rendimiento del estado de SQLite. Cuando está disponible el informe de código fuente del proveedor simulado publicado anteriormente para la referencia probada, el resumen del código fuente compara los valores actuales de RSS y heap con esa referencia de base y marca los grandes aumentos de RSS como `watch`. El resumen Markdown de los sondeos del código fuente se encuentra en `source/index.md` dentro del paquete del informe, con el JSON sin procesar junto a él.

Cada vía carga su artefacto completo de GitHub, incluidos los paquetes comprimidos de CPU, heap, trazas y diagnósticos. Un trabajo de publicación independiente descarga y valida esos artefactos, después genera un token de corta duración de la GitHub App de ClawSweeper limitado únicamente al contenido de `openclaw/clawgrit-reports` y solo lo pasa al paso de envío de Git. Confirma `report.json`, `report.md`, `index.md`, los artefactos de sondeo del código fuente y los metadatos/sumas de comprobación del paquete en `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`; el archivo de diagnóstico completo permanece en el artefacto enlazado de Actions. El publicador rechaza cualquier archivo de informe de más de 50 MB antes de intentar un envío. El puntero actual de la referencia probada es `openclaw-performance/<tested-ref>/latest-<lane>.json`. Las ejecuciones programadas y los lanzamientos `profile=release` fallan si falla la creación del token de la aplicación o la publicación del informe. En los lanzamientos manuales que no sean de publicación, la publicación sigue siendo informativa y los artefactos de GitHub se conservan cuando falla la autenticación o la publicación. La referencia de base anterior del código fuente se obtiene de forma anónima desde el repositorio público de informes, por lo que una obtención correcta de la referencia de base no demuestra la autenticación del publicador.

## Validación completa de la versión

`Full Release Validation` es el flujo de trabajo general manual para «ejecutarlo todo antes de una publicación». Acepta una rama, etiqueta o SHA de commit completo, lanza el flujo de trabajo manual `CI` con ese destino (incluido Android), lanza `Plugin Prerelease` para las pruebas exclusivas de publicación de plugins, paquetes, análisis estático y Docker, lanza `OpenClaw Performance` contra el SHA de destino y lanza `OpenClaw Release Checks` para la prueba rápida de instalación, la aceptación del paquete, las comprobaciones del paquete entre sistemas operativos, la paridad de QA Lab, Matrix, Telegram y las vías condicionadas de Discord, WhatsApp y Slack (la generación informativa de la tarjeta de puntuación de madurez es opcional mediante `run_maturity_scorecard`). Los perfiles estable y completo siempre incluyen cobertura exhaustiva en vivo/E2E y de pruebas prolongadas de la ruta de publicación de Docker; el perfil beta puede incluirla mediante `run_release_soak=true`. La prueba E2E canónica de Telegram para el paquete se ejecuta dentro de Aceptación del paquete, por lo que un candidato completo no inicia un sondeador en vivo duplicado. Después de publicar, pase `release_package_spec` para reutilizar el paquete npm publicado en las comprobaciones de publicación, Aceptación del paquete, Docker, entre sistemas operativos y Telegram sin volver a compilarlo. Use `npm_telegram_package_spec` únicamente para volver a ejecutar de forma específica Telegram con el paquete publicado. La vía del paquete en vivo del plugin de Codex usa de forma predeterminada el mismo estado seleccionado: el `release_package_spec=openclaw@<tag>` publicado deriva `codex_plugin_spec=npm:@openclaw/codex@<tag>`, mientras que las ejecuciones de SHA/artefactos empaquetan `extensions/codex` desde la referencia seleccionada. Establezca `codex_plugin_spec` explícitamente para fuentes de plugins personalizadas, como las especificaciones `npm:`, `npm-pack:` o `git:`. Su prueba del agente en vivo envía progreso visible, continúa con lecturas aleatorias del espacio de trabajo y una escritura exacta del artefacto y, después, envía la finalización.

Consulte [Validación completa de la versión](/es/reference/full-release-validation) para conocer la
matriz de etapas, los nombres exactos de los trabajos de los flujos de trabajo, las diferencias entre perfiles, los artefactos y los
identificadores de repetición específicos.

`OpenClaw Release Publish` es el flujo de trabajo manual de publicación con modificaciones. Lance
las publicaciones beta y estables normales desde un `main` de confianza después de que exista la etiqueta de publicación
y después de que la comprobación previa de npm de OpenClaw se haya completado correctamente (la comprobación previa ejecuta
`pnpm plugins:sync:check` entre sus comprobaciones). La etiqueta sigue seleccionando el
commit exacto de la publicación, incluido un commit en `release/YYYY.M.PATCH`; las publicaciones alfa
de Tideclaw siguen usando su rama alfa correspondiente. Requiere el
`preflight_run_id` guardado y un
`full_release_validation_run_id` correcto y su
`full_release_validation_run_attempt` exacto, lanza `Plugin NPM Release` para todos
los paquetes de plugins publicables, lanza `Plugin ClawHub Release` para el mismo
SHA de publicación y solo entonces lanza `OpenClaw NPM Release`. La publicación estable también
requiere un `windows_node_tag` exacto; el flujo de trabajo verifica la publicación
del código fuente de Windows y compara sus instaladores x64/ARM64 con la entrada
`windows_node_installer_digests` aprobada para el candidato antes de cualquier publicación secundaria; después, promociona
y verifica esos mismos resúmenes de instaladores fijados, además del contrato exacto del recurso complementario
y de la suma de comprobación, antes de publicar el borrador de la publicación de GitHub.
Las reparaciones específicas solo de plugins usan `plugin_publish_scope=selected` con una
lista de paquetes no vacía. Las ejecuciones `all-publishable` solo de plugins requieren las mismas pruebas
inmutables de la comprobación previa de npm y de la Validación completa de la versión que una publicación del núcleo.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=beta
```

Para realizar pruebas de un commit fijado en una rama que cambia rápidamente, use el asistente en lugar de
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Las referencias de lanzamiento de los flujos de trabajo de GitHub deben ser ramas o etiquetas, no SHA de commits sin procesar. El
asistente envía una rama temporal `release-ci/<sha>-...` en un SHA de flujo de trabajo
`main` de confianza, pasa el SHA de destino solicitado mediante la entrada `ref` del flujo de trabajo,
reutiliza pruebas estrictas del destino exacto cuando están disponibles, verifica que el
`headSha` de cada flujo de trabajo secundario coincida con el SHA del flujo de trabajo de confianza y elimina la rama
temporal cuando termina la ejecución. Pase `-f reuse_evidence=false` para forzar una
validación nueva. El verificador general también falla si algún flujo de trabajo secundario se ejecutó con un
SHA de flujo de trabajo diferente.

`release_profile` controla la amplitud de las pruebas en vivo y de proveedores que se pasa a las comprobaciones de publicación. Los
flujos de trabajo manuales de publicación usan `stable` de forma predeterminada; use `full` únicamente cuando
se quiera utilizar intencionadamente la amplia matriz informativa de proveedores y medios. Las comprobaciones
de las publicaciones estables y completas siempre ejecutan las pruebas exhaustivas en vivo/E2E y prolongadas de la ruta de publicación de Docker;
el perfil beta puede incluirlas mediante `run_release_soak=true`.

- `beta` conserva las vías críticas de publicación más rápidas de OpenAI y el núcleo.
- `stable` añade el conjunto estable de proveedores y backends.
- `full` ejecuta la amplia matriz informativa de proveedores y medios.

El flujo general registra los identificadores de las ejecuciones secundarias lanzadas, y el trabajo final `Verify full validation` vuelve a comprobar las conclusiones actuales de las ejecuciones secundarias y añade tablas de los trabajos más lentos de cada ejecución secundaria. Si se vuelve a ejecutar un flujo de trabajo secundario y pasa a completarse correctamente, vuelva a ejecutar únicamente el trabajo de verificación principal para actualizar el resultado general y el resumen de tiempos.

Para la recuperación, tanto `Full Release Validation` como `OpenClaw Release Checks` aceptan `rerun_group`. Use `all` para un candidato de publicación, `ci` solo para el proceso secundario normal de CI completa, `plugin-prerelease` solo para el proceso secundario de versión preliminar de plugins, `performance` solo para el proceso secundario de rendimiento de OpenClaw, `release-checks` para todos los procesos secundarios de publicación o un grupo más limitado: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` o `npm-telegram` en el flujo general. Esto mantiene limitada la repetición de un entorno de publicación fallido después de una corrección específica. Para una única vía fallida entre sistemas operativos, combine `rerun_group=cross-os` con `cross_os_suite_filter`, por ejemplo, `windows/packaged-upgrade`; los comandos largos entre sistemas operativos emiten líneas de Heartbeat y los resúmenes de actualización del paquete incluyen tiempos por fase. Las vías seleccionadas de QA de Matrix y Telegram bloquean la validación normal de la publicación, al igual que la puerta estándar de cobertura de herramientas del entorno de ejecución. La paridad de QA, la paridad del entorno de ejecución y las vías condicionadas en vivo de Discord, WhatsApp y Slack son informativas.

`OpenClaw Release Checks` usa la referencia de confianza del flujo de trabajo para resolver una vez la referencia seleccionada en un archivo `release-package-under-test` y, después, pasa ese artefacto a las comprobaciones entre sistemas operativos y a Aceptación del paquete, además del flujo de trabajo en vivo/E2E de Docker para la ruta de publicación cuando se ejecuta la cobertura prolongada. Esto mantiene uniformes los bytes del paquete entre los entornos de publicación y evita volver a empaquetar el mismo candidato en varios trabajos secundarios. Para la vía en vivo del plugin npm de Codex, las comprobaciones de publicación pasan una especificación de plugin publicado coincidente derivada de `release_package_spec`, pasan el `codex_plugin_spec` proporcionado por el operador o dejan la entrada vacía para que el script de Docker empaquete el plugin de Codex del checkout seleccionado.

Las ejecuciones duplicadas de `Full Release Validation` para `ref=main` y `rerun_group=all`
sustituyen al flujo general anterior. El monitor principal cancela cualquier flujo de trabajo secundario que
ya haya lanzado cuando se cancela el principal, para que una validación más reciente de main
no quede detrás de una ejecución obsoleta de dos horas de comprobaciones de publicación. La validación
de ramas/etiquetas de publicación y los grupos de repeticiones específicas conservan `cancel-in-progress: false`.

## Fragmentos en vivo y E2E

El proceso secundario en vivo/E2E de la publicación conserva una amplia cobertura nativa de `pnpm test:live`, pero la ejecuta como fragmentos con nombre mediante `scripts/test-live-shard.mjs` en lugar de un trabajo en serie:

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
- fragmentos de medios divididos entre audio/vídeo y fragmentos de música filtrados por proveedor

Esto conserva la misma cobertura de archivos y facilita la repetición y el diagnóstico de los fallos lentos de proveedores en vivo. Los nombres de fragmentos agregados `native-live-src-gateway`, `native-live-extensions-o-z`, `native-live-extensions-media` y `native-live-extensions-media-music` siguen siendo válidos para repeticiones manuales individuales.

Los fragmentos nativos de medios en vivo se ejecutan en `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, creado por el flujo de trabajo `Live Media Runner Image`. Esa imagen preinstala `ffmpeg` y `ffprobe`; los trabajos de medios solo verifican los binarios antes de la configuración. Mantenga los conjuntos de pruebas en vivo respaldados por Docker en ejecutores normales de Blacksmith: los trabajos en contenedores no son el lugar adecuado para iniciar pruebas de Docker anidadas.

Los fragmentos de modelos/backends en vivo respaldados por Docker usan una imagen compartida independiente `ghcr.io/openclaw/openclaw-live-test:<sha>-<extensions>` por cada commit seleccionado. El flujo de trabajo de publicación en vivo compila y envía esa imagen una vez; después, los fragmentos del modelo de Docker en vivo, el Gateway dividido por proveedores, el backend de la CLI, la vinculación de ACP y el entorno de pruebas de Codex se ejecutan con `OPENCLAW_SKIP_DOCKER_BUILD=1`. Los fragmentos de Docker del Gateway llevan límites explícitos `timeout` a nivel de script por debajo del tiempo de espera del trabajo del flujo de trabajo, para que un contenedor bloqueado o una ruta de limpieza fallen rápidamente en lugar de consumir todo el presupuesto de comprobación de la publicación. Si esos fragmentos vuelven a compilar de forma independiente el destino completo del código fuente de Docker, la ejecución de publicación está mal configurada y desperdiciará tiempo real en compilaciones duplicadas de la imagen.

## Aceptación del paquete

Use `Package Acceptance` cuando la pregunta sea «¿funciona como producto este paquete instalable de OpenClaw?». Es diferente de la CI normal: la CI normal valida el árbol de código fuente, mientras que la aceptación del paquete valida un único archivo tar mediante el mismo entorno de pruebas E2E de Docker que usan los usuarios después de instalar o actualizar.

### Trabajos

1. `resolve_package` extrae `workflow_ref`, resuelve un candidato de paquete, escribe `.artifacts/docker-e2e-package/openclaw-current.tgz`, escribe `.artifacts/docker-e2e-package/package-candidate.json`, carga ambos como el artefacto `package-under-test` e imprime el origen, la referencia del flujo de trabajo, la referencia del paquete, la versión, el SHA-256 y el perfil en el resumen del paso de GitHub.
2. `package_integrity` descarga el artefacto `package-under-test` y aplica el contrato del tarball del paquete público con `scripts/check-openclaw-package-tarball.mjs`.
3. `docker_acceptance` llama a `openclaw-live-and-e2e-checks-reusable.yml` con el SHA del origen resuelto del paquete (recurriendo a `workflow_ref`) y `package_artifact_name=package-under-test`. El flujo de trabajo reutilizable descarga ese artefacto, valida el inventario del tarball, prepara imágenes de Docker del resumen del paquete cuando es necesario y ejecuta los carriles de Docker seleccionados con ese paquete en lugar de empaquetar la copia de trabajo del flujo de trabajo. Cuando un perfil selecciona varios `docker_lanes` específicos, el flujo de trabajo reutilizable prepara una sola vez el paquete y las imágenes compartidas y, a continuación, distribuye esos carriles como trabajos de Docker específicos en paralelo con artefactos únicos.
4. `package_telegram` llama opcionalmente a `NPM Telegram Beta E2E`. Se ejecuta cuando `telegram_mode` no es `none` e instala el mismo artefacto `package-under-test` cuando la aceptación de paquetes resolvió uno; la ejecución independiente de Telegram todavía puede instalar una especificación publicada de npm.
5. `summary` hace fallar el flujo de trabajo si fallaron la resolución o la integridad del paquete, la aceptación de Docker o el carril opcional de Telegram. La entrada `advisory` convierte los fallos de aceptación en advertencias para los invocadores consultivos.

### Orígenes de candidatos

- `source=npm` solo acepta `openclaw@extended-stable`, `openclaw@beta`, `openclaw@latest` o una versión de lanzamiento exacta de OpenClaw, como `openclaw@2026.4.27-beta.2`. Use esto para la aceptación de versiones publicadas de soporte estable extendido, preliminares o estables.
- `source=ref` empaqueta una rama, etiqueta o SHA completo de confirmación de confianza de `package_ref`. El resolutor obtiene las ramas y etiquetas de OpenClaw, verifica que se pueda acceder a la confirmación seleccionada desde el historial de ramas del repositorio o una etiqueta de lanzamiento, instala las dependencias en un árbol de trabajo desacoplado y lo empaqueta con `scripts/package-openclaw-for-docker.mjs`.
- `source=url` descarga un `.tgz` HTTPS público; se requiere `package_sha256`. Esta ruta rechaza credenciales en la URL, puertos HTTPS no predeterminados, nombres de host o direcciones IP resueltas que sean privadas, internas o de uso especial, y redirecciones que no cumplan la misma política de seguridad pública.
- `source=trusted-url` descarga un `.tgz` HTTPS desde una política de origen de confianza con nombre en `.github/package-trusted-sources.json`; se requieren `package_sha256` y `trusted_source_id`. Use esto únicamente para réplicas empresariales propiedad de los mantenedores o repositorios de paquetes privados que necesiten hosts, puertos, prefijos de ruta, hosts de redirección o resolución de red privada configurados. Si la política declara autenticación por portador, el flujo de trabajo usa el secreto fijo `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; las credenciales insertadas en la URL siguen rechazándose.
- `source=artifact` descarga un `.tgz` de `artifact_run_id` y `artifact_name`; `package_sha256` es opcional, pero debe proporcionarse para los artefactos compartidos externamente.

Mantenga `workflow_ref` y `package_ref` separados. `workflow_ref` es el código de confianza del flujo de trabajo o del arnés que ejecuta la prueba. `package_ref` es la confirmación de origen que se empaqueta cuando `source=ref`. Esto permite que el arnés de pruebas actual valide confirmaciones antiguas de orígenes de confianza sin ejecutar lógica antigua del flujo de trabajo.

### Perfiles de conjuntos de pruebas

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `root-managed-vps-upgrade`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — el conjunto `package` con cobertura en vivo de `plugins` en lugar de `plugins-offline`, además de `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — fragmentos completos de la ruta de lanzamiento de Docker con OpenWebUI
- `custom` — `docker_lanes` exacto; requerido cuando `suite_profile=custom`

El perfil `package` usa cobertura de plugins sin conexión para que la validación de paquetes publicados no dependa de la disponibilidad en vivo de ClawHub. El carril opcional de Telegram reutiliza el artefacto `package-under-test` en `NPM Telegram Beta E2E`, mientras que la ruta de especificación publicada de npm se conserva para ejecuciones independientes.

Para consultar la política específica de pruebas de actualizaciones y plugins, incluidos los comandos locales,
los carriles de Docker, las entradas de aceptación de paquetes, los valores predeterminados de lanzamiento y la clasificación de fallos,
consulte [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins).

Las comprobaciones de lanzamiento llaman a la aceptación de paquetes con `source=artifact`, el artefacto de paquete de lanzamiento preparado, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape'` y `telegram_mode=mock-openai`. Esto mantiene la migración de paquetes, la actualización, la instalación en vivo de Skills de ClawHub, la limpieza de dependencias obsoletas de plugins, la reparación de la instalación de plugins configurados, el plugin sin conexión, la actualización de plugins y la prueba de Telegram en el mismo tarball de paquete resuelto. Establezca `release_package_spec` en la validación completa del lanzamiento o en las comprobaciones de lanzamiento de OpenClaw después de publicar una versión beta para ejecutar la misma matriz con el paquete de npm distribuido sin volver a compilarlo; establezca `package_acceptance_package_spec` únicamente cuando la aceptación de paquetes necesite un paquete diferente al del resto de la validación del lanzamiento. Las comprobaciones de lanzamiento entre sistemas operativos siguen cubriendo la incorporación, el instalador y el comportamiento específico de cada plataforma; la validación del producto de paquetes y actualizaciones debe comenzar con la aceptación de paquetes.

El carril de Docker `published-upgrade-survivor` valida una referencia publicada de paquete por ejecución en la ruta de bloqueo del lanzamiento. En la aceptación de paquetes, el tarball `package-under-test` resuelto siempre es el candidato y `published_upgrade_survivor_baseline` selecciona la referencia publicada alternativa, cuyo valor predeterminado es `openclaw@latest`; los comandos para volver a ejecutar carriles fallidos conservan esa referencia. La validación completa del lanzamiento con `run_release_soak=true` o `release_profile=full` establece `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` y `published_upgrade_survivor_scenarios=reported-issues` para ampliar la cobertura a las cuatro versiones estables más recientes de npm, además de versiones límite fijadas de compatibilidad de plugins y casos de prueba con forma de incidencia para la configuración de Feishu, los archivos de arranque y persona conservados, las instalaciones configuradas de plugins de OpenClaw, las rutas de registro con virgulilla y las raíces obsoletas de dependencias de plugins heredados. Las selecciones de supervivencia de actualizaciones publicadas con múltiples referencias se dividen por referencia en trabajos independientes de ejecución específica de Docker. El flujo de trabajo independiente `Update Migration` usa el carril de Docker `update-migration` con referencias `all-since-2026.4.23` y escenarios `plugin-deps-cleanup` cuando se busca una limpieza exhaustiva de actualizaciones publicadas, no la amplitud normal de la CI completa del lanzamiento. Las ejecuciones agregadas locales pueden pasar especificaciones exactas de paquetes con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, conservar un solo carril con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, como `openclaw@2026.4.15`, o establecer `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` para la matriz de escenarios. El carril publicado configura la referencia con una receta de comandos `openclaw config set` incorporada, registra los pasos de la receta en `summary.json` y sondea `/healthz`, `/readyz` y el estado de RPC después de iniciar el Gateway. Los carriles nuevos del paquete y del instalador para Windows también verifican que un paquete instalado pueda importar una sustitución del control del navegador desde una ruta absoluta sin procesar de Windows. La prueba de humo entre sistemas operativos de un turno de agente de OpenAI usa de forma predeterminada `OPENCLAW_CROSS_OS_OPENAI_MODEL` cuando está establecido y, de lo contrario, `openai/gpt-5.6-luna`, de modo que la prueba de instalación y del Gateway utiliza el nivel de pruebas GPT-5.6 de menor coste.

### Periodos de compatibilidad heredada

La aceptación de paquetes tiene periodos delimitados de compatibilidad heredada para paquetes ya publicados. Los paquetes hasta `2026.4.25`, incluido `2026.4.25-beta.*`, pueden usar la ruta de compatibilidad:

- las entradas conocidas de control de calidad privado en `dist/postinstall-inventory.json` pueden apuntar a archivos omitidos del tarball;
- `doctor-switch` puede omitir el subcaso de persistencia `gateway install --wrapper` cuando el paquete no expone esa marca;
- `update-channel-switch` puede eliminar los `patchedDependencies` de pnpm que falten del caso de prueba de Git falso derivado del tarball y puede registrar los `update.channel` persistentes que falten;
- las pruebas de humo de plugins pueden leer ubicaciones heredadas de registros de instalación o aceptar que no se conserven los registros de instalación del catálogo;
- `plugin-update` puede permitir la migración de metadatos de configuración sin dejar de exigir que el registro de instalación y el comportamiento sin reinstalación permanezcan sin cambios.

El paquete publicado `2026.4.26` también puede emitir advertencias por archivos de sello de metadatos de compilación local que ya se distribuyeron, y los paquetes hasta `2026.5.20` pueden emitir una advertencia en lugar de fallar cuando falta `npm-shrinkwrap.json`. Los paquetes posteriores deben satisfacer los contratos modernos; las mismas condiciones hacen que se produzca un fallo en lugar de una advertencia u omisión.

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

# Valide el paquete de soporte estable extendido publicado con cobertura de paquetes.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@extended-stable \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Empaquete y valide una rama de lanzamiento con el arnés actual.
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

# Valide un tarball desde una política con nombre de réplica privada de confianza.
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

Al depurar una ejecución fallida de aceptación de paquetes, comience por el resumen `resolve_package` para confirmar el origen, la versión y el SHA-256 del paquete. A continuación, inspeccione la ejecución secundaria `docker_acceptance` y sus artefactos de Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, los registros de los carriles, los tiempos de las fases y los comandos de reejecución. Es preferible volver a ejecutar el perfil de paquete fallido o los carriles exactos de Docker en lugar de repetir la validación completa del lanzamiento.

## Prueba de humo de instalación

El flujo de trabajo `Install Smoke` ya no se ejecuta en pull requests ni en envíos a `main`. Tanto su contenedor nocturno/manual como la validación del lanzamiento llaman al núcleo de solo lectura `install-smoke-reusable.yml`, y cada ejecución recorre la ruta completa de la prueba de humo de instalación en ejecutores alojados en GitHub:

- La imagen de prueba de humo del Dockerfile raíz se compila una vez por SHA de destino, se vincula a la revisión del flujo de trabajo y al intento del productor en un artefacto inmutable y, a continuación, la cargan la prueba de humo de la CLI, la prueba de humo de la CLI de eliminación de espacios de trabajo compartidos por agentes, la prueba E2E de la red del Gateway del contenedor y la prueba de humo del argumento de compilación del plugin `matrix` incluido. La prueba de humo del plugin verifica la replicación de la instalación de dependencias en tiempo de ejecución y que el plugin se cargue sin diagnósticos de escape del punto de entrada.
- La instalación del paquete mediante QR y las pruebas de humo de Docker del instalador y la actualización (incluidos los carriles del instalador de Rocky Linux y un carril de actualización con una referencia configurable de npm `update_baseline_version`) se ejecutan como trabajos independientes para que el trabajo del instalador no tenga que esperar a las pruebas de humo de la imagen raíz.

La prueba de humo lenta del proveedor de imágenes para la instalación global de Bun está controlada por separado mediante `run_bun_global_install_smoke`. Se ejecuta según la programación nocturna, está activada de forma predeterminada para las llamadas al flujo de trabajo desde las comprobaciones de lanzamiento y los despachos manuales de `Install Smoke` pueden habilitarla. La CI normal de los pull requests sigue ejecutando el carril rápido de regresión del iniciador de Bun para los cambios pertinentes para Node. Las pruebas de Docker del código QR y del instalador mantienen sus propios Dockerfiles centrados en la instalación.

## E2E local de Docker

`pnpm test:docker:all` precompila una imagen compartida de pruebas en vivo, empaqueta OpenClaw una vez como tarball de npm y compila dos imágenes compartidas de `scripts/e2e/Dockerfile`:

- un ejecutor básico de Node/Git para los carriles de instalador, actualización y dependencias de plugins;
- una imagen funcional que instala el mismo tarball en `/app` para los carriles de funcionalidad normal.

Las definiciones de los carriles de Docker se encuentran en `scripts/lib/docker-e2e-scenarios.mjs`, la lógica del planificador se encuentra en `scripts/lib/docker-e2e-plan.mjs` y el ejecutor solo ejecuta el plan seleccionado. El programador selecciona la imagen por carril con `OPENCLAW_DOCKER_E2E_BARE_IMAGE` y `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` y, a continuación, ejecuta los carriles con `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parámetros ajustables

| Variable                               | Valor predeterminado | Propósito                                                                                       |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Cantidad de ranuras del grupo principal para los carriles normales.                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Cantidad de ranuras del grupo final sensible a proveedores.                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Límite de carriles en vivo simultáneos para que los proveedores no apliquen limitaciones.                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5       | Límite de carriles simultáneos de instalación de npm.                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Límite de carriles multiservicio simultáneos.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Intervalo escalonado entre inicios de carriles para evitar ráfagas de creación en el daemon de Docker; establezca `0` para no aplicar ningún intervalo.     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Tiempo de espera de reserva por carril (120 minutos); los carriles en vivo/finales seleccionados usan límites más estrictos.           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | sin establecer   | `1` imprime el plan del programador sin ejecutar los carriles.                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | sin establecer   | Lista separada por comas de carriles exactos; omite la prueba de humo de limpieza para que los agentes puedan reproducir un carril fallido. |

Un carril más pesado que su límite efectivo puede iniciarse aun así desde un grupo vacío y, después, ejecutarse en solitario hasta que libere capacidad. El agregado local realiza comprobaciones previas de Docker, elimina los contenedores E2E obsoletos de OpenClaw, emite el estado de los carriles activos, conserva los tiempos de los carriles para ordenarlos del más largo al más corto y, de forma predeterminada, deja de programar nuevos carriles agrupados después del primer fallo.

### Flujo de trabajo reutilizable en vivo/E2E

El flujo de trabajo reutilizable en vivo/E2E consulta a `scripts/test-docker-all.mjs --plan-json` qué paquete, tipo de imagen, imagen en vivo, carril y cobertura de credenciales se requieren. A continuación, `scripts/docker-e2e.mjs` convierte ese plan en salidas y resúmenes de GitHub. Empaqueta OpenClaw mediante `scripts/package-openclaw-for-docker.mjs`, descarga un artefacto de paquete de la ejecución actual o descarga un artefacto de paquete desde `package_artifact_run_id` y, después, valida el inventario del tarball. La ruta predeterminada `no-push-artifact` compila imágenes básicas/funcionales etiquetadas con el resumen del paquete mediante la caché de capas de Docker de Blacksmith, empaqueta los bytes exactos de la imagen en un artefacto inmutable del flujo de trabajo y hace que cada consumidor verifique y cargue ese artefacto. En cambio, `existing-only` requiere referencias explícitas de GHCR `docker_e2e_bare_image`/`docker_e2e_functional_image` y nunca compila ni publica. Esas extracciones del registro usan un tiempo de espera limitado de 180 segundos por intento para que un flujo bloqueado vuelva a intentarse rápidamente en lugar de consumir la mayor parte de la ruta crítica de la CI. Después de una validación programada correcta, `openclaw-scheduled-live-checks.yml` pasa el manifiesto inmutable de las imágenes probadas al publicador independiente con permiso de escritura de paquetes; los invocadores de lanzamientos y prelanzamientos de solo lectura nunca pasan por ese publicador.

### Fragmentos de la ruta de lanzamiento

La cobertura de Docker del lanzamiento ejecuta trabajos fragmentados más pequeños con `OPENCLAW_SKIP_DOCKER_BUILD=1` para que cada fragmento verifique y cargue únicamente el tipo de imagen respaldado por artefactos que necesita (o lo extraiga con la reutilización explícita de `existing-only`) y ejecute varios carriles mediante el mismo programador ponderado:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | openwebui`

Los fragmentos actuales de Docker para lanzamientos son `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, desde `plugins-runtime-install-a` hasta `plugins-runtime-install-h` y `openwebui`. `package-update-openai` incluye el carril en vivo del paquete del plugin Codex, que instala el paquete candidato de OpenClaw, instala el plugin Codex desde `codex_plugin_spec` o desde un tarball de la misma referencia con aprobación explícita para instalar la CLI de Codex, ejecuta las comprobaciones previas de la CLI de Codex y turnos del agente en la misma sesión y, después, ejecuta un turno de razonamiento medio sin reintentos que envía el progreso, lee entradas aleatorias del espacio de trabajo, escribe su artefacto exacto y envía la finalización. `plugins-runtime-core`, `plugins-runtime` y `plugins-integrations` siguen siendo alias agregados del plugin/entorno de ejecución. El alias de carril `install-e2e` sigue siendo el alias agregado de repetición manual para ambos carriles de instaladores de proveedores.

OpenWebUI se ejecuta como un fragmento independiente `openwebui` en un ejecutor Blacksmith dedicado con disco de gran capacidad siempre que la cobertura estable o completa de la ruta de lanzamiento lo solicite, incluso cuando el flujo de trabajo reutilizable dirige los trabajos compatibles a ejecutores alojados en GitHub. Mantener separada la extracción de la imagen externa evita que la imagen grande compita con las imágenes compartidas de paquetes y plugins en `plugins-runtime-services`; los fragmentos agregados heredados de plugins/entornos de ejecución siguen incluyendo OpenWebUI para repeticiones manuales compatibles. Los carriles de actualización de canales incluidos vuelven a intentarlo una vez ante fallos transitorios de red de npm.

Cada fragmento carga `.artifacts/docker-tests/` con registros de los carriles, tiempos, `summary.json`, `failures.json`, tiempos de las fases, el JSON del plan del programador, tablas de carriles lentos y comandos de repetición por carril. La entrada `docker_lanes` del flujo de trabajo ejecuta los carriles seleccionados contra imágenes preparadas para esa ejecución en lugar de los trabajos fragmentados, lo que mantiene la depuración de carriles fallidos limitada a un único trabajo de Docker dirigido; si un carril seleccionado es un carril de Docker en vivo, el trabajo dirigido compila localmente la imagen de pruebas en vivo para esa repetición. El asistente de repetición valida el SHA de destino seleccionado exacto del artefacto del fallo y el despacho manual vuelve a empaquetar esa referencia, porque la tupla interna del paquete del flujo de trabajo reutilizable no forma parte del esquema `workflow_dispatch`. Los comandos generados incluyen entradas de imágenes preparadas y `shared_image_policy=existing-only` solo cuando esas entradas están respaldadas por GHCR; las etiquetas de artefactos locales del ejecutor se omiten para que un ejecutor nuevo vuelva a compilarlas. Una sustitución explícita del destino descarta las referencias recuperadas de imágenes de GHCR salvo que el artefacto demuestre que coinciden con la sustitución. Las referencias de definición del flujo de trabajo generadas por artefactos también se omiten porque se eliminan las ramas temporales del lanzamiento completo; el despacho usa la rama predeterminada del repositorio salvo que el operador la sustituya explícitamente.

```bash
pnpm test:docker:rerun <run-id>      # descargar los artefactos de Docker e imprimir los comandos de repetición dirigidos combinados/por carril
pnpm test:docker:timings <summary>   # resúmenes de los carriles lentos y de la ruta crítica de las fases
```

El flujo de trabajo programado en vivo/E2E ejecuta diariamente el conjunto completo de Docker de la ruta de lanzamiento y, tras completarse correctamente, invoca al publicador explícito para los artefactos exactos de las imágenes probadas.

## Prelanzamiento de plugins

`Plugin Prerelease` ofrece una cobertura de producto/paquete más costosa, por lo que es un flujo de trabajo independiente despachado por `Full Release Validation` o por un operador explícito. Los pull requests normales, las inserciones de `main` y los despachos manuales independientes de CI mantienen desactivado ese conjunto. Equilibra las pruebas de plugins incluidos entre ocho ejecutores de extensiones; esos trabajos de fragmentos de extensiones ejecutan hasta dos grupos de configuración de plugins a la vez con un ejecutor de Vitest por grupo y un heap de Node más grande para que los lotes de plugins con muchas importaciones no creen trabajos de CI adicionales. La ruta de prelanzamiento de Docker exclusiva del lanzamiento (habilitada por la entrada `full_release_validation`) agrupa los carriles de Docker dirigidos en grupos de cuatro para evitar reservar decenas de ejecutores para trabajos de entre uno y tres minutos. El flujo de trabajo también carga un artefacto informativo `plugin-inspector-advisory` desde `@openclaw/plugin-inspector`; los hallazgos del inspector sirven como información para el triaje y no cambian la puerta de bloqueo de Prelanzamiento de plugins.

## QA Lab

QA Lab tiene carriles de CI dedicados fuera del flujo de trabajo principal con alcance inteligente. La paridad agéntica está anidada bajo los amplios conjuntos de QA y lanzamiento, no en un flujo de trabajo independiente para pull requests. Use `Full Release Validation` con `rerun_group=qa-parity` cuando la paridad deba acompañar a una ejecución de validación amplia.

- El flujo de trabajo `QA-Lab - All Lanes` se ejecuta cada noche en `main` y mediante despacho manual; distribuye trabajos de paridad simulada y trabajos en vivo de Matrix, Telegram, Discord, WhatsApp y Slack. Los trabajos en vivo usan el entorno `qa-live-shared`; Telegram, Discord, WhatsApp y Slack usan concesiones de Convex, mientras que Matrix aprovisiona credenciales locales desechables.

Las comprobaciones de lanzamiento ejecutan carriles de transporte en vivo de Matrix y Telegram con el proveedor simulado determinista y modelos cualificados como simulados (`mock-openai/gpt-5.6-luna` y `mock-openai/gpt-5.6-luna-alt`) para aislar el contrato del canal de la latencia del modelo en vivo y del inicio normal del plugin del proveedor. El Gateway de transporte en vivo desactiva la búsqueda en memoria porque la paridad de QA cubre por separado el comportamiento de la memoria; la conectividad del proveedor está cubierta por los conjuntos independientes del modelo en vivo, el proveedor nativo y el proveedor de Docker.

Las puertas de Matrix programadas y de lanzamiento usan el host compartido del conjunto de QA Lab y el adaptador en vivo con los escenarios de lanzamiento. El valor predeterminado de la CLI y la entrada manual del flujo de trabajo siguen siendo `all`; los despachos manuales de `all` distribuyen los perfiles `transport`, `media`, `e2ee-smoke`, `e2ee-deep` y `e2ee-cli` para que la prueba de 93 escenarios permanezca dentro de los tiempos de espera por trabajo. Los despachos manuales específicos seleccionan `fast`, `release` o `transport` en un solo trabajo.

`OpenClaw Release Checks` también ejecuta los carriles de QA Lab críticos para el lanzamiento antes de aprobarlo; su puerta de paridad de QA ejecuta los paquetes candidato y de referencia como trabajos de carriles paralelos y, después, descarga ambos artefactos en un pequeño trabajo de informe para realizar la comparación final de paridad.

Para los pull requests normales, siga las pruebas de CI/comprobaciones con alcance específico en lugar de tratar la paridad como un estado obligatorio.

## CodeQL

El flujo de trabajo `CodeQL` es intencionadamente un escáner de seguridad limitado de primera pasada, no un análisis completo del repositorio. Las ejecuciones diarias, manuales, las inserciones de `main` y las ejecuciones de protección de pull requests que no sean borradores analizan el código de los flujos de trabajo de Actions, además de las superficies de JavaScript/TypeScript de mayor riesgo, con consultas de seguridad de alta confianza filtradas por `security-severity` de nivel alto/crítico.

La protección de pull requests se mantiene ligera: solo se inicia para cambios en `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `scripts`, `src` o en rutas de entornos de ejecución de plugins incluidos que sean propietarias de procesos, y ejecuta la misma matriz de seguridad de alta confianza que el flujo de trabajo programado. CodeQL para Android y macOS permanece fuera de los valores predeterminados de los pull requests.

### Categorías de seguridad

| Categoría                                         | Superficie                                                                                                                          |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Autenticación, secretos, sandbox, cron y línea base del Gateway                                                                     |
| `/codeql-security-high/channel-runtime-boundary`  | Contratos de implementación de canales del núcleo, además del entorno de ejecución de plugins de canal, el Gateway, el SDK de plugins, los secretos y los puntos de contacto de auditoría |
| `/codeql-security-high/network-ssrf-boundary`     | Superficies de políticas de SSRF del núcleo, análisis de IP, protección de red, obtención web y SDK de plugins                      |
| `/codeql-security-high/mcp-process-tool-boundary` | Servidores MCP, auxiliares de ejecución de procesos, entrega saliente y barreras de ejecución de herramientas del agente            |
| `/codeql-security-high/process-exec-boundary`     | Shell local, auxiliares de creación de procesos, entornos de ejecución de plugins incluidos que gestionan subprocesos y código de enlace de scripts de flujo de trabajo |
| `/codeql-security-high/plugin-trust-boundary`     | Superficies de confianza de instalación, cargador, manifiesto, registro, instalación mediante gestor de paquetes, carga de fuentes y contrato de paquetes del SDK de plugins |

### Fragmentos de seguridad específicos de cada plataforma

- `CodeQL Android Critical Security` — fragmento programado de seguridad de Android. Compila manualmente la aplicación de Android para CodeQL en el runner Linux de Blacksmith más pequeño que acepta la comprobación de coherencia del flujo de trabajo. Carga los resultados bajo `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — fragmento de seguridad de macOS semanal/manual. Compila manualmente la aplicación de macOS para CodeQL en Blacksmith macOS, excluye de los archivos SARIF cargados los resultados de compilación de dependencias y carga los resultados bajo `/codeql-critical-security/macos`. Se mantiene fuera de los valores predeterminados diarios porque la compilación de macOS domina el tiempo de ejecución incluso cuando no hay incidencias.

### Categorías críticas de calidad

`CodeQL Critical Quality` es el fragmento equivalente no relacionado con la seguridad. Ejecuta únicamente consultas de calidad de JavaScript/TypeScript no relacionadas con la seguridad y con gravedad de error sobre superficies limitadas de alto valor en runners Linux alojados en GitHub, para que los análisis de calidad no consuman el presupuesto de registro de runners de Blacksmith. Su barrera para pull requests es intencionadamente más pequeña que el perfil programado: los PR que no sean borradores ejecutan únicamente los fragmentos correspondientes a las superficies que modifican, de entre trece fragmentos direccionables para PR: `agent-runtime-boundary`, `channel-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `gateway-runtime-boundary`, `mcp-process-runtime-boundary`, `memory-runtime-boundary`, `network-runtime-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, `plugin-sdk-reply-runtime`, `provider-runtime-boundary` y `session-diagnostics-boundary`. `ui-control-plane` y `web-media-runtime-boundary` quedan fuera de las ejecuciones de PR. Los cambios en la configuración de CodeQL y en el flujo de trabajo de calidad ejecutan el conjunto completo de fragmentos de PR (el fragmento del entorno de ejecución de red se activa según sus propios archivos de configuración de CodeQL y las rutas de código fuente que gestionan la red).

La ejecución manual acepta:

```text
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|network-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Los perfiles limitados son puntos de apoyo para aprendizaje e iteración que permiten ejecutar un fragmento de calidad de forma aislada.

| Categoría                                               | Superficie                                                                                                                                                         |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Código de límites de seguridad de autenticación, secretos, sandbox, cron y Gateway                                                                                |
| `/codeql-critical-quality/config-boundary`              | Contratos de esquema, migración, normalización y E/S de configuración                                                                                             |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Esquemas del protocolo del Gateway y contratos de métodos del servidor                                                                                            |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratos de implementación del canal del núcleo y de los plugins de canal incluidos                                                                              |
| `/codeql-critical-quality/agent-runtime-boundary`       | Contratos del entorno de ejecución para ejecución de comandos, envío de modelos/proveedores, envío y colas de respuestas automáticas y plano de control de ACP    |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Servidores MCP y puentes de herramientas, auxiliares de supervisión de procesos y contratos de entrega saliente                                                    |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK del host de memoria, fachadas del entorno de ejecución de memoria, alias del SDK de plugins para memoria, código de enlace para la activación del entorno de ejecución de memoria y comandos doctor de memoria |
| `/codeql-critical-quality/network-runtime-boundary`     | Paquete de políticas de red, entorno de ejecución de sockets sin procesar y captura de proxy, túnel SSH, bloqueo del Gateway, socket JSONL y superficies de transporte push |
| `/codeql-critical-quality/session-diagnostics-boundary` | Componentes internos de la cola de respuestas, colas de entrega de sesiones, auxiliares de vinculación/entrega de sesiones salientes, superficies de paquetes de eventos/registros de diagnóstico y contratos de CLI de doctor de sesiones |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Envío de respuestas entrantes del SDK de plugins, auxiliares de carga útil, fragmentación y entorno de ejecución de respuestas, opciones de respuesta de canales, colas de entrega y auxiliares de vinculación de sesiones/hilos |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalización del catálogo de modelos, autenticación y detección de proveedores, registro del entorno de ejecución de proveedores, valores predeterminados/catálogos de proveedores y registros de web/búsqueda/obtención/embeddings |
| `/codeql-critical-quality/ui-control-plane`             | Inicialización de la interfaz de control, persistencia local, flujos de control del Gateway y contratos del entorno de ejecución del plano de control de tareas    |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contratos del entorno de ejecución de obtención/búsqueda web del núcleo, E/S multimedia, comprensión multimedia, generación de imágenes y generación multimedia   |
| `/codeql-critical-quality/plugin-boundary`              | Contratos del cargador, registro, superficie pública y puntos de entrada del SDK de plugins                                                                       |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Código fuente publicado del SDK de plugins del lado del paquete y auxiliares de contratos de paquetes de plugins                                                   |

La calidad se mantiene separada de la seguridad para que los hallazgos de calidad se puedan programar, medir, desactivar o ampliar sin ocultar la señal de seguridad. La ampliación de CodeQL para Swift, Python y plugins incluidos solo debe reincorporarse como trabajo de seguimiento delimitado o fragmentado después de que los perfiles limitados tengan un tiempo de ejecución y una señal estables.

## Flujos de trabajo de mantenimiento

### Agente de documentación

El flujo de trabajo `Docs Agent` es una vía de mantenimiento de Codex controlada por eventos para mantener la documentación existente alineada con los cambios integrados recientemente. No tiene una programación pura: una ejecución correcta de CI de un push que no sea de bot en `main` puede activarlo, y la ejecución manual puede iniciarlo directamente. Las invocaciones mediante ejecuciones de flujo de trabajo se omiten cuando `main` ha avanzado o cuando se creó en la última hora otra ejecución no omitida del Agente de documentación. Cuando se ejecuta, revisa el intervalo de commits desde el SHA de origen de la ejecución anterior no omitida del Agente de documentación hasta el `main` actual, de modo que una ejecución por hora puede abarcar todos los cambios de main acumulados desde la última revisión de documentación.

### Agente de rendimiento de pruebas

El flujo de trabajo `Test Performance Agent` es una vía de mantenimiento de Codex controlada por eventos para pruebas lentas. No tiene una programación pura: una ejecución correcta de CI de un push que no sea de bot en `main` puede activarlo, pero se omite si otra invocación mediante ejecución de flujo de trabajo ya se ejecutó o está en ejecución durante ese día UTC. La ejecución manual omite esa barrera de actividad diaria. La vía genera un informe de rendimiento agrupado de Vitest para la suite completa, permite que Codex realice únicamente pequeñas correcciones de rendimiento de pruebas que conserven la cobertura, en lugar de refactorizaciones amplias, después vuelve a ejecutar el informe de la suite completa y rechaza los cambios que reduzcan el recuento base de pruebas superadas. El informe agrupado registra el tiempo de reloj por configuración y el RSS máximo en Linux y macOS, para que la comparación anterior/posterior muestre las diferencias de memoria de las pruebas junto con las diferencias de duración. Si la línea base tiene pruebas fallidas, Codex solo puede corregir fallos evidentes y el informe de la suite completa posterior al agente debe aprobarse antes de realizar cualquier commit. Cuando `main` avanza antes de que se complete el push del bot, la vía reorganiza el parche validado mediante rebase, vuelve a ejecutar `pnpm check:changed` e intenta de nuevo el push; los parches obsoletos con conflictos se omiten. Utiliza Ubuntu alojado en GitHub para que la acción de Codex pueda mantener la misma postura de seguridad de eliminación de sudo que el agente de documentación.

### PR duplicados después de la integración

El flujo de trabajo `Duplicate PRs After Merge` es un flujo de trabajo manual para mantenedores destinado a la limpieza de duplicados después de la integración. De forma predeterminada, realiza un simulacro y solo cierra los PR indicados explícitamente cuando `apply=true`. Antes de modificar GitHub, verifica que el PR integrado esté fusionado y que cada duplicado tenga un issue referenciado compartido o fragmentos modificados que se solapen.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Barreras de comprobación local y direccionamiento de cambios

La lógica local de vías modificadas reside en `scripts/changed-lanes.mjs` y la ejecuta `scripts/check-changed.mjs`. Esa barrera de comprobación local es más estricta con los límites arquitectónicos que el ámbito amplio de plataformas de CI:

- los cambios de producción del núcleo ejecutan la comprobación de tipos de producción y de pruebas del núcleo, además del lint y las protecciones del núcleo;
- los cambios únicamente en pruebas del núcleo ejecutan solo la comprobación de tipos de pruebas del núcleo, además del lint del núcleo;
- los cambios de producción de extensiones ejecutan la comprobación de tipos de producción y de pruebas de extensiones, además del lint de extensiones;
- los cambios únicamente en pruebas de extensiones ejecutan la comprobación de tipos de pruebas de extensiones, además del lint de extensiones;
- los cambios públicos en el SDK de plugins o en contratos de plugins amplían la comprobación de tipos a las extensiones porque estas dependen de esos contratos del núcleo (los barridos de extensiones de Vitest siguen siendo trabajo de pruebas explícito);
- los incrementos de versión que solo afectan a metadatos de lanzamiento ejecutan comprobaciones específicas de versión, configuración y dependencias raíz;
- los cambios desconocidos en la raíz/configuración adoptan una postura segura y ejecutan todas las vías de comprobación.

El direccionamiento local de pruebas modificadas reside en `scripts/test-projects.test-support.mjs` y es intencionadamente más económico que `check:changed`: las modificaciones directas de pruebas ejecutan esas mismas pruebas; las modificaciones de código fuente priorizan las asignaciones explícitas y, después, las pruebas hermanas y los dependientes del grafo de importación. La configuración compartida de entrega en salas de grupo es una de las asignaciones explícitas: los cambios en la configuración de respuestas visibles del grupo, el modo de entrega de respuestas del código fuente o el prompt del sistema de la herramienta de mensajes se direccionan a través de las pruebas de respuesta del núcleo, además de las regresiones de entrega de Discord y Slack, para que un cambio predeterminado compartido falle antes del primer push del PR. Utilice `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` únicamente cuando el cambio abarque tanto el arnés que el conjunto asignado económico no sea una aproximación fiable.

## Validación con Testbox

Crabbox es el contenedor de máquinas remotas gestionado por el repositorio para las verificaciones de mantenedores en Linux. Las sesiones de
agentes mantienen en local una o unas pocas pruebas específicas y comprobaciones estáticas económicas solo para
código fuente de confianza cuando la instalación de dependencias existente está lista. Usan Crabbox para suites más grandes y
trabajo computacionalmente intensivo, incluidas compilaciones, comprobaciones de tipos, distribución en paralelo del lint,
Docker, carriles de paquetes, E2E, verificación en vivo y paridad con la CI. La verificación intensiva de mantenedores de confianza
utiliza de forma predeterminada `blacksmith-testbox`, y `.crabbox.yaml` ahora también lo utiliza de forma predeterminada. Su flujo de trabajo
configurado incorpora las credenciales del proveedor y del agente, por lo que el código no fiable de colaboradores o
bifurcaciones debe usar en su lugar una CI de bifurcación sin secretos o Crabbox directo en AWS y desinfectado.
Las ejecuciones de AWS desinfectadas establecen `CRABBOX_ENV_ALLOW=CI`, pasan
`--no-hydrate` y usan un `HOME` remoto temporal nuevo; esto impide que la lista de permitidos
`OPENCLAW_*` del repositorio y los perfiles de autenticación existentes lleguen al código no fiable.
Usan un arrendamiento recién preparado dedicado a ese código fuente no fiable, nunca un
arrendamiento de confianza ni uno previamente provisto de credenciales. Inicie un binario de Crabbox
de confianza instalado desde un checkout `main` limpio y de confianza, y obtenga únicamente el PR remoto con
`--fresh-pr`; nunca ejecute localmente el contenedor ni la configuración del checkout no fiable.
Anule `CRABBOX_AWS_INSTANCE_PROFILE` y aplique un cierre seguro salvo que el valor resuelto de
`aws.instanceProfile` esté vacío. Antes de cualquier instalación o prueba, use herramientas de confianza
con rutas absolutas para exigir un token IMDSv2, demostrar que el endpoint de credenciales de IAM
devuelve 404 y comparar el `git rev-parse HEAD` remoto con el SHA completo
de la cabecera del PR revisado. Vincule el arrendamiento a ese SHA, y deténgalo y vuelva a prepararlo cuando cambie la cabecera.
Cargue el archivo de confianza `scripts/crabbox-untrusted-bootstrap.sh` desde un `main` limpio
junto con `--fresh-pr`; instala versiones fijadas de Node/pnpm, verifica el SHA y
la versión fijada del gestor de paquetes, aísla `HOME`, instala las dependencias y después ejecuta la
prueba solicitada.
Anule todas las sustituciones de `CRABBOX_TAILSCALE*`, fuerce `--network public
--tailscale=false`, borre los indicadores de nodo de salida/LAN y exija que `crabbox inspect`
informe de una red pública sin estado de Tailscale antes de cargar cualquier script.
La capacidad propia de AWS/Hetzner también permanece como alternativa para interrupciones de Blacksmith,
problemas de cuota o pruebas explícitas de capacidad propia.

Los agentes no realizan preparaciones anticipadas para trabajos previstos. Adquiera una Testbox bajo demanda cuando esté listo el
primer comando intensivo, reutilice el identificador `tbx_...` devuelto para los comandos intensivos
posteriores, sincronice el checkout actual en cada ejecución y deténgala antes del traspaso.

Las ejecuciones de Blacksmith respaldadas por Crabbox preparan, reclaman, sincronizan, ejecutan, generan informes y limpian
Testboxes de un solo uso. La comprobación de integridad de sincronización integrada falla inmediatamente cuando
`git status --short` en la máquina sincronizada muestra al menos 200 eliminaciones de archivos con seguimiento,
lo que detecta la desaparición de archivos raíz como `pnpm-lock.yaml`. Para PRs con
grandes eliminaciones intencionadas, establezca `CRABBOX_ALLOW_MASS_DELETIONS=1` para el comando remoto.

Crabbox también termina una invocación local de la CLI de Blacksmith que permanece en la
fase de sincronización durante más de cinco minutos sin salida posterior a la sincronización. Establezca
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` para desactivar esa protección o use un valor mayor en
milisegundos para diferencias locales inusualmente grandes.

Antes de una primera ejecución, compruebe el contenedor desde la raíz del repositorio:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

El contenedor del repositorio rechaza un binario de Crabbox obsoleto que no anuncie el proveedor seleccionado, y las ejecuciones respaldadas por Blacksmith requieren Crabbox 0.22.0 o posterior para que el contenedor obtenga el comportamiento actual de sincronización, cola y limpieza de Testbox. En worktrees de Codex o checkouts enlazados/dispersos, evite el script local `pnpm crabbox:run`, ya que pnpm puede reconciliar las dependencias antes de que Crabbox se inicie; invoque directamente el contenedor de Node en su lugar:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Cuando use el checkout contiguo, vuelva a compilar el binario local ignorado antes de realizar mediciones o verificaciones:

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

El bloque `blacksmith:` de `.crabbox.yaml` ya fija los valores predeterminados de organización, flujo de trabajo, trabajo y referencia, por lo que los indicadores explícitos siguientes son opcionales. Puerta de cambios:

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
objetivo se distribuya en paralelo:

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
`syncDelegated`, `exitCode`, `commandMs` y `totalMs`. Para ejecuciones delegadas
de Blacksmith Testbox, el código de salida del contenedor de Crabbox y el resumen JSON constituyen el
resultado del comando. La ejecución enlazada de GitHub Actions gestiona la incorporación de credenciales y el mantenimiento activo; puede
finalizar como `cancelled` cuando la Testbox se detiene externamente después de que el comando SSH
ya haya regresado. Trátelo como un artefacto de limpieza/estado salvo que
el `exitCode` del contenedor sea distinto de cero o que la salida del comando muestre una prueba fallida.
Las ejecuciones de Crabbox de un solo uso respaldadas por Blacksmith deben detener la Testbox automáticamente;
si una ejecución se interrumpe o la limpieza no está clara, inspeccione las máquinas activas y detenga únicamente
las que haya creado:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Use la reutilización únicamente cuando necesite deliberadamente varios comandos en la misma máquina provista de credenciales:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --id <tbx_id> --timing-json --shell -- "corepack pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Reutilice el arrendamiento, no código fuente obsoleto. Omita `--no-sync` para que cada ejecución cargue el
checkout actual; úselo únicamente para volver a ejecutar deliberadamente un árbol sin cambios y ya sincronizado.
El código no fiable de colaboradores o bifurcaciones debe usar
`CRABBOX_ENV_ALLOW=CI`, `--provider aws --no-hydrate` y un `HOME`
remoto temporal nuevo para cada comando; instale las dependencias dentro de ese comando
desinfectado antes de realizar las pruebas. Reutilice únicamente un arrendamiento recién preparado y dedicado al
mismo código fuente no fiable; nunca uno de confianza o previamente provisto de credenciales. Nunca
ejecute localmente el contenedor ni la configuración del checkout no fiable: inicie el binario instalado
de Crabbox de confianza desde un `main` limpio y de confianza, y pase `--fresh-pr` en cada
ejecución. Mantenga `CRABBOX_AWS_INSTANCE_PROFILE` sin definir, rechace un perfil de instancia resuelto
que no esté vacío, exija una prueba IMDS remota de confianza sin rol y verifique el
SHA de la cabecera revisada antes de instalar o probar. Vincule el arrendamiento a ese SHA; deténgalo y
vuelva a prepararlo después de cualquier cambio de cabecera. Si no existe un PR remoto, use una CI de bifurcación sin secretos.
Nunca seleccione `hydrate-github` ni el flujo de trabajo de Blacksmith provisto de credenciales
para código fuente no fiable.

Si Crabbox es la capa averiada pero Blacksmith funciona, use Blacksmith directamente
solo para diagnósticos como `list`, `status` y la limpieza. Corrija la
ruta de Crabbox antes de tratar una ejecución directa de Blacksmith como verificación del mantenedor.

Si `blacksmith testbox list --all` y `blacksmith testbox status` funcionan, pero las nuevas
preparaciones permanecen en `queued` sin IP ni URL de ejecución de Actions después de un par de minutos,
trátelo como presión del proveedor, la cola, la facturación o los límites de la organización de Blacksmith. Detenga los
identificadores en cola que haya creado, evite iniciar más Testboxes y traslade la verificación a la
ruta de capacidad propia de Crabbox que se indica a continuación mientras alguien comprueba el panel de Blacksmith,
la facturación y los límites de la organización.

Escale a la capacidad propia de Crabbox únicamente cuando Blacksmith no funcione, tenga limitaciones de cuota, carezca del entorno necesario o la capacidad propia sea explícitamente el objetivo:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --provider aws --id <cbx_id-or-slug>
pnpm crabbox:run -- --provider aws --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- --provider aws <cbx_id-or-slug>
```

Cuando AWS esté bajo presión, evite `class=beast` salvo que la tarea necesite realmente una CPU de clase 48xlarge. Una solicitud `beast` comienza con 192 vCPU y es la forma más sencilla de superar la cuota regional de EC2 Spot o Standard bajo demanda. El `.crabbox.yaml` gestionado por el repositorio usa de forma predeterminada `class: standard`, el mercado bajo demanda y `capacity.hints: true`, de modo que los arrendamientos de AWS intermediados imprimen la región y el mercado seleccionados, la presión de cuota, la alternativa Spot y las advertencias de clases de alta presión. Use `fast` para comprobaciones amplias más intensivas, `large` solo cuando standard/fast no sean suficientes y `beast` únicamente para carriles excepcionales limitados por CPU, como suites completas o matrices de Docker para todos los plugins, validaciones explícitas de versiones/bloqueadores o perfiles de rendimiento con muchos núcleos. No use `beast` para `pnpm check:changed`, pruebas específicas, trabajo exclusivamente de documentación, lint/comprobaciones de tipos ordinarios, reproducciones E2E pequeñas ni el triaje de interrupciones de Blacksmith. Use `--market on-demand` para diagnosticar la capacidad, de modo que la inestabilidad del mercado Spot no se mezcle con la señal.

`.crabbox.yaml` gestiona los valores predeterminados del proveedor, la sincronización y la incorporación de credenciales de GitHub Actions. La sincronización de Crabbox nunca transfiere `.git`, por lo que el checkout de Actions provisto de credenciales conserva sus propios metadatos remotos de Git en lugar de sincronizar los remotos y almacenes de objetos locales del mantenedor; además, la configuración del repositorio excluye los artefactos locales de ejecución/compilación (como `.artifacts` y los informes de pruebas) que nunca deben transferirse. `.github/workflows/crabbox-hydrate.yml` gestiona el checkout, la configuración de Node/pnpm, la obtención de `origin/main` y la transferencia del entorno sin secretos para los comandos `crabbox run --id <cbx_id>` en la nube propia.

## Relacionado

- [Descripción general de la instalación](/es/install)
- [Canales de desarrollo](/es/install/development-channels)
