---
read_when:
    - Cambiar el comportamiento de actualización, diagnóstico, aceptación de paquetes o instalación de Plugin de OpenClaw
    - Preparar o aprobar una versión candidata
    - Depuración de regresiones en actualizaciones de paquetes, limpieza de dependencias de Plugin o instalación de Plugin
sidebarTitle: Update and plugin tests
summary: Cómo OpenClaw valida las rutas de actualización, las migraciones de paquetes y el comportamiento de instalación/actualización de plugins
title: 'Pruebas: actualizaciones y plugins'
x-i18n:
    generated_at: "2026-05-06T05:38:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: db3790bb8c6b952458342727f3e326f9610b4d8155889dfdadb143e3ef07aa46
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Esta es la lista de verificación dedicada para la validación de actualizaciones y plugins. El objetivo es
simple: demostrar que el paquete instalable puede actualizar el estado real del usuario, reparar el estado
heredado obsoleto mediante `doctor`, y seguir instalando, cargando, actualizando y desinstalando
plugins desde las fuentes compatibles.

Para el mapa más amplio del ejecutor de pruebas, consulta [Pruebas](/es/help/testing). Para claves de proveedores
en vivo y conjuntos que tocan la red, consulta [Pruebas en vivo](/es/help/testing-live).

## Qué protegemos

Las pruebas de actualización y plugins protegen estos contratos:

- Un tarball de paquete está completo, tiene un `dist/postinstall-inventory.json` válido,
  y no depende de archivos del repositorio sin empaquetar.
- Un usuario puede pasar de un paquete publicado anterior al paquete candidato
  sin perder configuración, agentes, sesiones, espacios de trabajo, listas de permitidos de plugins ni
  configuración de canales.
- `openclaw doctor --fix --non-interactive` es responsable de las rutas de limpieza y reparación
  heredadas. El inicio no debería acumular migraciones de compatibilidad ocultas para el estado
  obsoleto de plugins.
- Las instalaciones de plugins funcionan desde directorios locales, repositorios git, paquetes npm y la
  ruta del registro de ClawHub.
- Las dependencias npm de plugins se instalan en la raíz npm administrada, se analizan antes de
  confiar en ellas y se eliminan mediante npm durante la desinstalación para que las dependencias elevadas no
  permanezcan.
- La actualización de plugins es estable cuando nada cambió: los registros de instalación, la fuente
  resuelta, la disposición de dependencias instaladas y el estado habilitado permanecen intactos.

## Prueba local durante el desarrollo

Empieza con un alcance reducido:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Para cambios de instalación, desinstalación, dependencias o inventario de paquete de plugins, ejecuta también
las pruebas enfocadas que cubren el punto de unión editado:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Antes de que cualquier lane Docker de paquete consuma un tarball, demuestra el artefacto del paquete:

```bash
pnpm release:check
```

`release:check` ejecuta comprobaciones de deriva de configuración/docs/API, escribe el inventario dist
del paquete, ejecuta `npm pack --dry-run`, rechaza archivos empaquetados prohibidos, instala
el tarball en un prefijo temporal, ejecuta postinstall y prueba superficialmente los puntos de entrada de canales
incluidos.

## Lanes Docker

Las lanes Docker son la prueba a nivel de producto. Instalan o actualizan un paquete real
dentro de contenedores Linux y verifican el comportamiento mediante comandos CLI,
inicio del Gateway, sondas HTTP, estado RPC y estado del sistema de archivos.

Usa lanes enfocadas mientras iteras:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-restart-auth
pnpm test:docker:update-migration
```

Lanes importantes:

- `test:docker:plugins` valida una prueba superficial de instalación de plugins, instalaciones desde carpetas locales,
  comportamiento de omisión de actualización en carpetas locales, carpetas locales con
  dependencias preinstaladas, instalaciones de paquetes `file:`, instalaciones git con ejecución de CLI, actualizaciones de referencias móviles git, instalaciones desde registro npm con dependencias transitivas
  elevadas, operaciones sin cambios de actualización npm, instalaciones desde fixtures locales de ClawHub y operaciones sin cambios de actualización,
  comportamiento de actualización de marketplace, y habilitación/inspección del paquete Claude. Define
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` para mantener el bloque de ClawHub hermético/sin conexión.
- `test:docker:plugin-lifecycle-matrix` instala el paquete candidato en un contenedor básico,
  ejecuta un Plugin npm a través de instalación, inspección, deshabilitación, habilitación,
  actualización explícita, degradación explícita y desinstalación después de eliminar el código del Plugin.
  Registra métricas RSS y CPU para cada fase.
- `test:docker:plugin-update` valida que un Plugin instalado sin cambios no
  se reinstale ni pierda metadatos de instalación durante `openclaw plugins update`.
- `test:docker:upgrade-survivor` instala el tarball candidato sobre un fixture de usuario antiguo
  con estado sucio, ejecuta actualización de paquete más doctor no interactivo, luego inicia
  un Gateway local loopback y verifica la preservación del estado.
- `test:docker:published-upgrade-survivor` primero instala una base publicada,
  la configura mediante una receta `openclaw config set` integrada, la actualiza al
  tarball candidato, ejecuta doctor, verifica la limpieza heredada, inicia el Gateway y
  sondea `/healthz`, `/readyz` y el estado RPC.
- `test:docker:update-restart-auth` instala el paquete candidato, inicia un
  Gateway administrado con autenticación por token, elimina las variables de entorno de autenticación del Gateway llamador para
  `openclaw update --yes --json`, y exige que el comando de actualización candidato
  reinicie el Gateway antes de las sondas normales.
- `test:docker:update-migration` es la lane de actualización publicada con mucha limpieza. Parte
  de un estado de usuario configurado al estilo Discord/Telegram, ejecuta doctor en la base
  para que las dependencias de plugins configurados tengan oportunidad de materializarse, siembra
  restos heredados de dependencias de plugins para un Plugin empaquetado configurado, actualiza al
  tarball candidato y exige que doctor posterior a la actualización elimine las raíces de dependencias
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
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` se expande a todos los escenarios con forma
de problemas reportados, incluida la migración de instalación de plugins configurados.

La migración de actualización completa está separada intencionalmente de Full Release CI. Usa el
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

## Aceptación de paquetes

Package Acceptance es la puerta de paquete nativa de GitHub. Resuelve un paquete
candidato en un tarball `package-under-test`, registra versión y SHA-256, y luego
ejecuta lanes Docker E2E reutilizables contra ese tarball exacto. La referencia del arnés
del flujo de trabajo está separada de la referencia de origen del paquete, por lo que la lógica de pruebas actual puede validar
versiones confiables anteriores.

Fuentes candidatas:

- `source=npm`: valida `openclaw@beta`, `openclaw@latest` o una versión
  publicada exacta.
- `source=ref`: empaqueta una rama, etiqueta o commit confiable con el arnés actual
  seleccionado.
- `source=url`: valida un tarball HTTPS con `package_sha256` requerido.
- `source=artifact`: reutiliza un tarball cargado por otra ejecución de Actions.

Full Release Validation usa `source=artifact` de forma predeterminada, construido desde el
SHA de lanzamiento resuelto. Para prueba posterior a la publicación, pasa
`package_acceptance_package_spec=openclaw@YYYY.M.D` para que la misma matriz de actualización
apunte al paquete npm entregado en su lugar.

Las comprobaciones de lanzamiento llaman a Package Acceptance con el conjunto de paquete/actualización/reinicio/plugins:

```text
doctor-switch update-channel-switch update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update
```

Cuando el período de observación de lanzamiento está habilitado, también pasan:

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Esto mantiene la migración de paquetes, el cambio de canal de actualización, la tolerancia a plugins administrados
corruptos, la limpieza de dependencias obsoletas de plugins, la cobertura sin conexión de plugins, el comportamiento de
actualización de plugins y la QA de paquete de Telegram sobre el mismo artefacto resuelto sin
hacer que la puerta predeterminada de paquete de lanzamiento recorra todas las versiones publicadas.

`last-stable-4` se resuelve a las cuatro versiones estables de OpenClaw publicadas en npm más recientes.
La aceptación de paquetes de lanzamiento fija `2026.4.23` como el primer límite de compatibilidad
de actualización de plugins, `2026.5.2` como un límite de cambio de arquitectura de plugins, y
`2026.4.15` como una base de actualización publicada más antigua de 2026.4.1x; el resolvedor
deduplica los pines que ya estén en las cuatro más recientes. Para cobertura exhaustiva de migración de
actualización publicada, usa `all-since-2026.4.23` en el flujo de trabajo separado Update
Migration en lugar de Full Release CI. `release-history` permanece
disponible para muestreo manual más amplio cuando también quieras el ancla heredada anterior a esa fecha.

Cuando se seleccionan varias bases de published-upgrade survivor, el flujo de trabajo Docker
reutilizable divide cada base en su propio job de ejecutor dirigido. Cada shard
de base sigue ejecutando el conjunto de escenarios seleccionado, pero los registros y artefactos permanecen
por base y el tiempo total queda limitado por el shard más lento en lugar de un gran
job serial.

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
limpieza de Cron/subagentes, búsqueda web de OpenAI u OpenWebUI. Usa `suite_profile=full`
solo cuando necesites cobertura completa de la ruta de lanzamiento Docker.

## Valor predeterminado de lanzamiento

Para candidatos de lanzamiento, la pila de prueba predeterminada es:

1. `pnpm check:changed` y `pnpm test:changed` para regresiones a nivel de código fuente.
2. `pnpm release:check` para integridad del artefacto de paquete.
3. Perfil `package` de Package Acceptance o las lanes personalizadas de paquete de release-check
   para contratos de instalación/actualización/reinicio/plugins.
4. Comprobaciones de lanzamiento entre sistemas operativos para comportamiento específico de instalador, incorporación y plataforma.
5. Conjuntos en vivo solo cuando la superficie cambiada toca comportamiento de proveedores o servicios alojados.

En máquinas de mantenedores, las puertas amplias y la prueba de producto Docker/paquete deberían ejecutarse
en Testbox salvo que se esté haciendo explícitamente prueba local.

## Compatibilidad heredada

La flexibilidad de compatibilidad es estrecha y limitada en el tiempo:

- Los paquetes hasta `2026.4.25`, incluido `2026.4.25-beta.*`, pueden tolerar
  brechas de metadatos de paquete ya entregadas en Package Acceptance.
- El paquete publicado `2026.4.26` puede advertir por archivos de sello de metadatos de compilación local
  ya entregados.
- Los paquetes posteriores deben satisfacer los contratos modernos. Las mismas brechas fallan en lugar de
  advertir o saltarse.

No agregues nuevas migraciones de inicio para estas formas antiguas. Agrega o extiende una reparación de doctor,
y luego demuéstrala con `upgrade-survivor`, `published-upgrade-survivor` o
`update-restart-auth` cuando el comando de actualización sea responsable del reinicio.

## Añadir cobertura

Al cambiar el comportamiento de actualización o plugins, añade cobertura en la capa más baja que
pueda fallar por la razón correcta:

- Lógica pura de rutas o metadatos: prueba unitaria junto al código fuente.
- Inventario de paquete o comportamiento de archivos empaquetados: prueba `package-dist-inventory` o del verificador de tarball.
- Comportamiento de instalación/actualización de CLI: aserción o fixture de lane Docker.
- Comportamiento de migración de versión publicada: escenario `published-upgrade-survivor`.
- Comportamiento de reinicio propiedad de la actualización: `update-restart-auth`.
- Comportamiento de origen de registro/paquete: fixture `test:docker:plugins` o servidor de fixture de ClawHub.
- Comportamiento de disposición o limpieza de dependencias: verifica tanto la ejecución en runtime como el
  límite del sistema de archivos. Las dependencias npm pueden elevarse bajo la raíz npm
  administrada, por lo que las pruebas deberían demostrar que la raíz se analiza/limpia en lugar de asumir un
  árbol `node_modules` local del paquete.

Mantén los nuevos fixtures Docker herméticos de forma predeterminada. Usa registros de fixtures locales y
paquetes falsos salvo que el objetivo de la prueba sea el comportamiento de un registro en vivo.

## Triaje de fallos

Empieza con la identidad del artefacto:

- Resumen de aceptación de paquetes `resolve_package`: origen, versión, SHA-256 y
  nombre del artefacto.
- Artefactos de Docker: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, registros de carril y comandos de repetición.
- Resumen de superviviente de actualización: `.artifacts/upgrade-survivor/summary.json`,
  incluida la versión de referencia, la versión candidata, el escenario, los tiempos de fase y
  los pasos de la receta.

Prefiere volver a ejecutar el carril exacto que falló con el mismo artefacto de paquete en lugar de
volver a ejecutar todo el paraguas de release.
