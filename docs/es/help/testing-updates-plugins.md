---
read_when:
    - Cambiar el comportamiento de actualización, doctor, aceptación de paquetes o instalación de plugins de OpenClaw
    - Preparar o aprobar una versión candidata
    - Depuración de actualizaciones de paquetes, limpieza de dependencias de plugins o regresiones de instalación de plugins
sidebarTitle: Update and plugin tests
summary: Cómo OpenClaw valida las rutas de actualización, las migraciones de paquetes y el comportamiento de instalación/actualización de Plugin
title: 'Pruebas: actualizaciones y plugins'
x-i18n:
    generated_at: "2026-05-02T20:50:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1a56e249f565cc23a439142b3332c0a57fd4afe9021b79f644d353946d6d2ffc
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Esta es la lista de verificación dedicada para la validación de actualizaciones y plugins. El objetivo es
simple: demostrar que el paquete instalable puede actualizar el estado real del usuario, reparar estado
heredado obsoleto mediante `doctor` y seguir instalando, cargando, actualizando y desinstalando
plugins desde los orígenes admitidos.

Para el mapa más amplio del ejecutor de pruebas, consulta [Pruebas](/es/help/testing). Para claves de proveedores
en vivo y suites que tocan la red, consulta [Pruebas en vivo](/es/help/testing-live).

## Qué protegemos

Las pruebas de actualización y plugins protegen estos contratos:

- Un tarball de paquete está completo, tiene un `dist/postinstall-inventory.json` válido
  y no depende de archivos del repositorio sin empaquetar.
- Un usuario puede pasar de un paquete publicado anterior al paquete candidato
  sin perder configuración, agentes, sesiones, espacios de trabajo, listas de plugins permitidos ni
  configuración de canales.
- `openclaw doctor --fix --non-interactive` es responsable de las rutas de limpieza y reparación
  heredadas. El inicio no debe crecer con migraciones de compatibilidad ocultas para estado
  obsoleto de plugins.
- Las instalaciones de plugins funcionan desde directorios locales, repositorios git, paquetes npm y la
  ruta de registro de ClawHub.
- Las dependencias npm de plugins se instalan en la raíz npm gestionada, se analizan antes
  de confiar en ellas y se eliminan mediante npm durante la desinstalación para que las dependencias elevadas no
  permanezcan.
- La actualización de plugins es estable cuando no cambió nada: los registros de instalación, el origen
  resuelto, la disposición de dependencias instaladas y el estado habilitado permanecen intactos.

## Prueba local durante el desarrollo

Empieza de forma acotada:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Para cambios de instalación, desinstalación, dependencias o inventario de paquetes de plugins, ejecuta también
las pruebas enfocadas que cubren la interfaz editada:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Antes de que cualquier carril Docker de paquetes consuma un tarball, demuestra el artefacto del paquete:

```bash
pnpm release:check
```

`release:check` ejecuta comprobaciones de deriva de configuración/docs/API, escribe el inventario dist
del paquete, ejecuta `npm pack --dry-run`, rechaza archivos empaquetados prohibidos, instala
el tarball en un prefijo temporal, ejecuta postinstall y hace una prueba de humo de los puntos de entrada
de canales incluidos.

## Carriles Docker

Los carriles Docker son la prueba a nivel de producto. Instalan o actualizan un paquete real
dentro de contenedores Linux y verifican el comportamiento mediante comandos de CLI,
inicio del Gateway, sondeos HTTP, estado RPC y estado del sistema de archivos.

Usa carriles enfocados mientras iteras:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

Carriles importantes:

- `test:docker:plugins` valida la prueba de humo de instalación de plugins, instalaciones desde carpetas locales,
  comportamiento de omisión de actualización de carpetas locales, carpetas locales con dependencias
  preinstaladas, instalaciones de paquetes `file:`, instalaciones git con ejecución de CLI, actualizaciones de
  referencias móviles git, instalaciones desde registro npm con dependencias transitivas
  elevadas, no-ops de actualización npm, instalaciones desde fixture local de ClawHub y no-ops de actualización,
  comportamiento de actualización del marketplace, y habilitación/inspección del paquete de Claude. Define
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` para mantener el bloque de ClawHub hermético/sin conexión.
- `test:docker:plugin-update` valida que un plugin instalado sin cambios no
  se reinstale ni pierda metadatos de instalación durante `openclaw plugins update`.
- `test:docker:upgrade-survivor` instala el tarball candidato sobre un fixture sucio
  de usuario antiguo, ejecuta actualización de paquete más doctor no interactivo, luego inicia
  un Gateway local loopback y comprueba la preservación del estado.
- `test:docker:published-upgrade-survivor` primero instala una línea base publicada,
  la configura mediante una receta `openclaw config set` integrada, la actualiza al
  tarball candidato, ejecuta doctor, comprueba la limpieza heredada, inicia el Gateway y
  sondea `/healthz`, `/readyz` y el estado RPC.
- `test:docker:update-migration` es el carril de actualización publicada con mucha limpieza. Parte
  de un estado de usuario configurado al estilo Discord/Telegram, ejecuta doctor de línea base para que
  las dependencias de plugins configurados tengan oportunidad de materializarse, siembra
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
`plugin-deps-cleanup`, `configured-plugin-installs`, `tilde-log-path` y
`versioned-runtime-deps`. En ejecuciones agregadas,
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` se expande a todos los escenarios con forma de incidencias
reportadas, incluida la migración de instalación de plugins configurados.

La migración completa de actualización está separada intencionalmente del CI de lanzamiento completo. Usa el
flujo de trabajo manual `Update Migration` cuando la pregunta de lanzamiento sea "¿puede cada
versión estable publicada desde 2026.4.23 en adelante actualizarse a este candidato y
limpiar restos de dependencias de plugins?":

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Aceptación del paquete

Package Acceptance es la compuerta de paquetes nativa de GitHub. Resuelve un paquete
candidato en un tarball `package-under-test`, registra versión y SHA-256, y luego
ejecuta carriles Docker E2E reutilizables contra ese tarball exacto. La referencia del arnés del flujo de trabajo
está separada de la referencia del origen del paquete, por lo que la lógica de prueba actual puede validar
versiones confiables más antiguas.

Orígenes candidatos:

- `source=npm`: valida `openclaw@beta`, `openclaw@latest` o una versión
  publicada exacta.
- `source=ref`: empaqueta una rama, etiqueta o commit confiable con el arnés actual
  seleccionado.
- `source=url`: valida un tarball HTTPS con `package_sha256` obligatorio.
- `source=artifact`: reutiliza un tarball subido por otra ejecución de Actions.

Full Release Validation usa `source=artifact` de forma predeterminada, construido desde el
SHA de lanzamiento resuelto. Para prueba posterior a la publicación, pasa
`package_acceptance_package_spec=openclaw@YYYY.M.D` para que la misma matriz de actualización
apunte al paquete npm enviado en su lugar.

Las comprobaciones de lanzamiento llaman a Package Acceptance con el conjunto de paquete/actualización/plugin:

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

También pasan:

```text
published_upgrade_survivor_baselines=all-since-2026.4.23
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Esto mantiene la migración de paquetes, el cambio de canal de actualización, la limpieza de dependencias
obsoletas de plugins, la cobertura offline de plugins, el comportamiento de actualización de plugins y la QA del paquete
Telegram sobre el mismo artefacto resuelto.

`all-since-2026.4.23` es la muestra de actualización de Full Release CI: cada versión estable publicada en npm desde `2026.4.23` hasta `latest`. Para una cobertura exhaustiva de migración de actualización
publicada, usa `all-since-2026.4.23` en el flujo de trabajo separado Update
Migration en lugar de Full Release CI. `release-history` sigue
disponible para muestreo manual más amplio cuando también quieres el ancla heredada previa a la fecha.

Ejecuta manualmente un perfil de paquete al validar un candidato antes del lanzamiento:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=package \
  -f published_upgrade_survivor_baselines=all-since-2026.4.23 \
  -f published_upgrade_survivor_scenarios=reported-issues \
  -f telegram_mode=mock-openai
```

Usa `suite_profile=product` cuando la pregunta de lanzamiento incluya canales MCP,
limpieza de cron/subagentes, búsqueda web de OpenAI u OpenWebUI. Usa `suite_profile=full`
solo cuando necesites cobertura completa de la ruta de lanzamiento Docker.

## Valor predeterminado de lanzamiento

Para candidatos de lanzamiento, la pila de prueba predeterminada es:

1. `pnpm check:changed` y `pnpm test:changed` para regresiones a nivel de código fuente.
2. `pnpm release:check` para la integridad del artefacto del paquete.
3. Perfil `package` de Package Acceptance o los carriles personalizados de paquete de release-check
   para contratos de instalación/actualización/plugins.
4. Comprobaciones de lanzamiento entre sistemas operativos para comportamiento específico del instalador, onboarding y plataforma
   por sistema operativo.
5. Suites en vivo solo cuando la superficie modificada toque comportamiento de proveedores o servicios alojados.

En máquinas de mantenedores, las compuertas amplias y la prueba de producto Docker/paquete deben ejecutarse
en Testbox salvo que se esté haciendo explícitamente prueba local.

## Compatibilidad heredada

La tolerancia de compatibilidad es estrecha y acotada en el tiempo:

- Los paquetes hasta `2026.4.25`, incluido `2026.4.25-beta.*`, pueden tolerar
  brechas de metadatos de paquetes ya enviadas en Package Acceptance.
- El paquete publicado `2026.4.26` puede advertir por archivos de sello de metadatos de compilación local
  ya enviados.
- Los paquetes posteriores deben satisfacer los contratos modernos. Las mismas brechas fallan en lugar de
  advertir u omitirse.

No agregues nuevas migraciones de inicio para estas formas antiguas. Agrega o amplía una reparación de doctor,
luego demuéstrala con `upgrade-survivor` o `published-upgrade-survivor`.

## Agregar cobertura

Al cambiar comportamiento de actualización o plugins, agrega cobertura en la capa más baja que
pueda fallar por la razón correcta:

- Lógica pura de rutas o metadatos: prueba unitaria junto al código fuente.
- Inventario de paquetes o comportamiento de archivos empaquetados: prueba `package-dist-inventory` o del verificador
  de tarballs.
- Comportamiento de instalación/actualización de CLI: aserción o fixture de carril Docker.
- Comportamiento de migración de versión publicada: escenario `published-upgrade-survivor`.
- Comportamiento de origen de registro/paquete: fixture `test:docker:plugins` o servidor fixture
  de ClawHub.
- Comportamiento de disposición o limpieza de dependencias: verifica tanto la ejecución en runtime como el
  límite del sistema de archivos. Las dependencias npm pueden elevarse bajo la raíz npm
  gestionada, por lo que las pruebas deben demostrar que la raíz se analiza/limpia en lugar de asumir un
  árbol `node_modules` local del paquete.

Mantén los nuevos fixtures Docker herméticos de forma predeterminada. Usa registros fixture locales y
paquetes falsos salvo que el objetivo de la prueba sea el comportamiento de registro en vivo.

## Triaje de fallos

Empieza con la identidad del artefacto:

- Resumen `resolve_package` de Package Acceptance: origen, versión, SHA-256 y
  nombre del artefacto.
- Artefactos Docker: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, registros de carriles y comandos de reejecución.
- Resumen de superviviente de actualización: `.artifacts/upgrade-survivor/summary.json`,
  incluida la versión de línea base, versión candidata, escenario, tiempos de fases y
  pasos de receta.

Prefiere reejecutar el carril exacto fallido con el mismo artefacto de paquete en lugar de
reejecutar todo el paraguas de lanzamiento.
