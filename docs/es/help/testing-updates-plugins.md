---
read_when:
    - Cambiar el comportamiento de actualización, doctor, aceptación de paquetes o instalación de plugins de OpenClaw
    - Preparar o aprobar una versión candidata
    - Depuración de actualizaciones de paquetes, limpieza de dependencias de plugins o regresiones de instalación de plugins
sidebarTitle: Update and plugin tests
summary: Cómo OpenClaw valida las rutas de actualización, las migraciones de paquetes y el comportamiento de instalación/actualización de plugins
title: 'Pruebas: actualizaciones y plugins'
x-i18n:
    generated_at: "2026-06-27T11:43:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9be94eab4be97c53022bdac3110da74a61cfa23db989964c803497305e5415db
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Esta es la lista de verificación dedicada para la validación de actualizaciones y plugins. El objetivo es
simple: demostrar que el paquete instalable puede actualizar el estado real de los usuarios, reparar el estado
heredado obsoleto mediante `doctor` y seguir instalando, cargando, actualizando y desinstalando
plugins desde las fuentes admitidas.

Para el mapa más amplio del ejecutor de pruebas, consulta [Pruebas](/es/help/testing). Para claves de proveedores en vivo
y suites que tocan la red, consulta [Pruebas en vivo](/es/help/testing-live).

## Qué protegemos

Las pruebas de actualización y plugins protegen estos contratos:

- Un tarball de paquete está completo, tiene un `dist/postinstall-inventory.json` válido,
  y no depende de archivos del repositorio sin empaquetar.
- Un usuario puede pasar de un paquete publicado anterior al paquete candidato
  sin perder configuración, agentes, sesiones, espacios de trabajo, listas de permitidos de plugins ni
  configuración de canales.
- `openclaw doctor --fix --non-interactive` es dueño de las rutas de limpieza y reparación
  heredadas. El inicio no debe acumular migraciones de compatibilidad ocultas para el estado
  obsoleto de plugins.
- Las instalaciones de plugins funcionan desde directorios locales, repositorios git, paquetes npm y la
  ruta del registro de ClawHub.
- Las dependencias npm de plugins se instalan en un proyecto npm gestionado por plugin,
  se analizan antes de la confianza y se eliminan mediante npm durante la desinstalación para que las dependencias
  elevadas no queden persistentes.
- La actualización de plugins es estable cuando nada ha cambiado: los registros de instalación, la fuente
  resuelta, la disposición de dependencias instaladas y el estado habilitado permanecen intactos.

## Prueba local durante el desarrollo

Empieza de forma acotada:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Para cambios de instalación, desinstalación, dependencias o inventario de paquetes de plugins, ejecuta también
las pruebas enfocadas que cubren el límite editado:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Antes de que cualquier carril Docker de paquete consuma un tarball, demuestra el artefacto del paquete:

```bash
pnpm release:check
```

`release:check` ejecuta comprobaciones de deriva de configuración/docs/API, escribe el inventario dist
del paquete, ejecuta `npm pack --dry-run`, rechaza archivos empaquetados prohibidos, instala
el tarball en un prefijo temporal, ejecuta postinstall y prueba superficialmente los puntos de entrada
de canales incluidos.

## Carriles Docker

Los carriles Docker son la prueba a nivel de producto. Instalan o actualizan un paquete real
dentro de contenedores Linux y verifican el comportamiento mediante comandos CLI,
inicio de Gateway, sondeos HTTP, estado RPC y estado del sistema de archivos.

Usa carriles enfocados durante la iteración:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-restart-auth
pnpm test:docker:update-migration
```

Carriles importantes:

- `test:docker:plugins` valida una prueba superficial de instalación de plugins, instalaciones desde carpetas locales,
  comportamiento de omisión de actualización de carpetas locales, carpetas locales con dependencias
  preinstaladas, instalaciones de paquetes `file:`, instalaciones git con ejecución de CLI, actualizaciones de referencias git
  móviles, instalaciones desde registro npm con dependencias transitivas elevadas,
  no-ops de actualización npm, rechazo de metadatos de paquete npm malformados,
  instalaciones de fixture local de ClawHub y no-ops de actualización, comportamiento de actualización del marketplace,
  y habilitación/inspección del paquete de Claude. Define `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` para
  mantener el bloque de ClawHub hermético/sin conexión.
- `test:docker:plugin-lifecycle-matrix` instala el paquete candidato en un contenedor
  básico, ejecuta un plugin npm por instalación, inspección, deshabilitación, habilitación,
  actualización explícita, degradación explícita y desinstalación después de eliminar el código
  del plugin. Registra métricas de RSS y CPU para cada fase.
- `test:docker:plugin-update` valida que un plugin instalado sin cambios
  no se reinstale ni pierda metadatos de instalación durante `openclaw plugins update`.
- `test:docker:upgrade-survivor` instala el tarball candidato sobre un fixture
  de usuario antiguo con suciedad, ejecuta actualización de paquete más doctor no interactivo, luego inicia
  un Gateway loopback y comprueba la preservación del estado.
- `test:docker:published-upgrade-survivor` primero instala una línea base publicada,
  la configura mediante una receta integrada de `openclaw config set`, la actualiza al
  tarball candidato, ejecuta doctor, comprueba la limpieza heredada, inicia el Gateway y
  sondea `/healthz`, `/readyz` y el estado RPC.
- `test:docker:update-restart-auth` instala el paquete candidato, inicia un
  Gateway gestionado con autenticación por token, desdefine el env de autenticación de gateway del llamador para
  `openclaw update --yes --json`, y exige que el comando de actualización candidato
  reinicie el Gateway antes de los sondeos normales.
- `test:docker:update-migration` es el carril de actualización publicada con mucha limpieza. Parte
  de un estado de usuario configurado al estilo Discord/Telegram, ejecuta doctor de línea base
  para que las dependencias de plugins configuradas tengan oportunidad de materializarse, siembra
  residuos de dependencias de plugins heredadas para un plugin empaquetado configurado, actualiza al
  tarball candidato y exige que el doctor posterior a la actualización elimine las raíces de dependencias
  heredadas.

Variantes útiles de published-upgrade survivor:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

Los escenarios disponibles son `base`, `feishu-channel`, `bootstrap-persona`,
`plugin-deps-cleanup`, `configured-plugin-installs`,
`stale-source-plugin-shadow`, `tilde-log-path` y `versioned-runtime-deps`. En ejecuciones agregadas,
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` se expande a todos los escenarios con forma de incidencias
reportadas, incluida la migración de instalación de plugins configurados.

La migración de actualización completa está separada intencionalmente de Full Release CI. Usa el
flujo de trabajo manual `Update Migration` cuando la pregunta de lanzamiento sea "¿puede cada
versión estable publicada desde 2026.4.23 en adelante actualizarse a este candidato y
limpiar residuos de dependencias de plugins?":

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Package Acceptance

Package Acceptance es la puerta de paquete nativa de GitHub. Resuelve un paquete candidato
en un tarball `package-under-test`, registra versión y SHA-256, luego
ejecuta carriles Docker E2E reutilizables contra ese tarball exacto. La referencia del arnés de flujo de trabajo
está separada de la referencia de origen del paquete, por lo que la lógica de prueba actual puede validar
versiones confiables anteriores.

Fuentes candidatas:

- `source=npm`: valida `openclaw@beta`, `openclaw@latest` o una versión
  publicada exacta.
- `source=ref`: empaqueta una rama, etiqueta o commit confiable con el arnés actual
  seleccionado.
- `source=url`: valida un tarball HTTPS público con `package_sha256` requerido.
  Esta ruta rechaza credenciales de URL, puertos HTTPS no predeterminados, nombres de host privados/internos
  o resultados DNS/IP, espacio IP de uso especial y redirecciones inseguras.
- `source=trusted-url`: valida un tarball HTTPS con `package_sha256`
  requerido y `trusted_source_id` contra la política propiedad de mantenedores
  en `.github/package-trusted-sources.json`. Usa esto para espejos empresariales/privados
  en lugar de debilitar `source=url` con un conmutador allow-private de nivel de entrada.
  La autenticación Bearer, cuando la política la configura, usa el secreto fijo
  `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.
- `source=artifact`: reutiliza un tarball subido por otra ejecución de Actions.

Full Release Validation usa `source=artifact` de forma predeterminada, creado a partir del
SHA de lanzamiento resuelto. Para prueba posterior a la publicación, pasa
`package_acceptance_package_spec=openclaw@YYYY.M.PATCH` para que la misma matriz de actualización
apunte al paquete npm enviado.

Las comprobaciones de lanzamiento llaman a Package Acceptance con el conjunto package/update/restart/plugin:

```text
doctor-switch update-channel-switch update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update
```

Cuando la estabilización de lanzamiento está habilitada, también pasan:

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Esto mantiene la migración de paquetes, el cambio de canal de actualización, la tolerancia a plugins gestionados
corruptos, la limpieza de dependencias de plugins obsoletas, la cobertura de plugins sin conexión, el
comportamiento de actualización de plugins y el QA de paquete de Telegram sobre el mismo artefacto resuelto sin
hacer que la puerta de paquete de lanzamiento predeterminada recorra cada versión publicada.

`last-stable-4` se resuelve a las cuatro versiones estables de OpenClaw publicadas en npm
más recientes. La aceptación de paquetes de lanzamiento fija `2026.4.23` como el primer límite de compatibilidad
de actualización de plugins, `2026.5.2` como un límite de cambios de arquitectura de plugins y
`2026.4.15` como una línea base de actualización publicada anterior de 2026.4.1x; el resolvedor
deduplica pines que ya están en las cuatro más recientes. Para cobertura exhaustiva de migración de
actualizaciones publicadas, usa `all-since-2026.4.23` en el flujo de trabajo Update
Migration separado en lugar de Full Release CI. `release-history` sigue
disponible para un muestreo manual más amplio cuando también quieres el ancla heredada anterior a la fecha.

Cuando se seleccionan varias líneas base de published-upgrade survivor, el flujo de trabajo Docker
reutilizable fragmenta cada línea base en su propio trabajo de runner dirigido. Cada
fragmento de línea base sigue ejecutando el conjunto de escenarios seleccionado, pero los registros y artefactos permanecen
por línea base y el tiempo total queda acotado por el fragmento más lento en lugar de un gran
trabajo serial.

Ejecuta manualmente un perfil de paquete al validar un candidato antes del lanzamiento:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=package \
  -f published_upgrade_survivor_baselines="last-stable-4 2026.4.23 2026.5.2 2026.4.15" \
  -f published_upgrade_survivor_scenarios=reported-issues \
  -f telegram_mode=mock-openai
```

Usa `suite_profile=product` cuando la pregunta de lanzamiento incluya canales MCP,
limpieza de cron/subagentes, búsqueda web de OpenAI u OpenWebUI. Usa `suite_profile=full`
solo cuando necesites cobertura completa de Docker de la ruta de lanzamiento.

## Valor predeterminado de lanzamiento

Para candidatos de lanzamiento, la pila de prueba predeterminada es:

1. `pnpm check:changed` y `pnpm test:changed` para regresiones a nivel de código fuente.
2. `pnpm release:check` para la integridad del artefacto de paquete.
3. Perfil `package` de Package Acceptance o los carriles de paquete personalizados de release-check
   para contratos de instalación/actualización/reinicio/plugins.
4. Comprobaciones de lanzamiento entre sistemas operativos para instalador, incorporación y comportamiento
   de plataforma específicos del sistema operativo.
5. Suites en vivo solo cuando la superficie modificada toca el comportamiento de proveedores o servicios alojados.

En máquinas de mantenedores, las puertas amplias y la prueba de producto Docker/paquete deben ejecutarse
en Testbox salvo que se esté haciendo prueba local explícitamente.

## Compatibilidad heredada

La lenidad de compatibilidad es acotada y con límite temporal:

- Los paquetes hasta `2026.4.25`, incluido `2026.4.25-beta.*`, pueden tolerar
  brechas de metadatos de paquete ya enviados en Package Acceptance.
- El paquete publicado `2026.4.26` puede advertir por archivos de sello de metadatos
  de compilación local ya enviados.
- Los paquetes posteriores deben satisfacer los contratos modernos. Las mismas brechas fallan en lugar de
  advertir u omitirse.

No agregues nuevas migraciones de inicio para estas formas antiguas. Agrega o extiende una reparación de doctor,
luego demuéstrala con `upgrade-survivor`, `published-upgrade-survivor` o
`update-restart-auth` cuando el comando de actualización sea dueño del reinicio.

## Agregar cobertura

Al cambiar el comportamiento de actualización o plugins, agrega cobertura en la capa más baja que
pueda fallar por la razón correcta:

- Lógica pura de rutas o metadatos: prueba unitaria junto al código fuente.
- Inventario del paquete o comportamiento de archivos empaquetados: prueba de
  `package-dist-inventory` o del comprobador de tarballs.
- Comportamiento de instalación/actualización de la CLI: aserción de carril de Docker o fixture.
- Comportamiento de migración de una versión publicada: escenario `published-upgrade-survivor`.
- Comportamiento de reinicio propiedad de la actualización: `update-restart-auth`.
- Comportamiento de origen de registro/paquete: fixture de `test:docker:plugins` o servidor
  fixture de ClawHub.
- Comportamiento de disposición o limpieza de dependencias: afirma tanto la ejecución en runtime como el
  límite del sistema de archivos. Las dependencias de npm pueden elevarse dentro del proyecto npm
  administrado del Plugin, por lo que las pruebas deben demostrar que ese proyecto se escanea/limpia
  en lugar de asumir solo el árbol `node_modules` local del paquete del Plugin.

Mantén los nuevos fixtures de Docker herméticos de forma predeterminada. Usa registros fixture locales y
paquetes falsos, salvo que el objetivo de la prueba sea el comportamiento de un registro en vivo.

## Triaje de fallos

Empieza con la identidad del artefacto:

- Resumen `resolve_package` de Package Acceptance: origen, versión, SHA-256 y
  nombre del artefacto.
- Artefactos de Docker: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, registros del carril y comandos de repetición.
- Resumen del superviviente de actualización: `.artifacts/upgrade-survivor/summary.json`,
  incluida la versión base, la versión candidata, el escenario, los tiempos de fase y
  los pasos de la receta.

Prefiere volver a ejecutar el carril exacto que falló con el mismo artefacto de paquete antes que
volver a ejecutar todo el paraguas de la versión.
