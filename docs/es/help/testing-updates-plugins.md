---
read_when:
    - Cambio del comportamiento de actualización, doctor, aceptación de paquetes o instalación de plugins de OpenClaw
    - Preparación o aprobación de una versión candidata
    - Depuración de actualizaciones de paquetes, limpieza de dependencias de plugins o regresiones en la instalación de plugins
sidebarTitle: Update and plugin tests
summary: Cómo valida OpenClaw las rutas de actualización, las migraciones de paquetes y el comportamiento de instalación y actualización de plugins
title: 'Pruebas: actualizaciones y plugins'
x-i18n:
    generated_at: "2026-07-11T23:11:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e930960b5819d2144467476cb473e62f236eca63e1d9941a6bc793b484e731c
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Lista de comprobación para validar actualizaciones y plugins: demostrar que el paquete instalable puede
actualizar el estado real del usuario, reparar mediante `doctor` el estado heredado obsoleto y seguir
instalando, cargando, actualizando y desinstalando plugins desde todos los orígenes compatibles.

Para consultar el mapa general del ejecutor de pruebas, consulta [Pruebas](/es/help/testing). Para las claves
de proveedores activos y las suites que acceden a la red, consulta [Pruebas en vivo](/es/help/testing-live).

## Qué protegemos

- Un tarball de paquete está completo, contiene un archivo `dist/postinstall-inventory.json`
  válido y no depende de archivos desempaquetados del repositorio.
- Un usuario puede pasar de un paquete publicado anterior al paquete candidato
  sin perder la configuración, los agentes, las sesiones, los espacios de trabajo, las listas de plugins
  permitidos ni la configuración de canales.
- `openclaw doctor --fix --non-interactive` es responsable de las rutas de limpieza
  y reparación heredadas. El inicio no debe incorporar migraciones de compatibilidad
  ocultas para estados obsoletos de plugins.
- Las instalaciones de plugins funcionan desde directorios locales, repositorios git, paquetes npm
  y la ruta del registro de ClawHub.
- Las dependencias npm de cada plugin se instalan en un único proyecto npm administrado por plugin,
  se analizan antes de concederles confianza y se eliminan mediante `npm uninstall` durante
  la desinstalación del plugin, para que las dependencias elevadas no permanezcan.
- La actualización de un plugin no hace nada cuando no ha cambiado nada: los registros de instalación,
  el origen resuelto, la disposición de las dependencias instaladas y el estado de activación permanecen intactos.

## Comprobación local durante el desarrollo

Empieza por lo más específico:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Para cambios en la instalación, desinstalación, dependencias o inventario de paquetes
de plugins, ejecuta también las pruebas específicas que cubren el punto de integración editado:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Antes de que cualquier vía Docker de paquetes consuma un tarball, comprueba el artefacto del paquete:

```bash
pnpm release:check
```

`release:check` ejecuta comprobaciones de divergencias de configuración, documentación y API
(esquema de configuración, referencia base de la documentación de configuración, referencia base y
exportaciones de la API del SDK de plugins, versiones e inventario de plugins), escribe el inventario
de distribución del paquete, ejecuta `npm pack --dry-run`, rechaza archivos empaquetados prohibidos,
instala el tarball en un prefijo temporal, ejecuta la posinstalación y realiza pruebas básicas de los
puntos de entrada de los canales incluidos.

## Vías Docker

Las vías Docker constituyen la comprobación a nivel de producto. Instalan o actualizan un paquete real
dentro de contenedores Linux y verifican su comportamiento mediante comandos de la CLI,
el inicio del Gateway, sondas HTTP, el estado RPC y el estado del sistema de archivos.

Utiliza vías específicas mientras iteras:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-restart-auth
pnpm test:docker:update-migration
```

Vías importantes:

- `test:docker:plugins` cubre pruebas básicas de instalación de plugins, instalaciones desde
  carpetas locales, el comportamiento de omisión de actualizaciones de carpetas locales, carpetas
  locales con dependencias preinstaladas, instalaciones de paquetes `file:`, instalaciones git con
  ejecución de la CLI, actualizaciones de referencias git móviles, instalaciones desde el registro npm
  con dependencias transitivas elevadas, actualizaciones npm que no realizan cambios, el rechazo de
  metadatos incorrectos de paquetes npm, instalaciones desde fixtures locales de ClawHub y
  actualizaciones sin cambios, el comportamiento de actualización del marketplace y la activación
  e inspección del paquete de Claude. Establece `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` para mantener
  el bloque de ClawHub hermético y sin conexión.
- `test:docker:plugin-lifecycle-matrix` instala el paquete candidato en un contenedor vacío
  y somete un plugin npm a instalación, inspección, desactivación, activación, actualización
  explícita, reversión explícita a una versión anterior y desinstalación después de eliminar el código
  del plugin. Registra métricas de RSS y CPU por fase.
- `test:docker:plugin-update` valida que un plugin instalado sin cambios no se reinstale
  ni pierda sus metadatos de instalación durante `openclaw plugins update`.
- `test:docker:upgrade-survivor` instala el tarball candidato sobre un fixture de usuario
  antiguo con estado residual, ejecuta la actualización del paquete junto con `doctor` de forma
  no interactiva, inicia después un Gateway de loopback y comprueba que se conserve el estado.
- `test:docker:published-upgrade-survivor` instala primero una versión base publicada,
  la configura mediante una receta integrada de `openclaw config set`, la actualiza al
  tarball candidato, ejecuta `doctor`, comprueba la limpieza heredada, inicia el Gateway
  y sondea `/healthz`, `/readyz` y el estado RPC.
- `test:docker:update-restart-auth` instala el paquete candidato, inicia un Gateway
  administrado con autenticación por token, elimina del entorno la autenticación del Gateway
  del invocador para `openclaw update --yes --json` y exige que el comando de actualización
  del candidato reinicie el Gateway antes de realizar las sondas habituales.
- `test:docker:update-migration` es la vía de actualización publicada con mayor énfasis
  en la limpieza. Parte de un estado de usuario configurado al estilo de Discord/Telegram,
  ejecuta primero `doctor` en la versión base para que las dependencias configuradas de plugins
  tengan la oportunidad de materializarse, introduce residuos heredados de dependencias para
  un plugin empaquetado configurado, actualiza al tarball candidato y exige que `doctor`
  elimine las raíces heredadas de dependencias después de la actualización.

Variantes útiles de supervivencia a actualizaciones publicadas:

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
(alias `far-reaching`) se expande a todos los escenarios, incluida la migración
de instalación de plugins configurados.

La migración completa de actualizaciones está separada intencionadamente de la CI completa
de versiones. Utiliza el flujo de trabajo manual `Update Migration` cuando la pregunta sobre
la versión sea «¿pueden todas las versiones estables publicadas desde 2026.4.23 actualizarse
a este candidato y limpiar los residuos de dependencias de plugins?»:

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Aceptación de paquetes

La aceptación de paquetes es la puerta de control de paquetes nativa de GitHub. Resuelve un paquete
candidato en un tarball `package-under-test`, registra la versión y el SHA-256 y, a continuación,
ejecuta vías E2E reutilizables de Docker contra ese tarball exacto. La referencia del entorno
del flujo de trabajo está separada de la referencia de origen del paquete, por lo que la lógica
actual de las pruebas puede validar versiones anteriores de confianza.

Orígenes de candidatos:

- `source=npm`: valida `openclaw@extended-stable`, `openclaw@beta`,
  `openclaw@latest` o una versión publicada exacta.
- `source=ref`: empaqueta una rama, etiqueta o confirmación de confianza con el entorno
  actual seleccionado.
- `source=url`: valida un tarball HTTPS público con el valor obligatorio `package_sha256`.
  Esta ruta rechaza credenciales en la URL, puertos HTTPS no predeterminados, nombres de host
  o resultados DNS/IP privados o internos, espacios de direcciones IP de uso especial
  y redirecciones inseguras.
- `source=trusted-url`: valida un tarball HTTPS con los valores obligatorios
  `package_sha256` y `trusted_source_id` según la política mantenida por los responsables
  en `.github/package-trusted-sources.json`. Utiliza esta opción para espejos empresariales
  o privados en lugar de debilitar `source=url` mediante un selector de entrada que permita
  direcciones privadas. La autenticación Bearer, cuando la política la configura, utiliza
  el secreto fijo `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.
- `source=artifact`: reutiliza un tarball cargado por otra ejecución de Actions.

La validación completa de la versión utiliza `source=artifact` de forma predeterminada,
generado a partir del SHA resuelto de la versión. Para comprobar el estado después de publicar,
pasa `package_acceptance_package_spec=openclaw@YYYY.M.PATCH` para que la misma matriz
de actualización utilice como objetivo el paquete npm publicado.

Las comprobaciones de la versión invocan la aceptación de paquetes con el conjunto
de paquetes, actualizaciones, reinicios y plugins:

```text
doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape
```

Cuando se activa el periodo de estabilización de la versión (obligatorio para
`release_profile=stable` y `full`), también pasan:

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Esto mantiene la migración de paquetes, el cambio de canal de actualización, la tolerancia
a plugins administrados dañados, la limpieza de dependencias obsoletas de plugins, la cobertura
de plugins sin conexión, el comportamiento de actualización de plugins y el control de calidad
de paquetes de Telegram sobre el mismo artefacto resuelto, sin hacer que la puerta de control
predeterminada del paquete de la versión recorra todas las versiones publicadas.

`last-stable-4` se resuelve en las cuatro versiones estables más recientes de OpenClaw
publicadas en npm. La aceptación de paquetes de versiones fija `2026.4.23` como el primer
límite de compatibilidad de actualización de plugins, `2026.5.2` como un límite de cambios
importantes en la arquitectura de plugins y `2026.4.15` como una versión base publicada
anterior de la serie 2026.4.1x; el resolutor elimina los valores fijos duplicados que ya estén
entre las cuatro versiones más recientes. Para obtener una cobertura exhaustiva de migraciones
de actualización publicadas, utiliza `all-since-2026.4.23` en el flujo de trabajo independiente
de migración de actualizaciones en lugar de la CI completa de versiones. `release-history`
sigue disponible para realizar manualmente un muestreo más amplio cuando también se necesite
el punto de referencia heredado anterior a esa fecha.

Cuando se seleccionan varias versiones base de supervivencia a actualizaciones publicadas,
el flujo de trabajo reutilizable de Docker divide cada versión base en su propia tarea
de ejecución específica. Cada fragmento de versión base sigue ejecutando el conjunto
de escenarios seleccionado, pero los registros y artefactos permanecen separados por
versión base y el tiempo total queda limitado por el fragmento más lento, en lugar de
por una gran tarea en serie.

Ejecuta manualmente un perfil de paquete cuando valides un candidato antes de la versión:

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

Para una versión canaria publicada de estabilidad extendida, establece
`package_spec=openclaw@extended-stable`. La aceptación de paquetes resuelve ese
selector en un tarball exacto antes de ejecutar las vías Docker.

Utiliza `suite_profile=product` cuando la validación de la versión incluya canales MCP,
limpieza de Cron o subagentes, búsqueda web de OpenAI u OpenWebUI. Utiliza
`suite_profile=full` solo cuando necesites una cobertura completa de Docker para las
rutas de publicación.

## Configuración predeterminada para versiones

Para candidatos a versión, el conjunto predeterminado de comprobaciones es:

1. `pnpm check:changed` y `pnpm test:changed` para detectar regresiones a nivel de código fuente.
2. `pnpm release:check` para comprobar la integridad del artefacto del paquete.
3. El perfil `package` de aceptación de paquetes o las vías de paquetes personalizadas
   de comprobación de versiones para los contratos de instalación, actualización, reinicio y plugins.
4. Comprobaciones de versión entre distintos sistemas operativos para el instalador, la incorporación
   y el comportamiento específicos de cada sistema operativo y plataforma.
5. Suites en vivo solo cuando la superficie modificada afecte al comportamiento de proveedores
   o servicios alojados.

En los equipos de los responsables, las puertas de control amplias y las comprobaciones
de producto con Docker o paquetes deben ejecutarse en Testbox, salvo que se realice
explícitamente una comprobación local.

## Compatibilidad heredada

La tolerancia de compatibilidad es limitada y tiene una duración definida:

- Los paquetes hasta `2026.4.25`, incluidos `2026.4.25-beta.*`, pueden tolerar
  en la aceptación de paquetes las carencias de metadatos ya publicadas.
- El paquete publicado `2026.4.26` puede emitir advertencias por archivos de sello
  de metadatos de compilaciones locales que ya se hayan publicado.
- Los paquetes posteriores deben satisfacer los contratos modernos. Las mismas carencias
  producen errores en lugar de advertencias u omisiones.

No añadas nuevas migraciones de inicio para estas estructuras antiguas. Añade o amplía
una reparación de `doctor` y compruébala después con `upgrade-survivor`,
`published-upgrade-survivor` o `update-restart-auth` cuando el comando de actualización
sea responsable del reinicio.

## Añadir cobertura

Al cambiar el comportamiento de las actualizaciones o los plugins, añade cobertura
en la capa más baja que pueda fallar por el motivo correcto:

- Lógica pura de rutas o metadatos: prueba unitaria junto al código fuente.
- Inventario del paquete o comportamiento de los archivos empaquetados: prueba de comprobación `package-dist-inventory` o del archivo tar.
- Comportamiento de instalación/actualización mediante la CLI: aserción o fixture de la vía de Docker.
- Comportamiento de migración de una versión publicada: escenario `published-upgrade-survivor`.
- Comportamiento de reinicio gestionado por la actualización: `update-restart-auth`.
- Comportamiento del registro/origen del paquete: fixture de `test:docker:plugins` o servidor de fixtures de ClawHub.
- Comportamiento de la disposición o limpieza de dependencias: compruebe tanto la ejecución en tiempo de ejecución como el límite del sistema de archivos. Las dependencias de npm pueden elevarse dentro del proyecto npm gestionado del plugin, por lo que las pruebas deben demostrar que dicho proyecto se analiza/limpia, en lugar de suponer que solo se procesa el árbol `node_modules` local del paquete del plugin.

Mantenga los nuevos fixtures de Docker herméticos de forma predeterminada. Use registros de fixtures locales y paquetes ficticios, salvo que el objetivo de la prueba sea comprobar el comportamiento de un registro real.

## Triaje de fallos

Comience por la identidad del artefacto:

- Resumen `resolve_package` de Package Acceptance: origen, versión, SHA-256 y nombre del artefacto.
- Artefactos de Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, registros de la vía y comandos para volver a ejecutarla.
- Resumen de supervivencia a la actualización: `.artifacts/upgrade-survivor/summary.json`, incluidas la versión de referencia, la versión candidata, el escenario, la duración de cada fase y la cobertura de las recetas de configuración.

Priorice volver a ejecutar exactamente la vía que falló con el mismo artefacto de paquete, en lugar de volver a ejecutar todo el conjunto de pruebas de la versión.
