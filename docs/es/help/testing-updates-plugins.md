---
read_when:
    - Cambiar el comportamiento de actualización, doctor, aceptación de paquetes o instalación de plugins de OpenClaw
    - Preparar o aprobar una versión candidata
    - Depuración de actualizaciones de paquetes, limpieza de dependencias de plugins o regresiones de instalación de plugins
sidebarTitle: Update and plugin tests
summary: Cómo valida OpenClaw las rutas de actualización, las migraciones de paquetes y el comportamiento de instalación/actualización de plugins
title: 'Pruebas: actualizaciones y plugins'
x-i18n:
    generated_at: "2026-07-05T11:24:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e930960b5819d2144467476cb473e62f236eca63e1d9941a6bc793b484e731c
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Lista de comprobación para la validación de actualización y Plugin: demostrar que el paquete instalable puede
actualizar el estado real del usuario, reparar el estado heredado obsoleto mediante `doctor` y seguir
instalando, cargando, actualizando y desinstalando plugins desde todos los orígenes admitidos.

Para el mapa más amplio del ejecutor de pruebas, consulta [Pruebas](/es/help/testing). Para claves de proveedores
en vivo y suites que tocan la red, consulta [Pruebas en vivo](/es/help/testing-live).

## Qué protegemos

- Un tarball de paquete está completo, tiene un `dist/postinstall-inventory.json` válido
  y no depende de archivos del repositorio sin empaquetar.
- Un usuario puede pasar de un paquete publicado anterior al paquete candidato
  sin perder configuración, agentes, sesiones, espacios de trabajo, listas de permitidos de plugins ni
  configuración de canales.
- `openclaw doctor --fix --non-interactive` es responsable de las rutas de limpieza y reparación
  heredadas. El inicio no debe incorporar migraciones de compatibilidad ocultas para estado
  de plugins obsoleto.
- Las instalaciones de plugins funcionan desde directorios locales, repositorios git, paquetes npm y la
  ruta de registro de ClawHub.
- Las dependencias npm de plugins se instalan en un proyecto npm gestionado por plugin,
  se escanean antes de confiar en ellas y se eliminan mediante `npm uninstall` durante la
  desinstalación del plugin para que las dependencias elevadas no permanezcan.
- La actualización de plugins no hace nada cuando nada cambió: los registros de instalación, el
  origen resuelto, el diseño de dependencias instaladas y el estado habilitado permanecen intactos.

## Prueba local durante el desarrollo

Empieza con alcance limitado:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Para cambios en instalación, desinstalación, dependencias o inventario de paquete de plugins, ejecuta también
las pruebas enfocadas que cubren el punto editado:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Antes de que cualquier carril Docker de paquetes consuma un tarball, demuestra el artefacto del paquete:

```bash
pnpm release:check
```

`release:check` ejecuta comprobaciones de deriva de configuración/docs/API (esquema de configuración, línea base de docs de configuración,
línea base y exportaciones de la API del SDK de plugins, versiones/inventario de plugins),
escribe el inventario dist del paquete, ejecuta `npm pack --dry-run`, rechaza archivos
empaquetados prohibidos, instala el tarball en un prefijo temporal, ejecuta postinstall y
hace una prueba smoke de los puntos de entrada de canales incluidos.

## Carriles Docker

Los carriles Docker son la prueba a nivel de producto. Instalan o actualizan un paquete real
dentro de contenedores Linux y verifican el comportamiento mediante comandos de CLI,
inicio del Gateway, sondeos HTTP, estado RPC y estado del sistema de archivos.

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

- `test:docker:plugins` cubre la prueba smoke de instalación de plugins, instalaciones desde carpeta local,
  comportamiento de omisión de actualización de carpetas locales, carpetas locales con dependencias
  preinstaladas, instalaciones de paquetes `file:`, instalaciones git con ejecución de CLI, actualizaciones
  de refs móviles git, instalaciones desde registro npm con dependencias transitivas elevadas,
  no-ops de actualización npm, rechazo de metadatos de paquete npm mal formados,
  instalaciones de fixtures locales de ClawHub y no-ops de actualización, comportamiento de actualización de marketplace
  y habilitación/inspección del paquete Claude. Define `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` para
  mantener el bloque de ClawHub hermético/sin conexión.
- `test:docker:plugin-lifecycle-matrix` instala el paquete candidato en un contenedor
  vacío, ejecuta un plugin npm mediante instalación, inspección, deshabilitación, habilitación,
  actualización explícita, degradación explícita y desinstalación después de eliminar el código del plugin.
  Registra métricas de RSS y CPU por fase.
- `test:docker:plugin-update` valida que un plugin instalado sin cambios no
  se reinstale ni pierda metadatos de instalación durante `openclaw plugins update`.
- `test:docker:upgrade-survivor` instala el tarball candidato sobre un fixture de
  usuario antiguo sucio, ejecuta actualización de paquete más doctor no interactivo, luego inicia
  un Gateway loopback y comprueba la preservación del estado.
- `test:docker:published-upgrade-survivor` primero instala una línea base publicada,
  la configura mediante una receta `openclaw config set` integrada, la actualiza al
  tarball candidato, ejecuta doctor, comprueba la limpieza heredada, inicia el Gateway y
  sondea `/healthz`, `/readyz` y el estado RPC.
- `test:docker:update-restart-auth` instala el paquete candidato, inicia un
  Gateway gestionado con autenticación por token, desdefine las variables de entorno de autenticación del Gateway del llamador para
  `openclaw update --yes --json` y exige que el comando de actualización candidato
  reinicie el Gateway antes de los sondeos normales.
- `test:docker:update-migration` es el carril de actualización publicada con mucha limpieza. Parte
  de un estado de usuario configurado al estilo Discord/Telegram, ejecuta doctor de línea base para que
  las dependencias de plugins configurados tengan ocasión de materializarse, siembra
  residuos heredados de dependencias de plugins para un plugin empaquetado configurado, actualiza al
  tarball candidato y exige que doctor posterior a la actualización elimine las raíces de dependencias
  heredadas.

Variantes útiles del superviviente de actualización publicada:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

Escenarios disponibles: `base`, `acpx-openclaw-tools-bridge`, `feishu-channel`,
`bootstrap-persona`, `channel-post-core-restore`, `plugin-deps-cleanup`,
`configured-plugin-installs`, `stale-source-plugin-shadow`, `tilde-log-path`
y `versioned-runtime-deps`. En ejecuciones agregadas, `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`
(alias `far-reaching`) se expande a todos los escenarios, incluida la
migración de instalación de plugins configurados.

La migración completa de actualización está separada intencionalmente de la CI de versión completa. Usa el
flujo de trabajo manual `Update Migration` cuando la pregunta de la versión sea "¿puede cada
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

## Aceptación de paquetes

La Aceptación de paquetes es la compuerta de paquetes nativa de GitHub. Resuelve un paquete
candidato en un tarball `package-under-test`, registra la versión y SHA-256, y luego
ejecuta carriles Docker E2E reutilizables contra ese tarball exacto. La referencia del arnés de flujo de trabajo
está separada de la referencia de origen del paquete, por lo que la lógica de prueba actual puede validar
versiones confiables anteriores.

Orígenes candidatos:

- `source=npm`: valida `openclaw@extended-stable`, `openclaw@beta`,
  `openclaw@latest` o una versión publicada exacta.
- `source=ref`: empaqueta una rama, etiqueta o commit confiable con el arnés actual
  seleccionado.
- `source=url`: valida un tarball HTTPS público con `package_sha256` requerido.
  Esta ruta rechaza credenciales en URL, puertos HTTPS no predeterminados, nombres de host o resultados DNS/IP
  privados/internos, espacio IP de uso especial y redirecciones inseguras.
- `source=trusted-url`: valida un tarball HTTPS con
  `package_sha256` y `trusted_source_id` requeridos contra la política propiedad de mantenedores
  en `.github/package-trusted-sources.json`. Usa esto para espejos empresariales/privados
  en lugar de debilitar `source=url` con un interruptor allow-private a nivel de entrada.
  La autenticación Bearer, cuando la política la configura, usa el secreto fijo
  `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.
- `source=artifact`: reutiliza un tarball subido por otra ejecución de Actions.

La Validación de versión completa usa `source=artifact` de forma predeterminada, creado a partir del
SHA de versión resuelto. Para prueba posterior a la publicación, pasa
`package_acceptance_package_spec=openclaw@YYYY.M.PATCH` para que la misma matriz de actualización
apunte al paquete npm enviado.

Las comprobaciones de versión llaman a Aceptación de paquetes con el conjunto de paquete/actualización/reinicio/plugin:

```text
doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape
```

Cuando la maduración de versión está habilitada (forzada para `release_profile=stable` y
`full`), también pasan:

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Esto mantiene la migración de paquetes, el cambio de canal de actualización, la tolerancia a plugins gestionados
corruptos, la limpieza de dependencias de plugins obsoletas, la cobertura de plugins sin conexión, el
comportamiento de actualización de plugins y el QA de paquete de Telegram en el mismo artefacto resuelto sin
hacer que la compuerta de paquetes de versión predeterminada recorra cada versión publicada.

`last-stable-4` se resuelve a las cuatro versiones estables de OpenClaw más recientes
publicadas en npm. La aceptación de paquetes de versión fija `2026.4.23` como el primer límite de
compatibilidad de actualización de plugins, `2026.5.2` como un límite de cambios de arquitectura de plugins y
`2026.4.15` como una línea base anterior de actualización publicada 2026.4.1x; el resolutor
deduplica pines que ya están en las cuatro últimas. Para cobertura exhaustiva de migración de
actualización publicada, usa `all-since-2026.4.23` en el flujo de trabajo Update Migration
separado en lugar de la CI de versión completa. `release-history` sigue
disponible para muestreo manual más amplio cuando también quieres el ancla heredada anterior a esa fecha.

Cuando se seleccionan varias líneas base de superviviente de actualización publicada, el flujo de trabajo Docker
reutilizable divide cada línea base en su propio job de ejecutor dirigido. Cada
fragmento de línea base sigue ejecutando el conjunto de escenarios seleccionado, pero los logs y artefactos permanecen
por línea base y el tiempo total queda acotado por el fragmento más lento en lugar de un job
serial grande.

Ejecuta un perfil de paquete manualmente al validar un candidato antes de la versión:

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

Para un canary extended-stable publicado, define
`package_spec=openclaw@extended-stable`. Aceptación de paquetes resuelve ese
selector a un tarball exacto antes de que se ejecuten los carriles Docker.

Usa `suite_profile=product` cuando la pregunta de la versión incluya canales MCP,
limpieza de cron/subagente, búsqueda web de OpenAI u OpenWebUI. Usa `suite_profile=full`
solo cuando necesites cobertura completa de ruta de versión Docker.

## Valor predeterminado de versión

Para candidatos de versión, la pila de prueba predeterminada es:

1. `pnpm check:changed` y `pnpm test:changed` para regresiones a nivel de origen.
2. `pnpm release:check` para integridad del artefacto de paquete.
3. Perfil `package` de Aceptación de paquetes o los carriles de paquetes personalizados de comprobación de versión
   para contratos de instalación/actualización/reinicio/plugin.
4. Comprobaciones de versión entre sistemas operativos para instalador, onboarding y comportamiento de plataforma
   específicos del sistema operativo.
5. Suites en vivo solo cuando la superficie cambiada toca comportamiento de proveedor o servicio alojado.

En máquinas de mantenedores, las compuertas amplias y la prueba de producto Docker/paquete deben ejecutarse
en Testbox salvo que se esté haciendo prueba local explícitamente.

## Compatibilidad heredada

La tolerancia de compatibilidad es estrecha y limitada en el tiempo:

- Los paquetes hasta `2026.4.25`, incluido `2026.4.25-beta.*`, pueden tolerar
  huecos de metadatos de paquete ya enviados en Aceptación de paquetes.
- El paquete publicado `2026.4.26` puede advertir por archivos de marca de metadatos
  de compilación local ya enviados.
- Los paquetes posteriores deben cumplir los contratos modernos. Los mismos huecos fallan en lugar de
  advertir u omitirse.

No agregues nuevas migraciones de inicio para estas formas antiguas. Agrega o extiende una reparación de doctor,
luego demuéstrala con `upgrade-survivor`, `published-upgrade-survivor` o
`update-restart-auth` cuando el comando de actualización sea responsable del reinicio.

## Agregar cobertura

Al cambiar comportamiento de actualización o plugins, agrega cobertura en la capa más baja que
pueda fallar por la razón correcta:

- Lógica pura de rutas o metadatos: prueba unitaria junto al código fuente.
- Inventario del paquete o comportamiento de archivos empaquetados: prueba
  `package-dist-inventory` o de verificación de tarball.
- Comportamiento de instalación/actualización de la CLI: aserción de carril de
  Docker o fixture.
- Comportamiento de migración de una versión publicada: escenario
  `published-upgrade-survivor`.
- Comportamiento de reinicio propiedad de la actualización: `update-restart-auth`.
- Comportamiento de origen de registro/paquete: fixture de `test:docker:plugins`
  o servidor fixture de ClawHub.
- Comportamiento de diseño de dependencias o limpieza: afirma tanto la ejecución
  en tiempo de ejecución como el límite del sistema de archivos. Las dependencias
  de npm pueden estar elevadas dentro del proyecto npm gestionado del Plugin, por
  lo que las pruebas deben demostrar que ese proyecto se escanea/limpia en lugar
  de asumir solo el árbol `node_modules` local del paquete del Plugin.

Mantén los nuevos fixtures de Docker herméticos de forma predeterminada. Usa
registros de fixtures locales y paquetes falsos, salvo que el objetivo de la
prueba sea el comportamiento de un registro en vivo.

## Triaje de fallos

Empieza con la identidad del artefacto:

- Resumen de `resolve_package` de Aceptación de paquetes: origen, versión,
  SHA-256 y nombre del artefacto.
- Artefactos de Docker: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, registros de carril y comandos de repetición.
- Resumen de supervivencia de actualización: `.artifacts/upgrade-survivor/summary.json`,
  incluidas la versión base, la versión candidata, el escenario, los tiempos de
  fase y la cobertura de recetas de configuración.

Prefiere volver a ejecutar el carril exacto fallido con el mismo artefacto de
paquete antes que volver a ejecutar todo el paraguas de la versión.
