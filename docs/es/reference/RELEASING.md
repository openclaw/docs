---
read_when:
    - Buscando definiciones de canales de lanzamiento públicos
    - Ejecución de la validación de versiones o la aceptación de paquetes
    - Buscando la nomenclatura y la cadencia de las versiones
summary: Canales de lanzamiento, lista de verificación del operador, entornos de validación, nomenclatura de versiones y cadencia
title: Política de lanzamientos
x-i18n:
    generated_at: "2026-07-22T10:46:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 347bbdefeca44d652d7222f0d80724c675c540b8f4ea5527475e3c4e2e7b4c4b
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw expone actualmente tres canales de actualización orientados al usuario:

- stable: el canal existente de versiones promovidas, que todavía se resuelve mediante npm `latest` hasta que se complete el hito independiente de la CLI y los canales
- beta: etiquetas de versiones preliminares que se publican en npm `beta`
- dev: la cabecera móvil de `main`

Por separado, los operadores de versiones pueden publicar el paquete principal
del último mes completado en npm `extended-stable`, comenzando en el parche `33`. La línea
final regular del mes actual continúa en npm `latest`; esta separación de publicaciones
del lado del operador no cambia por sí misma la resolución de los canales de actualización de la CLI.

Las compilaciones alfa de Tideclaw constituyen una vía interna independiente de versiones preliminares (dist-tag de npm `alpha`), descrita en [Entradas del flujo de trabajo de NPM](#npm-workflow-inputs) y [Entornos de prueba de versiones](#release-test-boxes).

## Nomenclatura de versiones

- Versión mensual de la publicación estable extendida de npm: `YYYY.M.PATCH`, con `PATCH >= 33`, etiqueta de git `vYYYY.M.PATCH`
- Versión final diaria/regular: `YYYY.M.PATCH`, con `PATCH < 33`, etiqueta de git `vYYYY.M.PATCH`
- Versión regular de corrección alternativa: `YYYY.M.PATCH-N`, etiqueta de git `vYYYY.M.PATCH-N`
- Versión preliminar beta: `YYYY.M.PATCH-beta.N`, etiqueta de git `vYYYY.M.PATCH-beta.N`
- Versión preliminar alfa: `YYYY.M.PATCH-alpha.N`, etiqueta de git `vYYYY.M.PATCH-alpha.N`
- Nunca se deben rellenar con ceros el mes ni el parche
- `PATCH` es un número secuencial del ciclo mensual de versiones, no un día del calendario. Las versiones finales regulares y beta hacen avanzar el ciclo actual; las etiquetas exclusivamente alfa nunca consumen ni hacen avanzar el número de parche beta/regular, por lo que deben ignorarse las etiquetas heredadas exclusivamente alfa con números de parche superiores al seleccionar un ciclo beta o regular.
- Las compilaciones alfa/nocturnas usan el siguiente ciclo de parche no publicado e incrementan únicamente `alpha.N` para las compilaciones repetidas. Cuando ese parche ya tiene una beta, las nuevas compilaciones alfa pasan al parche siguiente.
- Las versiones de npm son inmutables: nunca se debe eliminar, volver a publicar ni reutilizar una etiqueta publicada. Se debe crear el siguiente número de versión preliminar o el siguiente parche mensual.
- `latest` continúa siguiendo la línea npm regular/diaria actual; `beta` es el destino actual de instalación de la beta
- `extended-stable` representa el paquete npm compatible del último mes, comenzando en el parche `33`; el parche `34` y los posteriores son versiones de mantenimiento de esa línea mensual
- Las versiones finales regulares y las correcciones regulares se publican de forma predeterminada en npm `beta`; los operadores de versiones pueden especificar explícitamente `latest` o promover posteriormente una compilación beta validada
- La ruta mensual dedicada de estabilidad extendida publica el paquete principal de npm y todos los plugins oficiales publicables en npm con exactamente la misma versión. No publica plugins en ClawHub ni artefactos de macOS o Windows, una versión de GitHub, dist-tags de repositorios privados, imágenes de Docker, artefactos móviles o descargas del sitio web.
- Cada versión final regular distribuye conjuntamente el paquete npm, la aplicación para macOS, el APK independiente firmado para Android y los instaladores firmados de Windows Hub. Las versiones beta normalmente validan y publican primero la ruta de npm/paquetes; la compilación, firma, notarización y promoción de aplicaciones nativas se reservan para la versión final regular, salvo que se soliciten explícitamente.

## Cadencia de versiones

- Las versiones avanzan primero por beta; stable solo llega después de validar la beta más reciente
- Normalmente, los mantenedores crean las versiones desde una rama `release/YYYY.M.PATCH` creada a partir de la versión actual de `main`, para que la validación y las correcciones de la versión no bloqueen el nuevo desarrollo en `main`
- Si se ha enviado o publicado una etiqueta beta y necesita una corrección, los mantenedores crean la siguiente etiqueta `-beta.N` en lugar de eliminar o volver a crear la anterior
- El procedimiento detallado de publicación, las aprobaciones, las credenciales y las notas de recuperación son exclusivos de los mantenedores

## Publicación mensual de estabilidad extendida solo en npm

Esta es una excepción específica al procedimiento regular de publicación descrito a continuación. Para un
mes completado `YYYY.M`, se crea `extended-stable/YYYY.M.33`; se publican
`vYYYY.M.33` y los parches de mantenimiento posteriores desde esa misma rama. La etiqueta de
versión, la punta de la rama, el checkout, la versión del paquete, la comprobación previa de npm y la ejecución de
la Validación completa de la versión deben identificar el mismo commit. La rama protegida `main` ya debe
contener la versión final de un mes natural estrictamente posterior por debajo del parche
`33`; los parches de mantenimiento siguen siendo aptos después de que `main` avance más de un
mes.

En la rama exacta de estabilidad extendida, se incrementa la versión del paquete raíz a `YYYY.M.P`, se ejecuta
`pnpm release:prep` y se verifica que todos los paquetes de plugins publicables tengan la
misma versión. Se confirman y envían todos los cambios generados y, a continuación, se congela y registra el
SHA completo resultante. Los flujos de trabajo consumen este árbol preparado; no incrementan
ni sincronizan las versiones automáticamente. No se debe crear la etiqueta final de un candidato.

Se ejecutan la comprobación previa de npm y la Validación completa de la versión con ese SHA congelado y, a continuación,
se guardan los dos identificadores de ejecución y el intento de ejecución correcto de la Validación completa de la versión:

```bash
RELEASE_SHA="$(git rev-parse HEAD)"

gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag="$RELEASE_SHA" \
  -f preflight_only=true \
  -f npm_dist_tag=extended-stable

node scripts/full-release-validation-at-sha.mjs \
  --sha "$RELEASE_SHA" \
  --target-ref extended-stable/YYYY.M.33
```

La forma SHA solo es compatible con la comprobación previa de npm destinada exclusivamente a la validación. El asistente
fija código de confianza del flujo de trabajo mientras registra el SHA exacto del producto y el contexto
canónico de la rama. Su perfil de validación estable es independiente del dist-tag
`extended-stable` de npm.

Si falla alguna de las puertas del candidato o se necesita otro backport, se actualiza la rama,
se congela un nuevo SHA y se vuelven a ejecutar las puertas afectadas del candidato. No se debe crear, eliminar
ni mover una etiqueta final durante la validación del candidato. Cuando ambas puertas estén en verde,
se vuelve a resolver la punta de la rama, se exige que siga siendo igual a `RELEASE_SHA` y, a continuación, se crea
y envía la etiqueta inmutable `vYYYY.M.P` en ese SHA. Un cambio del código fuente posterior a la etiqueta exige una
nueva versión de parche y un nuevo candidato; las etiquetas finales de estabilidad extendida nunca se mueven
ni se eliminan.

Cuando ambas ejecuciones finalicen correctamente, se publican todos los plugins oficiales publicables en npm desde la
misma punta exacta de la rama. El parche `P` debe ser `33` o superior. Se pasa el SHA completo de la versión
como `ref`, se espera a que finalicen la matriz completa y la relectura del registro y, a continuación, se guarda el
identificador de la ejecución correcta de Publicación de plugins en NPM:

```bash
RELEASE_SHA="$(git rev-parse HEAD)"
gh workflow run plugin-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f publish_scope=all-publishable \
  -f ref="$RELEASE_SHA" \
  -f npm_dist_tag=extended-stable
```

El flujo de trabajo utiliza el inventario regular preparado de paquetes `all-publishable`,
incluidos los paquetes cuyo código fuente no haya cambiado. Verifica cada paquete exacto
y cada etiqueta `extended-stable` de plugin antes de finalizar correctamente. Si una ejecución parcial
falla, se vuelve a ejecutar el mismo comando: se reutilizan los paquetes ya publicados, se concilian
las etiquetas de plugins ausentes u obsoletas en el entorno de publicación de npm y la
relectura final sigue abarcando el conjunto completo de paquetes.

Cuando el flujo de trabajo de plugins finalice correctamente y el entorno de publicación de npm esté listo,
se publica el tarball exacto de la comprobación previa del paquete principal. La publicación del paquete principal verifica que la
ejecución de plugins indicada sea `completed/success` en la misma rama canónica y con el
SHA exacto del código fuente:

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

Para un ensayo en una bifurcación o en un entorno no productivo que intencionadamente no pueda cumplir la
política mensual de `.33` o del mes de la rama protegida `main`, se añade
`-f bypass_extended_stable_guard=true` tanto a la comprobación previa de npm como a los
despachos de publicación. El valor predeterminado es `false`. La omisión solo se acepta con
`npm_dist_tag=extended-stable` y queda registrada en el resumen del flujo de trabajo. No
omite la referencia canónica del flujo de trabajo `extended-stable/YYYY.M.33`,
la igualdad entre la punta de la rama, la etiqueta y el checkout, la sintaxis de la etiqueta final, la igualdad
entre las versiones del paquete y la etiqueta, la identidad de las ejecuciones y el manifiesto indicados, la procedencia del tarball,
la aprobación del entorno, la relectura del registro ni las pruebas de reparación de selectores.

El flujo de trabajo de publicación verifica las identidades de las ejecuciones indicadas de comprobación previa, validación y plugins,
el resumen criptográfico del tarball preparado y los selectores del registro del paquete principal.
Se confirma el resultado de forma independiente después de que el flujo de trabajo finalice correctamente:

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

Ambos comandos deben devolver `YYYY.M.P`. Si la publicación finaliza correctamente, pero falla la
relectura de los selectores, no se debe volver a publicar la versión inmutable del paquete. Se utiliza el
único comando de reparación `npm dist-tag add openclaw@YYYY.M.P extended-stable`
impreso en el resumen de ejecución permanente del flujo de trabajo fallido y, a continuación, se repiten ambas
relecturas independientes. La reversión al selector anterior es una decisión independiente del operador,
no la ruta de reparación de la relectura.

Inicialmente, la documentación pública de soporte designa Slack, Discord y Codex como
superficies de plugins cubiertas por la estabilidad extendida. Esa lista es una declaración de soporte, no
una lista de permitidos del código de publicación: todos los plugins oficiales publicables en npm siguen la
misma ruta de publicación con la versión exacta.

La lista de comprobación regular que aparece a continuación sigue rigiendo la publicación de versiones beta, `latest`, versiones de GitHub,
plugins, macOS, Windows y otras plataformas. No se deben ejecutar esos
pasos para esta ruta de estabilidad extendida exclusiva de npm.

## Lista de comprobación regular para operadores de versiones

Esta lista de comprobación constituye la estructura pública del flujo de publicación. Las credenciales privadas, la firma, la notarización, la recuperación de dist-tags y los detalles de reversión de emergencia permanecen en el manual de publicación exclusivo para mantenedores.

1. Comience desde la versión actual de `main`: obtenga la versión más reciente, confirme que el commit de destino se haya enviado y confirme que la CI de `main` esté lo suficientemente en verde como para crear una rama a partir de ella.
2. Cree `release/YYYY.M.PATCH` a partir de ese commit. Los backports son opcionales; aplique únicamente el conjunto seleccionado por el operador. Incremente la versión en todas las ubicaciones requeridas, ejecute `pnpm release:prep`, complete las correcciones de la versión y los forward-ports requeridos, y revise `src/plugins/compat/registry.ts` junto con `src/commands/doctor/shared/deprecation-compat.ts`.
3. Congele el commit anterior al registro de cambios que contiene el producto completo como **Code SHA**. Ejecute la comprobación preliminar determinista del código fuente y, a continuación, use `node scripts/full-release-validation-at-sha.mjs --sha <code-sha> --target-ref release/YYYY.M.PATCH`. Esto fija las herramientas de confianza del flujo de trabajo mientras la matriz completa de Vitest, Docker, QA, paquetes y rendimiento se ejecuta sobre el Code SHA exacto.
4. Clasifique los fallos antes de editar. Un fallo del producto o del código genera un nuevo Code SHA y requiere una validación completa en verde para ese SHA. Un fallo del flujo de trabajo, del arnés, de las credenciales, de la aprobación o de la infraestructura se corrige en la superficie que lo posee y se vuelve a ejecutar sobre el mismo Code SHA.
5. Solo cuando el Code SHA esté en verde, genere la sección superior de `CHANGELOG.md` a partir de los pull requests fusionados y los commits directos desde la última etiqueta publicada alcanzable. Mantenga las entradas orientadas al usuario y sin duplicados. Cuando una etiqueta publicada divergente o un forward-port posterior vuelva a asociar pull requests ya publicados, pásela explícitamente como `--shipped-ref`.
6. Confirme únicamente `CHANGELOG.md`. Este commit es el **Release SHA**. El diff completo entre el Code SHA y el Release SHA debe ser exactamente `CHANGELOG.md`; cualquier otra ruta modificada devuelve la publicación al paso 2.
7. Ejecute la validación completa de la publicación fijada por SHA para el Release SHA con la reutilización de pruebas habilitada. El proceso principal ligero debe registrar `changelog-only-release-v1`, apuntar al Code SHA en verde y no despachar ningún flujo secundario del producto. Esto reutiliza las pruebas del producto, pero no reutiliza los bytes del paquete.
8. Ejecute `OpenClaw NPM Release` con `preflight_only=true` sobre el Release SHA o la etiqueta. Guarde el `preflight_run_id` correcto. Esto compila y comprueba los bytes exactos del paquete que incluyen el registro de cambios final.
9. Etiquete el Release SHA y, a continuación, ejecute el asistente de candidatos con el proceso principal de validación correcto del Release SHA y la comprobación preliminar de npm, en lugar de volver a despachar cualquiera de ellos:

   ```bash
   pnpm release:candidate -- \
     --tag vYYYY.M.PATCH-beta.N \
     --full-release-run <release-sha-validation-run-id> \
     --npm-preflight-run <preflight-run-id> \
     --skip-dispatch
   ```

   Para una publicación estable, pase también `--windows-node-tag vX.Y.Z`. El asistente verifica la procedencia de las notas de la versión, los bytes de la comprobación preliminar de npm, las pruebas de instalación y actualización de Parallels, las pruebas del paquete de Telegram y los planes de publicación de los plugins; después, muestra el comando de publicación.

   `OpenClaw Release Publish` despacha en paralelo los paquetes de plugins seleccionados o todos los publicables tanto a npm como a ClawHub y, una vez que la publicación de los plugins en npm se completa correctamente, promociona el artefacto preparado de la comprobación preliminar de npm de OpenClaw con la etiqueta de distribución correspondiente. El checkout de la publicación sigue siendo la raíz del producto y de los datos, mientras que la planificación y la verificación final se ejecutan desde el checkout exacto y de confianza del código fuente del flujo de trabajo, para que un commit de publicación anterior no pueda usar silenciosamente herramientas de publicación obsoletas. Antes de que se inicie cualquier flujo secundario de publicación, representa y almacena en caché el cuerpo exacto de la publicación de GitHub. Cuando la sección completa correspondiente de `CHANGELOG.md` cabe dentro del límite de 125,000 caracteres de GitHub y del límite de seguridad correspondiente de 125,000 bytes del representador, la página contiene esa sección exacta de `## YYYY.M.PATCH`, incluido su encabezado. Cuando la sección de origen no cabe, la página conserva las notas editoriales agrupadas exactas y sustituye el registro de contribuciones de tamaño excesivo por un enlace estable al registro completo del `CHANGELOG.md` fijado a la etiqueta; nunca se publican registros parciales ni viñetas truncadas. El flujo de trabajo elige ese cuerpo completo o compacto antes de añadir `### Release verification`; si el final de las pruebas superara el límite, conserva el cuerpo canónico y utiliza en su lugar las pruebas inmutables adjuntas. Las publicaciones estables publicadas en npm `latest` se convierten en la publicación más reciente de GitHub, mientras que las publicaciones estables de mantenimiento conservadas en npm `beta` se crean con `latest=false` de GitHub. El flujo de trabajo también carga en la publicación de GitHub las pruebas de dependencias de la comprobación preliminar, el manifiesto de la validación completa y las pruebas de verificación del registro posteriores a la publicación para responder a incidentes posteriores a la publicación. Muestra inmediatamente los identificadores de los procesos secundarios, aprueba automáticamente las puertas del entorno de publicación que el token del flujo de trabajo puede aprobar, resume los trabajos secundarios fallidos con los finales de sus registros, crea por adelantado la página de publicación de GitHub como borrador y promociona los recursos de Windows y Android simultáneamente con la publicación de OpenClaw en npm, completa la página de publicación y las pruebas de dependencias cuando esas etapas finalizan correctamente, espera a ClawHub siempre que se publique OpenClaw en npm y, a continuación, ejecuta el verificador beta de la rama principal de confianza y carga las pruebas posteriores a la publicación correspondientes a la publicación de GitHub, el paquete de npm, los paquetes de plugins de npm seleccionados, los paquetes de ClawHub seleccionados, los identificadores de los procesos secundarios del flujo de trabajo y el identificador opcional del proceso de Telegram en NPM. El verificador de arranque de ClawHub requiere la ruta y el SHA exactos del flujo de trabajo de la rama principal de confianza, los intentos de ejecución del productor y del proceso terminal, el Release SHA, el conjunto de paquetes solicitado, la tupla inmutable del artefacto del paquete y el artefacto terminal de lectura del registro; no se acepta una ejecución correcta heredada de la referencia de publicación.

   A continuación, ejecute la aceptación del paquete posterior a la publicación sobre el paquete `openclaw@YYYY.M.PATCH-beta.N` o `openclaw@beta` publicado. Si una versión preliminar enviada o publicada necesita una corrección, cree el siguiente número de versión preliminar correspondiente; nunca elimine ni reescriba el anterior.

10. Tras un intento de publicación fallido, mantenga el Release SHA sin cambios, salvo que el fallo demuestre un defecto del producto o del registro de cambios. Reanude los procesos secundarios y artefactos inmutables que se hayan completado correctamente; nunca vuelva a compilar ni publicar una versión de paquete que ya se haya completado correctamente.
11. Para una publicación estable, continúe únicamente cuando la beta o la versión candidata aprobada disponga de las pruebas de validación requeridas. La publicación estable en npm también pasa por `OpenClaw Release Publish`, reutilizando el artefacto correcto de la comprobación preliminar mediante `preflight_run_id`. La preparación de la publicación estable para macOS también requiere los elementos empaquetados `.zip`, `.dmg`, `.dSYM.zip` y el `appcast.xml` actualizado en `main`; el flujo de trabajo de publicación de macOS publica automáticamente el appcast firmado en el `main` público después de verificar los recursos de la publicación, o abre o actualiza un pull request del appcast si la protección de la rama bloquea el envío directo. La preparación estable de Windows Hub requiere los recursos firmados `OpenClawCompanion-Setup-x64.exe`, `OpenClawCompanion-Setup-arm64.exe` y `OpenClawCompanion-SHA256SUMS.txt` en la publicación de GitHub de OpenClaw. Pase la etiqueta exacta de la publicación firmada `openclaw/openclaw-windows-node` como `windows_node_tag` y su mapa de resúmenes de instaladores aprobado por el candidato como `windows_node_installer_digests`; `OpenClaw Release Publish` conserva el borrador de la publicación, despacha `Windows Node Release` y verifica los tres recursos antes de la publicación.
12. Después de publicar, ejecute el verificador posterior a la publicación de npm, la prueba E2E independiente y opcional de Telegram sobre el npm publicado cuando se requieran pruebas del canal posteriores a la publicación, la promoción de la etiqueta de distribución cuando sea necesaria, verifique la página generada de la publicación de GitHub, ejecute los pasos del anuncio de la publicación y, a continuación, complete el [cierre estable de la rama principal](#stable-main-closeout) antes de considerar finalizada una publicación estable.

## Cierre estable de la rama principal

La publicación estable no está completa hasta que `main` contenga el estado real de la versión publicada.

1. Comience desde la versión más reciente y actualizada de `main`. Audite `release/YYYY.M.PATCH` comparándolo con ella y aplique mediante forward-port las correcciones reales que falten en `main`. No fusione a ciegas en la versión más reciente de `main` los adaptadores de compatibilidad, pruebas o validación exclusivos de la publicación.
2. Para la ruta normal, establezca `main` en la versión estable publicada. Un cierre tardío puede usar `main` después de que haya avanzado a una versión CalVer estable posterior de OpenClaw; no reduzca la versión de un ciclo de publicación ya iniciado únicamente para cerrar la publicación anterior. El validador sigue requiriendo la sección exacta del registro de cambios publicado y la entrada del appcast, y registra la versión y el SHA reales de `main`. Ejecute `pnpm release:prep` después de cualquier cambio de la versión raíz y, a continuación, `pnpm deps:shrinkwrap:generate`.
3. Haga que la sección `## YYYY.M.PATCH` de `CHANGELOG.md` en `main` coincida exactamente con la rama de publicación etiquetada. Incluya la actualización estable de `appcast.xml` cuando la publicación de macOS haya publicado una.
4. No añada `YYYY.M.PATCH+1`, una versión beta ni una sección vacía del registro de cambios futuro a `main` hasta que el operador inicie explícitamente ese ciclo de publicación.
5. Ejecute `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check` y `OPENCLAW_TESTBOX=1 pnpm check:changed`. Envíe los cambios y, a continuación, verifique que `origin/main` contenga la versión publicada y el registro de cambios antes de considerar terminada la publicación estable.
6. Mantenga actualizadas las variables del repositorio `RELEASE_ROLLBACK_DRILL_ID` y `RELEASE_ROLLBACK_DRILL_DATE` después de cada simulacro privado de reversión.

`OpenClaw Stable Main Closeout` comienza a partir del envío de `main` que contiene la versión publicada, el registro de cambios y el appcast después de la publicación estable. Lee las pruebas inmutables posteriores a la publicación para vincular la etiqueta publicada con sus procesos de validación completa de la publicación y de publicación; a continuación, verifica el estado estable de la rama principal, la publicación, el periodo de observación estable obligatorio y las pruebas de rendimiento bloqueantes. Adjunta a la publicación de GitHub un manifiesto de cierre inmutable y su suma de comprobación. El desencadenador automático por envío omite las publicaciones heredadas anteriores a las pruebas inmutables posteriores a la publicación y nunca considera esa omisión como un cierre completado.

Un cierre completo requiere tanto los recursos como una suma de comprobación coincidente. Un manifiesto parcial reproduce el SHA de `main` y el simulacro de reversión registrados para regenerar bytes idénticos y, a continuación, adjunta la suma de comprobación que falta; un par no válido, o una suma de comprobación sin manifiesto, sigue siendo bloqueante. Una ejecución desencadenada por un envío sin variables del repositorio para el simulacro de reversión se omite sin completar el cierre; la ausencia de un registro del simulacro, o uno con más de 90 días de antigüedad, sigue bloqueando el cierre manual respaldado por pruebas. Los comandos privados de recuperación permanecen en el manual exclusivo para responsables de mantenimiento. Use el despacho manual únicamente para reparar o reproducir un cierre estable respaldado por pruebas.

Si el proceso principal de publicación falló únicamente después de adjuntar las pruebas inmutables de npm o de los plugins, repare y publique primero todos los recursos de las plataformas estables. A continuación, un responsable de mantenimiento puede despachar manualmente el cierre con `allow_failed_publish_recovery=true`; este modo solo acepta un proceso principal fallido y completado, y además requiere los contratos exactos de los recursos de Android y Windows, los resúmenes SHA-256 de GitHub, la verificación de las sumas de comprobación, la procedencia de Android y una promoción correcta de Windows despachada por el proceso principal cuyas comprobaciones de Authenticode y resúmenes aprobados por el candidato coincidan con los instaladores publicados, junto con las comprobaciones habituales de macOS y del appcast. El cierre automático por envío nunca habilita este modo de recuperación.

Una etiqueta heredada de corrección alternativa solo puede reutilizar las pruebas del paquete base cuando la etiqueta de corrección se resuelva al mismo commit de origen que la etiqueta estable base. Su publicación de Android reutiliza el APK verificado de la etiqueta base y añade la procedencia de la etiqueta de corrección. Una corrección con un origen diferente debe publicar y verificar sus propias pruebas del paquete y usar un `versionCode` de Android más alto.

## Comprobación preliminar de la publicación

- Ejecute `pnpm check:test-types` antes de la comprobación previa al lanzamiento para que el TypeScript de las pruebas siga cubierto fuera de la puerta local más rápida `pnpm check`.
- Ejecute `pnpm check:architecture` antes de la comprobación previa al lanzamiento para que las comprobaciones más amplias de ciclos de importación y límites de arquitectura estén correctas fuera de la puerta local más rápida.
- Ejecute `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que los artefactos de lanzamiento `dist/*` esperados y el paquete de Control UI existan para el paso de validación del empaquetado.
- Ejecute `pnpm release:prep` después de incrementar la versión raíz y antes de crear la etiqueta. Ejecuta todos los generadores deterministas de lanzamiento que suelen quedar desactualizados tras un cambio de versión, configuración o API: versiones de plugins, shrinkwraps de npm, inventario de plugins, esquema de configuración base, metadatos de configuración de canales incluidos, referencia de configuración de la documentación, exportaciones del SDK de plugins, manifiesto del contrato de API del SDK de plugins y paquetes de configuración regional de Control UI. También bloquea hasta que las traducciones de las aplicaciones nativas y los recursos de configuración regional generados por la plataforma coincidan con el inventario de origen; si están atrasados, espere a `Native App Locale Refresh` o ejecútelo antes de fijar el SHA del código. `pnpm release:check` vuelve a ejecutar esas protecciones en modo de comprobación (incluidas las puertas estrictas de configuración regional y el presupuesto de superficie del SDK de plugins) e informa de todos los fallos de desajuste generado en una sola pasada antes de ejecutar las comprobaciones de lanzamiento de paquetes.
- La sincronización de versiones de plugins actualiza de forma predeterminada el paquete de tiempo de ejecución publicable `@openclaw/ai`, las versiones de los paquetes de plugins oficiales y los mínimos existentes de `openclaw.compat.pluginApi` a la versión de lanzamiento de OpenClaw. Trate ese campo como la versión mínima de la API del SDK o del tiempo de ejecución del plugin, no solo como una copia de la versión del paquete: para lanzamientos exclusivos de plugins que mantengan intencionadamente la compatibilidad con hosts de OpenClaw anteriores, conserve como mínimo la API de host compatible más antigua y documente esa decisión en la evidencia del lanzamiento del plugin.
- Ejecute manualmente el flujo de trabajo `Full Release Validation` antes de aprobar el lanzamiento para iniciar todos los entornos de pruebas previas al lanzamiento desde un único punto de entrada. Acepta una rama, etiqueta o SHA de confirmación completo, ejecuta manualmente `CI` y ejecuta `OpenClaw Release Checks` para las vías de comprobación rápida de instalación, aceptación de paquetes, comprobaciones de paquetes entre sistemas operativos, paridad de QA Lab, Matrix y Telegram. Las ejecuciones estables y completas siempre incluyen pruebas exhaustivas en vivo/E2E y de resistencia de la ruta de lanzamiento de Docker; `run_release_soak=true` se conserva para una prueba de resistencia beta explícita. Package Acceptance proporciona la prueba E2E canónica de Telegram para el paquete durante la validación del candidato, lo que evita un segundo sondeador en vivo simultáneo.

  Proporcione `release_package_spec` después de publicar una beta para reutilizar el paquete npm distribuido en las comprobaciones de lanzamiento, Package Acceptance y las pruebas E2E de Telegram del paquete sin volver a compilar el tarball de lanzamiento. Proporcione `npm_telegram_package_spec` solo cuando Telegram deba utilizar un paquete publicado distinto del resto de la validación del lanzamiento. Proporcione `package_acceptance_package_spec` cuando Package Acceptance deba utilizar un paquete publicado distinto de la especificación del paquete de lanzamiento. Proporcione `evidence_package_spec` cuando el informe de evidencias del lanzamiento deba demostrar que la validación coincide con un paquete npm publicado sin forzar las pruebas E2E de Telegram.

  ```bash
  node scripts/full-release-validation-at-sha.mjs \
    --sha <code-sha> \
    --target-ref release/YYYY.M.PATCH
  ```

- Ejecute manualmente el flujo de trabajo `Package Acceptance` cuando desee obtener evidencia por un canal secundario para un paquete candidato mientras continúa el trabajo de lanzamiento. Utilice `source=npm` para `openclaw@beta`, `openclaw@latest` o una versión de lanzamiento exacta; `source=ref` para empaquetar una rama, etiqueta o SHA de confianza de `package_ref` con el arnés actual `workflow_ref`; `source=url` para un tarball HTTPS público con un SHA-256 obligatorio y una política estricta de URL públicas; `source=trusted-url` para una política de origen de confianza con nombre que utilice obligatoriamente `trusted_source_id` y SHA-256; o `source=artifact` para un tarball cargado por otra ejecución de GitHub Actions.

  El flujo de trabajo resuelve el candidato como `package-under-test`, reutiliza el planificador de lanzamientos E2E de Docker con ese tarball y puede ejecutar el control de calidad de Telegram con el mismo tarball mediante `telegram_mode=mock-openai` o `telegram_mode=live-frontier`. Cuando las vías de Docker seleccionadas incluyen `published-upgrade-survivor`, el artefacto del paquete es el candidato y `published_upgrade_survivor_baseline` selecciona la referencia publicada. `update-restart-auth` utiliza el paquete candidato tanto como CLI instalada como paquete sometido a prueba, por lo que ejercita la ruta de reinicio administrado del comando de actualización del candidato.

  Ejemplo:

  ```bash
  gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai
  ```

  Perfiles habituales:
  - `smoke`: vías de instalación/canal/agente, red del Gateway y recarga de configuración
  - `package`: vías nativas de artefactos para paquetes/actualizaciones/reinicios/plugins sin OpenWebUI ni ClawHub en vivo
  - `product`: perfil de paquete más canales MCP, limpieza de cron/subagentes, búsqueda web de OpenAI y OpenWebUI
  - `full`: segmentos de la ruta de lanzamiento de Docker con OpenWebUI
  - `custom`: selección exacta de `docker_lanes` para una repetición específica

- Ejecute manualmente y de forma directa el flujo de trabajo `CI` cuando solo necesite una cobertura determinista de CI normal para el candidato de lanzamiento. Las ejecuciones manuales de CI omiten la delimitación por cambios y fuerzan los segmentos de Linux con Node, los segmentos de plugins incluidos, los segmentos de contratos de plugins y canales, la compatibilidad con Node 22, `check-*`, `check-additional-*`, las comprobaciones rápidas de artefactos compilados, las comprobaciones de documentación, las Skills de Python y las vías de Windows, macOS e internacionalización de Control UI. Las ejecuciones manuales independientes de CI solo ejecutan Android cuando se inician con `include_android=true`; `Full Release Validation` pasa esa entrada a su ejecución secundaria de CI.

  ```bash
  gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true
  ```

- Ejecute `pnpm qa:otel:smoke` al validar la telemetría del lanzamiento. Ejercita QA Lab mediante un receptor OTLP/HTTP local y verifica la exportación de trazas, métricas y registros, además de los atributos de traza limitados y la ocultación de contenido e identificadores, sin requerir Opik, Langfuse ni otro recopilador externo.
- Ejecute `pnpm qa:otel:collector-smoke` al validar la compatibilidad con recopiladores. Enruta la misma exportación OTLP de QA Lab mediante un contenedor Docker real de OpenTelemetry Collector antes de las aserciones del receptor local.
- Ejecute `pnpm qa:prometheus:smoke` al validar la extracción protegida de Prometheus. Ejercita QA Lab, rechaza las extracciones no autenticadas y verifica que las familias de métricas críticas para el lanzamiento no contengan contenido de prompts, identificadores sin procesar, tokens de autenticación ni rutas locales.
- Ejecute `pnpm qa:observability:smoke` para ejecutar consecutivamente las vías de comprobación rápida de OpenTelemetry y Prometheus desde el repositorio de código fuente.
- Ejecute `pnpm release:check` antes de cada lanzamiento etiquetado.
- La comprobación previa `OpenClaw NPM Release` genera evidencias de lanzamiento de dependencias antes de empaquetar el tarball de npm. La puerta de vulnerabilidades de avisos de npm bloquea el lanzamiento. Los informes de riesgo del manifiesto transitivo, de propiedad/superficie de instalación de dependencias y de cambios de dependencias sirven únicamente como evidencia del lanzamiento. El informe de cambios de dependencias compara el candidato de lanzamiento con la etiqueta de lanzamiento anterior accesible. La comprobación previa carga las evidencias de dependencias como `openclaw-release-dependency-evidence-<tag>` y también las incorpora en `dependency-evidence/` dentro del artefacto preparado de comprobación previa de npm. La ruta de publicación real reutiliza ese artefacto de comprobación previa y después adjunta las mismas evidencias al lanzamiento de GitHub como `openclaw-<version>-dependency-evidence.zip`.
- Ejecute `OpenClaw Release Publish` para la secuencia de publicación con modificaciones después de que exista la etiqueta. Ejecute las publicaciones beta y estables habituales desde `main` de confianza; la etiqueta de lanzamiento sigue seleccionando la confirmación de destino exacta y puede apuntar a `release/YYYY.M.PATCH`. Las publicaciones alfa de Tideclaw permanecen en su rama alfa correspondiente. Proporcione el `preflight_run_id` de npm correcto de OpenClaw, el `full_release_validation_run_id` correcto y el `full_release_validation_run_attempt` exacto, y mantenga el ámbito predeterminado de publicación de plugins `all-publishable` salvo que ejecute deliberadamente una reparación específica. El flujo de trabajo serializa la publicación de plugins en npm, la publicación de plugins en ClawHub y la publicación de OpenClaw en npm para que el paquete central no se publique antes que sus plugins externalizados; la promoción de Windows y Android se ejecuta simultáneamente con la publicación del paquete central en npm sobre la página de lanzamiento en borrador. Las repeticiones de publicación pueden reanudarse: si ya se ha publicado una versión central en npm, se omite la ejecución del paquete central después de que el flujo de trabajo demuestre que el tarball del registro coincide con el artefacto de comprobación previa de la etiqueta; además, la promoción de Windows/Android se omite cuando el lanzamiento ya contiene el contrato de artefactos verificado, por lo que un nuevo intento solo repite las etapas fallidas. Las reparaciones específicas exclusivas de plugins requieren `plugin_publish_scope=selected` y una lista de plugins no vacía. Las ejecuciones `all-publishable` exclusivas de plugins requieren evidencias completas e inmutables de la comprobación previa y de Full Release Validation; se rechazan las evidencias parciales.
- La versión estable `OpenClaw Release Publish` requiere un `windows_node_tag` exacto después de que exista el lanzamiento `openclaw/openclaw-windows-node` correspondiente que no sea preliminar, además del mapa `windows_node_installer_digests` aprobado para el candidato. Antes de ejecutar cualquier publicación secundaria, verifica que ese lanzamiento de origen esté publicado, no sea preliminar, contenga los instaladores x64/ARM64 requeridos y siga coincidiendo con el mapa aprobado. A continuación ejecuta `Windows Node Release` mientras el lanzamiento de OpenClaw todavía es un borrador y transmite sin cambios el mapa fijado de resúmenes de los instaladores. El flujo de trabajo secundario descarga desde esa etiqueta exacta los instaladores firmados de Windows Hub, los compara con los resúmenes fijados, verifica en un ejecutor de Windows que sus firmas Authenticode utilicen el firmante esperado de OpenClaw Foundation, escribe un manifiesto SHA-256 y carga los instaladores y el manifiesto en el lanzamiento canónico de OpenClaw en GitHub; después vuelve a descargar los artefactos promocionados y verifica su pertenencia al manifiesto y sus hashes. El flujo de trabajo principal verifica el contrato actual de artefactos x64, ARM64 y de suma de comprobación antes de la publicación. La recuperación directa rechaza nombres de artefactos `OpenClawCompanion-*` inesperados antes de sustituir los artefactos esperados del contrato por los bytes fijados del origen.

  Ejecute manualmente `Windows Node Release` solo para la recuperación y proporcione siempre una etiqueta exacta, nunca `latest`, además del mapa JSON explícito `expected_installer_digests` del lanzamiento de origen aprobado. Los enlaces de descarga del sitio web deben apuntar a las URL exactas de los artefactos del lanzamiento de OpenClaw para la versión estable actual, o a `releases/latest/download/...` solo después de verificar que la redirección a la versión más reciente de GitHub apunte a ese mismo lanzamiento; no enlace únicamente a la página de lanzamiento del repositorio complementario.

- Las comprobaciones de lanzamiento ahora se ejecutan en un flujo de trabajo manual independiente: `OpenClaw Release Checks`. También ejecuta la vía de paridad simulada de QA Lab, además del perfil de lanzamiento de Matrix y la vía de QA de Telegram antes de aprobar el lanzamiento. Las vías en vivo usan el entorno `qa-live-shared`; Telegram también usa concesiones de credenciales de CI de Convex. Ejecute el flujo de trabajo manual `QA-Lab - All Lanes` con `matrix_profile=all` cuando quiera ejecutar todos los escenarios de Matrix mantenidos; el flujo de trabajo distribuye esa selección entre los perfiles de transporte, medios y E2EE para mantener la prueba completa dentro de los tiempos de espera de cada trabajo.
- La validación del entorno de ejecución de instalación y actualización entre sistemas operativos forma parte de los flujos públicos `OpenClaw Release Checks` y `Full Release Validation`, que llaman directamente al flujo de trabajo reutilizable `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`. Esta separación es intencional: mantiene la ruta real de lanzamiento en npm breve, determinista y centrada en los artefactos, mientras que las comprobaciones en vivo más lentas permanecen en su propia vía para que no retrasen ni bloqueen la publicación.
- Las comprobaciones de lanzamiento que contienen secretos deben iniciarse mediante `Full Release Validation` o desde la referencia del flujo de trabajo `main`/release para mantener bajo control la lógica del flujo de trabajo y los secretos.
- `OpenClaw Release Checks` acepta una rama, una etiqueta o un SHA de commit completo, siempre que el commit resuelto sea accesible desde una rama o etiqueta de lanzamiento de OpenClaw.
- La comprobación previa de solo validación `OpenClaw NPM Release` también acepta el SHA de commit completo actual de 40 caracteres de la rama del flujo de trabajo sin requerir una etiqueta enviada. Esa ruta de SHA es solo para validación y no puede promoverse a una publicación real. En el modo SHA, el flujo de trabajo sintetiza `v<package.json version>` únicamente para la comprobación de metadatos del paquete; una publicación real sigue requiriendo una etiqueta de lanzamiento real.
- Ambos flujos de trabajo mantienen la ruta real de publicación y promoción en ejecutores alojados en GitHub, mientras que la ruta de validación que no realiza modificaciones puede usar los ejecutores Linux más grandes de Blacksmith.
- Ese flujo de trabajo ejecuta `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` usando los secretos de flujo de trabajo `OPENAI_API_KEY` y `ANTHROPIC_API_KEY`.
- La comprobación previa del lanzamiento en npm ya no espera a la vía independiente de comprobaciones de lanzamiento.
- Antes de etiquetar localmente una versión candidata, ejecute `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`. El asistente ejecuta las protecciones rápidas del lanzamiento, las comprobaciones de lanzamiento de plugins en npm/ClawHub, la compilación, la compilación de la interfaz de usuario y `release:openclaw:npm:check`, en el orden que permite detectar los errores habituales que bloquean la aprobación antes de que se inicie el flujo de trabajo de publicación de GitHub.
- Ejecute `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts` (o la etiqueta correspondiente de prelanzamiento/corrección) antes de la aprobación.
- Después de publicar en npm, ejecute `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH` (o la versión beta/de corrección correspondiente) para verificar la ruta de instalación desde el registro publicado en un prefijo temporal nuevo.
- Después de publicar una beta, ejecute `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` para verificar la incorporación del paquete instalado, la configuración de Telegram y la E2E real de Telegram con el paquete de npm publicado usando el conjunto compartido de credenciales de Telegram concedidas. Para ejecuciones puntuales locales, los mantenedores pueden omitir las variables de Convex y proporcionar directamente las tres credenciales de entorno `OPENCLAW_QA_TELEGRAM_*`.
- Para ejecutar la prueba de humo beta completa posterior a la publicación desde el equipo de un mantenedor, use `pnpm release:beta-smoke -- --beta betaN`. El asistente ejecuta la validación de actualización de npm y de destino nuevo en Parallels, inicia `NPM Telegram Beta E2E`, consulta la ejecución exacta del flujo de trabajo, descarga el artefacto e imprime el informe de Telegram.
- Los mantenedores pueden ejecutar la misma comprobación posterior a la publicación desde GitHub Actions mediante el flujo de trabajo manual `NPM Telegram Beta E2E`. Es intencionalmente solo manual y no se ejecuta con cada fusión.
- La automatización de lanzamientos para mantenedores usa primero la comprobación previa y después la promoción:
  - La publicación real en npm debe superar correctamente una `preflight_run_id` de npm.
  - La orquestación y la comprobación previa de publicaciones beta y estables habituales usan `main` de confianza con la etiqueta de destino exacta. La publicación y comprobación previa alfa de Tideclaw usan la rama alfa correspondiente.
  - Los lanzamientos estables de npm usan `beta` de forma predeterminada; la publicación estable en npm puede dirigirse explícitamente a `latest` mediante una entrada del flujo de trabajo.
  - La modificación de etiquetas de distribución de npm basada en tokens reside en `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` porque `npm dist-tag add` todavía necesita `NPM_TOKEN`, mientras que el repositorio de origen mantiene la publicación solo mediante OIDC.
  - El flujo público `macOS Release` es solo para validación; cuando una etiqueta solo existe en una rama de lanzamiento, pero el flujo de trabajo se inicia desde `main`, establezca `public_release_branch=release/YYYY.M.PATCH`.
  - La publicación real para macOS debe superar correctamente `preflight_run_id` y `validate_run_id` de macOS.
  - Las rutas reales de publicación promueven los artefactos preparados en lugar de volver a compilarlos.
- Para lanzamientos estables de corrección como `YYYY.M.PATCH-N`, el verificador posterior a la publicación también comprueba la misma ruta de actualización con prefijo temporal desde `YYYY.M.PATCH` hasta `YYYY.M.PATCH-N`, de modo que las correcciones de lanzamiento no puedan dejar silenciosamente las instalaciones globales antiguas con la carga útil estable base.
- La comprobación previa del lanzamiento en npm falla de forma segura salvo que el archivo tar incluya tanto `dist/control-ui/index.html` como una carga útil `dist/control-ui/assets/` no vacía, para que no volvamos a distribuir un panel de navegador vacío.
- La verificación posterior a la publicación también comprueba que los puntos de entrada de los plugins publicados y los metadatos de los paquetes estén presentes en la disposición instalada del registro. Un lanzamiento al que le falten cargas útiles del entorno de ejecución de plugins no supera el verificador posterior a la publicación y no puede promoverse a `latest`.
- `pnpm test:install:smoke` también aplica el presupuesto `unpackedSize` del empaquetado de npm al archivo tar de actualización candidato, de modo que la E2E del instalador detecte el aumento accidental del tamaño del paquete antes de la ruta de publicación del lanzamiento.
- Si el trabajo de lanzamiento modificó la planificación de CI, los manifiestos de tiempos de las extensiones o las matrices de pruebas de extensiones, regenere y revise antes de la aprobación las salidas de matriz `plugin-prerelease-extension-shard`, propiedad del planificador, desde `.github/workflows/plugin-prerelease.yml`, para que las notas de la versión no describan una disposición de CI obsoleta.
- La preparación de un lanzamiento estable para macOS también incluye las superficies del actualizador: el lanzamiento de GitHub debe terminar con los archivos empaquetados `.zip`, `.dmg` y `.dSYM.zip`; `appcast.xml` en `main` debe apuntar al nuevo archivo zip estable después de la publicación (el flujo de trabajo de publicación para macOS lo confirma automáticamente o abre un pull request del appcast cuando el envío directo está bloqueado); la aplicación empaquetada debe conservar un identificador de paquete que no sea de depuración, una URL no vacía del canal de Sparkle y un `CFBundleVersion` igual o superior al mínimo de compilación canónico de Sparkle para esa versión de lanzamiento.

## Máquinas de prueba de lanzamiento

`Full Release Validation` permite que los operadores inicien la matriz completa del producto desde un único punto de entrada. Use el asistente para que cada flujo de trabajo secundario se ejecute desde una rama temporal fijada en un SHA de flujo de trabajo `main` de confianza, mientras el commit solicitado sigue siendo el candidato sometido a prueba:

```bash
pnpm ci:full-release \
  --sha <code-sha> \
  --target-ref release/YYYY.M.PATCH
```

El asistente obtiene el `origin/main` actual, envía `release-ci/<workflow-sha>-...` en ese commit de flujo de trabajo de confianza, deduce `beta` a partir de las versiones alfa/beta de los paquetes y `stable` en los demás casos, inicia `Full Release Validation` desde la rama temporal con `ref=<target-sha>`, verifica que el `headSha` de cada flujo de trabajo secundario coincida con el SHA fijado del flujo de trabajo principal y, después, elimina la rama temporal. Proporcione `-f reuse_evidence=false` para forzar una ejecución nueva, `-f release_profile=full` para el análisis consultivo amplio o `--workflow-sha <trusted-main-sha>` para fijar un commit anterior que aún sea accesible desde el `origin/main` actual. El propio flujo de trabajo nunca escribe referencias del repositorio. Esto mantiene disponibles las herramientas de lanzamiento exclusivas de la rama principal sin añadir commits de herramientas al candidato y evita validar accidentalmente una ejecución secundaria `main` más reciente.

Cuando el SHA del código esté en verde, confirme únicamente `CHANGELOG.md` y ejecute el mismo asistente con el SHA del lanzamiento:

```bash
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH
```

El segundo flujo principal reutiliza las pruebas del producto únicamente cuando GitHub demuestra que el SHA del lanzamiento desciende del SHA del código y que el conjunto completo de rutas modificadas es exactamente `CHANGELOG.md`. Registra `changelog-only-release-v1` y no inicia ningún flujo secundario del producto. La comprobación previa de npm y la aceptación de paquetes/instalaciones siguen ejecutándose con el SHA del lanzamiento porque los bytes de su archivo tar han cambiado.

Para un SHA de código nuevo, el flujo de trabajo resuelve el destino, inicia manualmente `CI` y, después, inicia `OpenClaw Release Checks`. `OpenClaw Release Checks` distribuye la prueba de humo de instalación, las comprobaciones de lanzamiento entre sistemas operativos, la cobertura en vivo/E2E de la ruta de lanzamiento con Docker cuando está habilitada la prueba prolongada, la aceptación de paquetes con la E2E canónica del paquete de Telegram, la paridad de QA Lab, Matrix en vivo y Telegram en vivo. Una ejecución completa/total solo es aceptable cuando el resumen de `Full Release Validation` muestra `normal_ci`, `plugin_prerelease` y `release_checks` como correctos, salvo que una repetición enfocada haya omitido intencionalmente el flujo secundario independiente `Plugin Prerelease`. Use el flujo secundario independiente `npm-telegram` únicamente para repetir de forma enfocada la comprobación del paquete publicado con `release_package_spec` o `npm_telegram_package_spec`. El resumen final del verificador incluye tablas de los trabajos más lentos de cada ejecución secundaria, para que el responsable del lanzamiento pueda ver la ruta crítica actual sin descargar los registros.

El flujo secundario de rendimiento del producto solo genera artefactos en esta ruta de lanzamiento. El
flujo general lo inicia con `publish_reports=false`, y la validación se rechaza
salvo que su protección de solo artefactos demuestre que el publicador de informes de Clawgrit permaneció
omitido.

Consulte [Validación completa del lanzamiento](/es/reference/full-release-validation) para conocer la matriz completa de etapas, los nombres exactos de los trabajos de los flujos de trabajo, las diferencias entre los perfiles estable y completo, los artefactos y los identificadores de repetición enfocada.

Los flujos de trabajo secundarios se inician desde la referencia de confianza fijada por SHA que ejecuta `Full Release Validation`. Cada ejecución secundaria debe usar el SHA exacto del flujo de trabajo principal. No use inicios directos de `--ref main -f ref=<sha>` como prueba de lanzamiento; use `pnpm ci:full-release --sha <target-sha> --target-ref release/YYYY.M.PATCH`.

Use `release_profile` para seleccionar la amplitud de proveedores y pruebas en vivo:

- `beta`: ruta crítica de lanzamiento más rápida para OpenAI/núcleo en vivo y Docker
- `stable`: cobertura de proveedores/backends de beta y estable para aprobar el lanzamiento
- `full`: cobertura estable más cobertura consultiva amplia de proveedores/medios

La validación estable y completa siempre ejecuta antes de la promoción el análisis exhaustivo en vivo/E2E, la ruta de lanzamiento con Docker y la comprobación acotada de supervivencia a actualizaciones publicadas. Use `run_release_soak=true` para solicitar el mismo análisis para una beta. Este análisis abarca los cuatro paquetes estables más recientes, además de las líneas base fijadas `2026.4.23` y `2026.5.2` y la cobertura anterior `2026.4.15`, elimina las líneas base duplicadas y divide cada línea base en su propio trabajo de ejecución de Docker.

`OpenClaw Release Checks` usa la referencia de flujo de trabajo de confianza para resolver una sola vez la referencia de destino como `release-package-under-test` y reutiliza ese artefacto en las comprobaciones entre sistemas operativos, de aceptación de paquetes y de Docker para la ruta de lanzamiento cuando se ejecuta la prueba prolongada. Esto mantiene todas las máquinas orientadas a paquetes con los mismos bytes y evita compilaciones repetidas del paquete. Cuando una beta ya esté en npm, establezca `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` para que las comprobaciones de lanzamiento descarguen una vez el paquete distribuido, extraigan su SHA de origen de compilación de `dist/build-info.json` y reutilicen ese artefacto en las vías entre sistemas operativos, de aceptación de paquetes, de Docker para la ruta de lanzamiento y del paquete de Telegram.

La prueba de humo de instalación de OpenAI entre sistemas operativos usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` cuando está definida la variable del repositorio o de la organización y, en caso contrario, `openai/gpt-5.6-luna`, porque esta vía valida la instalación del paquete, la incorporación, el inicio del Gateway y un turno de agente en vivo, en lugar de comparar el rendimiento del modelo más capaz. La matriz más amplia de proveedores en vivo sigue siendo el lugar para la cobertura específica de modelos.

Use estas variantes según la etapa del lanzamiento:

```bash
# Valida el SHA de código del producto completo.
pnpm ci:full-release \
  --sha <code-sha> \
  --target-ref release/YYYY.M.PATCH

# Valida el SHA de la versión que solo contiene el registro de cambios reutilizando la evidencia del producto del SHA de código.
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH

# Después de publicar una beta, añade el E2E de Telegram del paquete publicado.
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH \
  -f release_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

No utilice el conjunto completo como primera repetición tras una corrección específica. Si falla una instancia, utilice el flujo de trabajo secundario, trabajo, carril de Docker, perfil de paquete, proveedor de modelos o carril de QA que haya fallado para la siguiente prueba. Vuelva a ejecutar el conjunto completo únicamente cuando la corrección haya cambiado la orquestación compartida de la versión o haya dejado obsoleta la evidencia anterior de todas las instancias. El verificador final del conjunto vuelve a comprobar los identificadores registrados de las ejecuciones de los flujos de trabajo secundarios, por lo que, después de repetir correctamente un flujo de trabajo secundario, repita únicamente el trabajo principal `Verify full validation` que haya fallado.

`rerun_group=all` puede reutilizar una ejecución correcta anterior del conjunto cuando coincidan el perfil de la versión, la configuración de estabilización efectiva y las entradas de validación, y el SHA de destino sea idéntico o el nuevo destino sea un descendiente cuyo conjunto completo de rutas modificadas sea exactamente `CHANGELOG.md`. La reutilización del destino exacto registra `exact-target-full-validation-v1`; el SHA de la versión posterior a la validación registra `changelog-only-release-v1`. Este último reutiliza únicamente la validación del producto. La comprobación previa de npm, los bytes del paquete, la procedencia de las notas de la versión y la aceptación de instalación/actualización deben seguir ejecutándose con el SHA de la versión. Cualquier cambio de versión, fuente, contenido generado, dependencia, paquete o destino propiedad de un flujo de trabajo requiere un nuevo SHA de código y una validación completa nueva. Las ejecuciones más recientes del conjunto para la misma referencia `release/*` y el mismo grupo de repetición sustituyen automáticamente a las que están en curso. Pase `reuse_evidence=false` para forzar una ejecución completa nueva.

Para una recuperación acotada, pase `rerun_group` al conjunto. `all` es la ejecución real de la versión candidata, `ci` ejecuta únicamente el flujo secundario de CI normal, `plugin-prerelease` ejecuta únicamente el flujo secundario de plugins exclusivo de la versión, `release-checks` ejecuta todas las instancias de la versión y los grupos de versión más específicos son `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` y `npm-telegram`. Las repeticiones específicas de `npm-telegram` requieren `release_package_spec` o `npm_telegram_package_spec`; las ejecuciones completas o de todos los grupos utilizan el E2E canónico de Telegram del paquete dentro de Package Acceptance. Las repeticiones específicas entre sistemas operativos pueden añadir `cross_os_suite_filter=windows/packaged-upgrade` u otro filtro de sistema operativo/conjunto. Los fallos de las comprobaciones de versión de QA bloquean la validación normal de la versión, incluida la desviación obligatoria de herramientas dinámicas de OpenClaw en el nivel estándar. Las ejecuciones alfa de Tideclaw aún pueden tratar como consultivos los carriles de comprobación de versión no relacionados con la seguridad del paquete. Con `release_profile=beta`, los conjuntos de proveedores activos `Run repo/live E2E validation` son consultivos (advertencias, no bloqueos); los perfiles estable y completo siguen considerándolos bloqueantes. Cuando `live_suite_filter` solicite explícitamente un carril activo de QA sujeto a control, como Discord, WhatsApp o Slack, la variable de repositorio `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` correspondiente debe estar habilitada; de lo contrario, la captura de entradas falla en lugar de omitir silenciosamente el carril.

### Vitest

La instancia de Vitest es el flujo de trabajo secundario manual `CI`. La CI manual omite intencionadamente la delimitación por cambios y fuerza el grafo normal de pruebas para la versión candidata: fragmentos de Linux Node, fragmentos de plugins incluidos, fragmentos de contratos de plugins y canales, compatibilidad con Node 22, `check-*`, `check-additional-*`, comprobaciones rápidas de artefactos compilados, comprobaciones de documentación, Skills de Python, Windows, macOS e i18n de Control UI. Android se incluye cuando `Full Release Validation` ejecuta la instancia porque el conjunto pasa `include_android=true`; la CI manual independiente requiere `include_android=true` para cubrir Android.

Utilice esta instancia para responder «¿el árbol de fuentes superó el conjunto completo de pruebas normales?». No equivale a la validación del producto en la ruta de publicación. Evidencia que debe conservarse:

- `Full Release Validation` resumen que muestra la URL de la ejecución `CI` iniciada
- ejecución `CI` correcta en el SHA de destino exacto
- nombres de fragmentos fallidos o lentos de los trabajos de CI al investigar regresiones
- artefactos de tiempos de Vitest, como `.artifacts/vitest-shard-timings.json`, cuando una ejecución requiera análisis de rendimiento

Ejecute la CI manual directamente solo cuando la versión necesite una CI normal determinista, pero no las instancias de Docker, QA Lab, proveedores activos, varios sistemas operativos o paquetes. Utilice el primer comando para una CI directa sin Android. Añada `include_android=true` cuando la CI directa de la versión candidata deba cubrir Android:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

La instancia de Docker se encuentra en `OpenClaw Release Checks` mediante `openclaw-live-and-e2e-checks-reusable.yml`, además del flujo de trabajo en modo de versión `install-smoke`. Valida la versión candidata mediante entornos Docker empaquetados, en lugar de limitarse a pruebas en el nivel del código fuente.

La cobertura de Docker para la versión incluye:

- comprobación rápida de instalación completa con la comprobación lenta de instalación global mediante Bun habilitada
- preparación/reutilización de la imagen de comprobación rápida del Dockerfile raíz según el SHA de destino, con trabajos de comprobación de QR, raíz/Gateway e instalador/Bun ejecutados como fragmentos separados de comprobación de instalación
- carriles E2E del repositorio
- segmentos de Docker de la ruta de publicación: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, de `plugins-runtime-install-a` a `plugins-runtime-install-h` y `openwebui`
- cobertura de OpenWebUI en un ejecutor dedicado con disco grande cuando se solicite
- carriles divididos de instalación/desinstalación de plugins incluidos, de `bundled-plugin-install-uninstall-0` a `bundled-plugin-install-uninstall-23`
- conjuntos de proveedores activos/E2E y cobertura de modelos activos en Docker cuando las comprobaciones de la versión incluyan conjuntos activos

Utilice los artefactos de Docker antes de repetir la ejecución. El planificador de la ruta de publicación carga `.artifacts/docker-tests/` con registros de los carriles, `summary.json`, `failures.json`, tiempos de las fases, el JSON del plan del planificador y comandos de repetición. Para una recuperación específica, utilice `docker_lanes=<lane[,lane]>` en el flujo de trabajo reutilizable de proveedores activos/E2E en lugar de repetir todos los segmentos de la versión. Los comandos de repetición generados incluyen las entradas anteriores de `package_artifact_run_id` y de las imágenes de Docker preparadas cuando están disponibles, para que un carril fallido pueda reutilizar el mismo archivo tar y las mismas imágenes de GHCR.

### QA Lab

La instancia de QA Lab también forma parte de `OpenClaw Release Checks`. Es la puerta de publicación del comportamiento agéntico y del nivel de canal, separada de Vitest y de la mecánica de paquetes de Docker.

La cobertura de QA Lab para la versión incluye:

- carril de paridad simulada que compara el carril candidato de OpenAI con la referencia `anthropic/claude-opus-4-8` mediante el paquete de paridad agéntica
- perfil de publicación del adaptador activo de Matrix mediante el entorno `qa-live-shared`
- carril activo de QA de Telegram mediante concesiones de credenciales de Convex CI
- `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`, `pnpm qa:prometheus:smoke` o `pnpm qa:observability:smoke` cuando la telemetría de la versión necesite pruebas locales explícitas

Utilice esta instancia para responder «¿la versión se comporta correctamente en los escenarios de QA y los flujos de canales activos?». Conserve las URL de los artefactos de los carriles de paridad, Matrix y Telegram cuando apruebe la versión. La cobertura completa de Matrix sigue estando disponible como ejecución manual fragmentada de QA Lab, en lugar de ser el carril crítico predeterminado de la versión.

### Paquete

La instancia de paquete es la puerta del producto instalable. Está respaldada por `Package Acceptance` y el solucionador `scripts/resolve-openclaw-package-candidate.mjs`. El solucionador normaliza un candidato en el archivo tar `package-under-test` consumido por el E2E de Docker, valida el inventario del paquete, registra la versión y el SHA-256 del paquete y mantiene la referencia del entorno del flujo de trabajo separada de la referencia de origen del paquete.

Fuentes de candidatos compatibles:

- `source=npm`: `openclaw@beta`, `openclaw@latest` o una versión exacta de OpenClaw
- `source=ref`: empaqueta una rama, etiqueta o SHA de confirmación completo y de confianza de `package_ref` con el entorno `workflow_ref` seleccionado
- `source=url`: descarga un `.tgz` HTTPS público con el `package_sha256` requerido; se rechazan las credenciales en URL, los puertos HTTPS no predeterminados, los nombres de host o las direcciones resueltas privados, internos o de uso especial, y las redirecciones no seguras
- `source=trusted-url`: descarga un `.tgz` HTTPS con los valores requeridos `package_sha256` y `trusted_source_id` de una política con nombre en `.github/package-trusted-sources.json`; utilice esta opción para espejos empresariales propiedad de mantenedores o repositorios de paquetes privados, en lugar de añadir a `source=url` una omisión de red privada en el nivel de entrada
- `source=artifact`: reutiliza un `.tgz` cargado por otra ejecución de GitHub Actions

`OpenClaw Release Checks` ejecuta Package Acceptance con `source=artifact`, el artefacto del paquete de la versión preparado, `suite_profile=custom`, `docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape`, `telegram_mode=mock-openai`. Package Acceptance mantiene la migración, actualización, actualización de VPS administrado desde la raíz, reinicio tras actualización con autenticación configurada, instalación activa de Skills de ClawHub, limpieza de dependencias obsoletas de plugins, accesorios de plugins sin conexión, actualización de plugins, refuerzo del escape de enlaces de comandos de plugins y QA de Telegram del paquete con el mismo archivo tar resuelto. Las comprobaciones bloqueantes de la versión utilizan como referencia predeterminada el último paquete publicado; el perfil beta con `run_release_soak=true`, `release_profile=stable` o `release_profile=full` amplía el recorrido de supervivencia a la actualización publicada a `last-stable-4`, además de las referencias fijadas `2026.4.23`, `2026.5.2` y `2026.4.15`, con escenarios `reported-issues`. Utilice Package Acceptance con `source=npm` para un candidato ya publicado, `source=ref` para un archivo tar local de npm respaldado por un SHA antes de publicarlo, `source=trusted-url` para un espejo empresarial/privado propiedad de mantenedores o `source=artifact` para un archivo tar preparado y cargado por otra ejecución de GitHub Actions.

Es el sustituto nativo de GitHub para la mayor parte de la cobertura de paquetes/actualizaciones que anteriormente requería Parallels. Las comprobaciones de publicación entre sistemas operativos siguen siendo importantes para la incorporación, el instalador y el comportamiento específico de cada plataforma, pero la validación del producto en cuanto a paquetes/actualizaciones debe preferir Package Acceptance.

La lista de comprobación canónica para validar actualizaciones y plugins es [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins). Utilícela para decidir qué carril local, de Docker, Package Acceptance o comprobación de versión demuestra un cambio en la instalación/actualización de un plugin, la limpieza mediante doctor o la migración de un paquete publicado. La migración exhaustiva de actualizaciones publicadas desde cada paquete estable `2026.4.23+` es un flujo de trabajo manual `Update Migration` separado, no forma parte de la CI completa de la versión.

La permisividad heredada de Package Acceptance tiene intencionadamente una duración limitada. Los paquetes hasta `2026.4.25` pueden utilizar la ruta de compatibilidad para carencias de metadatos ya publicadas en npm: entradas privadas del inventario de QA ausentes del archivo tar, ausencia de `gateway install --wrapper`, ausencia de archivos de parche en el accesorio de Git derivado del archivo tar, ausencia de `update.channel` persistido, ubicaciones heredadas de registros de instalación de plugins, ausencia de persistencia de registros de instalación del mercado y migración de metadatos de configuración durante `plugins update`. El paquete publicado `2026.4.26` puede emitir advertencias por archivos de sello de metadatos de compilación local que ya se hayan publicado. Los paquetes posteriores deben cumplir los contratos modernos de paquetes; esas mismas carencias hacen fallar la validación de la versión.

Utilice perfiles más amplios de Package Acceptance cuando la cuestión de la versión se refiera a un paquete instalable real:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

Perfiles habituales de paquetes:

- `smoke`: rutas rápidas de instalación de paquetes/canal/agente, red del Gateway y recarga de configuración
- `package`: contratos de instalación/actualización/reinicio/paquetes de plugins, además de prueba en vivo de instalación de Skills de ClawHub; este es el valor predeterminado para la comprobación de versiones
- `product`: `package` más canales MCP, limpieza de Cron/subagentes, búsqueda web de OpenAI y OpenWebUI
- `full`: segmentos de la ruta de publicación de Docker con OpenWebUI
- `custom`: lista exacta de `docker_lanes` para repeticiones específicas

Para la prueba de Telegram del paquete candidato, habilite `telegram_mode=mock-openai` o `telegram_mode=live-frontier` en Package Acceptance. El flujo de trabajo pasa el tarball `package-under-test` resuelto a la ruta de Telegram; el flujo de trabajo independiente de Telegram sigue aceptando una especificación de npm publicada para las comprobaciones posteriores a la publicación.

## Automatización habitual de publicación de versiones

Para la publicación beta, de `latest`, plugins, GitHub Release y plataformas,
`OpenClaw Release Publish` es el punto de entrada habitual que realiza modificaciones. La ruta mensual
de estabilidad extendida `.33+`, exclusiva de npm, no utiliza este orquestador. El
flujo de trabajo habitual orquesta los flujos de trabajo de publicación de confianza en el orden que
requiere la versión:

1. Extraiga la etiqueta de la versión y resuelva el SHA de su commit.
2. Verifique que se pueda acceder a la etiqueta desde `main` o `release/*` (o desde una rama alfa de Tideclaw para versiones preliminares alfa).
3. Ejecute `pnpm plugins:sync:check`.
4. Ejecute `Plugin NPM Release` con `publish_scope=all-publishable` y `ref=<release-sha>`.
5. Ejecute `Plugin ClawHub Release` con el mismo ámbito y SHA.
6. Ejecute `OpenClaw NPM Release` con la etiqueta de versión, la etiqueta de distribución de npm y el `preflight_run_id` guardado después de verificar el `full_release_validation_run_id` guardado y el intento de ejecución exacto.
7. Para versiones estables, cree o actualice la versión de GitHub como borrador, ejecute `Windows Node Release` con el `windows_node_tag` explícito y el `windows_node_installer_digests` aprobado para el candidato, y verifique los activos canónicos del instalador de Windows y sus sumas de comprobación. Ejecute también `Android Release` para compilar el APK firmado de la etiqueta exacta, junto con la suma de comprobación y la procedencia. Verifique ambos contratos de activos nativos antes de publicar el borrador.

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

Utilice los flujos de trabajo de nivel inferior `Plugin NPM Release` y `Plugin ClawHub Release` solo para trabajos específicos de reparación o republicación. `OpenClaw Release Publish` rechaza `plugin_publish_scope=selected` cuando `publish_openclaw_npm=true`, de modo que el paquete principal no pueda publicarse sin todos los plugins oficiales publicables, incluido `@openclaw/diffs-language-pack`. Para reparar un plugin seleccionado, establezca `publish_openclaw_npm=false` con `plugin_publish_scope=selected` y `plugins=@openclaw/name`, o ejecute directamente el flujo de trabajo secundario.

La inicialización de ClawHub para la primera publicación es la excepción: ejecute `Plugin ClawHub New`
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

La validación previa a la etiqueta requiere `dry_run=true`, rechaza las entradas de la etiqueta de versión
y de la ejecución principal, y solo acepta un destino exacto al que se pueda acceder desde `main` o `release/*`.
No carga credenciales de ClawHub, publica bytes de paquetes ni cambia la configuración
de publicación de confianza. El flujo de trabajo sigue resolviendo el plan del registro en vivo,
extrae y empaqueta el destino únicamente en un trabajo sin secretos, materializa la
cadena de herramientas bloqueada de ClawHub y valida el artefacto inmutable y el
slug/la identidad del paquete antes de que exista la etiqueta de versión. Apruebe el entorno
`clawhub-plugin-bootstrap` solo después de que finalicen los trabajos de empaquetado sin secretos;
este trabajo de validación protegido no tiene credenciales ni comandos de modificación.

Una ejecución de prueba aprobada o una inicialización real después del etiquetado debe incluir la
etiqueta de versión exacta, además del identificador, el intento y la rama de la ejecución principal
`OpenClaw Release Publish`. La principal certifica el SHA de su propio flujo de trabajo y otro SHA de confianza
`main` exacto para `Plugin ClawHub New`; la ejecución secundaria y cada aprobación de entorno
protegido deben coincidir con ese SHA secundario aprobado. La etiqueta de versión se
vuelve a comprobar antes de cada intento de publicación y modificación de la publicación de confianza.

El trabajo de empaquetado
carga un artefacto inmutable cuyo nombre, identificador/resumen del artefacto de Actions,
ejecución/intento del productor, SHA de destino y SHA-256/tamaño del tarball de cada paquete se
transmiten a los trabajos de validación y protegidos. El trabajo protegido extrae únicamente las herramientas
de confianza de `main`, valida la tupla del artefacto mediante la API de GitHub, realiza la descarga
por el identificador exacto del artefacto, vuelve a calcular el hash de cada tarball y valida las rutas TAR locales y
la identidad del paquete con las reglas de canonicalización USTAR de la CLI fijada. Cada
candidato pasa después la ejecución de prueba de publicación de la CLI fijada, que finaliza antes
de consultar el registro o autenticar. El prefiltro del trabajo con credenciales limita los ClawPacks comprimidos
a 120 MiB, la carga útil total de archivos a 50 MiB, los datos TAR expandidos a 64 MiB y
el número de entradas TAR a 10,000. La reparación de la publicación de confianza de paquetes existentes sigue
limitada a la configuración, pero aun así empaqueta el destino y requiere que la etiqueta solicitada,
los bytes exactos del registro y los metadatos coincidan antes de cambiar la configuración de publicación de confianza.
La verificación posterior a la publicación descarga el artefacto de ClawHub y
exige el mismo SHA-256 y tamaño. Una recuperación mediante la repetición de trabajos fallidos puede reutilizar el artefacto
de paquete de un intento anterior solo cuando el trabajo productor exacto haya finalizado
correctamente. La evidencia final también vincula la versión bloqueada de ClawHub, el
SHA-256 del archivo de bloqueo y la integridad de npm. Una discrepancia requiere una nueva versión del paquete.

## Entradas del flujo de trabajo de NPM

`OpenClaw NPM Release` acepta estas entradas controladas por el operador:

- `tag`: etiqueta de versión obligatoria, como `v2026.4.2`, `v2026.4.2-1`, `v2026.4.2-beta.1` o `v2026.4.2-alpha.1`; cuando `preflight_only=true`, también puede ser el SHA de commit completo actual de 40 caracteres de la rama del flujo de trabajo para la comprobación previa solo de validación
- `preflight_only`: `true` solo para validación/compilación/empaquetado, `false` para la ruta de publicación real
- `preflight_run_id`: identificador de una ejecución previa correcta existente, obligatorio en la ruta de publicación real para que el flujo de trabajo reutilice el tarball preparado en lugar de volver a compilarlo
- `full_release_validation_run_id`: identificador de una ejecución correcta de `Full Release Validation` para esta etiqueta/SHA, obligatorio para una publicación real. Las publicaciones beta pueden continuar solo con la comprobación previa y una advertencia, pero la promoción estable/`latest` sigue requiriéndolo.
- `full_release_validation_run_attempt`: intento de ejecución positivo exacto asociado con `full_release_validation_run_id`; obligatorio siempre que se proporcione el identificador de ejecución para que las repeticiones no puedan cambiar la evidencia de autorización durante la publicación.
- `release_publish_run_id`: identificador aprobado de la ejecución de `OpenClaw Release Publish`; obligatorio cuando este flujo de trabajo lo ejecuta esa principal (llamadas de publicación real del actor bot)
- `plugin_npm_run_id`: identificador de una ejecución correcta de `Plugin NPM Release` con el encabezado exacto; obligatorio para una publicación principal real de `extended-stable`
- `npm_dist_tag`: etiqueta de destino de npm para la ruta de publicación; acepta `alpha`, `beta`, `latest` o `extended-stable` y el valor predeterminado es `beta`. La versión final del parche `33` y posteriores deben utilizar `extended-stable`; de forma predeterminada, `extended-stable` rechaza los parches anteriores y siempre rechaza las etiquetas no finales.
- `bypass_extended_stable_guard`: booleano solo para pruebas, valor predeterminado `false`; con `npm_dist_tag=extended-stable`, omite la elegibilidad mensual de estabilidad extendida y conserva las comprobaciones de identidad de la versión, artefactos, aprobación y lectura posterior.

`Plugin NPM Release` acepta `npm_dist_tag=default` para el comportamiento de versiones
existente o `npm_dist_tag=extended-stable` para la ruta mensual protegida. La
opción de estabilidad extendida requiere `publish_scope=all-publishable`, una entrada
`plugins` vacía, un parche final igual o superior a `33` y la rama canónica
`extended-stable/YYYY.M.33` en su punta exacta. Nunca mueve los plugins
`latest` ni `beta`. Las nuevas versiones de paquetes reciben `extended-stable` de forma atómica
mediante publicación de confianza con OIDC (`npm publish --tag extended-stable`); este
flujo de trabajo de origen no utiliza `npm dist-tag add` autenticado mediante token. Los reintentos
omiten las versiones exactas que ya estén presentes en npm y luego se cierran de forma segura, salvo que
la lectura posterior completa confirme que cada paquete exacto y etiqueta `extended-stable` hayan convergido.

`OpenClaw Release Publish` acepta estas entradas controladas por el operador:

- `tag`: etiqueta de versión obligatoria; ya debe existir
- `preflight_run_id`: identificador de una ejecución previa correcta de `OpenClaw NPM Release`; obligatorio cuando `publish_openclaw_npm=true` o `plugin_publish_scope=all-publishable`
- `full_release_validation_run_id`: identificador de una ejecución correcta de `Full Release Validation`; obligatorio cuando `publish_openclaw_npm=true` o `plugin_publish_scope=all-publishable`
- `full_release_validation_run_attempt`: intento positivo exacto asociado con `full_release_validation_run_id`; obligatorio siempre que se proporcione el identificador de ejecución
- `windows_node_tag`: etiqueta de versión `openclaw/openclaw-windows-node` exacta que no sea preliminar; obligatoria para la publicación estable de OpenClaw
- `windows_node_installer_digests`: mapa JSON compacto aprobado para el candidato, con los nombres actuales de los instaladores de Windows y sus resúmenes `sha256:` fijados; obligatorio para la publicación estable de OpenClaw
- `npm_telegram_run_id`: identificador opcional de una ejecución correcta de `NPM Telegram Beta E2E` que se incluirá en la evidencia final de la versión
- `npm_dist_tag`: etiqueta de destino de npm para el paquete OpenClaw, una de `alpha`, `beta` o `latest`
- `plugin_publish_scope`: el valor predeterminado es `all-publishable`; utilice `selected` solo para trabajos específicos de reparación exclusiva de plugins con `publish_openclaw_npm=false`
- `plugins`: nombres de paquetes `@openclaw/*` separados por comas cuando `plugin_publish_scope=selected`
- `publish_openclaw_npm`: el valor predeterminado es `true`; establezca `false` solo cuando utilice el flujo de trabajo como orquestador de reparaciones exclusivas de plugins
- `release_profile`: perfil de cobertura de la versión utilizado para los resúmenes de evidencias de la versión; el valor predeterminado es `from-validation`, que lo lee del manifiesto de validación, o se puede sustituir por `beta`, `stable` o `full`
- `wait_for_clawhub`: el valor predeterminado es `false` para que la disponibilidad de npm no quede bloqueada por el proceso auxiliar de ClawHub; establezca `true` solo cuando la finalización del flujo de trabajo deba incluir la finalización de ClawHub

`OpenClaw Release Checks` acepta estas entradas controladas por el operador:

- `ref`: rama, etiqueta o SHA completo del commit que se validará. Las comprobaciones que utilizan secretos requieren que el commit resuelto sea accesible desde una rama o etiqueta de versión de OpenClaw.
- `run_release_soak`: habilita las pruebas exhaustivas en vivo/E2E, la ruta de lanzamiento de Docker y las pruebas prolongadas de supervivencia a actualizaciones desde todas las versiones para las comprobaciones de versiones beta. Se habilita obligatoriamente mediante `release_profile=stable` y `release_profile=full`.

Reglas:

- Las versiones finales normales y de corrección inferiores al parche `33` pueden publicarse en `beta` o `latest`. Las versiones finales con el parche `33` o superior deben publicarse en `extended-stable`, y se rechazan las versiones con sufijo de corrección en ese límite.
- Las etiquetas de prelanzamiento beta solo pueden publicarse en `beta`; las etiquetas de prelanzamiento alfa solo pueden publicarse en `alpha`
- Para `OpenClaw NPM Release`, la entrada de un SHA completo del commit solo se permite cuando `preflight_only=true`
- `OpenClaw Release Checks` y `Full Release Validation` son siempre exclusivamente para validación
- La ruta de publicación real debe usar el mismo `npm_dist_tag` utilizado durante la comprobación previa; el flujo de trabajo verifica esos metadatos antes de continuar con la publicación

## Secuencia habitual de lanzamiento beta/estable más reciente

Esta secuencia heredada corresponde al lanzamiento orquestado habitual, que también gestiona los plugins, la versión de GitHub, Windows y el trabajo de otras plataformas. No es la ruta mensual `.33+` de estabilidad extendida exclusiva de npm que se documenta al principio de esta página.

Al preparar un lanzamiento estable orquestado habitual:

1. Ejecute `OpenClaw NPM Release` con `preflight_only=true`. Antes de que exista una etiqueta, se puede usar el SHA completo del commit actual de la rama del flujo de trabajo para realizar una ejecución de prueba exclusivamente de validación del flujo de comprobación previa.
2. Elija `npm_dist_tag=beta` para el flujo normal que comienza con la beta, o `latest` solo cuando se quiera realizar intencionadamente una publicación estable directa.
3. Ejecute `Full Release Validation` en la rama de lanzamiento, la etiqueta de versión o el SHA completo del commit cuando se quiera obtener la cobertura de la CI normal junto con la caché de prompts en vivo, Docker, QA Lab, Matrix y Telegram desde un único flujo de trabajo manual. Si intencionadamente solo se necesita el grafo determinista de pruebas normales, ejecute en su lugar el flujo de trabajo manual `CI` en la referencia de lanzamiento.
4. Seleccione la etiqueta de versión exacta que no sea de prelanzamiento `openclaw/openclaw-windows-node` cuyos instaladores firmados x64 y ARM64 deban distribuirse. Guárdela como `windows_node_tag` y guarde su mapa de resúmenes validado como `windows_node_installer_digests`. El asistente de la versión candidata registra ambos y los incluye en el comando de publicación que genera.
5. Guarde los valores correctos de `preflight_run_id`, `full_release_validation_run_id` y el valor exacto de `full_release_validation_run_attempt`.
6. Ejecute `OpenClaw Release Publish` desde el entorno de confianza `main` con el mismo `tag`, el mismo `npm_dist_tag`, el `windows_node_tag` seleccionado, su `windows_node_installer_digests` guardado, el `preflight_run_id` guardado, `full_release_validation_run_id` y `full_release_validation_run_attempt`. Este proceso publica los plugins externalizados en npm y ClawHub antes de promocionar el paquete npm de OpenClaw.
7. Si el lanzamiento se publicó en `beta`, use el flujo de trabajo `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` para promocionar esa versión estable de `beta` a `latest`.
8. Si el lanzamiento se publicó intencionadamente de forma directa en `latest` y `beta` debe adoptar de inmediato la misma compilación estable, use ese mismo flujo de trabajo de lanzamiento para hacer que ambas etiquetas de distribución apunten a la versión estable, o permita que su sincronización programada de autorreparación traslade `beta` más adelante.

La modificación de las etiquetas de distribución reside en el repositorio del registro de lanzamientos porque todavía requiere `NPM_TOKEN`, mientras que el repositorio de código fuente mantiene la publicación exclusiva mediante OIDC. De este modo, tanto la ruta de publicación directa como la ruta de promoción que comienza con la beta quedan documentadas y visibles para los operadores.

Si un mantenedor debe recurrir a la autenticación local de npm, ejecute cualquier comando de la CLI de 1Password (`op`) únicamente dentro de una sesión de tmux dedicada. No invoque `op` directamente desde el shell principal del agente; mantenerlo dentro de tmux permite observar las solicitudes, las alertas y la gestión de OTP, y evita que se repitan las alertas del host.

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

Los mantenedores usan la documentación privada de lanzamientos de [`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md) como guía operativa real.

## Contenido relacionado

- [Canales de lanzamiento](/es/install/development-channels)
