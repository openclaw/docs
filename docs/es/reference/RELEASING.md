---
read_when:
    - Buscando definiciones de canales de versiones públicas
    - Ejecución de la validación de la versión o de la aceptación del paquete
    - Buscando información sobre la nomenclatura y la cadencia de las versiones
summary: Canales de lanzamiento, lista de verificación del operador, cuadros de validación, nomenclatura de versiones y cadencia
title: Política de lanzamientos
x-i18n:
    generated_at: "2026-07-20T00:54:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7807f44029f8f5fd0d40499c0b1f2e731cd99780cf1f081bf62230a2146c49e4
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw ofrece actualmente tres canales de actualización orientados al usuario:

- stable: el canal de versiones promocionadas existente, que todavía se resuelve mediante npm `latest` hasta que se alcance el hito independiente de CLI/canal
- beta: etiquetas de versiones preliminares que se publican en npm `beta`
- dev: la cabecera cambiante de `main`

Por separado, los operadores de versiones pueden publicar el paquete principal del
último mes completado en npm `extended-stable`, comenzando en el parche `33`. La línea
final regular del mes actual continúa en npm `latest`; esta división de publicación
del lado del operador no cambia por sí sola la resolución de los canales de actualización de la CLI.

Las compilaciones alfa de Tideclaw constituyen una vía interna independiente de versiones preliminares (dist-tag de npm `alpha`), descrita en [Entradas del flujo de trabajo de NPM](#npm-workflow-inputs) y [Entornos de prueba de versiones](#release-test-boxes).

## Nomenclatura de versiones

- Versión mensual de la versión estable extendida de npm: `YYYY.M.PATCH`, con `PATCH >= 33`, etiqueta de git `vYYYY.M.PATCH`
- Versión final diaria/regular: `YYYY.M.PATCH`, con `PATCH < 33`, etiqueta de git `vYYYY.M.PATCH`
- Versión de corrección alternativa regular: `YYYY.M.PATCH-N`, etiqueta de git `vYYYY.M.PATCH-N`
- Versión preliminar beta: `YYYY.M.PATCH-beta.N`, etiqueta de git `vYYYY.M.PATCH-beta.N`
- Versión preliminar alfa: `YYYY.M.PATCH-alpha.N`, etiqueta de git `vYYYY.M.PATCH-alpha.N`
- Nunca se deben rellenar con ceros el mes ni el parche
- `PATCH` es un número secuencial del ciclo mensual de versiones, no un día del calendario. Las versiones finales regulares y beta hacen avanzar el ciclo actual; las etiquetas exclusivamente alfa nunca consumen ni hacen avanzar el número de parche beta/regular, por lo que deben ignorarse las etiquetas antiguas exclusivamente alfa con números de parche superiores al seleccionar un ciclo beta o regular.
- Las compilaciones alfa/nocturnas usan el siguiente ciclo de parche aún no publicado e incrementan solo `alpha.N` para compilaciones repetidas. Cuando ese parche tiene una beta, las nuevas compilaciones alfa pasan al parche siguiente.
- Las versiones de npm son inmutables: nunca se debe eliminar, volver a publicar ni reutilizar una etiqueta publicada. En su lugar, se debe crear el siguiente número de versión preliminar o el siguiente parche mensual.
- `latest` sigue la línea regular/diaria actual de npm; `beta` es el destino actual de instalación beta
- `extended-stable` representa el paquete de npm compatible del mes anterior, comenzando en el parche `33`; el parche `34` y los posteriores son versiones de mantenimiento de esa línea mensual
- Las versiones finales regulares y las de corrección regular se publican de forma predeterminada en npm `beta`; los operadores de versiones pueden usar explícitamente `latest` como destino o promocionar posteriormente una compilación beta validada
- La ruta mensual específica de estabilidad extendida publica el paquete principal de npm y todos los plugins oficiales publicables en npm con exactamente la misma versión. No publica plugins en ClawHub ni publica artefactos de macOS o Windows, una versión de GitHub, dist-tags de repositorios privados, imágenes de Docker, artefactos móviles ni descargas del sitio web.
- Cada versión final regular publica conjuntamente el paquete de npm, la aplicación para macOS, el APK independiente firmado de Android y los instaladores firmados de Windows Hub. Las versiones beta normalmente validan y publican primero la ruta de npm/paquete, mientras que la compilación, firma, notarización y promoción de aplicaciones nativas se reservan para las versiones finales regulares, salvo que se soliciten explícitamente.

## Cadencia de versiones

- Las versiones se publican primero como beta; stable solo llega después de validar la beta más reciente
- Los mantenedores normalmente crean las versiones desde una rama `release/YYYY.M.PATCH` creada a partir de la versión actual de `main`, de modo que la validación y las correcciones de la versión no bloqueen el desarrollo nuevo en `main`
- Si se ha enviado o publicado una etiqueta beta y necesita una corrección, los mantenedores crean la siguiente etiqueta `-beta.N` en lugar de eliminar o recrear la anterior
- El procedimiento detallado de publicación, las aprobaciones, las credenciales y las notas de recuperación son exclusivos de los mantenedores

## Publicación mensual de estabilidad extendida solo en npm

Esta es una excepción específica al procedimiento regular de publicación que se
describe a continuación. Para un mes completado `YYYY.M`, se debe crear `extended-stable/YYYY.M.33`; se deben publicar
`vYYYY.M.33` y los parches de mantenimiento posteriores desde esa misma rama. La etiqueta
de versión, la punta de la rama, el checkout, la versión del paquete, la comprobación previa de npm y la ejecución de la Validación
completa de la versión deben identificar el mismo commit. La rama protegida `main` ya debe
contener la versión final de un mes natural estrictamente posterior por debajo del parche
`33`; los parches de mantenimiento siguen siendo aptos después de que `main` avance más de un
mes.

En la rama exacta de estabilidad extendida, se debe cambiar la versión del paquete raíz a `YYYY.M.P`, ejecutar
`pnpm release:prep` y verificar que todos los paquetes de extensiones publicables tengan la
misma versión. Se deben confirmar y enviar todos los cambios generados, crear y enviar la
etiqueta inmutable `vYYYY.M.P` en ese commit y registrar el SHA completo resultante.
Los flujos de trabajo consumen este árbol preparado; no cambian ni sincronizan las
versiones automáticamente.

Se deben ejecutar la comprobación previa de npm y la Validación completa de la versión desde la punta exacta de esa
rama preparada y, después, guardar los ID de ambas ejecuciones y el intento correcto de ejecución de la Validación completa de la versión:

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=true \
  -f npm_dist_tag=extended-stable

gh workflow run full-release-validation.yml \
  --ref extended-stable/YYYY.M.33 \
  -f ref=extended-stable/YYYY.M.33 \
  -f release_profile=stable
```

`release_profile=stable` es el perfil existente de profundidad de validación; es
independiente del dist-tag `extended-stable` de npm y permanece
intencionadamente sin cambios.

Cuando ambas ejecuciones finalicen correctamente, se deben publicar todos los plugins oficiales publicables en npm desde la
punta exacta de la misma rama. El parche `P` debe ser `33` o superior. Se debe pasar el SHA completo de la versión
como `ref`, esperar a que finalicen la matriz completa y la lectura de verificación del registro y, después, guardar el
ID de la ejecución correcta de publicación de plugins en NPM:

```bash
RELEASE_SHA="$(git rev-parse HEAD)"
gh workflow run plugin-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f publish_scope=all-publishable \
  -f ref="$RELEASE_SHA" \
  -f npm_dist_tag=extended-stable
```

El flujo de trabajo usa el inventario habitual de paquetes `all-publishable` preparado,
incluidos los paquetes cuyo código fuente no cambió. Antes de finalizar correctamente, verifica cada paquete exacto
y cada etiqueta `extended-stable` de plugin. Si falla una ejecución
parcial, se debe volver a ejecutar el mismo comando: se reutilizan los paquetes ya publicados, se
reconcilian las etiquetas de plugin que falten o estén obsoletas en el entorno de publicación de npm y la
lectura de verificación final sigue cubriendo el conjunto completo de paquetes.

Cuando el flujo de trabajo de plugins finalice correctamente y el entorno de publicación de npm esté listo,
se debe publicar el tarball principal exacto de la comprobación previa. La publicación principal verifica que la
ejecución de plugins referenciada sea `completed/success` en la misma rama canónica y con
el SHA de origen exacto:

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=false \
  -f npm_dist_tag=extended-stable \
  -f preflight_run_id=<npm-preflight-run-id> \
  -f full_release_validation_run_id=<full-validation-run-id> \
  -f full_release_validation_run_attempt=<full-validation-run-attempt> \
  -f plugin_npm_run_id=<plugin-npm-run-id>
```

Para un fork o un ensayo que no sea de producción y que intencionadamente no pueda satisfacer la
política mensual de `.33` o del mes de la rama protegida `main`, se debe añadir
`-f bypass_extended_stable_guard=true` tanto a la comprobación previa de npm como a los
despachos de publicación. El valor predeterminado es `false`. La omisión solo se acepta con
`npm_dist_tag=extended-stable` y queda registrada en el resumen del flujo de trabajo.
No omite la referencia canónica `extended-stable/YYYY.M.33` del flujo de trabajo,
la igualdad entre la punta de la rama, la etiqueta y el checkout, la sintaxis de la etiqueta final, la igualdad entre la versión del paquete y la de la etiqueta,
la identidad de la ejecución y el manifiesto referenciados, la procedencia del tarball,
la aprobación del entorno, la lectura de verificación del registro ni las pruebas de reparación del selector.

El flujo de trabajo de publicación verifica las identidades de las ejecuciones de comprobación previa, validación y plugins
referenciadas, el resumen criptográfico del tarball preparado y los selectores del registro principal.
El resultado se debe confirmar de forma independiente cuando el flujo de trabajo finalice correctamente:

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

Ambos comandos deben devolver `YYYY.M.P`. Si la publicación se completa correctamente, pero falla la
lectura de verificación del selector, no se debe volver a publicar la versión inmutable del paquete. Se debe usar el
único comando de reparación `npm dist-tag add openclaw@YYYY.M.P extended-stable`
mostrado en el resumen de ejecución permanente del flujo de trabajo fallido y, después, repetir ambas
lecturas de verificación independientes. Revertir al selector anterior es una decisión independiente del operador,
no la ruta de reparación de la lectura de verificación.

La documentación pública de soporte designa inicialmente Slack, Discord y Codex como
superficies de plugins cubiertas por la estabilidad extendida. Esa lista es una declaración de soporte, no
una lista permitida del código de publicación: todos los plugins oficiales publicables en npm siguen la
misma ruta de publicación con la versión exacta.

La lista de comprobación regular que aparece a continuación sigue rigiendo las publicaciones beta, `latest`, de versiones de GitHub,
de plugins, de macOS, de Windows y de otras plataformas. No se deben ejecutar esos
pasos para esta ruta de estabilidad extendida exclusiva de npm.

## Lista de comprobación regular para operadores de versiones

Esta lista de comprobación representa públicamente el flujo de publicación. Las credenciales privadas, la firma, la notarización, la recuperación de dist-tags y los detalles de reversión de emergencia permanecen en el manual de publicación exclusivo de los mantenedores.

1. Se debe comenzar desde la versión actual de `main`: obtener los últimos cambios, confirmar que el commit de destino esté enviado y confirmar que el Pipeline de CI de `main` esté lo suficientemente estable como para crear una rama a partir de él.
2. Se debe crear `release/YYYY.M.PATCH` a partir de ese commit. Los backports son opcionales; solo se debe aplicar el conjunto seleccionado por el operador. Se deben actualizar todas las ubicaciones de versión necesarias, ejecutar `pnpm release:prep`, completar las correcciones de la versión y los forward ports necesarios, y revisar `src/plugins/compat/registry.ts` junto con `src/commands/doctor/shared/deprecation-compat.ts`.
3. Se debe inmovilizar el commit previo al registro de cambios que contiene el producto completo como **SHA del código**. Se debe ejecutar la comprobación previa determinista del código fuente y, después, usar `node scripts/full-release-validation-at-sha.mjs --sha <code-sha> --target-ref release/YYYY.M.PATCH`. Esto fija las herramientas de confianza del flujo de trabajo mientras la matriz completa de Vitest, Docker, QA, paquetes y rendimiento se ejecuta sobre el SHA exacto del código.
4. Se deben clasificar los fallos antes de editar. Un fallo del producto o del código crea un SHA del código nuevo y exige una validación completa correcta para ese SHA. Un fallo del flujo de trabajo, del entorno de pruebas, de las credenciales, de la aprobación o de la infraestructura se corrige en la superficie que lo controla y se vuelve a ejecutar con el mismo SHA del código.
5. Solo cuando el SHA del código se haya validado correctamente, se debe generar la sección superior de `CHANGELOG.md` a partir de los PR fusionados y los commits directos desde la última etiqueta de una versión publicada alcanzable. Las entradas deben estar orientadas al usuario y no contener duplicados. Cuando una etiqueta de versión publicada divergente o un forward port posterior vuelva a asociar PR ya publicados, se debe pasar explícitamente como `--shipped-ref`.
6. Solo se debe confirmar `CHANGELOG.md`. Este commit es el **SHA de la versión**. La diferencia completa entre el SHA del código y el SHA de la versión debe ser exactamente `CHANGELOG.md`; cualquier otra ruta modificada devuelve la publicación al paso 2.
7. Se debe ejecutar la Validación completa de la versión fijada por SHA para el SHA de la versión con la reutilización de pruebas habilitada. El proceso principal ligero debe registrar `changelog-only-release-v1`, apuntar al SHA del código validado y no despachar ningún proceso secundario del producto. Esto reutiliza las pruebas del producto; no reutiliza los bytes del paquete.
8. Se debe ejecutar `OpenClaw NPM Release` con `preflight_only=true` sobre el SHA o la etiqueta de la versión. Se debe guardar el `preflight_run_id` correcto. Esto compila y comprueba los bytes exactos del paquete que incluyen el registro de cambios final.
9. Se debe etiquetar el SHA de la versión y, después, ejecutar el asistente de candidatos con el proceso principal correcto de validación del SHA de la versión y la comprobación previa de npm, en lugar de volver a despachar cualquiera de ellos:

   ```bash
   pnpm release:candidate -- \
     --tag vYYYY.M.PATCH-beta.N \
     --full-release-run <release-sha-validation-run-id> \
     --npm-preflight-run <preflight-run-id> \
     --skip-dispatch
   ```

   Para estable, pase también `--windows-node-tag vX.Y.Z`. El asistente verifica la procedencia de las notas de la versión, los bytes de la comprobación preliminar de npm, la prueba de instalación/actualización de Parallels, la prueba del paquete de Telegram y los planes de publicación de plugins; después, imprime el comando de publicación.

   `OpenClaw Release Publish` despacha los paquetes de plugins seleccionados o todos los publicables a npm y, en paralelo, el mismo conjunto a ClawHub; después, promociona el artefacto preparado de la comprobación preliminar de npm de OpenClaw con la dist-tag correspondiente una vez que la publicación de los plugins en npm se completa correctamente. El checkout de la versión sigue siendo la raíz del producto y los datos, mientras que la planificación y la verificación final se ejecutan desde el checkout exacto y de confianza del código fuente del workflow, de modo que un commit de versión anterior no pueda utilizar silenciosamente herramientas de publicación obsoletas. Antes de iniciar cualquier proceso hijo de publicación, renderiza y almacena en caché el cuerpo exacto de la versión de GitHub. Cuando la sección `CHANGELOG.md` completa correspondiente cabe dentro del límite de 125,000 caracteres de GitHub y del límite de seguridad correspondiente de 125,000 bytes del renderizador, la página contiene esa sección `## YYYY.M.PATCH` exacta, incluido su encabezado. Cuando la sección de origen no cabe, la página conserva las notas editoriales agrupadas exactas y sustituye el registro de contribuciones sobredimensionado por un enlace estable al registro completo en `CHANGELOG.md` fijado mediante la etiqueta; nunca se publican registros parciales ni viñetas truncadas. El workflow elige ese cuerpo completo o compacto antes de añadir `### Release verification`; si la cola de pruebas superara el límite, conserva el cuerpo canónico y utiliza en su lugar las pruebas adjuntas inmutables. Las versiones estables publicadas en npm `latest` se convierten en la versión más reciente de GitHub, mientras que las versiones estables de mantenimiento conservadas en npm `beta` se crean con `latest=false` de GitHub. El workflow también carga en la versión de GitHub las pruebas de dependencias de la comprobación preliminar, el manifiesto de validación completa y las pruebas de verificación del registro posteriores a la publicación para responder a incidentes posteriores a la versión. Imprime inmediatamente los identificadores de las ejecuciones hijas, aprueba automáticamente las puertas del entorno de publicación que el token del workflow tiene permiso para aprobar, resume los trabajos hijos fallidos con los finales de los registros, crea por adelantado la página de borrador de la versión de GitHub y promociona simultáneamente los recursos de Windows y Android con la publicación de OpenClaw en npm, finaliza la página de la versión y las pruebas de dependencias una vez que esas etapas se completan correctamente, espera a ClawHub siempre que se publique OpenClaw en npm, ejecuta después el verificador beta de la rama principal de confianza y carga pruebas posteriores a la publicación para la versión de GitHub, el paquete de npm, los paquetes de plugins de npm seleccionados, los paquetes de ClawHub seleccionados, los identificadores de ejecuciones de workflows hijos y el identificador opcional de la ejecución de Telegram en NPM. El verificador de arranque de ClawHub exige la ruta y el SHA exactos del workflow de la rama principal de confianza, los intentos de ejecución del productor y el terminal, el SHA de la versión, el conjunto de paquetes solicitado, la tupla inmutable del artefacto del paquete y el artefacto de lectura de confirmación del registro terminal; no se acepta una ejecución correcta heredada desde la referencia de la versión.

   Después, ejecute la aceptación del paquete posterior a la publicación con el paquete `openclaw@YYYY.M.PATCH-beta.N` o `openclaw@beta` publicado. Si una versión preliminar enviada o publicada necesita una corrección, cree el siguiente número de versión preliminar correspondiente; nunca elimine ni reescriba la anterior.

10. Tras un intento de publicación fallido, mantenga el SHA de la versión sin cambios, a menos que el fallo demuestre un defecto del producto o del registro de cambios. Reanude los procesos hijos y artefactos inmutables completados correctamente; nunca vuelva a compilar ni a publicar una versión de paquete que ya se haya completado correctamente.
11. Para estable, continúe únicamente después de que la beta o la candidata a versión examinada cuente con las pruebas de validación requeridas. La publicación estable en npm también pasa por `OpenClaw Release Publish`, reutilizando el artefacto correcto de la comprobación preliminar mediante `preflight_run_id`. La preparación de la versión estable de macOS también requiere los elementos empaquetados `.zip`, `.dmg`, `.dSYM.zip` y el `appcast.xml` actualizado en `main`; el workflow de publicación de macOS publica automáticamente el appcast firmado en el `main` público después de verificar los recursos de la versión, o abre/actualiza un pull request del appcast si la protección de la rama bloquea el envío directo. La preparación estable de Windows Hub requiere los recursos firmados `OpenClawCompanion-Setup-x64.exe`, `OpenClawCompanion-Setup-arm64.exe` y `OpenClawCompanion-SHA256SUMS.txt` en la versión de GitHub de OpenClaw. Pase la etiqueta exacta de la versión firmada `openclaw/openclaw-windows-node` como `windows_node_tag` y su mapa de resúmenes de instaladores aprobado para la candidata como `windows_node_installer_digests`; `OpenClaw Release Publish` conserva el borrador de la versión, despacha `Windows Node Release` y verifica los tres recursos antes de la publicación.
12. Después de la publicación, ejecute el verificador de npm posterior a la publicación, la prueba E2E independiente y opcional de Telegram con el paquete de npm publicado cuando se necesite una prueba del canal posterior a la publicación, la promoción de la dist-tag cuando sea necesaria, verifique la página generada de la versión de GitHub, ejecute los pasos del anuncio de la versión y, después, complete el [cierre estable de la rama principal](#stable-main-closeout) antes de considerar terminada una versión estable.

## Cierre estable de la rama principal

La publicación estable no está completa hasta que `main` contenga el estado real de la versión publicada.

1. Parta de la última versión reciente de `main`. Audite `release/YYYY.M.PATCH` con respecto a ella y traslade hacia delante las correcciones reales ausentes de `main`. No fusione a ciegas adaptadores de compatibilidad, pruebas o validación exclusivos de la versión en el `main` más reciente.
2. Para la ruta normal, establezca `main` en la versión estable publicada. Un cierre tardío puede utilizar `main` después de que haya avanzado a una versión CalVer estable posterior de OpenClaw; no revierta a una versión anterior un ciclo de publicación ya iniciado únicamente para cerrar la versión anterior. El validador sigue exigiendo la sección exacta del registro de cambios publicado y la entrada del appcast, y registra la versión y el SHA reales de `main`. Ejecute `pnpm release:prep` después de cualquier cambio de la versión raíz y, después, `pnpm deps:shrinkwrap:generate`.
3. Haga que la sección `## YYYY.M.PATCH` de `CHANGELOG.md` en `main` coincida exactamente con la rama de la versión etiquetada. Incluya la actualización estable de `appcast.xml` cuando la versión de Mac haya publicado una.
4. No añada `YYYY.M.PATCH+1`, una versión beta ni una sección futura vacía del registro de cambios a `main` hasta que el operador inicie explícitamente ese ciclo de publicación.
5. Ejecute `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check` y `OPENCLAW_TESTBOX=1 pnpm check:changed`. Envíe los cambios y, después, verifique que `origin/main` contiene la versión publicada y el registro de cambios antes de considerar terminada la versión estable.
6. Mantenga actualizadas las variables del repositorio `RELEASE_ROLLBACK_DRILL_ID` y `RELEASE_ROLLBACK_DRILL_DATE` después de cada simulacro privado de reversión.

`OpenClaw Stable Main Closeout` comienza a partir del envío a `main` que contiene la versión publicada, el registro de cambios y el appcast después de la publicación estable. Lee las pruebas inmutables posteriores a la publicación para vincular la etiqueta publicada con sus ejecuciones de validación completa de la versión y publicación; después, verifica el estado estable de la rama principal, la versión, el periodo de observación estable obligatorio y las pruebas de rendimiento bloqueantes. Adjunta un manifiesto de cierre inmutable y una suma de comprobación a la versión de GitHub. El activador automático mediante envío omite las versiones heredadas anteriores a las pruebas inmutables posteriores a la publicación y nunca considera esa omisión como un cierre completado.

Un cierre completo requiere ambos recursos y una suma de comprobación correspondiente. Un manifiesto parcial reproduce su SHA de `main` registrado y el simulacro de reversión para regenerar bytes idénticos; después, adjunta la suma de comprobación que falta. Un par no válido, o una suma de comprobación sin manifiesto, sigue siendo bloqueante. Una ejecución activada mediante envío sin las variables de repositorio del simulacro de reversión se omite sin completar el cierre; la ausencia de un registro del simulacro o uno con más de 90 días de antigüedad sigue bloqueando el cierre manual respaldado por pruebas. Los comandos de recuperación privados permanecen en el manual de operaciones exclusivo para responsables de mantenimiento. Utilice el despacho manual únicamente para reparar o reproducir un cierre estable respaldado por pruebas.

Si el proceso principal de publicación de la versión falló solo después de adjuntar las pruebas inmutables de npm/plugins, repare y publique primero todos los recursos de plataformas estables. Después, un responsable de mantenimiento puede despachar manualmente el cierre con `allow_failed_publish_recovery=true`; ese modo solo acepta un proceso principal fallido y completado, y exige además los contratos exactos de los recursos de Android y Windows, los resúmenes SHA-256 de GitHub, la verificación de las sumas de comprobación, la procedencia de Android y una promoción correcta de Windows despachada por el proceso principal cuyas comprobaciones de Authenticode y resúmenes aprobados para la candidata coincidan con los instaladores publicados, junto con las comprobaciones normales de macOS/appcast. El cierre automático mediante envío nunca habilita este modo de recuperación.

Una etiqueta heredada de corrección alternativa puede reutilizar las pruebas del paquete base únicamente cuando la etiqueta de corrección se resuelva en el mismo commit de origen que la etiqueta estable base. Su versión de Android reutiliza el APK verificado de la etiqueta base y añade la procedencia correspondiente a la etiqueta de corrección. Una corrección con un origen diferente debe publicar y verificar sus propias pruebas del paquete y utilizar un `versionCode` de Android superior.

## Comprobación preliminar de la versión

- Ejecute `pnpm check:test-types` antes de la comprobación preliminar de la versión para que el TypeScript de las pruebas siga cubierto fuera de la puerta local más rápida `pnpm check`.
- Ejecute `pnpm check:architecture` antes de la comprobación preliminar de la versión para que las comprobaciones más amplias de ciclos de importación y límites de arquitectura estén correctas fuera de la puerta local más rápida.
- Ejecute `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que existan los artefactos de versión `dist/*` esperados y el paquete de Control UI para el paso de validación del empaquetado.
- Ejecute `pnpm release:prep` después de incrementar la versión raíz y antes de etiquetar. Ejecuta todos los generadores deterministas de la versión que suelen quedar desactualizados después de un cambio de versión/configuración/API: versiones de plugins, archivos shrinkwrap de npm, inventario de plugins, esquema de configuración base, metadatos de configuración de los canales incluidos, referencia de la documentación de configuración, exportaciones del SDK de plugins, manifiesto del contrato de la API del SDK de plugins y paquetes de configuraciones regionales de Control UI. También bloquea hasta que las traducciones de las aplicaciones nativas y los recursos de configuraciones regionales generados por las plataformas coincidan con el inventario de origen; si están retrasados, espere a `Native App Locale Refresh` o despáchelo antes de fijar el SHA del código. `pnpm release:check` vuelve a ejecutar esas protecciones en modo de comprobación (incluidas las puertas estrictas de configuraciones regionales y el presupuesto de la superficie del SDK de plugins) e informa en una sola pasada de todos los fallos por contenido generado desactualizado antes de ejecutar las comprobaciones de publicación de paquetes.
- La sincronización de versiones de plugins actualiza de forma predeterminada el paquete de runtime publicable `@openclaw/ai`, las versiones de paquetes de plugins oficiales y los límites inferiores existentes de `openclaw.compat.pluginApi` a la versión de OpenClaw. Trate ese campo como el límite inferior de la API del SDK/runtime de plugins, no solo como una copia de la versión del paquete: para las versiones exclusivas de plugins que mantengan intencionadamente la compatibilidad con hosts de OpenClaw anteriores, conserve el límite inferior en la API del host compatible más antiguo y documente esa decisión en la prueba de publicación del plugin.
- Ejecute el workflow manual `Full Release Validation` antes de aprobar la versión para iniciar todos los entornos de pruebas previas a la versión desde un único punto de entrada. Acepta una rama, una etiqueta o un SHA completo de commit, despacha manualmente `CI` y despacha `OpenClaw Release Checks` para las vías de pruebas rápidas de instalación, aceptación de paquetes, comprobaciones de paquetes entre sistemas operativos, paridad de QA Lab, Matrix y Telegram. Las ejecuciones estables y completas siempre incluyen pruebas exhaustivas en vivo/E2E y un periodo de observación de la ruta de publicación de Docker; `run_release_soak=true` se conserva para un periodo de observación beta explícito. La aceptación de paquetes proporciona la prueba E2E canónica de Telegram con el paquete durante la validación de la candidata, evitando un segundo sondeador en vivo simultáneo.

  Proporcione `release_package_spec` después de publicar una beta para reutilizar el paquete de npm publicado en las comprobaciones de la versión, la aceptación de paquetes y la prueba E2E de Telegram con el paquete sin volver a compilar el archivo tar de la versión. Proporcione `npm_telegram_package_spec` únicamente cuando Telegram deba utilizar un paquete publicado diferente al del resto de la validación de la versión. Proporcione `package_acceptance_package_spec` cuando la aceptación de paquetes deba utilizar un paquete publicado diferente de la especificación del paquete de la versión. Proporcione `evidence_package_spec` cuando el informe de pruebas de la versión deba demostrar que la validación coincide con un paquete de npm publicado sin imponer la prueba E2E de Telegram.

  ```bash
  node scripts/full-release-validation-at-sha.mjs \
    --sha <code-sha> \
    --target-ref release/YYYY.M.PATCH
  ```

- Ejecute el flujo de trabajo manual `Package Acceptance` cuando necesite una prueba por un canal secundario para un paquete candidato mientras continúa el trabajo de publicación. Use `source=npm` para `openclaw@beta`, `openclaw@latest` o una versión de publicación exacta; `source=ref` para empaquetar una rama/etiqueta/SHA de `package_ref` de confianza con el entorno de pruebas `workflow_ref` actual; `source=url` para un tarball HTTPS público con un SHA-256 obligatorio y una política estricta de URL públicas; `source=trusted-url` para una política de fuente de confianza con nombre que use `trusted_source_id` y SHA-256 obligatorios; o `source=artifact` para un tarball cargado por otra ejecución de GitHub Actions.

  El flujo de trabajo resuelve el candidato como `package-under-test`, reutiliza el programador de publicaciones E2E de Docker con ese tarball y puede ejecutar el control de calidad de Telegram con el mismo tarball mediante `telegram_mode=mock-openai` o `telegram_mode=live-frontier`. Cuando los carriles de Docker seleccionados incluyen `published-upgrade-survivor`, el artefacto del paquete es el candidato y `published_upgrade_survivor_baseline` selecciona la línea base publicada. `update-restart-auth` usa el paquete candidato tanto como CLI instalada como paquete sometido a prueba, por lo que ejercita la ruta de reinicio administrado del comando de actualización del candidato.

  Ejemplo:

  ```bash
  gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai
  ```

  Perfiles habituales:
  - `smoke`: carriles de instalación/canal/agente, red del Gateway y recarga de configuración
  - `package`: carriles nativos del artefacto para paquete/actualización/reinicio/plugins sin OpenWebUI ni ClawHub en vivo
  - `product`: perfil de paquete más canales MCP, limpieza de Cron/subagentes, búsqueda web de OpenAI y OpenWebUI
  - `full`: segmentos de la ruta de publicación de Docker con OpenWebUI
  - `custom`: selección exacta de `docker_lanes` para una nueva ejecución específica

- Ejecute directamente el flujo de trabajo manual `CI` cuando solo necesite una cobertura de CI normal y determinista para el candidato de publicación. Las ejecuciones manuales de CI omiten la delimitación por cambios y fuerzan los fragmentos de Linux Node, los fragmentos de plugins incluidos, los fragmentos de contratos de plugins y canales, la compatibilidad con Node 22, `check-*`, `check-additional-*`, las comprobaciones rápidas del artefacto compilado, las comprobaciones de documentación, las Skills de Python, Windows, macOS y los carriles de internacionalización de Control UI. Las ejecuciones manuales independientes de CI solo ejecutan Android cuando se inician con `include_android=true`; `Full Release Validation` pasa esa entrada a su CI secundaria.

  ```bash
  gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true
  ```

- Ejecute `pnpm qa:otel:smoke` al validar la telemetría de publicación. Ejercita QA-lab mediante un receptor OTLP/HTTP local y verifica la exportación de trazas, métricas y registros, además de los atributos de traza delimitados y la ocultación de contenido e identificadores, sin requerir Opik, Langfuse ni otro recopilador externo.
- Ejecute `pnpm qa:otel:collector-smoke` al validar la compatibilidad del recopilador. Enruta la misma exportación OTLP de QA-lab mediante un contenedor Docker real de OpenTelemetry Collector antes de las aserciones del receptor local.
- Ejecute `pnpm qa:prometheus:smoke` al validar la extracción protegida de Prometheus. Ejercita QA-lab, rechaza las extracciones sin autenticar y verifica que las familias de métricas críticas para la publicación permanezcan libres de contenido de prompts, identificadores sin procesar, tokens de autenticación y rutas locales.
- Ejecute `pnpm qa:observability:smoke` para ejecutar consecutivamente los carriles de comprobación rápida de OpenTelemetry y Prometheus desde el repositorio de código fuente.
- Ejecute `pnpm release:check` antes de cada publicación etiquetada.
- La comprobación previa `OpenClaw NPM Release` genera pruebas de publicación de las dependencias antes de empaquetar el tarball de npm. La puerta de vulnerabilidades de avisos de npm bloquea la publicación. Los informes de riesgo del manifiesto transitivo, de superficie de instalación y propiedad de dependencias, y de cambios en las dependencias son únicamente pruebas de publicación. El informe de cambios en las dependencias compara el candidato de publicación con la etiqueta de publicación accesible anterior. La comprobación previa carga las pruebas de dependencias como `openclaw-release-dependency-evidence-<tag>` y también las incorpora en `dependency-evidence/` dentro del artefacto preparado de comprobación previa de npm. La ruta de publicación real reutiliza ese artefacto de comprobación previa y después adjunta las mismas pruebas a la publicación de GitHub como `openclaw-<version>-dependency-evidence.zip`.
- Ejecute `OpenClaw Release Publish` para la secuencia de publicación con cambios una vez que exista la etiqueta. Inicie las publicaciones beta y estables habituales desde `main` de confianza; la etiqueta de publicación sigue seleccionando el commit de destino exacto y puede apuntar a `release/YYYY.M.PATCH`. Las publicaciones alfa de Tideclaw permanecen en su rama alfa correspondiente. Pase el `preflight_run_id` de npm de OpenClaw correcto, el `full_release_validation_run_id` correcto y el `full_release_validation_run_attempt` exacto, y conserve el ámbito predeterminado de publicación de plugins `all-publishable` salvo que ejecute deliberadamente una reparación específica. El flujo de trabajo serializa la publicación de plugins en npm, la publicación de plugins en ClawHub y la publicación de OpenClaw en npm para que el paquete principal no se publique antes que sus plugins externalizados; la promoción de Windows y Android se ejecuta simultáneamente con la publicación principal en npm sobre la página de publicación en borrador. Las nuevas ejecuciones de publicación se pueden reanudar: una versión principal de npm ya publicada omite la ejecución principal después de que el flujo de trabajo demuestre que el tarball del registro coincide con el artefacto de comprobación previa de la etiqueta, y la promoción de Windows/Android se omite cuando la publicación ya contiene el contrato de artefactos verificado, por lo que un reintento solo repite las etapas fallidas. Las reparaciones específicas exclusivamente de plugins requieren `plugin_publish_scope=selected` y una lista de plugins no vacía. Las ejecuciones `all-publishable` exclusivamente de plugins requieren pruebas completas e inmutables de la comprobación previa y de la validación completa de la publicación; se rechazan las pruebas parciales.
- La versión estable `OpenClaw Release Publish` requiere un `windows_node_tag` exacto después de que exista la publicación `openclaw/openclaw-windows-node` correspondiente que no sea una versión preliminar, además del mapa `windows_node_installer_digests` aprobado para el candidato. Antes de iniciar cualquier publicación secundaria, verifica que la publicación de origen esté publicada, no sea una versión preliminar, contenga los instaladores x64/ARM64 requeridos y siga coincidiendo con ese mapa aprobado. A continuación, inicia `Windows Node Release` mientras la publicación de OpenClaw todavía es un borrador y transfiere sin cambios el mapa fijado de resúmenes de los instaladores. El flujo de trabajo secundario descarga los instaladores firmados de Windows Hub desde esa etiqueta exacta, los coteja con los resúmenes fijados, verifica en un ejecutor de Windows que sus firmas Authenticode usen el firmante esperado de OpenClaw Foundation, crea un manifiesto SHA-256 y carga los instaladores y el manifiesto en la publicación canónica de OpenClaw en GitHub; después, vuelve a descargar los artefactos promocionados y verifica su pertenencia al manifiesto y sus hashes. El flujo principal verifica el contrato actual de artefactos x64, ARM64 y de sumas de comprobación antes de la publicación. La recuperación directa rechaza los nombres inesperados de artefactos `OpenClawCompanion-*` antes de sustituir los artefactos esperados del contrato por los bytes fijados del origen.

  Inicie manualmente `Windows Node Release` solo para la recuperación y pase siempre una etiqueta exacta, nunca `latest`, además del mapa JSON `expected_installer_digests` explícito de la publicación de origen aprobada. Los enlaces de descarga del sitio web deben apuntar a las URL exactas de los artefactos de la publicación de OpenClaw para la versión estable actual, o a `releases/latest/download/...` solo después de verificar que la redirección a la versión más reciente de GitHub apunte a esa misma publicación; no enlace únicamente a la página de publicación del repositorio complementario.

- Las comprobaciones de publicación ahora se ejecutan en un flujo de trabajo manual independiente: `OpenClaw Release Checks`. También ejecuta el carril de paridad simulada de QA Lab, además del perfil de publicación de Matrix y el carril de QA de Telegram antes de aprobar la publicación. Los carriles en vivo usan el entorno `qa-live-shared`; Telegram también usa arrendamientos de credenciales de CI de Convex. Ejecute el flujo de trabajo manual `QA-Lab - All Lanes` con `matrix_profile=all` cuando se necesiten todos los escenarios de Matrix mantenidos; el flujo de trabajo distribuye esa selección entre los perfiles de transporte, medios y E2EE para mantener la prueba completa dentro de los tiempos de espera de cada trabajo.
- La validación del entorno de ejecución de instalación y actualización entre sistemas operativos forma parte de los flujos públicos `OpenClaw Release Checks` y `Full Release Validation`, que invocan directamente el flujo de trabajo reutilizable `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`. Esta separación es intencional: mantiene la ruta real de publicación en npm breve, determinista y centrada en los artefactos, mientras que las comprobaciones en vivo más lentas permanecen en su propio carril para que no retrasen ni bloqueen la publicación.
- Las comprobaciones de publicación que contienen secretos deben iniciarse mediante `Full Release Validation` o desde la referencia del flujo de trabajo `main`/release, para que la lógica del flujo de trabajo y los secretos permanezcan controlados.
- `OpenClaw Release Checks` acepta una rama, una etiqueta o un SHA de commit completo, siempre que el commit resuelto sea accesible desde una rama o etiqueta de publicación de OpenClaw.
- La comprobación preliminar exclusiva de validación `OpenClaw NPM Release` también acepta el SHA completo de 40 caracteres del commit actual de la rama del flujo de trabajo sin requerir una etiqueta enviada. Esa ruta de SHA es exclusiva para validación y no se puede promover a una publicación real. En el modo SHA, el flujo de trabajo sintetiza `v<package.json version>` solo para la comprobación de metadatos del paquete; la publicación real sigue requiriendo una etiqueta de publicación real.
- Ambos flujos de trabajo mantienen la ruta real de publicación y promoción en ejecutores alojados en GitHub, mientras que la ruta de validación que no realiza cambios puede usar los ejecutores Linux de mayor capacidad de Blacksmith.
- Ese flujo de trabajo ejecuta `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` mediante los secretos de flujo de trabajo `OPENAI_API_KEY` y `ANTHROPIC_API_KEY`.
- La comprobación preliminar de publicación en npm ya no espera al carril independiente de comprobaciones de publicación.
- Antes de etiquetar localmente una versión candidata, ejecute `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`. El asistente ejecuta las protecciones rápidas de publicación, las comprobaciones de publicación de plugins en npm/ClawHub, la compilación, la compilación de la interfaz y `release:openclaw:npm:check`, en el orden que detecta los errores habituales que bloquean la aprobación antes de que se inicie el flujo de trabajo de publicación de GitHub.
- Ejecute `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts` (o la etiqueta de prelanzamiento/corrección correspondiente) antes de la aprobación.
- Después de publicar en npm, ejecute `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH` (o la versión beta/de corrección correspondiente) para verificar la ruta de instalación desde el registro publicado en un prefijo temporal nuevo.
- Después de una publicación beta, ejecute `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` para verificar la incorporación desde el paquete instalado, la configuración de Telegram y la E2E real de Telegram con el paquete de npm publicado mediante el grupo compartido de credenciales arrendadas de Telegram. Para ejecuciones locales puntuales de mantenimiento, se pueden omitir las variables de Convex y proporcionar directamente las tres credenciales de entorno `OPENCLAW_QA_TELEGRAM_*`.
- Para ejecutar la prueba de humo beta completa posterior a la publicación desde un equipo de mantenimiento, use `pnpm release:beta-smoke -- --beta betaN`. El asistente ejecuta la validación de actualización de npm y de destino nuevo en Parallels, inicia `NPM Telegram Beta E2E`, consulta periódicamente la ejecución exacta del flujo de trabajo, descarga el artefacto e imprime el informe de Telegram.
- Los responsables de mantenimiento pueden ejecutar la misma comprobación posterior a la publicación desde GitHub Actions mediante el flujo de trabajo manual `NPM Telegram Beta E2E`. Es deliberadamente solo manual y no se ejecuta con cada fusión.
- La automatización de publicaciones para responsables de mantenimiento utiliza una comprobación preliminar seguida de una promoción:
  - La publicación real en npm debe superar correctamente una ejecución de npm `preflight_run_id`.
  - La orquestación y la comprobación preliminar habituales de publicaciones beta y estables usan el `main` de confianza con la etiqueta de destino exacta. La publicación y la comprobación preliminar alfa de Tideclaw usan la rama alfa correspondiente.
  - Las publicaciones estables en npm usan `beta` de forma predeterminada; la publicación estable en npm puede dirigirse explícitamente a `latest` mediante una entrada del flujo de trabajo.
  - La modificación basada en tokens de las etiquetas de distribución de npm reside en `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`, porque `npm dist-tag add` todavía necesita `NPM_TOKEN` mientras el repositorio de origen mantiene una publicación exclusiva mediante OIDC.
  - El flujo público `macOS Release` es exclusivamente de validación; cuando una etiqueta existe solo en una rama de publicación, pero el flujo de trabajo se inicia desde `main`, establezca `public_release_branch=release/YYYY.M.PATCH`.
  - La publicación real de macOS debe superar correctamente las ejecuciones de macOS `preflight_run_id` y `validate_run_id`.
  - Las rutas de publicación reales promueven artefactos preparados en lugar de volver a compilarlos.
- Para publicaciones estables de corrección como `YYYY.M.PATCH-N`, el verificador posterior a la publicación también comprueba la misma ruta de actualización con prefijo temporal desde `YYYY.M.PATCH` hasta `YYYY.M.PATCH-N`, para que las correcciones de publicación no puedan dejar silenciosamente instalaciones globales anteriores con la carga útil estable base.
- La comprobación preliminar de publicación en npm falla de forma cerrada a menos que el archivo tar incluya tanto `dist/control-ui/index.html` como una carga útil `dist/control-ui/assets/` no vacía, para no volver a distribuir un panel web vacío.
- La verificación posterior a la publicación también comprueba que los puntos de entrada de los plugins publicados y los metadatos del paquete estén presentes en la estructura del registro instalado. Una publicación a la que le falten cargas útiles del entorno de ejecución de plugins no supera el verificador posterior a la publicación y no se puede promover a `latest`.
- `pnpm test:install:smoke` también aplica el presupuesto `unpackedSize` del empaquetado de npm al archivo tar de actualización candidato, para que la E2E del instalador detecte aumentos accidentales del tamaño del paquete antes de la ruta de publicación.
- Si el trabajo de publicación modificó la planificación de CI, los manifiestos de tiempos de extensiones o las matrices de pruebas de extensiones, vuelva a generar y revisar las salidas de matriz `plugin-prerelease-extension-shard` gestionadas por el planificador desde `.github/workflows/plugin-prerelease.yml` antes de la aprobación, para que las notas de publicación no describan una estructura de CI obsoleta.
- La preparación de una publicación estable de macOS también incluye las superficies del actualizador: la publicación de GitHub debe terminar con los archivos empaquetados `.zip`, `.dmg` y `.dSYM.zip`; `appcast.xml` en `main` debe apuntar al nuevo archivo zip estable después de la publicación (el flujo de trabajo de publicación de macOS lo confirma automáticamente o abre un pull request del appcast cuando se bloquea el envío directo); la aplicación empaquetada debe conservar un identificador de paquete que no sea de depuración, una URL de fuente de Sparkle no vacía y un `CFBundleVersion` igual o superior al mínimo canónico de compilación de Sparkle para esa versión de publicación.

## Entornos de prueba de publicación

`Full Release Validation` es la forma en que los operadores inician la matriz completa del producto desde un único punto de entrada. Use el asistente para que cada flujo de trabajo secundario se ejecute desde una rama temporal fijada en un SHA de flujo de trabajo `main` de confianza, mientras el commit solicitado sigue siendo el candidato sometido a prueba:

```bash
pnpm ci:full-release \
  --sha <code-sha> \
  --target-ref release/YYYY.M.PATCH
```

El asistente obtiene el `origin/main` actual, envía `release-ci/<workflow-sha>-...` en ese commit de flujo de trabajo de confianza, deduce `beta` a partir de las versiones alfa/beta del paquete y `stable` en los demás casos, inicia `Full Release Validation` desde la rama temporal con `ref=<target-sha>`, verifica que el `headSha` de cada flujo de trabajo secundario coincida con el SHA fijado del flujo de trabajo principal y, a continuación, elimina la rama temporal. Proporcione `-f reuse_evidence=false` para forzar una ejecución nueva, `-f release_profile=full` para el barrido consultivo amplio o `--workflow-sha <trusted-main-sha>` para fijar un commit anterior que todavía sea accesible desde el `origin/main` actual. El propio flujo de trabajo nunca escribe referencias del repositorio. Esto mantiene disponibles las herramientas de publicación exclusivas de main sin añadir commits de herramientas al candidato y evita demostrar accidentalmente una ejecución secundaria más reciente de `main`.

Cuando el SHA del código esté correcto, confirme únicamente `CHANGELOG.md` y ejecute el mismo asistente con el SHA de publicación:

```bash
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH
```

El segundo flujo principal reutiliza la evidencia del producto solo cuando GitHub demuestra que el SHA de publicación desciende del SHA del código y que el conjunto completo de rutas modificadas es exactamente `CHANGELOG.md`. Registra `changelog-only-release-v1` y no inicia ningún flujo secundario del producto. La comprobación preliminar de npm y la aceptación de paquetes/instalaciones siguen ejecutándose con el SHA de publicación porque los bytes de su archivo tar cambiaron.

Para un SHA de código nuevo, el flujo de trabajo resuelve el destino, inicia manualmente `CI` y, a continuación, inicia `OpenClaw Release Checks`. `OpenClaw Release Checks` distribuye la prueba de humo de instalación, las comprobaciones de publicación entre sistemas operativos, la cobertura en vivo/E2E mediante Docker de la ruta de publicación cuando está habilitada la ejecución prolongada, la aceptación de paquetes con la E2E canónica del paquete de Telegram, la paridad de QA Lab, Matrix en vivo y Telegram en vivo. Una ejecución completa/general solo es aceptable cuando el resumen de `Full Release Validation` muestra `normal_ci`, `plugin_prerelease` y `release_checks` como correctos, salvo que una repetición focalizada haya omitido intencionadamente el flujo secundario independiente `Plugin Prerelease`. Use el flujo secundario independiente `npm-telegram` solo para repetir de forma focalizada una prueba del paquete publicado con `release_package_spec` o `npm_telegram_package_spec`. El resumen final del verificador incluye tablas de los trabajos más lentos de cada ejecución secundaria, para que el responsable de la publicación pueda ver la ruta crítica actual sin descargar registros.

El flujo secundario de rendimiento del producto solo genera artefactos en esta ruta de publicación. El
flujo general lo inicia con `publish_reports=false`, y la validación se rechaza
a menos que su protección exclusiva de artefactos demuestre que el publicador de informes de Clawgrit permaneció
omitido.

Consulte [Validación completa de la publicación](/es/reference/full-release-validation) para conocer la matriz completa de etapas, los nombres exactos de los trabajos del flujo de trabajo, las diferencias entre los perfiles estable y completo, los artefactos y los identificadores para repeticiones focalizadas.

Los flujos de trabajo secundarios se inician desde la referencia de confianza fijada por SHA que ejecuta `Full Release Validation`. Cada ejecución secundaria debe usar el SHA exacto del flujo de trabajo principal. No use inicios directos de `--ref main -f ref=<sha>` como prueba de publicación; use `pnpm ci:full-release --sha <target-sha> --target-ref release/YYYY.M.PATCH`.

Use `release_profile` para seleccionar la amplitud de proveedores/en vivo:

- `beta`: ruta en vivo y de Docker más rápida y crítica para la publicación de OpenAI/núcleo
- `stable`: cobertura beta y estable de proveedores/backends para aprobar la publicación
- `full`: cobertura estable más una cobertura consultiva amplia de proveedores/medios

La validación estable y completa siempre ejecuta el barrido exhaustivo en vivo/E2E, la ruta de publicación mediante Docker y el barrido acotado de instalaciones actualizadas del paquete publicado que deben conservar su funcionamiento antes de la promoción. Use `run_release_soak=true` para solicitar el mismo barrido para una beta. Ese barrido cubre los cuatro paquetes estables más recientes, además de las líneas base fijadas `2026.4.23` y `2026.5.2` y la cobertura anterior de `2026.4.15`, elimina las líneas base duplicadas y distribuye cada línea base en su propio trabajo de ejecución de Docker.

`OpenClaw Release Checks` usa la referencia del flujo de trabajo de confianza para resolver una vez la referencia de destino como `release-package-under-test` y reutiliza ese artefacto en las comprobaciones entre sistemas operativos, la aceptación de paquetes y las comprobaciones mediante Docker de la ruta de publicación cuando se ejecuta la prueba prolongada. Esto mantiene todos los entornos orientados a paquetes sobre los mismos bytes y evita compilaciones repetidas de paquetes. Cuando una beta ya esté disponible en npm, establezca `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` para que las comprobaciones de publicación descarguen una vez el paquete distribuido, extraigan el SHA de origen de su compilación desde `dist/build-info.json` y reutilicen ese artefacto para los carriles entre sistemas operativos, de aceptación de paquetes, de Docker de la ruta de publicación y de Telegram mediante paquetes.

La prueba de humo de instalación de OpenAI entre sistemas operativos usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` cuando está definida la variable del repositorio o de la organización; en caso contrario, usa `openai/gpt-5.6-luna`, porque este carril demuestra la instalación del paquete, la incorporación, el inicio del Gateway y un turno de agente en vivo, en lugar de evaluar comparativamente el modelo más capaz. La matriz más amplia de proveedores en vivo sigue siendo el lugar para la cobertura específica de cada modelo.

Use estas variantes según la etapa de publicación:

```bash
# Validar el SHA del código con el producto completo.
pnpm ci:full-release \
  --sha <code-sha> \
  --target-ref release/YYYY.M.PATCH

# Validar el SHA de la versión solo con cambios en el registro de cambios reutilizando la evidencia del producto del SHA del código.
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH

# Después de publicar una beta, añadir el E2E de Telegram con el paquete publicado.
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH \
  -f release_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

No usar el conjunto completo como primera repetición tras una corrección específica. Si falla una caja, usar el flujo de trabajo secundario, trabajo, carril de Docker, perfil de paquete, proveedor de modelos o carril de QA que haya fallado para la siguiente prueba. Volver a ejecutar el conjunto completo únicamente cuando la corrección haya modificado la orquestación compartida de la versión o haya dejado obsoleta la evidencia anterior de todas las cajas. El verificador final del conjunto vuelve a comprobar los identificadores registrados de las ejecuciones de los flujos de trabajo secundarios, por lo que, tras repetir correctamente un flujo secundario, se debe repetir únicamente el trabajo principal `Verify full validation` que haya fallado.

`rerun_group=all` puede reutilizar una ejecución correcta anterior del conjunto cuando coincidan el perfil de la versión,
la configuración efectiva del periodo de observación y las entradas de validación, y el SHA de destino
sea idéntico o el nuevo destino sea un descendiente cuyo conjunto completo de rutas modificadas
sea exactamente `CHANGELOG.md`. La reutilización del destino exacto registra
`exact-target-full-validation-v1`; el SHA de la versión posterior a la validación registra
`changelog-only-release-v1`. Este último reutiliza únicamente la validación del producto. La comprobación
preliminar de npm, los bytes del paquete, la procedencia de las notas de la versión y la aceptación
de instalación/actualización aún deben ejecutarse con el SHA de la versión. Cualquier cambio de versión,
fuente, contenido generado, dependencia, paquete o destino propiedad del flujo de trabajo requiere un nuevo
SHA del código y una validación completa nueva. Las ejecuciones más recientes del conjunto para la misma referencia `release/*`
y el mismo grupo de repetición sustituyen automáticamente a las que están en curso. Pasar
`reuse_evidence=false` para forzar una ejecución completa nueva.

Para una recuperación acotada, pasar `rerun_group` al conjunto. `all` es la ejecución real de la candidata a versión, `ci` ejecuta únicamente el flujo secundario de CI normal, `plugin-prerelease` ejecuta únicamente el flujo secundario de plugins exclusivo de la versión, `release-checks` ejecuta todas las cajas de la versión, y los grupos de versión más específicos son `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` y `npm-telegram`. Las repeticiones específicas de `npm-telegram` requieren `release_package_spec` o `npm_telegram_package_spec`; las ejecuciones completas/totales usan el E2E canónico de Telegram con paquetes dentro de Aceptación de paquetes. Las repeticiones específicas entre sistemas operativos pueden añadir `cross_os_suite_filter=windows/packaged-upgrade` u otro filtro de sistema operativo/conjunto. Los fallos de comprobación de la versión de QA bloquean la validación normal de la versión, incluida la desviación obligatoria de herramientas dinámicas de OpenClaw en el nivel estándar. Las ejecuciones alfa de Tideclaw aún pueden tratar como orientativos los carriles de comprobación de la versión que no estén relacionados con la seguridad de los paquetes. Con `release_profile=beta`, los conjuntos de proveedores en vivo `Run repo/live E2E validation` son orientativos (advertencias, no bloqueos); los perfiles estable y completo los mantienen como bloqueantes. Cuando `live_suite_filter` solicita explícitamente un carril de QA en vivo sujeto a puerta, como Discord, WhatsApp o Slack, debe estar habilitada la variable de repositorio `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` correspondiente; de lo contrario, la captura de entradas falla en lugar de omitir silenciosamente el carril.

### Vitest

La caja de Vitest es el flujo de trabajo secundario manual `CI`. La CI manual omite intencionadamente el alcance basado en cambios y fuerza el grafo normal de pruebas para la candidata a versión: fragmentos de Linux Node, fragmentos de plugins incluidos, fragmentos de contratos de plugins y canales, compatibilidad con Node 22, `check-*`, `check-additional-*`, comprobaciones rápidas de artefactos compilados, comprobaciones de documentación, Skills de Python, Windows, macOS e i18n de la interfaz de control. Android se incluye cuando `Full Release Validation` ejecuta la caja porque el conjunto pasa `include_android=true`; la CI manual independiente requiere `include_android=true` para cubrir Android.

Usar esta caja para responder «¿el árbol de fuentes superó el conjunto completo de pruebas normales?». No es lo mismo que la validación del producto en la ruta de publicación. Evidencia que se debe conservar:

- resumen de `Full Release Validation` que muestre la URL de la ejecución de `CI` iniciada
- ejecución de `CI` correcta en el SHA de destino exacto
- nombres de fragmentos fallidos o lentos de los trabajos de CI al investigar regresiones
- artefactos de tiempos de Vitest, como `.artifacts/vitest-shard-timings.json`, cuando una ejecución requiera un análisis de rendimiento

Ejecutar la CI manual directamente únicamente cuando la versión necesite una CI normal determinista, pero no las cajas de Docker, QA Lab, pruebas en vivo, varios sistemas operativos o paquetes. Usar el primer comando para una CI directa sin Android. Añadir `include_android=true` cuando la CI directa de la candidata a versión deba cubrir Android:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

La caja de Docker se encuentra en `OpenClaw Release Checks` mediante `openclaw-live-and-e2e-checks-reusable.yml`, además del flujo de trabajo `install-smoke` en modo de versión. Valida la candidata a versión mediante entornos Docker empaquetados, en lugar de limitarse a pruebas en el nivel del código fuente.

La cobertura de Docker para la versión incluye:

- prueba rápida de instalación completa con la prueba rápida lenta de instalación global de Bun habilitada
- preparación/reutilización de la imagen de prueba rápida del Dockerfile raíz por SHA de destino, con los trabajos de prueba rápida de QR, raíz/Gateway e instalador/Bun ejecutándose como fragmentos independientes de pruebas rápidas de instalación
- carriles E2E del repositorio
- fragmentos de Docker de la ruta de publicación: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, de `plugins-runtime-install-a` a `plugins-runtime-install-h` y `openwebui`
- cobertura de OpenWebUI en un ejecutor dedicado con disco de gran tamaño cuando se solicite
- carriles divididos de instalación/desinstalación de plugins incluidos, de `bundled-plugin-install-uninstall-0` a `bundled-plugin-install-uninstall-23`
- conjuntos de proveedores en vivo/E2E y cobertura de modelos en vivo de Docker cuando las comprobaciones de la versión incluyan conjuntos en vivo

Usar los artefactos de Docker antes de repetir una ejecución. El planificador de la ruta de publicación carga `.artifacts/docker-tests/` con registros de carriles, `summary.json`, `failures.json`, tiempos de las fases, el JSON del plan del planificador y comandos de repetición. Para una recuperación específica, usar `docker_lanes=<lane[,lane]>` en el flujo de trabajo reutilizable en vivo/E2E en lugar de volver a ejecutar todos los fragmentos de la versión. Los comandos de repetición generados incluyen las entradas anteriores de `package_artifact_run_id` y de las imágenes de Docker preparadas cuando estén disponibles, por lo que un carril fallido puede reutilizar el mismo tarball y las mismas imágenes de GHCR.

### QA Lab

La caja de QA Lab también forma parte de `OpenClaw Release Checks`. Es la puerta de publicación para el comportamiento agéntico y en el nivel de los canales, separada de Vitest y de la mecánica de paquetes de Docker.

La cobertura de QA Lab para la versión incluye:

- carril de paridad simulada que compara el carril candidato de OpenAI con la referencia `anthropic/claude-opus-4-8` mediante el paquete de paridad agéntica
- perfil de publicación del adaptador en vivo de Matrix mediante el entorno `qa-live-shared`
- carril de QA en vivo de Telegram mediante arrendamientos de credenciales de CI de Convex
- `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`, `pnpm qa:prometheus:smoke` o `pnpm qa:observability:smoke` cuando la telemetría de la versión necesite una prueba local explícita

Usar esta caja para responder «¿la versión se comporta correctamente en los escenarios de QA y en los flujos de canales en vivo?». Conservar las URL de los artefactos de los carriles de paridad, Matrix y Telegram al aprobar la versión. La cobertura completa de Matrix sigue disponible como una ejecución manual fragmentada de QA Lab, en lugar del carril crítico predeterminado para la versión.

### Paquete

La caja de paquetes es la puerta del producto instalable. Está respaldada por `Package Acceptance` y el sistema de resolución `scripts/resolve-openclaw-package-candidate.mjs`. El sistema de resolución normaliza una candidata en el tarball `package-under-test` que consume Docker E2E, valida el inventario del paquete, registra la versión y el SHA-256 del paquete y mantiene separada la referencia del entorno del flujo de trabajo de la referencia de origen del paquete.

Fuentes de candidatas compatibles:

- `source=npm`: `openclaw@beta`, `openclaw@latest` o una versión de publicación exacta de OpenClaw
- `source=ref`: empaquetar una rama, etiqueta o SHA de confirmación completo de confianza de `package_ref` con el entorno `workflow_ref` seleccionado
- `source=url`: descargar un `.tgz` HTTPS público con `package_sha256` obligatorio; se rechazan las credenciales en la URL, los puertos HTTPS no predeterminados, los nombres de host o direcciones resueltas privados/internos/de uso especial y las redirecciones no seguras
- `source=trusted-url`: descargar un `.tgz` HTTPS con `package_sha256` y `trusted_source_id` obligatorios desde una política con nombre en `.github/package-trusted-sources.json`; usar esta opción para espejos empresariales propiedad de los mantenedores o repositorios privados de paquetes, en lugar de añadir a `source=url` una omisión de red privada en el nivel de las entradas
- `source=artifact`: reutilizar un `.tgz` cargado por otra ejecución de GitHub Actions

`OpenClaw Release Checks` ejecuta Aceptación de paquetes con `source=artifact`, el artefacto preparado del paquete de la versión, `suite_profile=custom`, `docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape`, `telegram_mode=mock-openai`. Aceptación de paquetes mantiene la migración, la actualización, la actualización de VPS administrados desde la raíz, el reinicio de actualización con autenticación configurada, la instalación en vivo de Skills de ClawHub, la limpieza de dependencias obsoletas de plugins, los accesorios de plugins sin conexión, la actualización de plugins, el refuerzo contra escapes en la vinculación de comandos de plugins y la QA de paquetes de Telegram con el mismo tarball resuelto. Las comprobaciones bloqueantes de la versión usan como referencia predeterminada el último paquete publicado; el perfil beta con `run_release_soak=true`, `release_profile=stable` o `release_profile=full` amplía el barrido de supervivencia a actualizaciones publicadas a `last-stable-4`, además de las referencias fijadas `2026.4.23`, `2026.5.2` y `2026.4.15`, con escenarios `reported-issues`. Usar Aceptación de paquetes con `source=npm` para una candidata ya publicada, `source=ref` para un tarball npm local respaldado por un SHA antes de la publicación, `source=trusted-url` para un espejo empresarial/privado propiedad de los mantenedores o `source=artifact` para un tarball preparado y cargado por otra ejecución de GitHub Actions.

Es el reemplazo nativo de GitHub para la mayor parte de la cobertura de paquetes/actualizaciones que antes requería Parallels. Las comprobaciones de publicación entre sistemas operativos siguen siendo importantes para la incorporación, el instalador y el comportamiento específico de cada plataforma, pero la validación del producto para paquetes/actualizaciones debe preferir Aceptación de paquetes.

La lista de comprobación canónica para validar actualizaciones y plugins es [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins). Usarla al decidir qué carril local, de Docker, de Aceptación de paquetes o de comprobación de la versión demuestra un cambio en la instalación/actualización de un plugin, en la limpieza de doctor o en la migración de un paquete publicado. La migración exhaustiva de actualizaciones publicadas desde cada paquete estable `2026.4.23+` es un flujo de trabajo manual `Update Migration` independiente, no forma parte de la CI completa de la versión.

La tolerancia heredada de Aceptación de paquetes tiene intencionadamente una duración limitada. Los paquetes hasta `2026.4.25` pueden usar la ruta de compatibilidad para las carencias de metadatos ya publicadas en npm: entradas del inventario privado de QA ausentes del tarball, ausencia de `gateway install --wrapper`, ausencia de archivos de parche en el accesorio de git derivado del tarball, ausencia del valor persistido `update.channel`, ubicaciones heredadas de registros de instalación de plugins, ausencia de persistencia de registros de instalación del mercado y migración de metadatos de configuración durante `plugins update`. El paquete publicado `2026.4.26` puede advertir sobre archivos de marca de metadatos de compilación local que ya se hayan distribuido. Los paquetes posteriores deben cumplir los contratos modernos de paquetes; esas mismas carencias hacen fallar la validación de la versión.

Usar perfiles más amplios de Aceptación de paquetes cuando la cuestión de la versión se refiera a un paquete instalable real:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

Perfiles de paquetes habituales:

- `smoke`: vías rápidas de instalación de paquetes/canales/agentes, red del Gateway y recarga de configuración
- `package`: contratos de instalación/actualización/reinicio/paquetes de plugins, además de una prueba en vivo de instalación de Skills desde ClawHub; esta es la opción predeterminada para la comprobación de versiones
- `product`: `package` más canales MCP, limpieza de cron/subagentes, búsqueda web de OpenAI y OpenWebUI
- `full`: segmentos de la ruta de publicación de Docker con OpenWebUI
- `custom`: lista exacta de `docker_lanes` para repeticiones enfocadas

Para la prueba de Telegram de un paquete candidato, habilite `telegram_mode=mock-openai` o `telegram_mode=live-frontier` en Package Acceptance. El flujo de trabajo pasa el tarball `package-under-test` resuelto a la vía de Telegram; el flujo de trabajo independiente de Telegram sigue aceptando una especificación npm publicada para las comprobaciones posteriores a la publicación.

## Automatización de publicación de versiones regulares

Para la publicación beta, de `latest`, plugins, GitHub Release y plataformas,
`OpenClaw Release Publish` es el punto de entrada habitual con capacidad de modificación. La ruta mensual
`.33+` de estabilidad extendida solo para npm no usa este orquestador. El
flujo de trabajo regular orquesta los flujos de trabajo de publicadores de confianza en el orden que
requiere la versión:

1. Extraiga la etiqueta de la versión y resuelva el SHA de su commit.
2. Verifique que se pueda acceder a la etiqueta desde `main` o `release/*` (o desde una rama alfa de Tideclaw para versiones preliminares alfa).
3. Ejecute `pnpm plugins:sync:check`.
4. Despache `Plugin NPM Release` con `publish_scope=all-publishable` y `ref=<release-sha>`.
5. Despache `Plugin ClawHub Release` con el mismo alcance y SHA.
6. Despache `OpenClaw NPM Release` con la etiqueta de versión, la etiqueta de distribución de npm y el `preflight_run_id` guardado tras verificar el `full_release_validation_run_id` guardado y el intento de ejecución exacto.
7. Para versiones estables, cree o actualice la versión de GitHub como borrador, despache `Windows Node Release` con el `windows_node_tag` explícito y el `windows_node_installer_digests` aprobado para el candidato, y verifique los activos canónicos del instalador y las sumas de comprobación de Windows. Despache también `Android Release` para compilar el APK firmado de la etiqueta exacta, junto con su suma de comprobación y procedencia. Verifique ambos contratos de activos nativos antes de publicar el borrador.

Ejemplo de publicación beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=beta
```

Publicación estable en la etiqueta de distribución beta predeterminada:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=beta
```

La promoción estable directamente a `latest` es explícita:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=latest
```

Use los flujos de trabajo de bajo nivel `Plugin NPM Release` y `Plugin ClawHub Release` únicamente para tareas específicas de reparación o republicación. `OpenClaw Release Publish` rechaza `plugin_publish_scope=selected` cuando `publish_openclaw_npm=true`, de modo que el paquete principal no pueda publicarse sin todos los plugins oficiales publicables, incluido `@openclaw/diffs-language-pack`. Para reparar un plugin seleccionado, establezca `publish_openclaw_npm=false` con `plugin_publish_scope=selected` y `plugins=@openclaw/name`, o despache directamente el flujo de trabajo secundario.

La inicialización de ClawHub para una primera publicación es la excepción: despache `Plugin ClawHub New`
desde el `main` de confianza y pase el SHA completo de la versión de destino mediante `ref`.
Nunca ejecute el propio flujo de trabajo de inicialización desde la etiqueta o rama de la versión:

```bash
gh workflow run plugin-clawhub-new.yml \
  --ref main \
  -f plugins=@openclaw/name \
  -f ref=<full-40-character-release-sha> \
  -f pretag_validation=true \
  -f dry_run=true
```

La validación previa a la etiqueta requiere `dry_run=true`, rechaza entradas de etiquetas de versión y de ejecuciones
principales, y solo acepta un destino exacto accesible desde `main` o `release/*`.
No carga credenciales de ClawHub, no publica bytes de paquetes ni cambia la configuración
del publicador de confianza. El flujo de trabajo sigue resolviendo el plan del registro en vivo,
extrae y empaqueta el destino solo en un trabajo sin secretos, materializa la
cadena de herramientas bloqueada de ClawHub y valida el artefacto inmutable y el
slug/la identidad del paquete antes de que exista la etiqueta de la versión. Apruebe el entorno
`clawhub-plugin-bootstrap` solo después de que finalicen los trabajos de empaquetado sin secretos;
este trabajo de validación protegido no tiene credenciales ni comandos de modificación.

Una ejecución de prueba aprobada o una inicialización real posterior al etiquetado debe incluir la
etiqueta de versión exacta, además del id, el intento y la rama de la ejecución principal `OpenClaw Release Publish`.
El proceso principal certifica el SHA de su propio flujo de trabajo y un SHA de confianza exacto
`main` independiente para `Plugin ClawHub New`; la ejecución secundaria y cada aprobación de
entorno protegido deben coincidir con ese SHA secundario aprobado. La etiqueta de la versión se
vuelve a comprobar antes de cada intento de publicación y modificación del publicador de confianza.

El trabajo de empaquetado
carga un artefacto inmutable cuyo nombre, ID/resumen del artefacto de Actions,
ejecución/intento productor, SHA de destino y SHA-256/tamaño del tarball de cada paquete
se transmiten a los trabajos de validación y protegidos. El trabajo protegido extrae únicamente las herramientas
`main` de confianza, valida la tupla del artefacto mediante la API de GitHub, descarga
por el ID exacto del artefacto, vuelve a calcular el hash de cada tarball y valida las rutas TAR locales y
la identidad del paquete con las reglas de canonicalización USTAR de la CLI fijada. Después,
cada candidato supera la ejecución de prueba de publicación de la CLI fijada, que retorna antes de
consultar el registro o realizar la autenticación. El prefiltro del trabajo con credenciales limita los ClawPacks
comprimidos a 120 MiB, la carga total de archivos a 50 MiB, los datos TAR expandidos a 64 MiB y
el número de entradas TAR a 10,000. La reparación del publicador de confianza de paquetes existentes
sigue siendo solo de configuración, pero aun así empaqueta el destino y exige la etiqueta solicitada,
así como la igualdad exacta de los bytes y metadatos del registro, antes de cambiar la configuración del publicador
de confianza. La verificación posterior a la publicación descarga el artefacto de ClawHub y
exige el mismo SHA-256 y tamaño. Una recuperación mediante la repetición de trabajos fallidos solo puede reutilizar
el artefacto del paquete de un intento anterior cuando el trabajo productor exacto haya finalizado
correctamente. La evidencia final también vincula la versión bloqueada de ClawHub, el
SHA-256 del archivo de bloqueo y la integridad de npm. Una discrepancia requiere una nueva versión del paquete.

## Entradas del flujo de trabajo de NPM

`OpenClaw NPM Release` acepta estas entradas controladas por el operador:

- `tag`: etiqueta de versión obligatoria, como `v2026.4.2`, `v2026.4.2-1`, `v2026.4.2-beta.1` o `v2026.4.2-alpha.1`; cuando `preflight_only=true`, también puede ser el SHA completo de 40 caracteres del commit actual de la rama del flujo de trabajo para una comprobación previa solo de validación
- `preflight_only`: `true` solo para validación/compilación/empaquetado; `false` para la ruta de publicación real
- `preflight_run_id`: id de una ejecución de comprobación previa existente y correcta, obligatorio en la ruta de publicación real para que el flujo de trabajo reutilice el tarball preparado en lugar de volver a compilarlo
- `full_release_validation_run_id`: id de una ejecución correcta de `Full Release Validation` para esta etiqueta/SHA, obligatorio para una publicación real. Las publicaciones beta pueden continuar únicamente con la comprobación previa y una advertencia, pero la promoción estable/de `latest` continúa requiriéndolo.
- `full_release_validation_run_attempt`: intento de ejecución positivo exacto asociado con `full_release_validation_run_id`; obligatorio siempre que se proporcione el id de ejecución, para impedir que las repeticiones cambien la evidencia de autorización durante la publicación.
- `release_publish_run_id`: id de ejecución aprobado de `OpenClaw Release Publish`; obligatorio cuando este flujo de trabajo es despachado por ese proceso principal (llamadas de publicación real realizadas por un actor bot)
- `plugin_npm_run_id`: id de ejecución correcta en la cabecera exacta de `Plugin NPM Release`; obligatorio para una publicación real del paquete principal `extended-stable`
- `npm_dist_tag`: etiqueta de destino de npm para la ruta de publicación; acepta `alpha`, `beta`, `latest` o `extended-stable` y el valor predeterminado es `beta`. El parche final `33` y posteriores deben usar `extended-stable`; de forma predeterminada, `extended-stable` rechaza parches anteriores y siempre rechaza etiquetas no finales.
- `bypass_extended_stable_guard`: booleano solo para pruebas, con valor predeterminado `false`; con `npm_dist_tag=extended-stable`, omite la comprobación de elegibilidad mensual para estabilidad extendida, pero conserva las comprobaciones de identidad de la versión, artefactos, aprobación y lectura posterior.

`Plugin NPM Release` acepta `npm_dist_tag=default` para el comportamiento de versiones
existente o `npm_dist_tag=extended-stable` para la ruta mensual protegida. La
opción de estabilidad extendida requiere `publish_scope=all-publishable`, una entrada
`plugins` vacía, un parche final igual o superior a `33` y la rama canónica
`extended-stable/YYYY.M.33` en su punta exacta. Nunca mueve `latest` ni
`beta` de los plugins. Las nuevas versiones de paquetes reciben `extended-stable` de forma atómica
mediante la publicación de confianza con OIDC (`npm publish --tag extended-stable`); este
flujo de trabajo de origen no usa `npm dist-tag add` autenticado mediante token. Los reintentos
omiten las versiones exactas que ya están presentes en npm y después adoptan un comportamiento cerrado ante fallos,
salvo que una lectura posterior completa confirme que todos los paquetes exactos y la etiqueta
`extended-stable` han convergido.

`OpenClaw Release Publish` acepta estas entradas controladas por el operador:

- `tag`: etiqueta de versión obligatoria; ya debe existir
- `preflight_run_id`: id de ejecución correcta de la comprobación previa `OpenClaw NPM Release`; obligatorio cuando `publish_openclaw_npm=true` o `plugin_publish_scope=all-publishable`
- `full_release_validation_run_id`: id de ejecución correcta de `Full Release Validation`; obligatorio cuando `publish_openclaw_npm=true` o `plugin_publish_scope=all-publishable`
- `full_release_validation_run_attempt`: intento positivo exacto asociado con `full_release_validation_run_id`; obligatorio siempre que se proporcione el id de ejecución
- `windows_node_tag`: etiqueta de versión exacta de `openclaw/openclaw-windows-node` que no sea de versión preliminar; obligatoria para la publicación estable de OpenClaw
- `windows_node_installer_digests`: mapa JSON compacto aprobado para el candidato que asigna los nombres actuales de los instaladores de Windows a sus resúmenes `sha256:` fijados; obligatorio para la publicación estable de OpenClaw
- `npm_telegram_run_id`: id opcional de una ejecución correcta de `NPM Telegram Beta E2E` para incluirlo en la evidencia final de la versión
- `npm_dist_tag`: etiqueta de destino de npm para el paquete OpenClaw, una de `alpha`, `beta` o `latest`
- `plugin_publish_scope`: el valor predeterminado es `all-publishable`; use `selected` únicamente para trabajos específicos de reparación solo de plugins con `publish_openclaw_npm=false`
- `plugins`: nombres de paquetes `@openclaw/*` separados por comas cuando `plugin_publish_scope=selected`
- `publish_openclaw_npm`: el valor predeterminado es `true`; establezca `false` únicamente cuando use el flujo de trabajo como orquestador de reparaciones solo de plugins
- `release_profile`: perfil de cobertura de la versión utilizado para los resúmenes de evidencia de la versión; el valor predeterminado es `from-validation`, que lo lee del manifiesto de validación, o puede sustituirse por `beta`, `stable` o `full`
- `wait_for_clawhub`: el valor predeterminado es `false` para que la disponibilidad en npm no quede bloqueada por el proceso auxiliar de ClawHub; establezca `true` únicamente cuando la finalización del flujo de trabajo deba incluir la finalización de ClawHub

`OpenClaw Release Checks` acepta estas entradas controladas por el operador:

- `ref`: rama, etiqueta o SHA completo del commit que se va a validar. Las comprobaciones que utilizan secretos requieren que el commit resuelto sea accesible desde una rama de OpenClaw o una etiqueta de versión.
- `run_release_soak`: habilita comprobaciones exhaustivas en vivo/E2E, la ruta de lanzamiento de Docker y las pruebas prolongadas de supervivencia a actualizaciones desde todas las versiones para las comprobaciones de versiones beta. Se activa obligatoriamente mediante `release_profile=stable` y `release_profile=full`.

Reglas:

- Las versiones finales normales y de corrección inferiores al parche `33` pueden publicarse en `beta` o `latest`. Las versiones finales con el parche `33` o superior deben publicarse en `extended-stable`, y se rechazan las versiones con sufijo de corrección en ese límite.
- Las etiquetas de prelanzamiento beta solo pueden publicarse en `beta`; las etiquetas de prelanzamiento alfa solo pueden publicarse en `alpha`
- Para `OpenClaw NPM Release`, solo se permite proporcionar el SHA completo del commit cuando `preflight_only=true`
- `OpenClaw Release Checks` y `Full Release Validation` son siempre exclusivamente para validación
- La ruta de publicación real debe usar el mismo `npm_dist_tag` utilizado durante la comprobación previa; el flujo de trabajo verifica esos metadatos antes de continuar con la publicación

## Secuencia habitual de lanzamiento beta/estable más reciente

Esta secuencia heredada corresponde al lanzamiento orquestado habitual, que también gestiona los plugins, la versión de GitHub, Windows y otras tareas específicas de plataformas. No es la ruta mensual de estabilidad extendida `.33+`, exclusiva de npm, documentada al principio de esta página.

Al preparar un lanzamiento estable orquestado habitual:

1. Ejecute `OpenClaw NPM Release` con `preflight_only=true`. Antes de que exista una etiqueta, puede usar el SHA completo del commit actual de la rama del flujo de trabajo para realizar una ejecución de prueba exclusivamente de validación del flujo de trabajo de comprobación previa.
2. Elija `npm_dist_tag=beta` para el flujo normal que comienza con la beta, o `latest` únicamente cuando se desee publicar deliberadamente una versión estable de forma directa.
3. Ejecute `Full Release Validation` en la rama de lanzamiento, la etiqueta de versión o el SHA completo del commit cuando se desee ejecutar la CI normal junto con la cobertura de caché de prompts en vivo, Docker, QA Lab, Matrix y Telegram desde un único flujo de trabajo manual. Si deliberadamente solo se necesita el grafo determinista de pruebas normales, ejecute en su lugar el flujo de trabajo manual `CI` en la referencia de lanzamiento.
4. Seleccione la etiqueta de versión exacta de `openclaw/openclaw-windows-node`, que no sea de prelanzamiento, cuyos instaladores firmados para x64 y ARM64 deban distribuirse. Guárdela como `windows_node_tag` y guarde el mapa de resúmenes validado de ambos como `windows_node_installer_digests`. La herramienta auxiliar de la versión candidata registra ambos y los incluye en el comando de publicación que genera.
5. Guarde los valores correctos de `preflight_run_id`, `full_release_validation_run_id` y el `full_release_validation_run_attempt` exacto.
6. Ejecute `OpenClaw Release Publish` desde el entorno de confianza `main` con el mismo `tag`, el mismo `npm_dist_tag`, el `windows_node_tag` seleccionado, su `windows_node_installer_digests` guardado, el `preflight_run_id` guardado, `full_release_validation_run_id` y `full_release_validation_run_attempt`. Este proceso publica los plugins externalizados en npm y ClawHub antes de promover el paquete npm de OpenClaw.
7. Si la versión se publicó en `beta`, use el flujo de trabajo `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` para promover esa versión estable de `beta` a `latest`.
8. Si la versión se publicó deliberadamente de forma directa en `latest` y `beta` debe adoptar inmediatamente la misma compilación estable, use ese mismo flujo de trabajo de lanzamiento para hacer que ambas etiquetas de distribución apunten a la versión estable, o permita que su sincronización programada con autorreparación traslade `beta` posteriormente.

La modificación de las etiquetas de distribución reside en el repositorio del registro de lanzamientos porque todavía requiere `NPM_TOKEN`, mientras que el repositorio de código fuente mantiene la publicación exclusivamente mediante OIDC. De este modo, tanto la ruta de publicación directa como la ruta de promoción que comienza con la beta quedan documentadas y visibles para los operadores.

Si una persona responsable del mantenimiento debe recurrir a la autenticación local de npm, ejecute todos los comandos de la CLI de 1Password (`op`) únicamente dentro de una sesión de tmux dedicada. No invoque `op` directamente desde el shell principal del agente; mantenerlo dentro de tmux permite observar las solicitudes, las alertas y la gestión de OTP, y evita alertas reiteradas del host.

## Referencias públicas

- [`.github/workflows/full-release-validation.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/full-release-validation.yml)
- [`.github/workflows/package-acceptance.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/package-acceptance.yml)
- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/resolve-openclaw-package-candidate.mjs`](https://github.com/openclaw/openclaw/blob/main/scripts/resolve-openclaw-package-candidate.mjs)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Las personas responsables del mantenimiento utilizan la documentación privada de lanzamientos de [`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md) como guía operativa real.

## Contenido relacionado

- [Canales de lanzamiento](/es/install/development-channels)
