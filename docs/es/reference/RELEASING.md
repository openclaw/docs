---
read_when:
    - Buscando definiciones públicas de canales de lanzamiento
    - Ejecución de la validación de la versión o de la aceptación del paquete
    - Información sobre la nomenclatura y la cadencia de versiones
summary: Canales de lanzamiento, lista de verificación del operador, entornos de validación, nomenclatura de versiones y cadencia
title: Política de lanzamientos
x-i18n:
    generated_at: "2026-07-14T13:57:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 09620a4ba58eb218b0b827a88bd91349bf3b9a6cb2d76fd0c8f0636153809db7
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw ofrece actualmente tres canales de actualización orientados al usuario:

- stable: el canal de versiones promovidas existente, que todavía se resuelve mediante npm `latest` hasta que se alcance el hito independiente de la CLI y los canales
- beta: etiquetas de versiones preliminares que se publican en npm `beta`
- dev: la cabecera cambiante de `main`

Por separado, los operadores de versiones pueden publicar el paquete principal del último mes completado
en npm `extended-stable`, comenzando en el parche `33`. La línea final normal
del mes actual continúa en npm `latest`; esta separación de publicación
del lado del operador no cambia por sí sola la resolución de los canales de actualización de la CLI.

Las compilaciones alfa de Tideclaw constituyen una vía interna independiente de versiones preliminares (dist-tag de npm `alpha`), descrita en [Entradas del flujo de trabajo de NPM](#npm-workflow-inputs) y [Entornos de prueba de versiones](#release-test-boxes).

## Nomenclatura de versiones

- Versión mensual extendida estable de npm: `YYYY.M.PATCH`, con `PATCH >= 33`, etiqueta de git `vYYYY.M.PATCH`
- Versión final diaria/normal: `YYYY.M.PATCH`, con `PATCH < 33`, etiqueta de git `vYYYY.M.PATCH`
- Versión normal de corrección alternativa: `YYYY.M.PATCH-N`, etiqueta de git `vYYYY.M.PATCH-N`
- Versión preliminar beta: `YYYY.M.PATCH-beta.N`, etiqueta de git `vYYYY.M.PATCH-beta.N`
- Versión preliminar alfa: `YYYY.M.PATCH-alpha.N`, etiqueta de git `vYYYY.M.PATCH-alpha.N`
- Nunca se deben rellenar con ceros el mes ni el parche
- `PATCH` es un número secuencial del ciclo mensual de versiones, no un día natural. Las versiones finales normales y beta avanzan el ciclo actual; las etiquetas exclusivamente alfa nunca consumen ni avanzan el número de parche beta/normal, por lo que se deben ignorar las etiquetas heredadas exclusivamente alfa con números de parche superiores al seleccionar un ciclo beta o normal.
- Las compilaciones alfa/nocturnas usan el siguiente ciclo de parche sin publicar e incrementan únicamente `alpha.N` para las compilaciones repetidas. Una vez que ese parche tiene una versión beta, las nuevas compilaciones alfa pasan al parche siguiente.
- Las versiones de npm son inmutables: nunca se debe eliminar, volver a publicar ni reutilizar una etiqueta publicada. En su lugar, se debe crear el siguiente número de versión preliminar o el siguiente parche mensual.
- `latest` continúa siguiendo la línea normal/diaria actual de npm; `beta` es el destino actual de instalación beta
- `extended-stable` representa el paquete de npm compatible del mes anterior, comenzando en el parche `33`; el parche `34` y los posteriores son versiones de mantenimiento de esa línea mensual
- Las versiones finales normales y las versiones normales de corrección se publican en npm `beta` de forma predeterminada; los operadores de versiones pueden seleccionar `latest` explícitamente o promover posteriormente una compilación beta validada
- La ruta mensual dedicada de estabilidad extendida publica el paquete principal de npm y todos los plugins oficiales publicables en npm con exactamente la misma versión. No publica plugins en ClawHub ni publica artefactos de macOS o Windows, una versión de GitHub, dist-tags de repositorios privados, imágenes de Docker, artefactos móviles ni descargas del sitio web.
- Cada versión final normal distribuye conjuntamente el paquete de npm, la aplicación para macOS, el APK independiente firmado para Android y los instaladores firmados de Windows Hub. Las versiones beta normalmente validan y publican primero la ruta de npm/paquetes, mientras que la compilación, firma, notarización y promoción de aplicaciones nativas se reservan para la versión final normal, salvo que se soliciten explícitamente.

## Cadencia de versiones

- Las versiones avanzan primero por beta; stable solo llega después de validar la beta más reciente
- Los mantenedores normalmente crean las versiones desde una rama `release/YYYY.M.PATCH` creada a partir de la versión actual de `main`, para que la validación y las correcciones de la versión no bloqueen el nuevo desarrollo en `main`
- Si se ha enviado o publicado una etiqueta beta que necesita una corrección, los mantenedores crean la siguiente etiqueta `-beta.N` en lugar de eliminar o volver a crear la anterior
- El procedimiento detallado de publicación, las aprobaciones, las credenciales y las notas de recuperación son exclusivos de los mantenedores

## Publicación mensual extendida estable solo en npm

Esta es una excepción específica al procedimiento normal de publicación que aparece a continuación. Para un
mes completado `YYYY.M`, se debe crear `extended-stable/YYYY.M.33`; se deben publicar
`vYYYY.M.33` y los parches de mantenimiento posteriores desde esa misma rama. La etiqueta
de versión, la punta de la rama, el checkout, la versión del paquete, la comprobación preliminar de npm y la ejecución de la Validación
completa de la versión deben identificar la misma confirmación. La rama protegida `main` ya debe
contener una versión final de un mes natural estrictamente posterior por debajo del parche
`33`; los parches de mantenimiento siguen siendo aptos después de que `main` avance más de un
mes.

En la rama exacta de estabilidad extendida, se debe cambiar la versión del paquete raíz a `YYYY.M.P`, ejecutar
`pnpm release:prep` y comprobar que cada paquete de extensión publicable tenga la
misma versión. Se deben confirmar y enviar todos los cambios generados, crear y enviar la
etiqueta inmutable `vYYYY.M.P` en esa confirmación y registrar el SHA completo resultante.
Los flujos de trabajo consumen este árbol preparado; no cambian ni sincronizan las
versiones automáticamente.

Se deben ejecutar la comprobación preliminar de npm y la Validación completa de la versión desde la punta exacta de esa rama
preparada y, después, guardar ambos identificadores de ejecución y el intento correcto de ejecución de la Validación
completa de la versión:

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
independiente del dist-tag de npm `extended-stable` y permanece
intencionadamente sin cambios.

Una vez que ambas ejecuciones finalicen correctamente, se deben publicar todos los plugins oficiales publicables en npm desde la
punta exacta de esa misma rama. El parche `P` debe ser `33` o superior. Se debe proporcionar el SHA completo de la versión
como `ref`, esperar a que finalicen toda la matriz y la lectura de comprobación del registro y, después, guardar el
identificador de la ejecución correcta de Publicación de plugins en NPM:

```bash
RELEASE_SHA="$(git rev-parse HEAD)"
gh workflow run plugin-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f publish_scope=all-publishable \
  -f ref="$RELEASE_SHA" \
  -f npm_dist_tag=extended-stable
```

El flujo de trabajo usa el inventario normal preparado de paquetes `all-publishable`,
incluidos los paquetes cuyo código fuente no haya cambiado. Comprueba cada paquete exacto
y cada etiqueta de plugin `extended-stable` antes de finalizar correctamente. Si falla una ejecución
parcial, se debe volver a ejecutar el mismo comando: los paquetes ya publicados se reutilizan, las etiquetas de
plugins ausentes u obsoletas se concilian en el entorno de publicación de npm y la
lectura de comprobación final sigue abarcando el conjunto completo de paquetes.

Después de que el flujo de trabajo de plugins finalice correctamente y el entorno de publicación de npm esté listo,
se debe publicar el tarball principal exacto de la comprobación preliminar. La publicación principal verifica que la
ejecución de plugins referenciada sea `completed/success` en la misma rama canónica y con
el SHA exacto del código fuente:

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

Para un fork o un ensayo fuera de producción que intencionadamente no pueda cumplir la
política mensual de `.33` o del mes de la rama protegida `main`, se debe añadir
`-f bypass_extended_stable_guard=true` tanto a la comprobación preliminar de npm como a los
lanzamientos de publicación. El valor predeterminado es `false`. La omisión solo se acepta con
`npm_dist_tag=extended-stable` y queda registrada en el resumen del flujo de trabajo. Esta
no omite la referencia canónica `extended-stable/YYYY.M.33` del flujo de trabajo,
la igualdad entre la punta de la rama, la etiqueta y el checkout, la sintaxis de la etiqueta final, la igualdad entre
las versiones del paquete y la etiqueta, la identidad de la ejecución y el manifiesto referenciados, la procedencia del tarball,
la aprobación del entorno, la lectura de comprobación del registro ni las pruebas de reparación de selectores.

El flujo de trabajo de publicación comprueba las identidades de las ejecuciones referenciadas de comprobación preliminar, validación y plugins,
el resumen del tarball preparado y los selectores del registro principal.
Después de que el flujo de trabajo finalice correctamente, se debe confirmar el resultado de forma independiente:

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

Ambos comandos deben devolver `YYYY.M.P`. Si la publicación se completa correctamente, pero falla la
lectura de comprobación del selector, no se debe volver a publicar la versión inmutable del paquete. Se debe usar el
único comando de reparación `npm dist-tag add openclaw@YYYY.M.P extended-stable`
impreso en el resumen que siempre se ejecuta del flujo de trabajo fallido y, después, repetir ambas
lecturas de comprobación independientes. La reversión al selector anterior es una decisión independiente del
operador, no la ruta de reparación de la lectura de comprobación.

La documentación pública de soporte designa inicialmente Slack, Discord y Codex como
superficies de plugins cubiertas por la estabilidad extendida. Esa lista es una declaración de soporte, no
una lista de elementos permitidos del código de publicación: todos los plugins oficiales publicables en npm siguen la
misma ruta de publicación con una versión exacta.

La lista de comprobación normal que aparece a continuación sigue controlando beta, `latest`, las versiones de GitHub,
los plugins, macOS, Windows y la publicación en otras plataformas. No se deben ejecutar esos
pasos para esta ruta de estabilidad extendida solo en npm.

## Lista de comprobación del operador para versiones normales

Esta lista de comprobación representa la forma pública del flujo de publicación. Las credenciales privadas, la firma, la notarización, la recuperación de dist-tags y los detalles de reversión de emergencia permanecen en el manual de publicación exclusivo de los mantenedores.

1. Se debe comenzar desde la versión actual de `main`: obtener los cambios más recientes, confirmar que la confirmación de destino se haya enviado y confirmar que la CI de `main` esté lo bastante estable como para crear una rama desde ella.
2. Se debe crear `release/YYYY.M.PATCH` desde esa confirmación. Las adaptaciones retrospectivas son opcionales; solo se debe aplicar el conjunto seleccionado por el operador. Se deben incrementar todas las versiones requeridas, ejecutar `pnpm release:prep`, finalizar las correcciones de la versión y las adaptaciones posteriores obligatorias, y revisar `src/plugins/compat/registry.ts` junto con `src/commands/doctor/shared/deprecation-compat.ts`.
3. Se debe inmovilizar la confirmación anterior al registro de cambios que contiene el producto completo como **SHA del código**. Se debe ejecutar la comprobación preliminar determinista del código fuente y, después, usar `node scripts/full-release-validation-at-sha.mjs --sha <code-sha> --target-ref release/YYYY.M.PATCH`. Esto fija las herramientas de confianza del flujo de trabajo mientras la matriz completa de Vitest, Docker, control de calidad, paquetes y rendimiento usa como destino el SHA exacto del código.
4. Los fallos deben clasificarse antes de realizar modificaciones. Un fallo del producto o del código genera un nuevo SHA del código y requiere una validación completa correcta para ese SHA. Un fallo del flujo de trabajo, el entorno de pruebas, las credenciales, la aprobación o la infraestructura se corrige en la superficie a la que pertenece y se vuelve a ejecutar con el mismo SHA del código.
5. Solo después de que el SHA del código esté validado, se debe generar la sección superior de `CHANGELOG.md` a partir de las PR fusionadas y las confirmaciones directas realizadas desde la última etiqueta de versión publicada accesible. Las entradas deben estar orientadas al usuario y sin duplicados. Cuando una etiqueta publicada divergente o una adaptación posterior posterior vuelva a asociar PR ya publicadas, se debe proporcionar explícitamente como `--shipped-ref`.
6. Solo se debe confirmar `CHANGELOG.md`. Esta confirmación es el **SHA de la versión**. La diferencia completa entre el SHA del código y el SHA de la versión debe ser exactamente `CHANGELOG.md`; cualquier otra ruta modificada devuelve la publicación al paso 2.
7. Se debe ejecutar la Validación completa de la versión fijada por SHA para el SHA de la versión con la reutilización de pruebas habilitada. El proceso principal ligero debe registrar `changelog-only-release-v1`, apuntar al SHA del código validado y no iniciar ningún proceso secundario del producto. Esto reutiliza las pruebas del producto; no reutiliza los bytes del paquete.
8. Se debe ejecutar `OpenClaw NPM Release` con `preflight_only=true` para el SHA o la etiqueta de la versión. Se debe guardar el valor correcto de `preflight_run_id`. Esto compila y comprueba los bytes exactos del paquete que incluyen el registro de cambios final.
9. Se debe etiquetar el SHA de la versión y, después, ejecutar el asistente de candidatos con el proceso principal correcto de validación del SHA de la versión y la comprobación preliminar de npm, en lugar de volver a iniciar cualquiera de ellos:

   ```bash
   pnpm release:candidate -- \
     --tag vYYYY.M.PATCH-beta.N \
     --full-release-run <release-sha-validation-run-id> \
     --npm-preflight-run <preflight-run-id> \
     --skip-dispatch
   ```

   Para estable, pase también `--windows-node-tag vX.Y.Z`. El auxiliar verifica la procedencia de las notas de la versión, los bytes de comprobación previa de npm, la prueba de instalación/actualización de Parallels, la prueba del paquete de Telegram y los planes de publicación de plugins; después, imprime el comando de publicación.

   `OpenClaw Release Publish` envía los paquetes de plugins seleccionados o todos los publicables a npm y, en paralelo, el mismo conjunto a ClawHub; después, promociona el artefacto preparado de comprobación previa de npm de OpenClaw con la dist-tag correspondiente cuando la publicación de los plugins en npm se completa correctamente. El checkout de la versión continúa siendo la raíz del producto y los datos, mientras que la planificación y la verificación final se ejecutan desde el checkout exacto y de confianza del código fuente del flujo de trabajo, para que un commit de versión anterior no pueda usar silenciosamente herramientas de publicación obsoletas. Antes de iniciar cualquier proceso secundario de publicación, representa y almacena en caché el cuerpo exacto de la versión de GitHub. Cuando la sección `CHANGELOG.md` completa y correspondiente cabe dentro del límite de 125,000 caracteres de GitHub y del límite de seguridad correspondiente de 125,000 bytes del representador, la página contiene exactamente esa sección `## YYYY.M.PATCH`, incluido su encabezado. Cuando la sección de origen no cabe, la página conserva exactamente las notas editoriales agrupadas y sustituye el registro de contribuciones sobredimensionado por un enlace estable al registro completo en `CHANGELOG.md` fijado a la etiqueta; nunca se publican registros parciales ni viñetas truncadas. El flujo de trabajo elige ese cuerpo completo o compacto antes de añadir `### Release verification`; si la sección final de pruebas superase el límite, conserva el cuerpo canónico y se basa en las pruebas inmutables adjuntas. Las versiones estables publicadas en npm `latest` se convierten en la versión más reciente de GitHub, mientras que las versiones estables de mantenimiento conservadas en npm `beta` se crean con `latest=false` de GitHub. El flujo de trabajo también carga en la versión de GitHub las pruebas de dependencias de la comprobación previa, el manifiesto de validación completa y las pruebas de verificación del registro posteriores a la publicación para responder a incidentes posteriores a la versión. Imprime inmediatamente los identificadores de las ejecuciones secundarias, aprueba automáticamente las barreras del entorno de publicación que el token del flujo de trabajo puede aprobar, resume los trabajos secundarios fallidos con los finales de sus registros, crea por adelantado la página de borrador de la versión de GitHub y promociona los recursos de Windows y Android de forma simultánea a la publicación de OpenClaw en npm, finaliza la página de la versión y las pruebas de dependencias cuando esas etapas se completan correctamente, espera a ClawHub siempre que se publique OpenClaw en npm y, después, ejecuta el verificador beta de la rama principal de confianza y carga pruebas posteriores a la publicación para la versión de GitHub, el paquete npm, los paquetes npm de plugins seleccionados, los paquetes de ClawHub seleccionados, los identificadores de las ejecuciones de los flujos de trabajo secundarios y el identificador opcional de la ejecución de Telegram en NPM. El verificador de arranque de ClawHub exige la ruta y el SHA exactos del flujo de trabajo de la rama principal de confianza, los intentos de ejecución del productor y del terminal, el SHA de la versión, el conjunto de paquetes solicitado, la tupla inmutable del artefacto del paquete y el artefacto terminal de lectura de verificación del registro; no se acepta una ejecución correcta heredada de una referencia de versión.

   A continuación, ejecute la aceptación del paquete posterior a la publicación con el paquete `openclaw@YYYY.M.PATCH-beta.N` o `openclaw@beta` publicado. Si una versión preliminar enviada o publicada necesita una corrección, cree el siguiente número de versión preliminar correspondiente; nunca elimine ni reescriba el anterior.

10. Tras un intento de publicación fallido, mantenga sin cambios el SHA de la versión, salvo que el fallo demuestre un defecto del producto o del registro de cambios. Reanude los procesos secundarios y artefactos inmutables que se hayan completado correctamente; nunca vuelva a compilar ni a publicar una versión de paquete que ya se haya completado correctamente.
11. Para estable, continúe solo después de que la versión beta o candidata a publicación examinada disponga de las pruebas de validación requeridas. La publicación estable en npm también pasa por `OpenClaw Release Publish`, reutilizando mediante `preflight_run_id` el artefacto de comprobación previa completado correctamente. La preparación de la versión estable de macOS también requiere que `.zip`, `.dmg`, `.dSYM.zip` estén empaquetados y que `appcast.xml` esté actualizado en `main`; el flujo de trabajo de publicación de macOS publica automáticamente el appcast firmado en el recurso público `main` después de verificar los recursos de la versión, o abre/actualiza una PR del appcast si la protección de la rama bloquea el envío directo. La preparación estable de Windows Hub requiere los recursos firmados `OpenClawCompanion-Setup-x64.exe`, `OpenClawCompanion-Setup-arm64.exe` y `OpenClawCompanion-SHA256SUMS.txt` en la versión de GitHub de OpenClaw. Pase la etiqueta exacta de la versión firmada `openclaw/openclaw-windows-node` como `windows_node_tag` y su mapa de resúmenes de instaladores aprobado para la versión candidata como `windows_node_installer_digests`; `OpenClaw Release Publish` conserva el borrador de la versión, envía `Windows Node Release` y verifica los tres recursos antes de la publicación.
12. Después de publicar, ejecute el verificador posterior a la publicación de npm, la prueba E2E independiente y opcional de Telegram con el paquete npm publicado cuando se necesite una prueba del canal posterior a la publicación, la promoción de la dist-tag cuando sea necesaria, verifique la página de la versión de GitHub generada, ejecute los pasos del anuncio de la versión y, después, complete el [cierre estable de la rama principal](#stable-main-closeout) antes de considerar terminada una versión estable.

## Cierre estable de la rama principal

La publicación estable no está completa hasta que `main` contenga el estado real de la versión publicada.

1. Comience desde la versión más reciente y actualizada de `main`. Audite `release/YYYY.M.PATCH` con respecto a ella y traslade hacia delante las correcciones reales que falten en `main`. No fusione indiscriminadamente en la versión más reciente de `main` adaptadores de compatibilidad, pruebas o validación exclusivos de la versión.
2. Para la ruta normal, establezca `main` en la versión estable publicada. Un cierre tardío puede usar `main` después de que haya avanzado a una versión CalVer estable posterior de OpenClaw; no revierta a una versión anterior un ciclo de publicación ya iniciado únicamente para cerrar la versión anterior. El validador sigue exigiendo la sección exacta del registro de cambios publicado y la entrada del appcast, y registra la versión y el SHA reales de `main`. Ejecute `pnpm release:prep` después de cualquier cambio de la versión raíz y, después, `pnpm deps:shrinkwrap:generate`.
3. Haga que la sección `## YYYY.M.PATCH` de `CHANGELOG.md` en `main` coincida exactamente con la rama etiquetada de la versión. Incluya la actualización estable de `appcast.xml` cuando la versión para Mac haya publicado una.
4. No añada `YYYY.M.PATCH+1`, una versión beta ni una sección futura vacía del registro de cambios a `main` hasta que el operador inicie explícitamente ese ciclo de publicación.
5. Ejecute `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check` y `OPENCLAW_TESTBOX=1 pnpm check:changed`. Envíe los cambios y, después, verifique que `origin/main` contiene la versión publicada y el registro de cambios antes de considerar terminada la versión estable.
6. Mantenga actualizadas las variables del repositorio `RELEASE_ROLLBACK_DRILL_ID` y `RELEASE_ROLLBACK_DRILL_DATE` después de cada simulacro privado de reversión.

`OpenClaw Stable Main Closeout` comienza desde el envío de `main` que contiene la versión publicada, el registro de cambios y el appcast tras la publicación estable. Lee las pruebas inmutables posteriores a la publicación para vincular la etiqueta publicada con sus ejecuciones de validación completa de la versión y publicación; después, verifica el estado estable de la rama principal, la versión, el periodo de estabilización estable obligatorio y las pruebas de rendimiento bloqueantes. Adjunta un manifiesto de cierre inmutable y su suma de comprobación a la versión de GitHub. El activador automático por envío omite las versiones heredadas anteriores a las pruebas inmutables posteriores a la publicación y nunca considera esa omisión como un cierre completado.

Un cierre completo requiere ambos recursos y una suma de comprobación coincidente. Un manifiesto parcial reproduce su SHA `main` y el simulacro de reversión registrados para regenerar bytes idénticos y, después, adjunta la suma de comprobación que falta; un par no válido, o una suma de comprobación sin manifiesto, continúa siendo bloqueante. Una ejecución activada por un envío sin las variables del repositorio del simulacro de reversión se omite sin completar el cierre; si falta el registro del simulacro o tiene más de 90 días, sigue bloqueando el cierre manual respaldado por pruebas. Los comandos privados de recuperación permanecen en el manual de operaciones exclusivo para responsables de mantenimiento. Use el envío manual solo para reparar o reproducir un cierre estable respaldado por pruebas.

Si el proceso principal de publicación de la versión falló únicamente después de adjuntar las pruebas inmutables de npm/plugins, repare y publique primero todos los recursos de las plataformas estables. Después, un responsable de mantenimiento puede enviar manualmente el cierre con `allow_failed_publish_recovery=true`; ese modo solo acepta un proceso principal fallido y completado y, además, exige los contratos exactos de los recursos de Android y Windows, los resúmenes SHA-256 de GitHub, la verificación de las sumas de comprobación, la procedencia de Android y una promoción de Windows enviada por el proceso principal y completada correctamente, cuyas comprobaciones de Authenticode y resúmenes aprobados para la versión candidata coincidan con los instaladores publicados, además de las comprobaciones normales de macOS/appcast. El cierre automático activado por un envío nunca habilita este modo de recuperación.

Una etiqueta heredada de corrección alternativa puede reutilizar las pruebas del paquete base solo cuando la etiqueta de corrección se resuelve en el mismo commit de origen que la etiqueta estable base. Su versión de Android reutiliza el APK verificado de la etiqueta base y añade la procedencia de la etiqueta de corrección. Una corrección con un origen diferente debe publicar y verificar sus propias pruebas del paquete y usar un `versionCode` de Android superior.

## Comprobación previa de la versión

- Ejecute `pnpm check:test-types` antes de la comprobación previa de la versión para que el TypeScript de las pruebas siga cubierto fuera de la barrera local más rápida `pnpm check`.
- Ejecute `pnpm check:architecture` antes de la comprobación previa de la versión para que las comprobaciones más amplias de ciclos de importación y límites arquitectónicos estén correctas fuera de la barrera local más rápida.
- Ejecute `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que los artefactos de versión `dist/*` esperados y el paquete de la interfaz de control existan para el paso de validación del paquete.
- Ejecute `pnpm release:prep` después de incrementar la versión raíz y antes de crear la etiqueta. Ejecuta todos los generadores deterministas de la versión que suelen desincronizarse después de un cambio de versión, configuración o API: versiones de plugins, archivos shrinkwrap de npm, inventario de plugins, esquema de configuración base, metadatos de configuración de canales incluidos, base de referencia de la documentación de configuración, exportaciones del SDK de plugins y base de referencia de la API del SDK de plugins. `pnpm release:check` vuelve a ejecutar esas protecciones en modo de comprobación (además de una comprobación del presupuesto de superficie del SDK de plugins) e informa de todos los fallos de desincronización generados en una sola pasada antes de ejecutar las comprobaciones de publicación de los paquetes.
- De manera predeterminada, la sincronización de versiones de plugins actualiza a la versión de OpenClaw el paquete de entorno de ejecución publicable `@openclaw/ai`, las versiones de los paquetes de plugins oficiales y los límites mínimos existentes de `openclaw.compat.pluginApi`. Considere ese campo como el límite mínimo de la API del SDK/entorno de ejecución de plugins, no solo como una copia de la versión del paquete: para versiones exclusivas de plugins que mantengan intencionadamente la compatibilidad con hosts de OpenClaw anteriores, conserve el límite mínimo en la API del host compatible más antiguo y documente esa decisión en las pruebas de publicación del plugin.
- Ejecute el flujo de trabajo manual `Full Release Validation` antes de aprobar la versión para iniciar desde un único punto de entrada todos los entornos de prueba previos a la publicación. Acepta una rama, una etiqueta o un SHA de commit completo, envía manualmente `CI` y envía `OpenClaw Release Checks` para las rutas de pruebas rápidas de instalación, aceptación de paquetes, comprobaciones de paquetes entre sistemas operativos, paridad de QA Lab, Matrix y Telegram. Las ejecuciones estables y completas siempre incluyen pruebas exhaustivas en vivo/E2E y un periodo de estabilización de la ruta de publicación en Docker; `run_release_soak=true` se conserva para un periodo de estabilización beta explícito. La aceptación de paquetes proporciona la prueba E2E canónica de Telegram para paquetes durante la validación de la versión candidata, evitando un segundo sondeo en vivo simultáneo.

  Proporcione `release_package_spec` después de publicar una versión beta para reutilizar el paquete npm publicado en las comprobaciones de la versión, la aceptación de paquetes y la prueba E2E de Telegram para paquetes sin volver a compilar el archivo tar de la versión. Proporcione `npm_telegram_package_spec` solo cuando Telegram deba usar un paquete publicado diferente del resto de la validación de la versión. Proporcione `package_acceptance_package_spec` cuando la aceptación de paquetes deba usar un paquete publicado diferente de la especificación del paquete de la versión. Proporcione `evidence_package_spec` cuando el informe de pruebas de la versión deba demostrar que la validación coincide con un paquete npm publicado sin forzar la prueba E2E de Telegram.

  ```bash
  node scripts/full-release-validation-at-sha.mjs \
    --sha <code-sha> \
    --target-ref release/YYYY.M.PATCH
  ```

- Ejecute el flujo de trabajo manual `Package Acceptance` cuando necesite pruebas por un canal alternativo para un paquete candidato mientras continúa el trabajo de publicación. Use `source=npm` para `openclaw@beta`, `openclaw@latest` o una versión de publicación exacta; `source=ref` para empaquetar una rama, etiqueta o SHA de confianza de `package_ref` con el arnés actual de `workflow_ref`; `source=url` para un archivo tar público mediante HTTPS con un SHA-256 obligatorio y una política estricta de URL públicas; `source=trusted-url` para una política de fuente de confianza con nombre que use los valores obligatorios `trusted_source_id` y SHA-256; o `source=artifact` para un archivo tar cargado por otra ejecución de GitHub Actions.

  El flujo de trabajo resuelve el candidato como `package-under-test`, reutiliza el planificador de publicaciones E2E de Docker con ese archivo tar y puede ejecutar el control de calidad de Telegram con el mismo archivo tar mediante `telegram_mode=mock-openai` o `telegram_mode=live-frontier`. Cuando los carriles de Docker seleccionados incluyen `published-upgrade-survivor`, el artefacto del paquete es el candidato y `published_upgrade_survivor_baseline` selecciona la referencia publicada. `update-restart-auth` usa el paquete candidato tanto como CLI instalada como paquete sometido a prueba, de modo que ejercita la ruta de reinicio administrado del comando de actualización del candidato.

  Ejemplo:

  ```bash
  gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai
  ```

  Perfiles habituales:
  - `smoke`: carriles de instalación/canal/agente, red del Gateway y recarga de configuración
  - `package`: carriles nativos del artefacto para paquete/actualización/reinicio/plugins, sin OpenWebUI ni ClawHub en vivo
  - `product`: perfil de paquete más canales MCP, limpieza de cron/subagentes, búsqueda web de OpenAI y OpenWebUI
  - `full`: fragmentos de la ruta de publicación de Docker con OpenWebUI
  - `custom`: selección exacta de `docker_lanes` para una repetición enfocada

- Ejecute directamente el flujo de trabajo manual `CI` cuando solo necesite cobertura determinista de CI normal para el candidato de publicación. Las ejecuciones manuales de CI omiten el acotamiento por cambios y fuerzan los fragmentos de Linux Node, los fragmentos de plugins incluidos, los fragmentos de contratos de plugins y canales, la compatibilidad con Node 22, `check-*`, `check-additional-*`, las comprobaciones rápidas de artefactos compilados, las comprobaciones de documentación, las Skills de Python, Windows, macOS y los carriles de internacionalización de la interfaz de control. Las ejecuciones manuales independientes de CI solo ejecutan Android cuando se lanzan con `include_android=true`; `Full Release Validation` pasa esa entrada a su ejecución secundaria de CI.

  ```bash
  gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true
  ```

- Ejecute `pnpm qa:otel:smoke` al validar la telemetría de publicación. Ejercita el laboratorio de control de calidad mediante un receptor OTLP/HTTP local y verifica la exportación de trazas, métricas y registros, así como los atributos de traza acotados y la ocultación de contenido e identificadores, sin requerir Opik, Langfuse ni otro recopilador externo.
- Ejecute `pnpm qa:otel:collector-smoke` al validar la compatibilidad del recopilador. Enruta la misma exportación OTLP del laboratorio de control de calidad a través de un contenedor Docker real de OpenTelemetry Collector antes de las aserciones del receptor local.
- Ejecute `pnpm qa:prometheus:smoke` al validar la recopilación protegida de Prometheus. Ejercita el laboratorio de control de calidad, rechaza las recopilaciones no autenticadas y verifica que las familias de métricas críticas para la publicación no contengan contenido de solicitudes, identificadores sin procesar, tokens de autenticación ni rutas locales.
- Ejecute `pnpm qa:observability:smoke` para ejecutar consecutivamente los carriles de comprobación rápida de OpenTelemetry y Prometheus desde el código fuente.
- Ejecute `pnpm release:check` antes de cada publicación etiquetada.
- La comprobación previa de `OpenClaw NPM Release` genera pruebas de publicación de las dependencias antes de empaquetar el archivo tar de npm. La barrera de vulnerabilidades de los avisos de npm bloquea la publicación. Los informes de riesgo del manifiesto transitivo, de la superficie de propiedad/instalación de dependencias y de cambios en las dependencias solo constituyen pruebas de publicación. El informe de cambios en las dependencias compara el candidato de publicación con la etiqueta de publicación anterior accesible. La comprobación previa carga las pruebas de dependencias como `openclaw-release-dependency-evidence-<tag>` y también las incorpora en `dependency-evidence/` dentro del artefacto preparado de comprobación previa de npm. La ruta real de publicación reutiliza ese artefacto de comprobación previa y, después, adjunta las mismas pruebas a la publicación de GitHub como `openclaw-<version>-dependency-evidence.zip`.
- Ejecute `OpenClaw Release Publish` para la secuencia de publicación con cambios después de que exista la etiqueta. Lance las publicaciones beta y estables habituales desde un `main` de confianza; la etiqueta de publicación sigue seleccionando el commit de destino exacto y puede apuntar a `release/YYYY.M.PATCH`. Las publicaciones alfa de Tideclaw permanecen en su rama alfa correspondiente. Pase el `preflight_run_id` correcto de npm de OpenClaw, el `full_release_validation_run_id` correcto y el `full_release_validation_run_attempt` exacto, y conserve el ámbito predeterminado de publicación de plugins `all-publishable`, salvo que esté ejecutando deliberadamente una reparación enfocada. El flujo de trabajo serializa la publicación de plugins en npm, la publicación de plugins en ClawHub y la publicación de OpenClaw en npm para que el paquete principal no se publique antes que sus plugins externalizados; la promoción de Windows y Android se ejecuta simultáneamente con la publicación del paquete principal en npm usando la página de publicación en borrador. Las repeticiones de publicación son reanudables: si una versión del paquete principal ya está publicada en npm, se omite la ejecución del paquete principal después de que el flujo de trabajo compruebe que el archivo tar del registro coincide con el artefacto de comprobación previa de la etiqueta; asimismo, se omite la promoción de Windows/Android cuando la publicación ya contiene el contrato de artefactos verificado, por lo que un nuevo intento solo repite las etapas fallidas. Las reparaciones enfocadas únicamente en plugins requieren `plugin_publish_scope=selected` y una lista de plugins no vacía. Las ejecuciones `all-publishable` únicamente de plugins requieren pruebas inmutables y completas de la comprobación previa y de la validación completa de la publicación; las pruebas parciales se rechazan.
- La versión estable de `OpenClaw Release Publish` requiere un `windows_node_tag` exacto después de que exista la publicación `openclaw/openclaw-windows-node` correspondiente que no sea una versión preliminar, además del mapa `windows_node_installer_digests` aprobado para el candidato. Antes de lanzar cualquier flujo secundario de publicación, verifica que la publicación de origen esté publicada, no sea una versión preliminar, contenga los instaladores x64/ARM64 obligatorios y siga coincidiendo con ese mapa aprobado. A continuación, lanza `Windows Node Release` mientras la publicación de OpenClaw aún es un borrador, conservando sin cambios el mapa fijado de resúmenes de los instaladores. El flujo de trabajo secundario descarga los instaladores firmados de Windows Hub desde esa etiqueta exacta, los coteja con los resúmenes fijados, verifica en un ejecutor de Windows que sus firmas Authenticode usen el firmante esperado de OpenClaw Foundation, escribe un manifiesto SHA-256 y carga los instaladores junto con el manifiesto en la publicación canónica de OpenClaw en GitHub; después, vuelve a descargar los artefactos promocionados y verifica su inclusión en el manifiesto y sus hashes. El flujo de trabajo principal verifica el contrato actual de artefactos x64, ARM64 y de sumas de comprobación antes de la publicación. La recuperación directa rechaza nombres de artefactos `OpenClawCompanion-*` inesperados antes de sustituir los artefactos esperados del contrato por los bytes fijados del origen.

  Lance manualmente `Windows Node Release` solo para recuperación y pase siempre una etiqueta exacta, nunca `latest`, además del mapa JSON explícito `expected_installer_digests` de la publicación de origen aprobada. Los enlaces de descarga del sitio web deben apuntar a las URL exactas de los artefactos de la publicación de OpenClaw correspondientes a la versión estable actual, o a `releases/latest/download/...` solo después de verificar que la redirección de la versión más reciente de GitHub apunte a esa misma publicación; no enlace únicamente a la página de publicación del repositorio complementario.

- Las comprobaciones de la versión ahora se ejecutan en un flujo de trabajo manual independiente: `OpenClaw Release Checks`. También ejecuta el carril de paridad simulada de QA Lab, además del perfil rápido de Matrix en vivo y el carril de QA de Telegram antes de aprobar la versión. Los carriles en vivo usan el entorno `qa-live-shared`; Telegram también usa arrendamientos de credenciales de CI de Convex. Ejecute el flujo de trabajo manual `QA-Lab - All Lanes` con `matrix_profile=all` y `matrix_shards=true` cuando desee ejecutar en paralelo el inventario completo de transporte, contenido multimedia y E2EE de Matrix.
- La validación del entorno de ejecución de instalación y actualización entre sistemas operativos forma parte de los flujos públicos `OpenClaw Release Checks` y `Full Release Validation`, que invocan directamente el flujo de trabajo reutilizable `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`. Esta separación es intencionada: mantiene la ruta real de publicación de npm breve, determinista y centrada en los artefactos, mientras que las comprobaciones en vivo más lentas permanecen en su propio carril para que no retrasen ni bloqueen la publicación.
- Las comprobaciones de versiones que contienen secretos deben iniciarse mediante `Full Release Validation` o desde la referencia del flujo de trabajo `main`/release para que la lógica del flujo y los secretos permanezcan controlados.
- `OpenClaw Release Checks` acepta una rama, una etiqueta o un SHA completo de confirmación, siempre que la confirmación resuelta sea accesible desde una rama o etiqueta de versión de OpenClaw.
- La comprobación preliminar de solo validación de `OpenClaw NPM Release` también acepta el SHA completo de 40 caracteres de la confirmación actual de la rama del flujo de trabajo sin exigir una etiqueta enviada. Esa ruta de SHA es exclusivamente para validación y no puede promoverse a una publicación real. En modo SHA, el flujo de trabajo sintetiza `v<package.json version>` únicamente para comprobar los metadatos del paquete; la publicación real sigue requiriendo una etiqueta de versión real.
- Ambos flujos de trabajo mantienen la ruta real de publicación y promoción en ejecutores alojados en GitHub, mientras que la ruta de validación que no modifica el estado puede usar los ejecutores Linux más grandes de Blacksmith.
- Ese flujo de trabajo ejecuta `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` mediante los secretos de flujo de trabajo `OPENAI_API_KEY` y `ANTHROPIC_API_KEY`.
- La comprobación preliminar de la versión de npm ya no espera al carril independiente de comprobaciones de la versión.
- Antes de etiquetar localmente una versión candidata, ejecute `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`. El asistente ejecuta las medidas de protección rápidas de la versión, las comprobaciones de publicación de los plugins en npm/ClawHub, la compilación, la compilación de la interfaz de usuario y `release:openclaw:npm:check`, en el orden que permite detectar los errores comunes que bloquean la aprobación antes de que se inicie el flujo de publicación de GitHub.
- Ejecute `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts` (o la etiqueta correspondiente de versión preliminar/corrección) antes de la aprobación.
- Después de publicar en npm, ejecute `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH` (o la versión beta/correctiva correspondiente) para verificar la ruta de instalación desde el registro publicado en un prefijo temporal nuevo.
- Después de publicar una beta, ejecute `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` para verificar la incorporación desde el paquete instalado, la configuración de Telegram y la E2E real de Telegram con el paquete de npm publicado mediante el conjunto compartido de credenciales arrendadas de Telegram. Para ejecuciones puntuales locales, los responsables de mantenimiento pueden omitir las variables de Convex y proporcionar directamente las tres credenciales de entorno `OPENCLAW_QA_TELEGRAM_*`.
- Para ejecutar la prueba de humo beta completa posterior a la publicación desde el equipo de un responsable de mantenimiento, use `pnpm release:beta-smoke -- --beta betaN`. El asistente ejecuta la validación de actualización de npm y de destino nuevo en Parallels, inicia `NPM Telegram Beta E2E`, consulta periódicamente la ejecución exacta del flujo de trabajo, descarga el artefacto e imprime el informe de Telegram.
- Los responsables de mantenimiento pueden ejecutar la misma comprobación posterior a la publicación desde GitHub Actions mediante el flujo de trabajo manual `NPM Telegram Beta E2E`. Es intencionadamente solo manual y no se ejecuta con cada fusión.
- La automatización de versiones para responsables de mantenimiento usa primero la comprobación preliminar y después la promoción:
  - La publicación real en npm debe superar correctamente una `preflight_run_id` de npm.
  - La orquestación y la comprobación preliminar de publicaciones beta y estables normales usan `main` de confianza con la etiqueta de destino exacta. La publicación alfa y la comprobación preliminar de Tideclaw usan la rama alfa correspondiente.
  - Las versiones estables de npm usan de forma predeterminada `beta`; la publicación estable en npm puede dirigirse explícitamente a `latest` mediante una entrada del flujo de trabajo.
  - La modificación de etiquetas de distribución de npm basada en tokens reside en `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` porque `npm dist-tag add` todavía necesita `NPM_TOKEN`, mientras que el repositorio de origen mantiene una publicación exclusiva mediante OIDC.
  - El flujo público `macOS Release` es exclusivamente de validación; cuando una etiqueta solo existe en una rama de versión, pero el flujo de trabajo se inicia desde `main`, configure `public_release_branch=release/YYYY.M.PATCH`.
  - La publicación real de macOS debe superar correctamente `preflight_run_id` y `validate_run_id` de macOS.
  - Las rutas de publicación real promueven los artefactos preparados en lugar de volver a compilarlos.
- Para versiones correctivas estables como `YYYY.M.PATCH-N`, el verificador posterior a la publicación también comprueba la misma ruta de actualización con prefijo temporal desde `YYYY.M.PATCH` hasta `YYYY.M.PATCH-N`, para que las correcciones de versiones no puedan dejar silenciosamente las instalaciones globales anteriores con la carga útil de la versión estable base.
- La comprobación preliminar de la versión de npm se cierra con error salvo que el archivo tar incluya tanto `dist/control-ui/index.html` como una carga útil `dist/control-ui/assets/` que no esté vacía, para evitar volver a distribuir un panel de navegador vacío.
- La verificación posterior a la publicación también comprueba que los puntos de entrada de los plugins publicados y los metadatos del paquete estén presentes en la disposición del registro instalado. Una versión que distribuya cargas útiles faltantes del entorno de ejecución de plugins no supera el verificador posterior a la publicación y no puede promoverse a `latest`.
- `pnpm test:install:smoke` también aplica el presupuesto `unpackedSize` del empaquetado de npm al archivo tar de actualización candidato, para que la E2E del instalador detecte un aumento accidental del tamaño del paquete antes de la ruta de publicación de la versión.
- Si el trabajo de la versión modificó la planificación de CI, los manifiestos de tiempos de las extensiones o las matrices de pruebas de extensiones, regenere y revise antes de la aprobación las salidas de la matriz `plugin-prerelease-extension-shard` propiedad del planificador desde `.github/workflows/plugin-prerelease.yml`, para que las notas de la versión no describan una disposición de CI obsoleta.
- La preparación de una versión estable de macOS también incluye las superficies del actualizador: la versión de GitHub debe terminar con los archivos empaquetados `.zip`, `.dmg` y `.dSYM.zip`; `appcast.xml` en `main` debe apuntar al nuevo archivo zip estable después de la publicación (el flujo de publicación de macOS lo confirma automáticamente o abre una PR del appcast cuando se bloquea el envío directo); la aplicación empaquetada debe mantener un identificador de paquete que no sea de depuración, una URL de fuente de Sparkle que no esté vacía y un `CFBundleVersion` igual o superior al límite mínimo canónico de compilación de Sparkle para esa versión.

## Entornos de prueba de versiones

`Full Release Validation` es la forma en que los operadores inician la matriz completa del producto desde un único punto de entrada. Use el asistente para que cada flujo de trabajo secundario se ejecute desde una rama temporal fijada en un único SHA de flujo de trabajo `main` de confianza, mientras que la confirmación solicitada sigue siendo la candidata sometida a prueba:

```bash
pnpm ci:full-release \
  --sha <code-sha> \
  --target-ref release/YYYY.M.PATCH
```

El asistente obtiene la versión actual de `origin/main`, envía `release-ci/<workflow-sha>-...` en esa confirmación de flujo de trabajo de confianza, deduce `beta` de las versiones de paquetes alfa/beta y `stable` en los demás casos, inicia `Full Release Validation` desde la rama temporal con `ref=<target-sha>`, verifica que cada `headSha` de flujo de trabajo secundario coincida con el SHA fijado del flujo de trabajo principal y, a continuación, elimina la rama temporal. Proporcione `-f reuse_evidence=false` para forzar una ejecución nueva, `-f release_profile=full` para el análisis consultivo amplio o `--workflow-sha <trusted-main-sha>` para fijar una confirmación anterior que siga siendo accesible desde el `origin/main` actual. El propio flujo de trabajo nunca escribe referencias del repositorio. Esto mantiene disponibles las herramientas de versiones exclusivas de la rama principal sin añadir confirmaciones de herramientas a la candidata y evita demostrar accidentalmente una ejecución secundaria `main` más reciente.

Cuando el SHA del código esté en verde, confirme únicamente `CHANGELOG.md` y ejecute el mismo asistente con el SHA de la versión:

```bash
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH
```

El segundo flujo principal reutiliza las pruebas del producto únicamente cuando GitHub demuestra que el SHA de la versión desciende del SHA del código y que el conjunto completo de rutas modificadas es exactamente `CHANGELOG.md`. Registra `changelog-only-release-v1` y no inicia ningún flujo secundario del producto. La comprobación preliminar de npm y la aceptación del paquete y de la instalación siguen ejecutándose con el SHA de la versión porque los bytes de su archivo tar han cambiado.

Para un SHA de código nuevo, el flujo de trabajo resuelve el destino, inicia el flujo manual `CI` y, a continuación, inicia `OpenClaw Release Checks`. `OpenClaw Release Checks` distribuye en paralelo la prueba de humo de instalación, las comprobaciones de versiones entre sistemas operativos, la cobertura en vivo/E2E de la ruta de versión de Docker cuando está habilitada la prueba prolongada, la aceptación del paquete con la E2E canónica del paquete de Telegram, la paridad de QA Lab, Matrix en vivo y Telegram en vivo. Una ejecución completa/total solo es aceptable cuando el resumen `Full Release Validation` muestra `normal_ci`, `plugin_prerelease` y `release_checks` como correctos, salvo que una repetición focalizada haya omitido intencionadamente el flujo secundario independiente `Plugin Prerelease`. Use el flujo secundario independiente `npm-telegram` únicamente para repetir de forma focalizada una prueba del paquete publicado con `release_package_spec` o `npm_telegram_package_spec`. El resumen final del verificador incluye tablas de las tareas más lentas de cada ejecución secundaria, para que el responsable de la versión pueda consultar la ruta crítica actual sin descargar los registros.

El flujo secundario de rendimiento del producto solo genera artefactos en esta ruta de versión. El
flujo general lo inicia con `publish_reports=false`, y la validación se rechaza
salvo que su protección de solo artefactos demuestre que el publicador de informes de Clawgrit permaneció
omitido.

Consulte [Validación completa de versiones](/es/reference/full-release-validation) para conocer la matriz completa de etapas, los nombres exactos de las tareas del flujo de trabajo, las diferencias entre los perfiles estable y completo, los artefactos y los identificadores de repetición focalizada.

Los flujos de trabajo secundarios se inician desde la referencia de confianza fijada mediante SHA que ejecuta `Full Release Validation`. Cada ejecución secundaria debe usar el SHA exacto del flujo de trabajo principal. No use inicios directos de `--ref main -f ref=<sha>` como prueba de la versión; use `pnpm ci:full-release --sha <target-sha> --target-ref release/YYYY.M.PATCH`.

Use `release_profile` para seleccionar la amplitud de proveedores y comprobaciones en vivo:

- `beta`: ruta crítica de versión más rápida para OpenAI/núcleo en vivo y Docker
- `stable`: cobertura beta y estable de proveedores y backends para aprobar la versión
- `full`: cobertura estable más una cobertura consultiva amplia de proveedores y contenido multimedia

Las validaciones estable y completa siempre ejecutan, antes de la promoción, el análisis exhaustivo en vivo/E2E, la ruta de versión de Docker y el análisis acotado de supervivencia a actualizaciones publicadas. Use `run_release_soak=true` para solicitar el mismo análisis para una beta. Ese análisis abarca los cuatro paquetes estables más recientes, además de las líneas base fijadas `2026.4.23` y `2026.5.2`, así como la cobertura anterior `2026.4.15`; elimina las líneas base duplicadas y divide cada línea base en su propia tarea de ejecución de Docker.

`OpenClaw Release Checks` usa la referencia de flujo de trabajo de confianza para resolver una vez la referencia de destino como `release-package-under-test` y reutiliza ese artefacto en las comprobaciones entre sistemas operativos, de aceptación del paquete y de Docker para la ruta de versión cuando se ejecuta la prueba prolongada. Esto mantiene todos los entornos orientados a paquetes sobre los mismos bytes y evita repetir las compilaciones del paquete. Cuando una beta ya esté en npm, configure `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` para que las comprobaciones de la versión descarguen una vez el paquete distribuido, extraigan su SHA de origen de compilación de `dist/build-info.json` y reutilicen ese artefacto en los carriles entre sistemas operativos, de aceptación del paquete, de Docker para la ruta de versión y del paquete de Telegram.

La prueba de humo de instalación de OpenAI entre sistemas operativos usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` cuando se configura la variable del repositorio o de la organización; de lo contrario, usa `openai/gpt-5.6-luna`, porque este carril demuestra la instalación del paquete, la incorporación, el inicio del Gateway y un turno de agente en vivo, en lugar de comparar el rendimiento del modelo más capaz. La matriz más amplia de proveedores en vivo sigue siendo el lugar para la cobertura específica de cada modelo.

Use estas variantes según la etapa de la versión:

```bash
# Validar el SHA de código con el producto completo.
pnpm ci:full-release \
  --sha <code-sha> \
  --target-ref release/YYYY.M.PATCH

# Validar el SHA de lanzamiento solo con cambios en el registro de cambios reutilizando la evidencia del producto del SHA de código.
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH

# Después de publicar una beta, añadir las pruebas E2E de Telegram del paquete publicado.
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH \
  -f release_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

No se debe usar el flujo general completo como primera repetición tras una corrección específica. Si falla una casilla, se debe usar el flujo de trabajo secundario, trabajo, carril de Docker, perfil de paquete, proveedor de modelos o carril de control de calidad que haya fallado para la siguiente comprobación. Se debe volver a ejecutar el flujo general completo únicamente cuando la corrección haya cambiado la orquestación compartida del lanzamiento o haya dejado obsoleta la evidencia anterior de todas las casillas. El verificador final del flujo general vuelve a comprobar los identificadores registrados de las ejecuciones de los flujos de trabajo secundarios, por lo que, después de repetir correctamente un flujo de trabajo secundario, se debe volver a ejecutar únicamente el trabajo principal `Verify full validation` que haya fallado.

`rerun_group=all` puede reutilizar una ejecución correcta anterior del flujo general cuando coincidan el perfil de lanzamiento,
la configuración efectiva de estabilización y las entradas de validación, y cuando el SHA de destino
sea idéntico o el nuevo destino sea un descendiente cuyo conjunto completo de rutas modificadas
sea exactamente `CHANGELOG.md`. La reutilización del destino exacto registra
`exact-target-full-validation-v1`; el SHA de lanzamiento posterior a la validación registra
`changelog-only-release-v1`. Este último reutiliza únicamente la validación del producto. La comprobación
preliminar de npm, los bytes del paquete, la procedencia de las notas de lanzamiento y la aceptación
de instalación/actualización deben seguir ejecutándose con el SHA de lanzamiento. Cualquier cambio
de versión, fuente, contenido generado, dependencia, paquete o destino perteneciente al flujo de trabajo
requiere un nuevo SHA de código y una validación completa nueva. Las ejecuciones más recientes del flujo
general para la misma referencia `release/*` y el mismo grupo de repetición sustituyen
automáticamente a las que estén en curso. Se debe pasar
`reuse_evidence=false` para forzar una ejecución completa nueva.

Para una recuperación acotada, se debe pasar `rerun_group` al flujo general. `all` es la ejecución real del candidato de lanzamiento, `ci` ejecuta únicamente el flujo secundario de CI normal, `plugin-prerelease` ejecuta únicamente el flujo secundario de Plugin exclusivo del lanzamiento, `release-checks` ejecuta todas las casillas del lanzamiento, y los grupos de lanzamiento más específicos son `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` y `npm-telegram`. Las repeticiones específicas de `npm-telegram` requieren `release_package_spec` o `npm_telegram_package_spec`; las ejecuciones completas/totales usan las pruebas E2E canónicas de Telegram del paquete dentro de la aceptación de paquetes. Las repeticiones específicas entre sistemas operativos pueden añadir `cross_os_suite_filter=windows/packaged-upgrade` u otro filtro de sistema operativo/conjunto de pruebas. Los fallos de las comprobaciones de lanzamiento de control de calidad bloquean la validación normal del lanzamiento, incluida la desviación requerida de herramientas dinámicas de OpenClaw en el nivel estándar. Las ejecuciones alfa de Tideclaw pueden seguir considerando como orientativos los carriles de comprobación del lanzamiento no relacionados con la seguridad del paquete. Con `release_profile=beta`, los conjuntos de pruebas de proveedores en vivo `Run repo/live E2E validation` son orientativos (advertencias, no bloqueos); los perfiles estables y completos los mantienen como bloqueantes. Cuando `live_suite_filter` solicita explícitamente un carril de control de calidad en vivo sujeto a una puerta, como Discord, WhatsApp o Slack, debe estar habilitada la variable correspondiente del repositorio `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED`; de lo contrario, la captura de entradas falla en vez de omitir silenciosamente el carril.

### Vitest

La casilla de Vitest es el flujo de trabajo secundario manual `CI`. La CI manual omite intencionadamente el ámbito de cambios y fuerza el grafo normal de pruebas para el candidato de lanzamiento: particiones de Linux Node, particiones de Plugins incluidos, particiones de contratos de Plugins y canales, compatibilidad con Node 22, `check-*`, `check-additional-*`, comprobaciones rápidas de artefactos compilados, comprobaciones de documentación, Skills de Python, Windows, macOS e internacionalización de la interfaz de control. Android se incluye cuando `Full Release Validation` ejecuta la casilla porque el flujo general pasa `include_android=true`; la CI manual independiente requiere `include_android=true` para la cobertura de Android.

Esta casilla sirve para responder «¿el árbol de fuentes superó el conjunto completo de pruebas normales?». No equivale a la validación del producto a través de la ruta de lanzamiento. Evidencia que se debe conservar:

- resumen de `Full Release Validation` que muestre la URL de la ejecución `CI` iniciada
- ejecución `CI` correcta en el SHA de destino exacto
- nombres de las particiones fallidas o lentas de los trabajos de CI al investigar regresiones
- artefactos de tiempos de Vitest, como `.artifacts/vitest-shard-timings.json`, cuando una ejecución requiera análisis de rendimiento

La CI manual se debe ejecutar directamente solo cuando el lanzamiento necesite una CI normal determinista, pero no las casillas de Docker, QA Lab, ejecución en vivo, sistemas operativos cruzados o paquetes. Se debe usar el primer comando para una CI directa sin Android. Se debe añadir `include_android=true` cuando la CI directa del candidato de lanzamiento deba cubrir Android:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

La casilla de Docker se encuentra en `OpenClaw Release Checks` mediante `openclaw-live-and-e2e-checks-reusable.yml`, además del flujo de trabajo en modo de lanzamiento `install-smoke`. Valida el candidato de lanzamiento mediante entornos Docker empaquetados, en vez de limitarse a pruebas del código fuente.

La cobertura de Docker para el lanzamiento incluye:

- prueba rápida de instalación completa con la prueba lenta de instalación global mediante Bun habilitada
- preparación/reutilización de la imagen de prueba rápida del Dockerfile raíz por SHA de destino, con los trabajos de prueba rápida de QR, raíz/Gateway e instalador/Bun ejecutándose como particiones independientes de pruebas de instalación
- carriles E2E del repositorio
- fragmentos de Docker de la ruta de lanzamiento: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, de `plugins-runtime-install-a` a `plugins-runtime-install-h` y `openwebui`
- cobertura de OpenWebUI en un ejecutor dedicado con disco de gran tamaño cuando se solicite
- carriles divididos de instalación/desinstalación de Plugins incluidos, de `bundled-plugin-install-uninstall-0` a `bundled-plugin-install-uninstall-23`
- conjuntos de pruebas de proveedores en vivo/E2E y cobertura de modelos en vivo mediante Docker cuando las comprobaciones del lanzamiento incluyan conjuntos de pruebas en vivo

Se deben usar los artefactos de Docker antes de repetir la ejecución. El programador de la ruta de lanzamiento carga `.artifacts/docker-tests/` con registros de los carriles, `summary.json`, `failures.json`, tiempos de las fases, el JSON del plan del programador y los comandos de repetición. Para una recuperación específica, se debe usar `docker_lanes=<lane[,lane]>` en el flujo de trabajo reutilizable en vivo/E2E en vez de volver a ejecutar todos los fragmentos del lanzamiento. Los comandos de repetición generados incluyen las entradas anteriores de `package_artifact_run_id` y de las imágenes Docker preparadas cuando están disponibles, por lo que un carril fallido puede reutilizar el mismo archivo tar y las mismas imágenes de GHCR.

### QA Lab

La casilla de QA Lab también forma parte de `OpenClaw Release Checks`. Es la puerta de lanzamiento para el comportamiento de los agentes y el nivel de los canales, independiente de Vitest y de la mecánica de paquetes de Docker.

La cobertura de QA Lab para el lanzamiento incluye:

- carril de paridad simulado que compara el carril candidato de OpenAI con la referencia `anthropic/claude-opus-4-8` mediante el paquete de paridad de agentes
- perfil rápido de control de calidad de Matrix en vivo mediante el entorno `qa-live-shared`
- carril de control de calidad de Telegram en vivo mediante arrendamientos de credenciales de Convex CI
- `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`, `pnpm qa:prometheus:smoke` o `pnpm qa:observability:smoke` cuando la telemetría del lanzamiento necesite comprobación local explícita

Esta casilla sirve para responder «¿el lanzamiento se comporta correctamente en los escenarios de control de calidad y en los flujos de canales en vivo?». Se deben conservar las URL de los artefactos de los carriles de paridad, Matrix y Telegram al aprobar el lanzamiento. La cobertura completa de Matrix sigue disponible como una ejecución manual particionada de QA Lab, en vez de formar parte del carril crítico predeterminado del lanzamiento.

### Paquete

La casilla de paquetes es la puerta del producto instalable. Está respaldada por `Package Acceptance` y el resolvedor `scripts/resolve-openclaw-package-candidate.mjs`. El resolvedor normaliza un candidato en el archivo tar `package-under-test` que consumen las pruebas E2E de Docker, valida el inventario del paquete, registra la versión del paquete y su SHA-256, y mantiene separada la referencia del entorno del flujo de trabajo de la referencia del código fuente del paquete.

Fuentes de candidatos admitidas:

- `source=npm`: `openclaw@beta`, `openclaw@latest` o una versión exacta de lanzamiento de OpenClaw
- `source=ref`: empaquetar una rama, etiqueta o SHA completo de confirmación `package_ref` de confianza con el entorno `workflow_ref` seleccionado
- `source=url`: descargar un `.tgz` HTTPS público con el `package_sha256` requerido; se rechazan las credenciales en la URL, los puertos HTTPS no predeterminados, los nombres de host o direcciones resueltas privados, internos o de uso especial y las redirecciones no seguras
- `source=trusted-url`: descargar un `.tgz` HTTPS con los valores requeridos `package_sha256` y `trusted_source_id` de una política con nombre en `.github/package-trusted-sources.json`; se debe usar para réplicas empresariales mantenidas por los responsables o repositorios de paquetes privados, en vez de añadir una omisión de red privada en el nivel de entrada a `source=url`
- `source=artifact`: reutilizar un `.tgz` cargado por otra ejecución de GitHub Actions

`OpenClaw Release Checks` ejecuta la aceptación de paquetes con `source=artifact`, el artefacto preparado del paquete de lanzamiento, `suite_profile=custom`, `docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape`, `telegram_mode=mock-openai`. La aceptación de paquetes mantiene la migración, la actualización, la actualización de VPS administrados desde la raíz, el reinicio tras una actualización con autenticación configurada, la instalación en vivo de Skills de ClawHub, la limpieza de dependencias obsoletas de Plugins, los accesorios de Plugins sin conexión, la actualización de Plugins, el refuerzo contra escapes en la vinculación de comandos de Plugins y el control de calidad de Telegram para paquetes con el mismo archivo tar resuelto. Las comprobaciones bloqueantes del lanzamiento usan como referencia predeterminada el paquete publicado más reciente; el perfil beta con `run_release_soak=true`, `release_profile=stable` o `release_profile=full` amplía el barrido de supervivencia a actualizaciones publicadas a `last-stable-4` más las referencias fijadas `2026.4.23`, `2026.5.2` y `2026.4.15` con escenarios `reported-issues`. Se debe usar la aceptación de paquetes con `source=npm` para un candidato ya publicado, `source=ref` para un archivo tar local de npm respaldado por un SHA antes de la publicación, `source=trusted-url` para una réplica empresarial/privada mantenida por los responsables o `source=artifact` para un archivo tar preparado y cargado por otra ejecución de GitHub Actions.

Es el reemplazo nativo de GitHub para la mayor parte de la cobertura de paquetes/actualizaciones que antes requería Parallels. Las comprobaciones de lanzamiento entre sistemas operativos siguen siendo importantes para la incorporación, el instalador y el comportamiento específico de cada plataforma, pero la validación del producto para paquetes/actualizaciones debe priorizar la aceptación de paquetes.

La lista de comprobación canónica para validar actualizaciones y Plugins es [Probar actualizaciones y Plugins](/es/help/testing-updates-plugins). Se debe usar para decidir qué carril local, de Docker, de aceptación de paquetes o de comprobación del lanzamiento demuestra un cambio en la instalación/actualización de un Plugin, la limpieza mediante doctor o la migración de un paquete publicado. La migración exhaustiva de actualizaciones publicadas desde cada paquete estable `2026.4.23+` es un flujo de trabajo manual independiente `Update Migration`, no forma parte de la CI completa del lanzamiento.

La tolerancia heredada de la aceptación de paquetes está limitada intencionadamente en el tiempo. Los paquetes hasta `2026.4.25` pueden usar la ruta de compatibilidad para carencias de metadatos ya publicadas en npm: entradas privadas del inventario de control de calidad ausentes del archivo tar, ausencia de `gateway install --wrapper`, ausencia de archivos de parches en el accesorio de git derivado del archivo tar, ausencia del valor persistente `update.channel`, ubicaciones heredadas de los registros de instalación de Plugins, ausencia de persistencia del registro de instalación del mercado y migración de metadatos de configuración durante `plugins update`. El paquete publicado `2026.4.26` puede emitir advertencias por archivos locales de marca de metadatos de compilación que ya se hayan distribuido. Los paquetes posteriores deben satisfacer los contratos modernos de paquetes; esas mismas carencias hacen fallar la validación del lanzamiento.

Se deben usar perfiles más amplios de aceptación de paquetes cuando la cuestión del lanzamiento se refiera a un paquete instalable real:

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

- `smoke`: vías rápidas de instalación de paquetes/canales/agentes, red del Gateway y recarga de la configuración
- `package`: contratos de instalación/actualización/reinicio/paquetes de Plugin, además de prueba en vivo de instalación de Skills de ClawHub; este es el valor predeterminado para la comprobación de versiones
- `product`: `package` más canales MCP, limpieza de Cron/subagentes, búsqueda web de OpenAI y OpenWebUI
- `full`: partes de la ruta de publicación de Docker con OpenWebUI
- `custom`: lista exacta de `docker_lanes` para repeticiones específicas

Para la prueba de Telegram del paquete candidato, habilite `telegram_mode=mock-openai` o `telegram_mode=live-frontier` en Package Acceptance. El flujo de trabajo pasa el tarball `package-under-test` resuelto a la vía de Telegram; el flujo de trabajo independiente de Telegram sigue aceptando una especificación npm publicada para las comprobaciones posteriores a la publicación.

## Automatización habitual de publicación de versiones

Para la publicación beta, `latest`, de plugins, de GitHub Release y de plataformas,
`OpenClaw Release Publish` es el punto de entrada habitual con mutaciones. La ruta mensual
`.33+` de estabilidad extendida solo para npm no utiliza este orquestador. El
flujo de trabajo habitual orquesta los flujos de trabajo de publicación de confianza en el orden que
requiere la versión:

1. Obtenga la etiqueta de la versión y resuelva el SHA de su commit.
2. Verifique que la etiqueta sea accesible desde `main` o `release/*` (o desde una rama alfa de Tideclaw para versiones preliminares alfa).
3. Ejecute `pnpm plugins:sync:check`.
4. Despache `Plugin NPM Release` con `publish_scope=all-publishable` y `ref=<release-sha>`.
5. Despache `Plugin ClawHub Release` con el mismo ámbito y SHA.
6. Despache `OpenClaw NPM Release` con la etiqueta de la versión, la etiqueta de distribución de npm y el `preflight_run_id` guardado después de verificar el `full_release_validation_run_id` guardado y el intento de ejecución exacto.
7. Para versiones estables, cree o actualice la versión de GitHub como borrador, despache `Windows Node Release` con el `windows_node_tag` explícito y el `windows_node_installer_digests` aprobado para el candidato, y verifique los activos canónicos del instalador de Windows y sus sumas de comprobación. Despache también `Android Release` para compilar el APK firmado de la etiqueta exacta, junto con su suma de comprobación y procedencia. Verifique ambos contratos de activos nativos antes de publicar el borrador.

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

Utilice los flujos de trabajo de bajo nivel `Plugin NPM Release` y `Plugin ClawHub Release` solo para trabajos específicos de reparación o republicación. `OpenClaw Release Publish` rechaza `plugin_publish_scope=selected` cuando `publish_openclaw_npm=true`, de modo que el paquete principal no pueda publicarse sin todos los plugins oficiales publicables, incluido `@openclaw/diffs-language-pack`. Para reparar un Plugin seleccionado, establezca `publish_openclaw_npm=false` con `plugin_publish_scope=selected` y `plugins=@openclaw/name`, o despache directamente el flujo de trabajo secundario.

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

La validación previa a la etiqueta requiere `dry_run=true`, rechaza entradas de etiquetas de versión
y ejecuciones superiores, y solo acepta un destino exacto accesible desde `main` o `release/*`.
No carga credenciales de ClawHub, publica bytes de paquetes ni cambia la
configuración del publicador de confianza. El flujo de trabajo aun así resuelve el plan activo del registro,
obtiene y empaqueta el destino únicamente en un trabajo sin secretos, materializa la
cadena de herramientas bloqueada de ClawHub y valida el artefacto inmutable y el
slug o la identidad del paquete antes de que exista la etiqueta de la versión. Apruebe el entorno
`clawhub-plugin-bootstrap` solo después de que finalicen los trabajos de empaquetado sin secretos;
este trabajo de validación protegido no tiene credenciales ni comandos de mutación.

Una ejecución en seco aprobada o una inicialización real después del etiquetado debe incluir la
etiqueta exacta de la versión, además del id, el intento y la rama de la ejecución superior
`OpenClaw Release Publish`. La ejecución superior certifica el SHA de su propio flujo de trabajo y un SHA de confianza exacto
`main` independiente para `Plugin ClawHub New`; la ejecución secundaria y cada aprobación
del entorno protegido deben coincidir con ese SHA secundario aprobado. La etiqueta de la versión se
vuelve a comprobar antes de cada intento de publicación y mutación del publicador de confianza.

El trabajo de empaquetado
carga un único artefacto inmutable cuyo nombre, id/digest del artefacto de Actions,
ejecución/intento productor, SHA de destino y SHA-256/tamaño del tarball de cada paquete se
transmiten a los trabajos de validación y protegidos. El trabajo protegido obtiene únicamente las herramientas
`main` de confianza, valida la tupla del artefacto mediante la API de GitHub, descarga
por id exacto del artefacto, vuelve a calcular el hash de cada tarball y valida las rutas TAR locales y
la identidad del paquete con las reglas de canonicalización USTAR de la CLI fijada. Después,
cada candidato supera la ejecución en seco de publicación de la CLI fijada, que regresa antes de
consultar el registro o autenticar. El prefiltro del trabajo con credenciales limita los ClawPacks comprimidos
a 120 MiB, la carga útil total de archivos a 50 MiB, los datos TAR expandidos a 64 MiB y
el número de entradas TAR a 10,000. La reparación del publicador de confianza para paquetes existentes sigue
siendo solo de configuración, pero aun así empaqueta el destino y exige la etiqueta solicitada
junto con la igualdad exacta de los bytes y metadatos del registro antes de cambiar la configuración
del publicador de confianza. La verificación posterior a la publicación descarga el artefacto de ClawHub y
exige el mismo SHA-256 y tamaño. Una recuperación mediante repetición de trabajos fallidos puede reutilizar el
artefacto de paquete de un intento anterior solo cuando el trabajo productor exacto haya finalizado
correctamente. La evidencia final también vincula la versión bloqueada de ClawHub, el
SHA-256 del bloqueo y la integridad de npm. Una discrepancia requiere una nueva versión del paquete.

## Entradas del flujo de trabajo de NPM

`OpenClaw NPM Release` acepta estas entradas controladas por el operador:

- `tag`: etiqueta de versión obligatoria, como `v2026.4.2`, `v2026.4.2-1`, `v2026.4.2-beta.1` o `v2026.4.2-alpha.1`; cuando `preflight_only=true`, también puede ser el SHA completo de 40 caracteres del commit actual de la rama del flujo de trabajo para una comprobación previa solo de validación
- `preflight_only`: `true` solo para validación/compilación/empaquetado, `false` para la ruta de publicación real
- `preflight_run_id`: id de una ejecución previa correcta, obligatorio en la ruta de publicación real para que el flujo de trabajo reutilice el tarball preparado en lugar de volver a compilarlo
- `full_release_validation_run_id`: id de una ejecución correcta de `Full Release Validation` para esta etiqueta/SHA, obligatorio para una publicación real. Las publicaciones beta pueden continuar solo con la comprobación previa y una advertencia, pero la promoción estable/`latest` sigue requiriéndolo.
- `full_release_validation_run_attempt`: intento de ejecución positivo exacto asociado con `full_release_validation_run_id`; obligatorio siempre que se proporcione el id de ejecución para que las repeticiones no puedan cambiar la evidencia de autorización durante la publicación.
- `release_publish_run_id`: id de ejecución aprobado de `OpenClaw Release Publish`; obligatorio cuando este flujo de trabajo es despachado por ese superior (llamadas de publicación real efectuadas por un actor bot)
- `plugin_npm_run_id`: id de ejecución correcta de `Plugin NPM Release` en el encabezado exacto; obligatorio para una publicación real del núcleo `extended-stable`
- `npm_dist_tag`: etiqueta de destino de npm para la ruta de publicación; acepta `alpha`, `beta`, `latest` o `extended-stable` y el valor predeterminado es `beta`. El parche final `33` y los posteriores deben utilizar `extended-stable`; de forma predeterminada, `extended-stable` rechaza parches anteriores y siempre rechaza etiquetas no finales.
- `bypass_extended_stable_guard`: booleano solo para pruebas, valor predeterminado `false`; con `npm_dist_tag=extended-stable`, omite la elegibilidad mensual de estabilidad extendida y conserva las comprobaciones de identidad de la versión, artefactos, aprobación y lectura posterior.

`Plugin NPM Release` acepta `npm_dist_tag=default` para el comportamiento de versiones
existente o `npm_dist_tag=extended-stable` para la ruta mensual protegida. La opción
de estabilidad extendida requiere `publish_scope=all-publishable`, una entrada
`plugins` vacía, un parche final igual o superior a `33` y la rama canónica
`extended-stable/YYYY.M.33` en su extremo exacto. Nunca mueve los plugins
`latest` ni `beta`. Las nuevas versiones de paquetes reciben `extended-stable` de forma atómica
mediante publicación de confianza con OIDC (`npm publish --tag extended-stable`); este
flujo de trabajo de origen no utiliza `npm dist-tag add` autenticado mediante token. Los reintentos
omiten las versiones exactas que ya existen en npm y, a continuación, se cierran de forma segura salvo que
una lectura posterior completa confirme que cada paquete exacto y etiqueta `extended-stable` convergieron.

`OpenClaw Release Publish` acepta estas entradas controladas por el operador:

- `tag`: etiqueta de versión obligatoria; ya debe existir
- `preflight_run_id`: id de una ejecución previa correcta de `OpenClaw NPM Release`; obligatorio cuando `publish_openclaw_npm=true` o `plugin_publish_scope=all-publishable`
- `full_release_validation_run_id`: id de una ejecución correcta de `Full Release Validation`; obligatorio cuando `publish_openclaw_npm=true` o `plugin_publish_scope=all-publishable`
- `full_release_validation_run_attempt`: intento positivo exacto asociado con `full_release_validation_run_id`; obligatorio siempre que se proporcione el id de ejecución
- `windows_node_tag`: etiqueta de versión exacta y no preliminar de `openclaw/openclaw-windows-node`; obligatoria para una publicación estable de OpenClaw
- `windows_node_installer_digests`: mapa JSON compacto aprobado para el candidato que relaciona los nombres actuales de los instaladores de Windows con sus digests `sha256:` fijados; obligatorio para una publicación estable de OpenClaw
- `npm_telegram_run_id`: id opcional de una ejecución correcta de `NPM Telegram Beta E2E` que se incluirá en la evidencia final de la versión
- `npm_dist_tag`: etiqueta de destino de npm para el paquete OpenClaw, una de `alpha`, `beta` o `latest`
- `plugin_publish_scope`: el valor predeterminado es `all-publishable`; utilice `selected` solo para trabajos específicos de reparación exclusiva de plugins con `publish_openclaw_npm=false`
- `plugins`: nombres de paquetes `@openclaw/*` separados por comas cuando `plugin_publish_scope=selected`
- `publish_openclaw_npm`: el valor predeterminado es `true`; establezca `false` solo cuando utilice el flujo de trabajo como orquestador de reparaciones exclusivas de plugins
- `release_profile`: perfil de cobertura de la versión utilizado para los resúmenes de evidencia de la versión; el valor predeterminado es `from-validation`, que lo lee del manifiesto de validación, o puede sustituirse por `beta`, `stable` o `full`
- `wait_for_clawhub`: el valor predeterminado es `false` para que la disponibilidad de npm no quede bloqueada por el componente auxiliar de ClawHub; establezca `true` solo cuando la finalización del flujo de trabajo deba incluir la finalización de ClawHub

`OpenClaw Release Checks` acepta estas entradas controladas por el operador:

- `ref`: rama, etiqueta o SHA completo del commit que se va a validar. Las comprobaciones que utilizan secretos requieren que el commit resuelto sea accesible desde una rama o etiqueta de versión de OpenClaw.
- `run_release_soak`: activa las pruebas exhaustivas en vivo/E2E, la ruta de lanzamiento de Docker y las pruebas prolongadas de supervivencia a actualizaciones desde todas las versiones para las comprobaciones de versiones beta. Se activa obligatoriamente mediante `release_profile=stable` y `release_profile=full`.

Reglas:

- Las versiones finales normales y de corrección inferiores al parche `33` pueden publicarse en `beta` o `latest`. Las versiones finales con el parche `33` o superior deben publicarse en `extended-stable`, y se rechazan las versiones con sufijo de corrección en ese límite.
- Las etiquetas de prelanzamiento beta solo pueden publicarse en `beta`; las etiquetas de prelanzamiento alfa solo pueden publicarse en `alpha`
- Para `OpenClaw NPM Release`, solo se permite introducir el SHA completo del commit cuando `preflight_only=true`
- `OpenClaw Release Checks` y `Full Release Validation` siempre son exclusivamente para validación
- La ruta de publicación real debe usar el mismo `npm_dist_tag` utilizado durante la comprobación previa; el flujo de trabajo verifica esos metadatos antes de continuar con la publicación

## Secuencia habitual de lanzamiento beta/estable más reciente

Esta secuencia heredada corresponde al lanzamiento orquestado habitual, que también gestiona plugins, GitHub Release, Windows y el trabajo en otras plataformas. No es la ruta mensual `.33+`, exclusiva de npm para versiones estables con soporte ampliado, documentada al principio de esta página.

Al preparar un lanzamiento estable orquestado habitual:

1. Ejecute `OpenClaw NPM Release` con `preflight_only=true`. Antes de que exista una etiqueta, puede usar el SHA completo del commit actual de la rama del flujo de trabajo para una ejecución de prueba de validación del flujo de trabajo de comprobación previa.
2. Elija `npm_dist_tag=beta` para el flujo normal que comienza con una beta, o `latest` únicamente cuando se quiera realizar deliberadamente una publicación estable directa.
3. Ejecute `Full Release Validation` en la rama de lanzamiento, la etiqueta de lanzamiento o el SHA completo del commit cuando se necesite la CI normal junto con cobertura en vivo de la caché de prompts, Docker, QA Lab, Matrix y Telegram desde un único flujo de trabajo manual. Si deliberadamente solo se necesita el grafo determinista de pruebas normales, ejecute en su lugar el flujo de trabajo manual `CI` en la referencia de lanzamiento.
4. Seleccione la etiqueta de lanzamiento exacta y sin indicador de prelanzamiento `openclaw/openclaw-windows-node` cuyos instaladores firmados x64 y ARM64 deban distribuirse. Guárdela como `windows_node_tag` y guarde el mapa de resúmenes validado de los instaladores como `windows_node_installer_digests`. El asistente de la versión candidata registra ambos valores y los incluye en el comando de publicación que genera.
5. Guarde los valores correctos de `preflight_run_id`, `full_release_validation_run_id` y el valor exacto de `full_release_validation_run_attempt`.
6. Ejecute `OpenClaw Release Publish` desde el entorno de confianza `main` con el mismo `tag`, el mismo `npm_dist_tag`, el `windows_node_tag` seleccionado, su `windows_node_installer_digests` guardado, el `preflight_run_id` guardado, `full_release_validation_run_id` y `full_release_validation_run_attempt`. Publica los plugins externalizados en npm y ClawHub antes de promocionar el paquete npm de OpenClaw.
7. Si el lanzamiento se publicó en `beta`, use el flujo de trabajo `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` para promocionar esa versión estable de `beta` a `latest`.
8. Si el lanzamiento se publicó deliberadamente de forma directa en `latest` y `beta` debe adoptar inmediatamente la misma compilación estable, use ese mismo flujo de trabajo de lanzamiento para que ambas etiquetas de distribución apunten a la versión estable, o permita que su sincronización autorreparable programada mueva `beta` más adelante.

La modificación de las etiquetas de distribución reside en el repositorio del registro de lanzamientos porque aún requiere `NPM_TOKEN`, mientras que el repositorio de código fuente mantiene la publicación exclusivamente mediante OIDC. Esto permite que tanto la ruta de publicación directa como la ruta de promoción que comienza con una beta estén documentadas y sean visibles para los operadores.

Si un responsable de mantenimiento debe recurrir a la autenticación local de npm, ejecute cualquier comando de la CLI de 1Password (`op`) únicamente dentro de una sesión de tmux dedicada. No invoque `op` directamente desde el shell principal del agente; mantenerlo dentro de tmux permite observar las solicitudes, las alertas y la gestión de contraseñas de un solo uso, además de evitar alertas reiteradas del sistema anfitrión.

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

Los responsables de mantenimiento usan la documentación privada de lanzamientos de [`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md) como manual operativo real.

## Contenido relacionado

- [Canales de lanzamiento](/es/install/development-channels)
