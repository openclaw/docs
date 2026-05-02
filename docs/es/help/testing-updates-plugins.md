---
read_when:
    - Cambiar el comportamiento de actualización, doctor, aceptación de paquetes o instalación de Plugin de OpenClaw
    - Preparar o aprobar una versión candidata
    - Depuración de regresiones de actualización de paquetes, limpieza de dependencias de Plugin o instalación de Plugin
sidebarTitle: Update and plugin tests
summary: Cómo OpenClaw valida las rutas de actualización, las migraciones de paquetes y el comportamiento de instalación/actualización de Plugin
title: 'Pruebas: actualizaciones y plugins'
x-i18n:
    generated_at: "2026-05-02T05:28:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: b1999106b52d2539a6ee0fd7cd88ebb3515c8726e080d4031d7bf421fb99de36
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Esta es la lista de verificación dedicada para la validación de actualizaciones y plugins. El objetivo es
simple: demostrar que el paquete instalable puede actualizar el estado real del usuario, reparar estado
heredado obsoleto mediante `doctor` y seguir instalando, cargando, actualizando y desinstalando
plugins desde las fuentes compatibles.

Para el mapa más amplio del ejecutor de pruebas, consulta [Pruebas](/es/help/testing). Para claves de proveedores en vivo
y suites que tocan la red, consulta [Pruebas en vivo](/es/help/testing-live).

## Qué protegemos

Las pruebas de actualización y plugins protegen estos contratos:

- Un tarball de paquete está completo, tiene un `dist/postinstall-inventory.json` válido
  y no depende de archivos del repositorio sin empaquetar.
- Un usuario puede pasar de un paquete publicado anterior al paquete candidato
  sin perder configuración, agentes, sesiones, espacios de trabajo, listas de permitidos de plugins ni
  configuración de canales.
- `openclaw doctor --fix --non-interactive` es responsable de las rutas de limpieza y reparación
  heredadas. El inicio no debería acumular migraciones de compatibilidad ocultas para estado
  obsoleto de plugins.
- Las instalaciones de plugins funcionan desde directorios locales, repositorios git, paquetes npm y la
  ruta del registro de ClawHub.
- Las dependencias npm de plugins se instalan en la raíz npm administrada, se escanean antes
  de la confianza y se eliminan mediante npm durante la desinstalación para que las dependencias elevadas no
  permanezcan.
- La actualización de plugins es estable cuando no cambió nada: los registros de instalación, la
  fuente resuelta, el diseño de dependencias instaladas y el estado habilitado permanecen intactos.

## Prueba local durante el desarrollo

Empieza de forma acotada:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Para cambios de instalación, desinstalación, dependencias o inventario de paquetes de plugins, ejecuta también
las pruebas enfocadas que cubren el punto editado:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Antes de que cualquier lane Docker de paquetes consuma un tarball, verifica el artefacto del paquete:

```bash
pnpm release:check
```

`release:check` ejecuta comprobaciones de deriva de configuración/docs/API, escribe el inventario de distribución
del paquete, ejecuta `npm pack --dry-run`, rechaza archivos empaquetados prohibidos, instala
el tarball en un prefijo temporal, ejecuta postinstall y hace una prueba smoke de los puntos de entrada
de canales incluidos.

## Lanes Docker

Las lanes Docker son la prueba de nivel producto. Instalan o actualizan un paquete real
dentro de contenedores Linux y verifican el comportamiento mediante comandos CLI,
inicio del Gateway, probes HTTP, estado RPC y estado del sistema de archivos.

Usa lanes enfocadas mientras iteras:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

Lanes importantes:

- `test:docker:plugins` valida el smoke de instalación de plugins, instalaciones de carpetas locales,
  comportamiento de omisión de actualización de carpetas locales, carpetas locales con
  dependencias preinstaladas, instalaciones de paquetes `file:`, instalaciones git con ejecución de CLI, actualizaciones de referencias móviles git, instalaciones desde registro npm con dependencias transitivas elevadas, no-ops de actualización npm, instalaciones de fixtures locales de ClawHub y no-ops de actualización, comportamiento de actualización del marketplace, e habilitación/inspección del paquete Claude. Define
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` para mantener el bloque de ClawHub hermético/offline.
- `test:docker:plugin-update` valida que un plugin instalado sin cambios
  no se reinstale ni pierda metadatos de instalación durante `openclaw plugins update`.
- `test:docker:upgrade-survivor` instala el tarball candidato sobre un fixture de usuario antiguo
  sucio, ejecuta la actualización del paquete más doctor no interactivo, luego inicia
  un Gateway local loopback y comprueba la preservación del estado.
- `test:docker:published-upgrade-survivor` primero instala una línea base publicada,
  la configura mediante una receta `openclaw config set` incorporada, la actualiza al
  tarball candidato, ejecuta doctor, comprueba la limpieza heredada, inicia el Gateway y
  sondea `/healthz`, `/readyz` y el estado RPC.
- `test:docker:update-migration` es la lane de actualización publicada con mucha limpieza. Parte
  de un estado de usuario configurado de estilo Discord/Telegram, ejecuta el doctor de línea base
  para que las dependencias de plugins configuradas tengan oportunidad de materializarse, siembra
  restos heredados de dependencias de plugins para un plugin empaquetado configurado, actualiza al
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
`plugin-deps-cleanup`, `tilde-log-path` y `versioned-runtime-deps`. En ejecuciones agregadas,
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` se expande a todos los escenarios
con forma de incidencias reportadas.

La migración de actualización completa está intencionalmente separada de Full Release CI. Usa el
workflow manual `Update Migration` cuando la pregunta de release sea "¿pueden todas las
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

## Package Acceptance

Package Acceptance es la compuerta de paquetes nativa de GitHub. Resuelve un paquete candidato
en un tarball `package-under-test`, registra versión y SHA-256, y luego
ejecuta lanes Docker E2E reutilizables contra ese tarball exacto. El ref del arnés del workflow
está separado del ref de origen del paquete, para que la lógica de prueba actual pueda validar
releases confiables antiguos.

Fuentes candidatas:

- `source=npm`: valida `openclaw@beta`, `openclaw@latest` o una versión
  publicada exacta.
- `source=ref`: empaqueta una rama, etiqueta o commit confiable con el arnés actual seleccionado.
- `source=url`: valida un tarball HTTPS con `package_sha256` requerido.
- `source=artifact`: reutiliza un tarball subido por otra ejecución de Actions.

Las comprobaciones de release llaman a Package Acceptance con el conjunto de paquete/actualización/plugins:

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

También pasan:

```text
published_upgrade_survivor_baselines=release-history
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Esto mantiene la migración de paquetes, el cambio de canal de actualización, la limpieza de dependencias
obsoletas de plugins, la cobertura offline de plugins, el comportamiento de actualización de plugins y el QA de paquete
de Telegram en el mismo artefacto resuelto.

`release-history` es una muestra acotada de comprobación de release: las últimas seis releases estables,
`2026.4.23` y un ancla anterior a la fecha. Para cobertura exhaustiva de migración de actualización
publicada, usa `all-since-2026.4.23` en el workflow separado Update Migration
en lugar de Full Release CI.

Ejecuta manualmente un perfil de paquete cuando valides un candidato antes del release:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=package \
  -f published_upgrade_survivor_baselines=release-history \
  -f published_upgrade_survivor_scenarios=reported-issues \
  -f telegram_mode=mock-openai
```

Usa `suite_profile=product` cuando la pregunta de release incluya canales MCP,
limpieza de cron/subagentes, búsqueda web de OpenAI u OpenWebUI. Usa `suite_profile=full`
solo cuando necesites cobertura Docker completa de rutas de release.

## Valor predeterminado de release

Para candidatos de release, la pila de prueba predeterminada es:

1. `pnpm check:changed` y `pnpm test:changed` para regresiones a nivel de código fuente.
2. `pnpm release:check` para la integridad del artefacto del paquete.
3. Perfil `package` de Package Acceptance o las lanes de paquete personalizadas de release-check
   para contratos de instalación/actualización/plugins.
4. Comprobaciones de release entre sistemas operativos para comportamiento específico de instalador, onboarding y plataforma.
5. Suites en vivo solo cuando la superficie cambiada toca comportamiento de proveedores o servicios alojados.

En máquinas de mantenedores, las compuertas amplias y la prueba de producto Docker/paquete deberían ejecutarse
en Testbox salvo que se esté haciendo explícitamente prueba local.

## Compatibilidad heredada

La flexibilidad de compatibilidad es estrecha y limitada en el tiempo:

- Los paquetes hasta `2026.4.25`, incluido `2026.4.25-beta.*`, pueden tolerar
  lagunas de metadatos de paquetes ya publicados en Package Acceptance.
- El paquete publicado `2026.4.26` puede advertir por archivos de sello de metadatos
  de compilación local ya publicados.
- Los paquetes posteriores deben satisfacer los contratos modernos. Las mismas lagunas fallan en lugar de
  advertir u omitirse.

No agregues nuevas migraciones de inicio para estas formas antiguas. Agrega o amplía una reparación de doctor,
luego demuéstrala con `upgrade-survivor` o `published-upgrade-survivor`.

## Agregar cobertura

Cuando cambies comportamiento de actualización o plugins, agrega cobertura en la capa más baja que
pueda fallar por la razón correcta:

- Lógica pura de rutas o metadatos: prueba unitaria junto al código fuente.
- Inventario de paquetes o comportamiento de archivos empaquetados: prueba `package-dist-inventory` o de verificador
  de tarball.
- Comportamiento de instalación/actualización de CLI: aserción o fixture de lane Docker.
- Comportamiento de migración de release publicada: escenario `published-upgrade-survivor`.
- Comportamiento de registro/fuente de paquete: fixture de `test:docker:plugins` o servidor de fixture
  de ClawHub.
- Comportamiento de diseño o limpieza de dependencias: afirma tanto la ejecución en tiempo de ejecución como el
  límite del sistema de archivos. Las dependencias npm pueden elevarse bajo la raíz npm
  administrada, así que las pruebas deberían demostrar que la raíz se escanea/limpia en lugar de asumir un
  árbol `node_modules` local al paquete.

Mantén los nuevos fixtures Docker herméticos por defecto. Usa registros de fixtures locales y
paquetes falsos salvo que el objetivo de la prueba sea el comportamiento de un registro en vivo.

## Triaje de fallos

Empieza por la identidad del artefacto:

- Resumen `resolve_package` de Package Acceptance: fuente, versión, SHA-256 y
  nombre de artefacto.
- Artefactos Docker: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, logs de lanes y comandos de repetición.
- Resumen de upgrade survivor: `.artifacts/upgrade-survivor/summary.json`,
  incluida la versión de línea base, versión candidata, escenario, tiempos de fase y
  pasos de receta.

Prefiere volver a ejecutar la lane exacta fallida con el mismo artefacto de paquete antes que
volver a ejecutar todo el paraguas de release.
