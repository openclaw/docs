---
read_when:
    - Cambiar el comportamiento de actualización, diagnóstico, aceptación de paquetes o instalación de Plugin de OpenClaw
    - Preparación o aprobación de una versión candidata
    - Depuración de regresiones en la actualización de paquetes, la limpieza de dependencias de Plugin o la instalación de Plugin
sidebarTitle: Update and plugin tests
summary: Cómo OpenClaw valida las rutas de actualización, las migraciones de paquetes y el comportamiento de instalación/actualización de Plugin
title: 'Pruebas: actualizaciones y plugins'
x-i18n:
    generated_at: "2026-05-05T05:24:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19ae526d3daa8a1b67cb2f74225138b3e1fa192c9f956c9dd6d0e407581b9ed9
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Esta es la lista de verificación dedicada para la validación de actualizaciones y plugins. El objetivo es
simple: demostrar que el paquete instalable puede actualizar el estado real del usuario, reparar el estado
heredado obsoleto mediante `doctor` y seguir instalando, cargando, actualizando y desinstalando
plugins desde las fuentes compatibles.

Para el mapa más amplio del ejecutor de pruebas, consulta [Pruebas](/es/help/testing). Para claves de proveedores
en vivo y suites que tocan la red, consulta [Pruebas en vivo](/es/help/testing-live).

## Qué protegemos

Las pruebas de actualización y plugins protegen estos contratos:

- Un tarball de paquete está completo, tiene un `dist/postinstall-inventory.json` válido
  y no depende de archivos desempaquetados del repositorio.
- Un usuario puede pasar de un paquete publicado anterior al paquete candidato
  sin perder configuración, agentes, sesiones, espacios de trabajo, listas de permitidos de plugins ni
  configuración de canales.
- `openclaw doctor --fix --non-interactive` es responsable de las rutas de limpieza y reparación
  heredadas. El inicio no debe acumular migraciones de compatibilidad ocultas para estados obsoletos
  de plugins.
- Las instalaciones de plugins funcionan desde directorios locales, repos de git, paquetes npm y la
  ruta del registro de ClawHub.
- Las dependencias npm de plugins se instalan en la raíz npm administrada, se analizan antes de
  confiar en ellas y se eliminan mediante npm durante la desinstalación para que las dependencias elevadas
  no permanezcan.
- La actualización de plugins es estable cuando nada cambió: los registros de instalación, la fuente
  resuelta, el diseño de dependencias instaladas y el estado habilitado permanecen intactos.

## Prueba local durante el desarrollo

Empieza con un alcance limitado:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Para cambios de instalación, desinstalación, dependencias o inventario de paquete de plugins, ejecuta también
las pruebas enfocadas que cubren el punto editado:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Antes de que cualquier carril Docker de paquete consuma un tarball, demuestra el artefacto del paquete:

```bash
pnpm release:check
```

`release:check` ejecuta comprobaciones de deriva de configuración/docs/API, escribe el inventario dist del paquete,
ejecuta `npm pack --dry-run`, rechaza archivos empaquetados prohibidos, instala
el tarball en un prefijo temporal, ejecuta postinstall y hace una prueba básica de los puntos de entrada de canales
incluidos.

## Carriles Docker

Los carriles Docker son la prueba a nivel de producto. Instalan o actualizan un paquete real
dentro de contenedores Linux y verifican el comportamiento mediante comandos de CLI,
inicio de Gateway, sondeos HTTP, estado RPC y estado del sistema de archivos.

Usa carriles enfocados mientras iteras:

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

- `test:docker:plugins` valida la prueba básica de instalación de plugins, instalaciones desde carpetas locales,
  comportamiento de omisión de actualización de carpetas locales, carpetas locales con dependencias
  preinstaladas, instalaciones de paquetes `file:`, instalaciones desde git con ejecución de CLI, actualizaciones de git
  con referencias móviles, instalaciones desde registro npm con dependencias transitivas
  elevadas, no operaciones de actualización npm, instalaciones de fixture local de ClawHub y no operaciones de
  actualización, comportamiento de actualización del marketplace y habilitación/inspección del paquete Claude. Define
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` para mantener el bloque de ClawHub hermético/sin conexión.
- `test:docker:plugin-lifecycle-matrix` instala el paquete candidato en un contenedor
  vacío, ejecuta un plugin npm mediante instalación, inspección, deshabilitación, habilitación,
  actualización explícita, degradación explícita y desinstalación después de eliminar el código del plugin.
  Registra métricas de RSS y CPU para cada fase.
- `test:docker:plugin-update` valida que un plugin instalado sin cambios no
  se reinstale ni pierda metadatos de instalación durante `openclaw plugins update`.
- `test:docker:upgrade-survivor` instala el tarball candidato sobre un fixture de usuario antiguo
  con estado sucio, ejecuta la actualización de paquete más doctor no interactivo, luego inicia
  un Gateway de loopback y verifica la preservación del estado.
- `test:docker:published-upgrade-survivor` primero instala una línea base publicada,
  la configura mediante una receta `openclaw config set` integrada, la actualiza al
  tarball candidato, ejecuta doctor, verifica la limpieza heredada, inicia el Gateway y
  sondea `/healthz`, `/readyz` y el estado RPC.
- `test:docker:update-restart-auth` instala el paquete candidato, inicia un
  Gateway administrado con autenticación por token, desdefine el env de autenticación de Gateway del llamador para
  `openclaw update --yes --json` y exige que el comando de actualización candidato
  reinicie el Gateway antes de los sondeos normales.
- `test:docker:update-migration` es el carril de actualización publicada con mucha limpieza. Parte
  de un estado de usuario configurado al estilo Discord/Telegram, ejecuta doctor de línea base
  para que las dependencias de plugins configuradas tengan oportunidad de materializarse, siembra
  restos heredados de dependencias de plugins para un plugin empaquetado configurado, actualiza al
  tarball candidato y exige que doctor posterior a la actualización elimine las raíces de dependencias
  heredadas.

Variantes útiles de superviviente de actualización publicada:

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
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` se expande a todos los escenarios con forma de
incidencias reportadas, incluida la migración de instalación de plugins configurados.

La migración completa de actualización está separada intencionalmente de Full Release CI. Usa el
flujo de trabajo manual `Update Migration` cuando la pregunta de lanzamiento sea "¿pueden todas las
versiones estables publicadas desde 2026.4.23 en adelante actualizarse a este candidato y
limpiar restos de dependencias de plugins?":

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Aceptación de Paquetes

Package Acceptance es la puerta de paquetes nativa de GitHub. Resuelve un paquete
candidato en un tarball `package-under-test`, registra versión y SHA-256, luego
ejecuta carriles Docker E2E reutilizables contra ese tarball exacto. La referencia del arnés de flujo de trabajo
está separada de la referencia fuente del paquete, por lo que la lógica de pruebas actual puede validar
versiones confiables anteriores.

Fuentes candidatas:

- `source=npm`: valida `openclaw@beta`, `openclaw@latest` o una versión
  publicada exacta.
- `source=ref`: empaqueta una rama, etiqueta o commit confiable con el arnés actual
  seleccionado.
- `source=url`: valida un tarball HTTPS con `package_sha256` requerido.
- `source=artifact`: reutiliza un tarball subido por otra ejecución de Actions.

Full Release Validation usa `source=artifact` de forma predeterminada, construido desde el
SHA de lanzamiento resuelto. Para prueba posterior a publicación, pasa
`package_acceptance_package_spec=openclaw@YYYY.M.D` para que la misma matriz de actualización
apunte al paquete npm enviado.

Las comprobaciones de lanzamiento llaman a Package Acceptance con el conjunto de paquete/actualización/reinicio/plugin:

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update
```

Cuando el remojo de lanzamiento está habilitado, también pasan:

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Esto mantiene la migración de paquetes, el cambio de canal de actualización, la limpieza de dependencias
obsoletas de plugins, la cobertura de plugins sin conexión, el comportamiento de actualización de plugins y la QA de paquete de Telegram
sobre el mismo artefacto resuelto sin hacer que la puerta de paquete de lanzamiento predeterminada
recorra cada versión publicada.

`last-stable-4` se resuelve a las cuatro últimas versiones estables de OpenClaw publicadas en npm.
La aceptación de paquetes de lanzamiento fija `2026.4.23` como el primer límite de compatibilidad
de actualización de plugins, `2026.5.2` como un límite de cambios de arquitectura de plugins y
`2026.4.15` como una línea base antigua de actualización publicada de 2026.4.1x; el resolutor
deduplica los pines que ya estén en las últimas cuatro. Para cobertura exhaustiva de migración de
actualización publicada, usa `all-since-2026.4.23` en el flujo de trabajo Update
Migration separado en lugar de Full Release CI. `release-history` permanece
disponible para muestreo manual más amplio cuando también quieres el ancla heredada anterior a la fecha.

Cuando se seleccionan varias líneas base de superviviente de actualización publicada, el flujo de trabajo Docker
reutilizable divide cada línea base en su propio job de runner objetivo. Cada
fragmento de línea base sigue ejecutando el conjunto de escenarios seleccionado, pero los logs y artefactos permanecen
por línea base y el tiempo total queda acotado por el fragmento más lento en lugar de un gran
job serial.

Ejecuta manualmente un perfil de paquete cuando valides un candidato antes del lanzamiento:

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
solo cuando necesites cobertura completa del camino de lanzamiento Docker.

## Valor predeterminado de lanzamiento

Para candidatos de lanzamiento, la pila de pruebas predeterminada es:

1. `pnpm check:changed` y `pnpm test:changed` para regresiones a nivel de fuente.
2. `pnpm release:check` para integridad del artefacto de paquete.
3. Perfil `package` de Package Acceptance o los carriles personalizados de paquete de release-check
   para contratos de instalación/actualización/reinicio/plugin.
4. Comprobaciones de lanzamiento multiplataforma para comportamiento específico de SO en instalador,
   incorporación y plataforma.
5. Suites en vivo solo cuando la superficie modificada toca comportamiento de proveedor o servicio
   alojado.

En máquinas de mantenedor, las puertas amplias y la prueba de producto Docker/paquete deben ejecutarse
en Testbox salvo que se esté haciendo explícitamente prueba local.

## Compatibilidad heredada

La flexibilidad de compatibilidad es estrecha y limitada en el tiempo:

- Los paquetes hasta `2026.4.25`, incluido `2026.4.25-beta.*`, pueden tolerar
  brechas de metadatos de paquete ya enviadas en Package Acceptance.
- El paquete publicado `2026.4.26` puede advertir por archivos de sello de metadatos de compilación local
  ya enviados.
- Los paquetes posteriores deben satisfacer los contratos modernos. Las mismas brechas fallan en lugar de
  advertir o saltarse.

No agregues nuevas migraciones de inicio para estas formas antiguas. Agrega o extiende una reparación de doctor,
luego demuéstrala con `upgrade-survivor`, `published-upgrade-survivor` o
`update-restart-auth` cuando el comando de actualización sea responsable del reinicio.

## Agregar cobertura

Al cambiar comportamiento de actualización o plugins, agrega cobertura en la capa más baja que
pueda fallar por la razón correcta:

- Lógica pura de rutas o metadatos: prueba unitaria junto a la fuente.
- Comportamiento de inventario de paquete o archivos empaquetados: prueba `package-dist-inventory` o de comprobador
  de tarball.
- Comportamiento de instalación/actualización de CLI: aserción o fixture de carril Docker.
- Comportamiento de migración de versión publicada: escenario `published-upgrade-survivor`.
- Comportamiento de reinicio propiedad de actualización: `update-restart-auth`.
- Comportamiento de registro/fuente de paquete: fixture `test:docker:plugins` o servidor de fixture de ClawHub.
- Comportamiento de diseño o limpieza de dependencias: afirma tanto la ejecución en runtime como el
  límite del sistema de archivos. Las dependencias npm pueden elevarse bajo la raíz npm administrada,
  por lo que las pruebas deben demostrar que la raíz se analiza/limpia en lugar de asumir un árbol
  `node_modules` local del paquete.

Mantén los nuevos fixtures Docker herméticos de forma predeterminada. Usa registros de fixtures locales y
paquetes falsos salvo que el objetivo de la prueba sea el comportamiento de registro en vivo.

## Triaje de fallos

Empieza con la identidad del artefacto:

- Resumen de Aceptación de paquetes `resolve_package`: origen, versión, SHA-256 y
  nombre del artefacto.
- Artefactos de Docker: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, registros de carriles y comandos de reejecución.
- Resumen de supervivencia de actualización: `.artifacts/upgrade-survivor/summary.json`,
  incluida la versión base, la versión candidata, el escenario, los tiempos de fase y
  los pasos de la receta.

Prefiere volver a ejecutar el carril exacto que falló con el mismo artefacto de paquete en lugar de
volver a ejecutar todo el conjunto general del lanzamiento.
