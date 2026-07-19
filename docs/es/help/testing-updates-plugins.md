---
read_when:
    - Cambio del comportamiento de actualización, doctor, aceptación de paquetes o instalación de plugins de OpenClaw
    - Preparación o aprobación de una versión candidata
    - Depuración de actualizaciones de paquetes, limpieza de dependencias de plugins o regresiones en la instalación de plugins
sidebarTitle: Update and plugin tests
summary: Cómo valida OpenClaw las rutas de actualización, las migraciones de paquetes y el comportamiento de instalación y actualización de plugins
title: 'Pruebas: actualizaciones y plugins'
x-i18n:
    generated_at: "2026-07-19T02:01:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 96a11fe42472f758d4fd1cc568486e301f7460982fdb547cab8b39de04a8dabe
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Lista de comprobación para la validación de actualizaciones y plugins: demostrar que el paquete instalable puede
actualizar el estado real del usuario, reparar el estado heredado obsoleto mediante `doctor` y seguir
instalando, cargando, actualizando y desinstalando plugins desde todas las fuentes compatibles.

Para consultar el mapa general del ejecutor de pruebas, véase [Pruebas](/es/help/testing). Para las claves de proveedores
en vivo y las suites que acceden a la red, véase [Pruebas en vivo](/es/help/testing-live).

## Qué protegemos

- Un tarball de paquete está completo, tiene un `dist/postinstall-inventory.json` válido
  y no depende de archivos del repositorio sin empaquetar.
- Un usuario puede pasar de un paquete publicado anteriormente al paquete candidato
  sin perder la configuración, los agentes, las sesiones, los espacios de trabajo, las listas de plugins permitidos ni la
  configuración de canales.
- `openclaw doctor --fix --non-interactive` se encarga de las rutas de limpieza y reparación
  heredadas. El inicio no debe incorporar migraciones de compatibilidad ocultas para el estado
  obsoleto de plugins.
- Las instalaciones de plugins funcionan desde directorios locales, repositorios git, paquetes npm y la
  ruta del registro de ClawHub.
- Las dependencias npm de los plugins se instalan en un proyecto npm administrado por plugin,
  se analizan antes de conceder confianza y se eliminan mediante `npm uninstall` durante
  la desinstalación del plugin para que no persistan dependencias elevadas.
- La actualización de plugins no realiza ninguna operación cuando nada ha cambiado: los registros de instalación, la fuente
  resuelta, la disposición de las dependencias instaladas y el estado de activación permanecen intactos.

## Comprobación local durante el desarrollo

Comience por lo más específico:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Para cambios en la instalación, desinstalación, dependencias o inventario de paquetes de plugins, también
ejecute las pruebas específicas que cubren el punto de integración editado:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Antes de que cualquier proceso de Docker para paquetes consuma un tarball, compruebe el artefacto del paquete:

```bash
pnpm release:check
```

`release:check` ejecuta comprobaciones de divergencias en la configuración, la documentación y la API (esquema de configuración, línea base de la documentación de configuración,
manifiesto del contrato de la API y exportaciones del SDK de plugins, versiones e inventario de plugins),
escribe el inventario de distribución del paquete, ejecuta `npm pack --dry-run`, rechaza los archivos
empaquetados prohibidos, instala el tarball en un prefijo temporal, ejecuta la posinstalación y
realiza pruebas rápidas de los puntos de entrada de los canales incluidos.

## Procesos de Docker

Los procesos de Docker constituyen la comprobación a nivel de producto. Instalan o actualizan un
paquete real dentro de contenedores Linux y verifican el comportamiento mediante comandos de la CLI,
el inicio del Gateway, sondas HTTP, el estado RPC y el estado del sistema de archivos.

Use procesos específicos mientras realiza iteraciones:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-restart-auth
pnpm test:docker:update-migration
```

Procesos importantes:

- `test:docker:plugins` cubre la prueba rápida de instalación de plugins, las instalaciones desde carpetas locales,
  el comportamiento de omisión de actualizaciones de carpetas locales, las carpetas locales con
  dependencias preinstaladas, las instalaciones de paquetes `file:`, las instalaciones desde git con ejecución de la CLI, las
  actualizaciones de referencias móviles de git, las instalaciones desde el registro npm con dependencias transitivas
  elevadas, las actualizaciones npm sin operaciones, el rechazo de metadatos de paquetes npm malformados,
  las instalaciones desde accesorios locales de ClawHub y las actualizaciones sin operaciones, el comportamiento de las actualizaciones del mercado
  y la activación e inspección del paquete de Claude. Establezca `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` para
  mantener el bloque de ClawHub hermético y sin conexión.
- `test:docker:plugin-lifecycle-matrix` instala el paquete candidato en un contenedor
  vacío y somete un plugin npm a instalación, inspección, desactivación, activación,
  actualización explícita, reversión explícita y desinstalación tras eliminar el código
  del plugin. Registra métricas de RSS y CPU por fase.
- `test:docker:plugin-update` valida que un plugin instalado sin cambios
  no se reinstale ni pierda los metadatos de instalación durante `openclaw plugins update`.
- `test:docker:upgrade-survivor` instala el tarball candidato sobre un accesorio
  de usuario antiguo con cambios pendientes, ejecuta la actualización del paquete y doctor de forma no interactiva, inicia después
  un Gateway de bucle invertido y comprueba la conservación del estado.
- `test:docker:published-upgrade-survivor` instala primero una línea base publicada,
  la configura mediante una receta `openclaw config set` integrada, la actualiza al
  tarball candidato, ejecuta doctor, comprueba la limpieza heredada, inicia el Gateway y
  sondea `/healthz`, `/readyz` y el estado RPC.
- `test:docker:update-restart-auth` instala el paquete candidato, inicia un
  Gateway administrado con autenticación mediante token, elimina del entorno la autenticación del Gateway del invocador para
  `openclaw update --yes --json` y exige que el comando de actualización candidato
  reinicie el Gateway antes de las sondas normales.
- `test:docker:update-migration` es el proceso de actualización publicada con limpieza intensiva. Parte
  de un estado de usuario configurado al estilo de Discord/Telegram, ejecuta doctor en la línea base
  para que las dependencias de plugins configuradas tengan la oportunidad de materializarse, siembra
  residuos de dependencias heredadas de plugins para un plugin empaquetado configurado, actualiza al
  tarball candidato y exige que doctor, tras la actualización, elimine las raíces de dependencias
  heredadas.

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
(alias `far-reaching`) se expande a todos los escenarios, incluida la
migración de instalación de plugins configurados.

La migración completa de actualizaciones se mantiene separada deliberadamente del Pipeline de CI de versión completa. Use el
flujo de trabajo manual `Update Migration` cuando la pregunta sobre la versión sea «¿pueden todas las
versiones estables publicadas desde 2026.4.23 en adelante actualizarse a este candidato y
limpiar los residuos de dependencias de plugins?»:

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Aceptación de paquetes

La aceptación de paquetes es la puerta de control de paquetes nativa de GitHub. Resuelve un
paquete candidato en un tarball `package-under-test`, registra la versión y el SHA-256 y, a continuación,
ejecuta procesos E2E reutilizables de Docker con ese tarball exacto. La referencia del entorno de
pruebas del flujo de trabajo está separada de la referencia de origen del paquete, por lo que la lógica de pruebas actual puede validar
versiones de confianza anteriores.

Orígenes de candidatos:

- `source=npm`: valida `openclaw@extended-stable`, `openclaw@beta`,
  `openclaw@latest` o una versión publicada exacta.
- `source=ref`: empaqueta una rama, etiqueta o confirmación de confianza con el entorno
  de pruebas actual seleccionado.
- `source=url`: valida un tarball HTTPS público con `package_sha256` obligatorio.
  Esta ruta rechaza credenciales en URL, puertos HTTPS no predeterminados, nombres de host o
  resultados de DNS/IP privados o internos, espacios de IP de uso especial y redirecciones no seguras.
- `source=trusted-url`: valida un tarball HTTPS con
  `package_sha256` y `trusted_source_id` obligatorios conforme a la política propiedad de los mantenedores
  en `.github/package-trusted-sources.json`. Use esta opción para réplicas empresariales o privadas
  en lugar de debilitar `source=url` con un conmutador de entrada que permita recursos privados.
  La autenticación Bearer, cuando la política la configura, utiliza el secreto fijo
  `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.
- `source=artifact`: reutiliza un tarball cargado por otra ejecución de Actions.

La validación completa de versiones utiliza `source=artifact` de forma predeterminada, creado a partir del
SHA de versión resuelto. Para la comprobación posterior a la publicación, proporcione
`package_acceptance_package_spec=openclaw@YYYY.M.PATCH` para que la misma matriz de actualizaciones
se dirija en su lugar al paquete npm publicado.

Las comprobaciones de versiones invocan la aceptación de paquetes con el conjunto de paquetes, actualizaciones, reinicios y plugins:

```text
doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape
```

Cuando se activa la prueba prolongada de la versión (forzada para `release_profile=stable` y
`full`), también proporcionan:

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Esto mantiene la migración de paquetes, el cambio de canal de actualización, la tolerancia de plugins administrados
dañados, la limpieza de dependencias obsoletas de plugins, la cobertura de plugins sin conexión, el
comportamiento de actualización de plugins y el control de calidad del paquete de Telegram sobre el mismo artefacto resuelto, sin
hacer que la puerta de control predeterminada del paquete de versión recorra todas las versiones publicadas.

`last-stable-4` se resuelve en las cuatro versiones estables más recientes de OpenClaw
publicadas en npm. La aceptación de paquetes de versiones fija `2026.4.23` como el primer límite de
compatibilidad de actualización de plugins, `2026.5.2` como límite de cambios intensivos en la arquitectura de plugins y
`2026.4.15` como una línea base anterior de actualización publicada de 2026.4.1x; el solucionador
elimina los elementos fijados duplicados que ya figuran entre los cuatro más recientes. Para una cobertura exhaustiva de la migración
de actualizaciones publicadas, use `all-since-2026.4.23` en el flujo de trabajo independiente de migración de
actualizaciones en lugar del Pipeline de CI de versión completa. `release-history` sigue
disponible para un muestreo manual más amplio cuando también se desea incluir el punto de referencia heredado
anterior a la fecha.

Cuando se seleccionan varias líneas base de supervivencia a actualizaciones publicadas, el flujo de trabajo reutilizable
de Docker divide cada línea base en su propia tarea específica del ejecutor. Cada
segmento de línea base continúa ejecutando el conjunto de escenarios seleccionado, pero los registros y artefactos permanecen
separados por línea base y el tiempo total queda limitado por el segmento más lento, en lugar de por una gran
tarea en serie.

Ejecute manualmente un perfil de paquete al validar un candidato antes de la publicación:

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

Para un canary estable ampliado publicado, establezca
`package_spec=openclaw@extended-stable`. La aceptación de paquetes resuelve ese
selector en un tarball exacto antes de ejecutar los procesos de Docker.

Use `suite_profile=product` cuando la pregunta sobre la versión incluya canales MCP,
limpieza de cron y subagentes, búsqueda web de OpenAI u OpenWebUI. Use `suite_profile=full`
solo cuando necesite una cobertura completa de la ruta de publicación de Docker.

## Valor predeterminado de publicación

Para candidatos a publicación, la pila de comprobación predeterminada es:

1. `pnpm check:changed` y `pnpm test:changed` para regresiones a nivel de código fuente.
2. `pnpm release:check` para la integridad de los artefactos del paquete.
3. El perfil `package` de aceptación de paquetes o los procesos de paquetes personalizados de comprobación de versiones
   para los contratos de instalación, actualización, reinicio y plugins.
4. Comprobaciones de versiones entre sistemas operativos para el instalador, la incorporación y el comportamiento
   específicos de cada sistema operativo y plataforma.
5. Suites en vivo solo cuando la superficie modificada afecta al comportamiento de un proveedor o servicio
   alojado.

En las máquinas de los mantenedores, las puertas de control amplias y la comprobación de producto mediante Docker o paquetes deben ejecutarse
en Testbox, salvo que se realice explícitamente una comprobación local.

## Compatibilidad heredada

La tolerancia de compatibilidad es limitada y tiene una duración definida:

- Los paquetes hasta `2026.4.25`, incluido `2026.4.25-beta.*`, pueden tolerar
  carencias de metadatos de paquetes ya publicados en la aceptación de paquetes.
- El paquete `2026.4.26` publicado puede emitir advertencias por archivos de sello
  de metadatos de compilación local ya publicados.
- Los paquetes posteriores deben satisfacer los contratos modernos. Las mismas carencias provocan errores en lugar de
  advertencias u omisiones.

No añada nuevas migraciones de inicio para estas formas antiguas. Añada o amplíe una reparación de doctor
y compruébela después con `upgrade-survivor`, `published-upgrade-survivor` o
`update-restart-auth` cuando el comando de actualización sea responsable del reinicio.

## Adición de cobertura

Al cambiar el comportamiento de actualización o de los plugins, añada cobertura en la capa más baja que
pueda fallar por el motivo correcto:

- Lógica pura de rutas o metadatos: prueba unitaria junto al código fuente.
- Inventario de paquetes o comportamiento de archivos empaquetados: `package-dist-inventory` o prueba del
  comprobador de tarballs.
- Comportamiento de instalación/actualización de la CLI: aserción o fixture del carril de Docker.
- Comportamiento de migración de versiones publicadas: escenario `published-upgrade-survivor`.
- Comportamiento de reinicio controlado por la actualización: `update-restart-auth`.
- Comportamiento del registro o del origen de paquetes: fixture `test:docker:plugins` o servidor de
  fixtures de ClawHub.
- Comportamiento de la disposición o limpieza de dependencias: compruebe tanto la ejecución en tiempo de ejecución como el
  límite del sistema de archivos. Las dependencias de npm pueden elevarse dentro del proyecto npm
  administrado del plugin, por lo que las pruebas deben demostrar que ese proyecto se examina y limpia,
  en lugar de suponer que solo se procesa el árbol `node_modules` local del paquete del plugin.

Mantenga los nuevos fixtures de Docker herméticos de forma predeterminada. Use registros de fixtures locales y
paquetes falsos, salvo que el objetivo de la prueba sea comprobar el comportamiento del registro en vivo.

## Triaje de fallos

Comience por la identidad del artefacto:

- Resumen de Package Acceptance `resolve_package`: origen, versión, SHA-256 y
  nombre del artefacto.
- Artefactos de Docker: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, registros del carril y comandos de repetición.
- Resumen de supervivencia a la actualización: `.artifacts/upgrade-survivor/summary.json`,
  incluidos la versión de referencia, la versión candidata, el escenario, los tiempos de las fases y
  la cobertura de las recetas de configuración.

Es preferible repetir el carril exacto que falló con el mismo artefacto del paquete que
volver a ejecutar todo el conjunto de la versión.
