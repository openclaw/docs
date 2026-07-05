---
read_when:
    - Cambiar el comportamiento de actualización, doctor, aceptación de paquetes o instalación de plugins de OpenClaw
    - Preparar o aprobar una versión candidata
    - Depuración de regresiones en la actualización de paquetes, la limpieza de dependencias de plugins o la instalación de plugins
sidebarTitle: Update and plugin tests
summary: Cómo valida OpenClaw las rutas de actualización, las migraciones de paquetes y el comportamiento de instalación/actualización de plugins
title: 'Pruebas: actualizaciones y plugins'
x-i18n:
    generated_at: "2026-07-05T01:57:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cd74606bfc6e600b6b3106fed2077c1b438f138aee3a67104669731a6e0db257
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Esta es la lista de verificación dedicada para la validación de actualizaciones y plugins. El objetivo es
simple: demostrar que el paquete instalable puede actualizar el estado real del usuario, reparar el estado
heredado obsoleto mediante `doctor` y seguir instalando, cargando, actualizando y desinstalando
plugins desde las fuentes admitidas.

Para el mapa más amplio del ejecutor de pruebas, consulta [Pruebas](/es/help/testing). Para claves de
proveedores en vivo y suites que tocan la red, consulta [Pruebas en vivo](/es/help/testing-live).

## Qué protegemos

Las pruebas de actualización y plugins protegen estos contratos:

- Un tarball de paquete está completo, tiene un `dist/postinstall-inventory.json` válido,
  y no depende de archivos del repo sin empaquetar.
- Un usuario puede pasar de un paquete publicado anterior al paquete candidato
  sin perder configuración, agentes, sesiones, espacios de trabajo, listas de permitidos de plugins ni
  configuración de canales.
- `openclaw doctor --fix --non-interactive` es dueño de las rutas de limpieza y reparación
  heredadas. El inicio no debe crecer con migraciones de compatibilidad ocultas para estado de
  plugins obsoleto.
- Las instalaciones de plugins funcionan desde directorios locales, repos git, paquetes npm y la
  ruta de registro de ClawHub.
- Las dependencias npm de plugins se instalan en un proyecto npm gestionado por plugin,
  se escanean antes de confiar en ellas y se eliminan mediante npm durante la desinstalación para que las
  dependencias elevadas no queden persistentes.
- La actualización de plugins es estable cuando nada cambió: los registros de instalación, la fuente
  resuelta, el diseño de dependencias instaladas y el estado habilitado permanecen intactos.

## Prueba local durante el desarrollo

Empieza acotado:

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

Antes de que cualquier carril Docker de paquetes consuma un tarball, demuestra el artefacto del paquete:

```bash
pnpm release:check
```

`release:check` ejecuta comprobaciones de deriva de configuración/docs/API, escribe el inventario dist
del paquete, ejecuta `npm pack --dry-run`, rechaza archivos empaquetados prohibidos, instala
el tarball en un prefijo temporal, ejecuta postinstall y hace pruebas de humo de los puntos de entrada
de canales incluidos.

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

- `test:docker:plugins` valida el humo de instalación de plugins, instalaciones desde carpetas locales,
  comportamiento de omisión de actualización de carpetas locales, carpetas locales con dependencias
  preinstaladas, instalaciones de paquetes `file:`, instalaciones git con ejecución de CLI, actualizaciones
  de refs móviles git, instalaciones desde registro npm con dependencias transitivas elevadas,
  no-ops de actualización npm, rechazo de metadatos de paquetes npm malformados,
  instalaciones de fixture local de ClawHub y no-ops de actualización, comportamiento de actualización de marketplace,
  y habilitar/inspeccionar el paquete Claude. Define `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` para
  mantener el bloque de ClawHub hermético/sin conexión.
- `test:docker:plugin-lifecycle-matrix` instala el paquete candidato en un contenedor vacío,
  ejecuta un plugin npm mediante instalación, inspección, deshabilitado, habilitado,
  upgrade explícito, downgrade explícito y desinstalación después de eliminar el código del plugin.
  Registra métricas de RSS y CPU para cada fase.
- `test:docker:plugin-update` valida que un plugin instalado sin cambios no
  se reinstale ni pierda metadatos de instalación durante `openclaw plugins update`.
- `test:docker:upgrade-survivor` instala el tarball candidato sobre un fixture sucio
  de usuario antiguo, ejecuta actualización de paquete más doctor no interactivo, luego inicia
  un Gateway loopback y comprueba la preservación del estado.
- `test:docker:published-upgrade-survivor` primero instala una línea base publicada,
  la configura mediante una receta `openclaw config set` integrada, la actualiza al
  tarball candidato, ejecuta doctor, comprueba la limpieza heredada, inicia el Gateway y
  sondea `/healthz`, `/readyz` y el estado RPC.
- `test:docker:update-restart-auth` instala el paquete candidato, inicia un
  Gateway gestionado con autenticación por token, desdefine el env de autenticación del gateway llamador para
  `openclaw update --yes --json`, y exige que el comando de actualización candidato
  reinicie el Gateway antes de los sondeos normales.
- `test:docker:update-migration` es el carril de actualización publicada con limpieza intensiva. Empieza
  desde un estado de usuario configurado al estilo Discord/Telegram, ejecuta el doctor de línea base
  para que las dependencias de plugins configurados tengan oportunidad de materializarse, siembra
  residuos de dependencias heredadas de plugins para un plugin empaquetado configurado, actualiza al
  tarball candidato y exige que el doctor posterior a la actualización elimine las raíces de dependencias
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
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` se expande a todos los escenarios
con forma de incidencias reportadas, incluida la migración de instalación de plugins configurados.

La migración completa de actualización está intencionalmente separada de Full Release CI. Usa el
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

## Aceptación de paquetes

Aceptación de paquetes es la puerta de paquetes nativa de GitHub. Resuelve un paquete candidato
en un tarball `package-under-test`, registra versión y SHA-256, y luego
ejecuta carriles Docker E2E reutilizables contra ese tarball exacto. La referencia del arnés de flujo de trabajo
está separada de la referencia de origen del paquete, por lo que la lógica de prueba actual puede validar
versiones confiables más antiguas.

Fuentes candidatas:

- `source=npm`: valida `openclaw@extended-stable`, `openclaw@beta`,
  `openclaw@latest` o una versión publicada exacta.
- `source=ref`: empaqueta una rama, etiqueta o commit confiable con el arnés actual
  seleccionado.
- `source=url`: valida un tarball HTTPS público con `package_sha256` requerido.
  Esta ruta rechaza credenciales en URL, puertos HTTPS no predeterminados, nombres de host o resultados
  DNS/IP privados/internos, espacio IP de uso especial y redirecciones inseguras.
- `source=trusted-url`: valida un tarball HTTPS con
  `package_sha256` y `trusted_source_id` requeridos contra la política propiedad de mantenedores
  en `.github/package-trusted-sources.json`. Usa esto para espejos empresariales/privados
  en lugar de debilitar `source=url` con un interruptor allow-private a nivel de entrada.
  La autenticación Bearer, cuando la política la configura, usa el secreto fijo
  `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.
- `source=artifact`: reutiliza un tarball subido por otra ejecución de Actions.

La Validación de lanzamiento completa usa `source=artifact` de forma predeterminada, construido a partir del
SHA de lanzamiento resuelto. Para prueba posterior a la publicación, pasa
`package_acceptance_package_spec=openclaw@YYYY.M.PATCH` para que la misma matriz de actualización
apunte al paquete npm enviado en su lugar.

Las comprobaciones de lanzamiento llaman a Aceptación de paquetes con el conjunto de paquete/actualización/reinicio/plugin:

```text
doctor-switch update-channel-switch update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update
```

Cuando el soak de lanzamiento está habilitado, también pasan:

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Esto mantiene la migración de paquetes, el cambio de canal de actualización, la tolerancia a plugins
gestionados corruptos, la limpieza de dependencias de plugins obsoletas, la cobertura de plugins sin conexión,
el comportamiento de actualización de plugins y el QA del paquete Telegram en el mismo artefacto resuelto sin
hacer que la puerta predeterminada de paquetes de lanzamiento recorra cada versión publicada.

`last-stable-4` se resuelve a las cuatro últimas versiones estables de OpenClaw publicadas en npm.
La aceptación de paquetes de lanzamiento fija `2026.4.23` como el primer límite de compatibilidad
de actualización de plugins, `2026.5.2` como un límite de churn de arquitectura de plugins y
`2026.4.15` como una línea base más antigua de actualización publicada de 2026.4.1x; el resolvedor
deduplica pines que ya están en las últimas cuatro. Para cobertura exhaustiva de migración de
actualizaciones publicadas, usa `all-since-2026.4.23` en el flujo de trabajo separado Update
Migration en lugar de Full Release CI. `release-history` sigue disponible
para muestreo manual más amplio cuando también quieras el ancla heredada anterior a esa fecha.

Cuando se seleccionan varias líneas base de superviviente de actualización publicada, el flujo de trabajo Docker
reutilizable fragmenta cada línea base en su propio job de runner dirigido. Cada
fragmento de línea base sigue ejecutando el conjunto de escenarios seleccionado, pero los logs y artefactos permanecen
por línea base y el tiempo de pared queda limitado por el fragmento más lento en lugar de por un gran
job serial.

Ejecuta un perfil de paquete manualmente al validar un candidato antes del lanzamiento:

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

Para un canario extended-stable publicado, define
`package_spec=openclaw@extended-stable`. Aceptación de paquetes resuelve ese
selector en un tarball exacto antes de que se ejecuten los carriles Docker.

Usa `suite_profile=product` cuando la pregunta de lanzamiento incluya canales MCP,
limpieza de cron/subagente, búsqueda web de OpenAI u OpenWebUI. Usa `suite_profile=full`
solo cuando necesites cobertura Docker completa de la ruta de lanzamiento.

## Predeterminado de lanzamiento

Para candidatos de lanzamiento, la pila de prueba predeterminada es:

1. `pnpm check:changed` y `pnpm test:changed` para regresiones a nivel de código fuente.
2. `pnpm release:check` para la integridad del artefacto del paquete.
3. Perfil `package` de Aceptación de paquetes o los carriles personalizados de paquete
   de release-check para contratos de instalación/actualización/reinicio/plugin.
4. Comprobaciones de lanzamiento entre sistemas operativos para comportamiento específico del SO en instalador, onboarding y plataforma.
5. Suites en vivo solo cuando la superficie cambiada toca comportamiento de proveedores o servicios alojados.

En máquinas de mantenedores, las puertas amplias y la prueba de producto Docker/paquetes deben ejecutarse
en Testbox salvo que se esté haciendo prueba local explícitamente.

## Compatibilidad heredada

La indulgencia de compatibilidad es estrecha y limitada en el tiempo:

- Los paquetes hasta `2026.4.25`, incluido `2026.4.25-beta.*`, pueden tolerar
  brechas de metadatos de paquetes ya publicados en Aceptación de paquetes.
- El paquete publicado `2026.4.26` puede advertir por archivos de sello de metadatos
  de compilación local ya enviados.
- Los paquetes posteriores deben satisfacer los contratos modernos. Las mismas brechas fallan en lugar de
  advertir u omitirse.

No agregues nuevas migraciones de inicio para estas formas antiguas. Agrega o amplía una reparación de doctor,
y luego demuéstrala con `upgrade-survivor`, `published-upgrade-survivor` o
`update-restart-auth` cuando el comando de actualización sea dueño del reinicio.

## Agregar cobertura

Al cambiar el comportamiento de actualización o plugins, agrega cobertura en la capa más baja que
pueda fallar por la razón correcta:

- Lógica pura de rutas o metadatos: prueba unitaria junto al código fuente.
- Inventario de paquete o comportamiento de archivos empaquetados: prueba de
  `package-dist-inventory` o verificador de tarball.
- Comportamiento de instalación/actualización de CLI: aserción de lane de Docker
  o fixture.
- Comportamiento de migración de versión publicada: escenario
  `published-upgrade-survivor`.
- Comportamiento de reinicio propiedad de la actualización: `update-restart-auth`.
- Comportamiento de origen de registro/paquete: fixture de `test:docker:plugins`
  o servidor fixture de ClawHub.
- Comportamiento de disposición o limpieza de dependencias: comprueba tanto la
  ejecución en tiempo de ejecución como el límite del sistema de archivos. Las
  dependencias npm pueden izarse dentro del proyecto npm gestionado del plugin,
  así que las pruebas deben demostrar que ese proyecto se escanea/limpia en vez
  de asumir solo el árbol `node_modules` local al paquete del plugin.

Mantén los nuevos fixtures de Docker herméticos por defecto. Usa registros de
fixtures locales y paquetes falsos, salvo que el objetivo de la prueba sea el
comportamiento del registro en vivo.

## Triaje de fallos

Empieza con la identidad del artefacto:

- Resumen de `resolve_package` de Package Acceptance: origen, versión, SHA-256 y
  nombre del artefacto.
- Artefactos de Docker: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, registros de lane y comandos de repetición.
- Resumen de superviviente de actualización:
  `.artifacts/upgrade-survivor/summary.json`, incluida la versión base, la
  versión candidata, el escenario, los tiempos de fase y los pasos de la receta.

Prefiere volver a ejecutar la lane exacta fallida con el mismo artefacto de
paquete antes que volver a ejecutar todo el paraguas de lanzamiento.
