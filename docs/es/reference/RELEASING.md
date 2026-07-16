---
read_when:
    - Buscando definiciones públicas de canales de lanzamiento
    - Ejecución de la validación de la versión o de la aceptación del paquete
    - Buscando la nomenclatura y la cadencia de las versiones
summary: Canales de lanzamiento, lista de verificación del operador, entornos de validación, nomenclatura de versiones y cadencia
title: Política de lanzamientos
x-i18n:
    generated_at: "2026-07-16T11:55:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c88c7c61be963ed832b1716e811e09d5f270cb296bb08625e6fd53d5359e45b8
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw expone actualmente tres canales de actualización orientados al usuario:

- stable: el canal de versiones promocionadas existente, que todavía se resuelve mediante npm `latest` hasta que se complete el hito independiente de CLI/canales
- beta: etiquetas de versión preliminar que se publican en npm `beta`
- dev: la cabecera cambiante de `main`

Por separado, los operadores de versiones pueden publicar el paquete del núcleo
del último mes completado en npm `extended-stable`, comenzando en el parche `33`. La línea
final normal del mes actual continúa en npm `latest`; esta división de publicación
del lado del operador no cambia por sí sola la resolución del canal de actualización de la CLI.

Las compilaciones alfa de Tideclaw constituyen una línea interna independiente de versiones preliminares (dist-tag de npm `alpha`), descrita en [Entradas del flujo de trabajo de NPM](#npm-workflow-inputs) y [Entornos de prueba de versiones](#release-test-boxes).

## Nomenclatura de versiones

- Versión mensual de la versión estable extendida de npm: `YYYY.M.PATCH`, con `PATCH >= 33`, etiqueta de git `vYYYY.M.PATCH`
- Versión final diaria/normal: `YYYY.M.PATCH`, con `PATCH < 33`, etiqueta de git `vYYYY.M.PATCH`
- Versión normal de corrección alternativa: `YYYY.M.PATCH-N`, etiqueta de git `vYYYY.M.PATCH-N`
- Versión preliminar beta: `YYYY.M.PATCH-beta.N`, etiqueta de git `vYYYY.M.PATCH-beta.N`
- Versión preliminar alfa: `YYYY.M.PATCH-alpha.N`, etiqueta de git `vYYYY.M.PATCH-alpha.N`
- Nunca se deben completar con ceros el mes ni el parche
- `PATCH` es un número secuencial de la línea mensual de versiones, no un día natural. Las versiones finales normales y beta hacen avanzar la línea actual; las etiquetas exclusivamente alfa nunca consumen ni incrementan el número de parche beta/normal, por lo que deben ignorarse las etiquetas heredadas exclusivamente alfa con números de parche superiores al seleccionar una línea beta o normal.
- Las compilaciones alfa/nocturnas usan la siguiente línea de parches aún no publicada e incrementan únicamente `alpha.N` para compilaciones repetidas. Cuando ese parche tenga una beta, las nuevas compilaciones alfa pasan al parche siguiente.
- Las versiones de npm son inmutables: nunca se debe eliminar, volver a publicar ni reutilizar una etiqueta publicada. En su lugar, se debe crear el siguiente número de versión preliminar o el siguiente parche mensual.
- `latest` continúa siguiendo la línea normal/diaria actual de npm; `beta` es el destino de instalación beta actual
- `extended-stable` representa el paquete compatible de npm del último mes, comenzando en el parche `33`; el parche `34` y los posteriores son versiones de mantenimiento de esa línea mensual
- Las versiones finales normales y las correcciones normales se publican de forma predeterminada en npm `beta`; los operadores de versiones pueden seleccionar explícitamente `latest` o promocionar más adelante una compilación beta validada
- La ruta mensual específica de estabilidad extendida publica el paquete principal de npm y todos los plugins oficiales publicables en npm con exactamente la misma versión. No publica plugins en ClawHub ni artefactos de macOS o Windows, una versión de GitHub, dist-tags de repositorios privados, imágenes de Docker, artefactos móviles o descargas del sitio web.
- Cada versión final normal publica conjuntamente el paquete de npm, la aplicación de macOS, el APK independiente firmado de Android y los instaladores firmados de Windows Hub. Las versiones beta normalmente validan y publican primero la ruta de npm/paquetes; la compilación, firma, notarización y promoción de aplicaciones nativas se reservan para la versión final normal, salvo solicitud explícita.

## Cadencia de versiones

- Las versiones avanzan primero por beta; stable solo llega después de validar la beta más reciente
- Normalmente, los responsables crean las versiones desde una rama `release/YYYY.M.PATCH` creada a partir de la versión actual de `main`, para que la validación y las correcciones de la versión no bloqueen el desarrollo nuevo en `main`
- Si una etiqueta beta ya se ha enviado o publicado y necesita una corrección, los responsables crean la siguiente etiqueta `-beta.N` en lugar de eliminar o recrear la anterior
- El procedimiento detallado de publicación, las aprobaciones, las credenciales y las notas de recuperación son exclusivos de los responsables

## Publicación mensual de estabilidad extendida solo en npm

Esta es una excepción específica al procedimiento normal de publicación que se
describe más adelante. Para un mes completado `YYYY.M`, se debe crear `extended-stable/YYYY.M.33`; se deben publicar
`vYYYY.M.33` y los parches de mantenimiento posteriores desde esa misma rama. La etiqueta
de versión, la punta de la rama, el checkout, la versión del paquete, la comprobación previa de npm y la ejecución de la
Validación completa de la versión deben identificar el mismo commit. La rama protegida `main` ya debe
contener una versión final de un mes natural estrictamente posterior por debajo del parche
`33`; los parches de mantenimiento continúan siendo aptos después de que `main` avance más de un
mes.

En la rama exacta de estabilidad extendida, se debe incrementar el paquete raíz a `YYYY.M.P`, ejecutar
`pnpm release:prep` y comprobar que todos los paquetes de extensiones publicables tengan la
misma versión. Se deben confirmar y enviar todos los cambios generados, crear y enviar la
etiqueta inmutable `vYYYY.M.P` en ese commit y registrar el SHA completo resultante.
Los flujos de trabajo consumen este árbol preparado; no incrementan ni sincronizan
las versiones automáticamente.

Se deben ejecutar la comprobación previa de npm y la Validación completa de la versión desde la punta exacta de esa rama
preparada y, después, guardar los ID de ambas ejecuciones y el intento correcto de ejecución de la Validación completa de la versión:

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
independiente del dist-tag de npm `extended-stable` y se mantiene
intencionadamente sin cambios.

Cuando ambas ejecuciones finalicen correctamente, se deben publicar todos los plugins oficiales publicables en npm desde la
punta exacta de la misma rama. El parche `P` debe ser `33` o superior. Se debe proporcionar el SHA completo de la versión
como `ref`, esperar a que finalicen toda la matriz y la lectura de verificación del registro y, después, guardar el
ID de la ejecución correcta de Plugin NPM Release:

```bash
RELEASE_SHA="$(git rev-parse HEAD)"
gh workflow run plugin-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f publish_scope=all-publishable \
  -f ref="$RELEASE_SHA" \
  -f npm_dist_tag=extended-stable
```

El flujo de trabajo usa el inventario normal preparado de paquetes `all-publishable`,
incluidos los paquetes cuyo código fuente no haya cambiado. Antes de finalizar correctamente, verifica cada paquete exacto
y cada etiqueta de Plugin `extended-stable`. Si falla una ejecución parcial,
se debe volver a ejecutar el mismo comando: se reutilizan los paquetes ya publicados, se concilian las etiquetas de Plugin
ausentes u obsoletas en el entorno de publicación de npm y la
lectura final de verificación continúa abarcando el conjunto completo de paquetes.

Cuando el flujo de trabajo de plugins finalice correctamente y el entorno de publicación de npm esté listo,
se debe publicar el tarball exacto de la comprobación previa del núcleo. La publicación del núcleo comprueba que la
ejecución de plugins referenciada sea `completed/success` en la misma rama canónica y con el
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

Para un fork o ensayo no destinado a producción que intencionadamente no pueda cumplir la
política mensual de `.33` o de mes de la rama protegida `main`, se debe añadir
`-f bypass_extended_stable_guard=true` tanto a la comprobación previa de npm como a los
despachos de publicación. El valor predeterminado es `false`. La omisión solo se acepta con
`npm_dist_tag=extended-stable` y se registra en el resumen del flujo de trabajo.
No omite la referencia canónica del flujo de trabajo `extended-stable/YYYY.M.33`,
la igualdad entre la punta de la rama, la etiqueta y el checkout, la sintaxis de la etiqueta final, la igualdad entre la versión
del paquete y la etiqueta, la identidad de las ejecuciones y del manifiesto referenciados, la procedencia del tarball,
la aprobación del entorno, la lectura de verificación del registro ni las pruebas de reparación del selector.

El flujo de trabajo de publicación comprueba las identidades de las ejecuciones referenciadas de comprobación previa, validación y plugins,
el resumen del tarball preparado y los selectores del registro del núcleo.
Después de que el flujo de trabajo finalice correctamente, se debe confirmar el resultado de forma independiente:

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

Ambos comandos deben devolver `YYYY.M.P`. Si la publicación se completa correctamente, pero falla la
lectura de verificación del selector, no se debe volver a publicar la versión inmutable del paquete. Se debe usar el
único comando de reparación `npm dist-tag add openclaw@YYYY.M.P extended-stable`
que aparece en el resumen de ejecución permanente del flujo de trabajo fallido y, después, repetir ambas
lecturas de verificación independientes. La reversión al selector anterior es una decisión independiente del operador,
no la ruta de reparación de la lectura de verificación.

La documentación pública de asistencia designa inicialmente Slack, Discord y Codex como
superficies de plugins con estabilidad extendida cubiertas. Esa lista es una declaración de compatibilidad, no
una lista de permitidos del código de publicación: todos los plugins oficiales publicables en npm siguen la
misma ruta de publicación con la versión exacta.

La lista de comprobación normal que aparece a continuación continúa gestionando beta, `latest`, la versión de GitHub,
los plugins, macOS, Windows y la publicación en otras plataformas. No se deben ejecutar esos
pasos para esta ruta de estabilidad extendida solo en npm.

## Lista de comprobación del operador para versiones normales

Esta lista de comprobación representa públicamente el flujo de publicación. Las credenciales privadas, la firma, la notarización, la recuperación de dist-tags y los detalles de reversión de emergencia permanecen en el manual de versiones exclusivo de los responsables.

1. Se debe comenzar desde la versión actual de `main`: obtener los cambios más recientes, confirmar que el commit de destino esté enviado y comprobar que la CI de `main` esté lo bastante correcta como para crear una rama.
2. Se debe crear `release/YYYY.M.PATCH` a partir de ese commit. Los backports son opcionales; solo debe aplicarse el conjunto seleccionado por el operador. Se deben incrementar todas las ubicaciones de versión requeridas, ejecutar `pnpm release:prep`, finalizar las correcciones de la versión y los forward-ports necesarios, y revisar `src/plugins/compat/registry.ts` junto con `src/commands/doctor/shared/deprecation-compat.ts`.
3. Se debe inmovilizar el commit completo del producto anterior al registro de cambios como **SHA del código**. Se debe ejecutar la comprobación previa determinista del código fuente y, después, usar `node scripts/full-release-validation-at-sha.mjs --sha <code-sha> --target-ref release/YYYY.M.PATCH`. Esto fija herramientas de flujo de trabajo de confianza mientras toda la matriz de Vitest, Docker, control de calidad, paquetes y rendimiento se ejecuta sobre el SHA exacto del código.
4. Los fallos deben clasificarse antes de editar. Un fallo del producto o del código crea un nuevo SHA del código y exige una validación completa correcta de ese SHA. Un fallo del flujo de trabajo, el entorno de pruebas, las credenciales, la aprobación o la infraestructura se corrige en su superficie propietaria y se vuelve a ejecutar con el mismo SHA del código.
5. Solo cuando el SHA del código esté validado, se debe generar la sección superior de `CHANGELOG.md` a partir de los PR fusionados y los commits directos desde la última etiqueta publicada accesible. Las entradas deben estar orientadas al usuario y no contener duplicados. Cuando una etiqueta publicada divergente o un forward-port posterior vuelva a asociar PR ya publicados, se debe proporcionar explícitamente como `--shipped-ref`.
6. Solo se debe confirmar `CHANGELOG.md`. Este commit es el **SHA de la versión**. La diferencia completa entre el SHA del código y el SHA de la versión debe ser exactamente `CHANGELOG.md`; cualquier otra ruta modificada devuelve la publicación al paso 2.
7. Se debe ejecutar la Validación completa de la versión fijada por SHA para el SHA de la versión con la reutilización de pruebas habilitada. El proceso principal ligero debe registrar `changelog-only-release-v1`, apuntar al SHA del código validado y no despachar ninguna ejecución secundaria del producto. Esto reutiliza las pruebas del producto; no reutiliza los bytes del paquete.
8. Se debe ejecutar `OpenClaw NPM Release` con `preflight_only=true` sobre el SHA o la etiqueta de la versión. Se debe guardar el valor correcto de `preflight_run_id`. Esto compila y comprueba los bytes exactos del paquete que incluyen el registro de cambios final.
9. Se debe etiquetar el SHA de la versión y, después, ejecutar el asistente de candidatos con el proceso principal correcto de validación del SHA de la versión y la comprobación previa de npm, en lugar de volver a despachar cualquiera de los dos:

   ```bash
   pnpm release:candidate -- \
     --tag vYYYY.M.PATCH-beta.N \
     --full-release-run <release-sha-validation-run-id> \
     --npm-preflight-run <preflight-run-id> \
     --skip-dispatch
   ```

   Para la versión estable, pase también `--windows-node-tag vX.Y.Z`. El auxiliar verifica la procedencia de las notas de la versión, los bytes de la comprobación preliminar de npm, la prueba de instalación/actualización de Parallels, la prueba del paquete de Telegram y los planes de publicación de plugins; después, muestra el comando de publicación.

   `OpenClaw Release Publish` envía los paquetes de plugins seleccionados o todos los publicables a npm y el mismo conjunto a ClawHub en paralelo; después, una vez que la publicación de los plugins en npm se completa correctamente, promueve el artefacto preparado de comprobación preliminar de npm de OpenClaw con el dist-tag correspondiente. El checkout de la versión continúa siendo la raíz del producto y los datos, mientras que la planificación y la verificación final se ejecutan desde el checkout exacto y de confianza del código fuente del flujo de trabajo, para que un commit de versión anterior no pueda utilizar silenciosamente herramientas de publicación obsoletas. Antes de iniciar cualquier proceso secundario de publicación, renderiza y almacena en caché el cuerpo exacto de la versión de GitHub. Cuando la sección completa correspondiente a `CHANGELOG.md` se ajusta al límite de 125,000 caracteres de GitHub y al límite de seguridad correspondiente de 125,000 bytes del renderizador, la página contiene esa sección exacta de `## YYYY.M.PATCH`, incluido su encabezado. Cuando la sección de origen no cabe, la página conserva las notas editoriales agrupadas exactas y sustituye el registro de contribuciones sobredimensionado por un enlace estable al registro completo en `CHANGELOG.md` fijado a la etiqueta; nunca se publican registros parciales ni viñetas truncadas. El flujo de trabajo elige ese cuerpo completo o compacto antes de añadir `### Release verification`; si la parte final de la prueba superara el límite, conserva el cuerpo canónico y utiliza en su lugar la evidencia adjunta inmutable. Las versiones estables publicadas en npm `latest` se convierten en la versión más reciente de GitHub, mientras que las versiones estables de mantenimiento conservadas en npm `beta` se crean con GitHub `latest=false`. El flujo de trabajo también carga en la versión de GitHub la evidencia de dependencias de la comprobación preliminar, el manifiesto de validación completa y la evidencia de verificación del registro posterior a la publicación para responder a incidentes posteriores a la versión. Muestra inmediatamente los identificadores de las ejecuciones secundarias, aprueba automáticamente las puertas del entorno de publicación que el token del flujo de trabajo tenga permiso para aprobar, resume los trabajos secundarios fallidos con las partes finales de los registros, crea por adelantado el borrador de la página de la versión de GitHub y promueve los recursos de Windows y Android simultáneamente con la publicación de OpenClaw en npm, completa la página de la versión y la evidencia de dependencias cuando esas etapas se realizan correctamente, espera a ClawHub siempre que se publique OpenClaw en npm y, después, ejecuta el verificador beta de la rama principal de confianza y carga evidencia posterior a la publicación para la versión de GitHub, el paquete de npm, los paquetes de plugins de npm seleccionados, los paquetes de ClawHub seleccionados, los identificadores de las ejecuciones secundarias y el identificador opcional de la ejecución de Telegram en NPM. El verificador de arranque de ClawHub requiere la ruta y el SHA exactos del flujo de trabajo de la rama principal de confianza, los intentos de ejecución del productor y del terminal, el SHA de la versión, el conjunto de paquetes solicitado, la tupla inmutable del artefacto del paquete y el artefacto terminal de lectura del registro; no se acepta una ejecución correcta heredada de una referencia de versión.

   Después, ejecute la aceptación del paquete posterior a la publicación con el paquete `openclaw@YYYY.M.PATCH-beta.N` o `openclaw@beta` publicado. Si una versión preliminar enviada o publicada necesita una corrección, cree el siguiente número de versión preliminar correspondiente; nunca elimine ni reescriba el anterior.

10. Tras un intento de publicación fallido, mantenga sin cambios el SHA de la versión, salvo que el fallo demuestre un defecto del producto o del registro de cambios. Reanude los procesos secundarios y artefactos inmutables que se completaron correctamente; nunca vuelva a compilar ni publicar una versión de paquete que ya se haya completado correctamente.
11. Para la versión estable, continúe solo después de que la versión beta o candidata evaluada disponga de la evidencia de validación requerida. La publicación estable en npm también pasa por `OpenClaw Release Publish` y reutiliza el artefacto de comprobación preliminar correcto mediante `preflight_run_id`. La preparación de la versión estable para macOS también requiere los elementos empaquetados `.zip`, `.dmg`, `.dSYM.zip` y el elemento `appcast.xml` actualizado en `main`; el flujo de trabajo de publicación de macOS publica automáticamente el appcast firmado en el elemento público `main` después de verificar los recursos de la versión, o abre/actualiza un PR del appcast si la protección de la rama bloquea el envío directo. La preparación de Windows Hub para la versión estable requiere los recursos firmados `OpenClawCompanion-Setup-x64.exe`, `OpenClawCompanion-Setup-arm64.exe` y `OpenClawCompanion-SHA256SUMS.txt` en la versión de GitHub de OpenClaw. Pase la etiqueta exacta de la versión firmada `openclaw/openclaw-windows-node` como `windows_node_tag` y su mapa de resúmenes del instalador aprobado para la versión candidata como `windows_node_installer_digests`; `OpenClaw Release Publish` conserva el borrador de la versión, envía `Windows Node Release` y verifica los tres recursos antes de la publicación.
12. Después de la publicación, ejecute el verificador posterior a la publicación de npm, la prueba E2E independiente y opcional de Telegram con el paquete publicado en npm cuando se necesite una prueba del canal posterior a la publicación, la promoción del dist-tag cuando sea necesaria, verifique la página generada de la versión de GitHub, ejecute los pasos del anuncio de la versión y, después, complete el [cierre de la versión estable en la rama principal](#stable-main-closeout) antes de dar por finalizada una versión estable.

## Cierre de la versión estable en la rama principal

La publicación estable no está completa hasta que `main` contenga el estado real de la versión publicada.

1. Parta de la versión más reciente y actualizada de `main`. Audite `release/YYYY.M.PATCH` con respecto a ella e incorpore los cambios reales ausentes de `main`. No fusione a ciegas en la versión más reciente de `main` adaptadores de compatibilidad, pruebas o validación exclusivos de la versión.
2. Para la ruta normal, establezca `main` en la versión estable publicada. Un cierre tardío puede utilizar `main` después de que haya avanzado a una versión CalVer estable posterior de OpenClaw; no reduzca la versión de un ciclo de publicación ya iniciado únicamente para cerrar la versión anterior. El validador sigue requiriendo la sección exacta del registro de cambios publicado y la entrada del appcast, y registra la versión y el SHA reales de `main`. Ejecute `pnpm release:prep` después de cualquier cambio de la versión raíz y, a continuación, `pnpm deps:shrinkwrap:generate`.
3. Haga que la sección `## YYYY.M.PATCH` de `CHANGELOG.md` en `main` coincida exactamente con la rama de la versión etiquetada. Incluya la actualización estable de `appcast.xml` cuando la versión para Mac haya publicado una.
4. No añada `YYYY.M.PATCH+1`, una versión beta ni una sección futura vacía del registro de cambios a `main` hasta que el operador inicie explícitamente ese ciclo de publicación.
5. Ejecute `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check` y `OPENCLAW_TESTBOX=1 pnpm check:changed`. Envíe los cambios y, después, verifique que `origin/main` contiene la versión publicada y el registro de cambios antes de dar por finalizada la versión estable.
6. Mantenga actualizadas las variables del repositorio `RELEASE_ROLLBACK_DRILL_ID` y `RELEASE_ROLLBACK_DRILL_DATE` después de cada simulacro privado de reversión.

`OpenClaw Stable Main Closeout` parte del envío a `main` que contiene la versión publicada, el registro de cambios y el appcast después de la publicación estable. Lee la evidencia inmutable posterior a la publicación para vincular la etiqueta publicada con sus ejecuciones de Validación completa de la versión y Publicación; después, verifica el estado estable de la rama principal, la versión, el período obligatorio de observación de la versión estable y la evidencia de rendimiento bloqueante. Adjunta un manifiesto de cierre inmutable y su suma de comprobación a la versión de GitHub. El desencadenador automático de envío omite las versiones heredadas anteriores a la evidencia inmutable posterior a la publicación y nunca considera esa omisión como un cierre completado.

Un cierre completo requiere tanto los recursos como una suma de comprobación coincidente. Un manifiesto parcial vuelve a reproducir el SHA de `main` y el simulacro de reversión que tiene registrados para regenerar bytes idénticos; después, adjunta la suma de comprobación ausente. Un par no válido, o una suma de comprobación sin manifiesto, continúa siendo bloqueante. Una ejecución desencadenada por un envío sin las variables del repositorio del simulacro de reversión se omite sin completar el cierre; la ausencia de un registro del simulacro, o que este tenga más de 90 días, sigue bloqueando el cierre manual respaldado por evidencia. Los comandos privados de recuperación permanecen en el manual operativo exclusivo para responsables de mantenimiento. Utilice el envío manual solo para reparar o volver a reproducir un cierre estable respaldado por evidencia.

Si el proceso principal de Publicación de la versión solo falló después de adjuntar evidencia inmutable de npm/plugins, repare y publique primero todos los recursos de las plataformas estables. Después, un responsable de mantenimiento puede enviar manualmente el cierre con `allow_failed_publish_recovery=true`; ese modo solo acepta un proceso principal fallido que haya finalizado y, además, requiere los contratos exactos de los recursos de Android y Windows, los resúmenes SHA-256 de GitHub, la verificación de sumas de comprobación, la procedencia de Android y una promoción correcta de Windows enviada por el proceso principal, cuyas comprobaciones de Authenticode y resúmenes aprobados para la versión candidata coincidan con los instaladores publicados, junto con las comprobaciones normales de macOS/appcast. El cierre automático por envío nunca habilita este modo de recuperación.

Una etiqueta de corrección alternativa heredada puede reutilizar la evidencia del paquete base solo cuando la etiqueta de corrección se resuelva al mismo commit de origen que la etiqueta estable base. Su versión para Android reutiliza el APK verificado de la etiqueta base y añade la procedencia de la etiqueta de corrección. Una corrección con un origen diferente debe publicar y verificar su propia evidencia del paquete y utilizar un valor de Android `versionCode` superior.

## Comprobación preliminar de la versión

- Ejecute `pnpm check:test-types` antes de la comprobación preliminar de la versión para que las pruebas de TypeScript sigan estando cubiertas fuera de la puerta local más rápida `pnpm check`.
- Ejecute `pnpm check:architecture` antes de la comprobación preliminar de la versión para que las comprobaciones más amplias de ciclos de importación y límites de arquitectura estén correctas fuera de la puerta local más rápida.
- Ejecute `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que los artefactos de versión esperados de `dist/*` y el paquete de Control UI existan para el paso de validación del paquete.
- Ejecute `pnpm release:prep` después de incrementar la versión raíz y antes de etiquetar. Ejecuta todos los generadores deterministas de la versión que suelen quedar desfasados después de un cambio de versión, configuración o API: versiones de plugins, archivos shrinkwrap de npm, inventario de plugins, esquema de configuración base, metadatos de configuración de canales incluidos, línea base de la documentación de configuración, exportaciones del SDK de plugins y línea base de la API del SDK de plugins. `pnpm release:check` vuelve a ejecutar esas protecciones en modo de comprobación (además de una comprobación del presupuesto de la superficie del SDK de plugins) e informa en una sola pasada de todos los fallos por desviaciones generadas antes de ejecutar las comprobaciones de publicación de paquetes.
- De forma predeterminada, la sincronización de versiones de plugins actualiza a la versión publicada de OpenClaw el paquete de ejecución publicable `@openclaw/ai`, las versiones de los paquetes de plugins oficiales y los límites mínimos existentes de `openclaw.compat.pluginApi`. Trate ese campo como el límite mínimo de la API del SDK/entorno de ejecución del plugin, no solo como una copia de la versión del paquete: para las versiones exclusivas de plugins que permanezcan intencionadamente compatibles con hosts de OpenClaw anteriores, conserve el límite mínimo en la API del host compatible más antiguo y documente esa decisión en la prueba de publicación del plugin.
- Ejecute el flujo de trabajo manual `Full Release Validation` antes de aprobar la versión para iniciar todos los entornos de pruebas previas a la versión desde un único punto de entrada. Acepta una rama, una etiqueta o un SHA completo de commit, envía manualmente `CI` y envía `OpenClaw Release Checks` para las rutas de prueba rápida de instalación, aceptación de paquetes, comprobaciones de paquetes entre sistemas operativos, paridad de QA Lab, Matrix y Telegram. Las ejecuciones estables y completas siempre incluyen pruebas exhaustivas en vivo/E2E y un período de observación de la ruta de publicación de Docker; `run_release_soak=true` se conserva para un período de observación beta explícito. La Aceptación de paquetes proporciona la prueba E2E canónica del paquete de Telegram durante la validación de la versión candidata, lo que evita un segundo proceso de consulta en vivo simultáneo.

  Proporcione `release_package_spec` después de publicar una versión beta para reutilizar el paquete de npm publicado en las comprobaciones de la versión, la Aceptación de paquetes y la prueba E2E del paquete de Telegram sin volver a compilar el archivo tar de la versión. Proporcione `npm_telegram_package_spec` solo cuando Telegram deba utilizar un paquete publicado diferente del utilizado en el resto de la validación de la versión. Proporcione `package_acceptance_package_spec` cuando la Aceptación de paquetes deba utilizar un paquete publicado diferente de la especificación del paquete de la versión. Proporcione `evidence_package_spec` cuando el informe de evidencia de la versión deba demostrar que la validación coincide con un paquete publicado en npm sin forzar la prueba E2E de Telegram.

  ```bash
  node scripts/full-release-validation-at-sha.mjs \
    --sha <code-sha> \
    --target-ref release/YYYY.M.PATCH
  ```

- Ejecute el flujo de trabajo manual `Package Acceptance` cuando necesite una verificación por un canal secundario para un paquete candidato mientras continúa el trabajo de publicación. Use `source=npm` para `openclaw@beta`, `openclaw@latest` o una versión de publicación exacta; `source=ref` para empaquetar una rama, etiqueta o SHA de confianza de `package_ref` con el entorno de pruebas `workflow_ref` actual; `source=url` para un tarball HTTPS público con un SHA-256 obligatorio y una política estricta de URL públicas; `source=trusted-url` para una política de origen de confianza con nombre que use obligatoriamente `trusted_source_id` y SHA-256; o `source=artifact` para un tarball cargado por otra ejecución de GitHub Actions.

  El flujo de trabajo resuelve el candidato como `package-under-test`, reutiliza el programador de publicaciones E2E de Docker con ese tarball y puede ejecutar el control de calidad de Telegram con el mismo tarball mediante `telegram_mode=mock-openai` o `telegram_mode=live-frontier`. Cuando los carriles de Docker seleccionados incluyen `published-upgrade-survivor`, el artefacto del paquete es el candidato y `published_upgrade_survivor_baseline` selecciona la referencia publicada. `update-restart-auth` usa el paquete candidato tanto como CLI instalada como paquete sometido a prueba, de modo que ejercita la ruta de reinicio gestionado del comando de actualización del candidato.

  Ejemplo:

  ```bash
  gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai
  ```

  Perfiles comunes:
  - `smoke`: carriles de instalación/canal/agente, red del Gateway y recarga de configuración
  - `package`: carriles nativos del artefacto para paquete/actualización/reinicio/plugins sin OpenWebUI ni ClawHub en vivo
  - `product`: perfil de paquete más canales MCP, limpieza de Cron/subagentes, búsqueda web de OpenAI y OpenWebUI
  - `full`: segmentos de la ruta de publicación de Docker con OpenWebUI
  - `custom`: selección exacta de `docker_lanes` para una repetición específica

- Ejecute directamente el flujo de trabajo manual `CI` cuando solo necesite una cobertura determinista de CI normal para el candidato a publicación. Las ejecuciones manuales de CI omiten la delimitación por cambios y fuerzan los fragmentos de Linux Node, los fragmentos de plugins incluidos, los fragmentos de contratos de plugins y canales, la compatibilidad con Node 22, `check-*`, `check-additional-*`, las comprobaciones rápidas de artefactos compilados, las comprobaciones de documentación, las Skills de Python y los carriles de Windows, macOS e internacionalización de Control UI. Las ejecuciones manuales independientes de CI solo ejecutan Android cuando se inician con `include_android=true`; `Full Release Validation` pasa esa entrada a su ejecución de CI secundaria.

  ```bash
  gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true
  ```

- Ejecute `pnpm qa:otel:smoke` al validar la telemetría de la publicación. Ejercita el laboratorio de control de calidad mediante un receptor OTLP/HTTP local y verifica la exportación de trazas, métricas y registros, así como los atributos de traza acotados y la censura de contenido e identificadores, sin requerir Opik, Langfuse ni otro recopilador externo.
- Ejecute `pnpm qa:otel:collector-smoke` al validar la compatibilidad del recopilador. Enruta la misma exportación OTLP del laboratorio de control de calidad a través de un contenedor Docker real de OpenTelemetry Collector antes de las comprobaciones del receptor local.
- Ejecute `pnpm qa:prometheus:smoke` al validar la recopilación protegida de Prometheus. Ejercita el laboratorio de control de calidad, rechaza las recopilaciones no autenticadas y verifica que las familias de métricas críticas para la publicación no contengan contenido de solicitudes, identificadores sin procesar, tokens de autenticación ni rutas locales.
- Ejecute `pnpm qa:observability:smoke` para ejecutar consecutivamente los carriles de comprobación rápida de OpenTelemetry y Prometheus desde el código fuente.
- Ejecute `pnpm release:check` antes de cada publicación etiquetada.
- La comprobación preliminar de `OpenClaw NPM Release` genera pruebas de dependencias de la publicación antes de empaquetar el tarball de npm. La barrera de vulnerabilidades de avisos de npm bloquea la publicación. El riesgo del manifiesto transitivo, la superficie de propiedad/instalación de dependencias y los informes de cambios de dependencias son únicamente pruebas de la publicación. El informe de cambios de dependencias compara el candidato a publicación con la etiqueta de publicación anterior accesible. La comprobación preliminar carga las pruebas de dependencias como `openclaw-release-dependency-evidence-<tag>` y también las incorpora en `dependency-evidence/` dentro del artefacto preliminar de npm preparado. La ruta de publicación real reutiliza ese artefacto preliminar y después adjunta las mismas pruebas a la publicación de GitHub como `openclaw-<version>-dependency-evidence.zip`.
- Ejecute `OpenClaw Release Publish` para la secuencia de publicación que realiza cambios después de que exista la etiqueta. Inicie las publicaciones beta y estables habituales desde `main` de confianza; la etiqueta de publicación seguirá seleccionando el commit de destino exacto y puede apuntar a `release/YYYY.M.PATCH`. Las publicaciones alfa de Tideclaw permanecen en su rama alfa correspondiente. Proporcione el `preflight_run_id` de npm de OpenClaw correcto, el `full_release_validation_run_id` correcto y el `full_release_validation_run_attempt` exacto, y mantenga el ámbito predeterminado de publicación de plugins `all-publishable`, salvo que esté ejecutando deliberadamente una reparación específica. El flujo de trabajo serializa la publicación de plugins en npm, la publicación de plugins en ClawHub y la publicación de OpenClaw en npm para que el paquete principal no se publique antes que sus plugins externalizados; la promoción de Windows y Android se ejecuta simultáneamente con la publicación principal en npm en la página de publicación en borrador. Las repeticiones de publicación se pueden reanudar: una versión principal de npm ya publicada omite la ejecución principal después de que el flujo de trabajo demuestre que el tarball del registro coincide con el artefacto preliminar de la etiqueta, y la promoción de Windows/Android se omite cuando la publicación ya contiene el contrato de artefactos verificado, por lo que un nuevo intento solo repite las etapas fallidas. Las reparaciones específicas únicamente de plugins requieren `plugin_publish_scope=selected` y una lista de plugins no vacía. Las ejecuciones `all-publishable` únicamente de plugins requieren pruebas completas e inmutables de la comprobación preliminar y de la validación completa de la publicación; se rechazan las pruebas parciales.
- La versión estable de `OpenClaw Release Publish` requiere un `windows_node_tag` exacto después de que exista la publicación `openclaw/openclaw-windows-node` correspondiente que no sea preliminar, además del mapa `windows_node_installer_digests` aprobado para el candidato. Antes de iniciar cualquier flujo secundario de publicación, verifica que la publicación de origen esté publicada, no sea preliminar, contenga los instaladores x64/ARM64 requeridos y siga coincidiendo con ese mapa aprobado. Después inicia `Windows Node Release` mientras la publicación de OpenClaw aún es un borrador y transmite sin cambios el mapa fijado de resúmenes de los instaladores. El flujo de trabajo secundario descarga los instaladores firmados de Windows Hub desde esa etiqueta exacta, los compara con los resúmenes fijados, verifica en un ejecutor de Windows que sus firmas Authenticode usen el firmante previsto de OpenClaw Foundation, crea un manifiesto SHA-256 y carga los instaladores junto con el manifiesto en la publicación canónica de OpenClaw en GitHub; después vuelve a descargar los artefactos promocionados y verifica su pertenencia al manifiesto y sus hashes. El flujo principal verifica el contrato actual de artefactos x64, ARM64 y de suma de comprobación antes de la publicación. La recuperación directa rechaza los nombres de artefactos `OpenClawCompanion-*` inesperados antes de sustituir los artefactos esperados del contrato por los bytes fijados del origen.

  Inicie manualmente `Windows Node Release` solo para la recuperación y proporcione siempre una etiqueta exacta, nunca `latest`, junto con el mapa JSON `expected_installer_digests` explícito de la publicación de origen aprobada. Los enlaces de descarga del sitio web deben apuntar a las URL exactas de los artefactos de la publicación de OpenClaw para la publicación estable actual, o a `releases/latest/download/...` solo después de verificar que la redirección a la versión más reciente de GitHub apunte a esa misma publicación; no enlace únicamente a la página de publicación del repositorio complementario.

- Las comprobaciones de lanzamiento ahora se ejecutan en un flujo de trabajo manual independiente: `OpenClaw Release Checks`. También ejecuta el carril de paridad simulada de QA Lab, además del perfil de lanzamiento de Matrix y el carril de QA de Telegram antes de la aprobación del lanzamiento. Los carriles en vivo usan el entorno `qa-live-shared`; Telegram también usa arrendamientos de credenciales de CI de Convex. Ejecute el flujo de trabajo manual `QA-Lab - All Lanes` con `matrix_profile=all` cuando quiera todos los escenarios de Matrix mantenidos; el flujo de trabajo distribuye esa selección entre los perfiles de transporte, contenido multimedia y E2EE para mantener la comprobación completa dentro de los tiempos de espera de cada trabajo.
- La validación en tiempo de ejecución de instalación y actualización entre sistemas operativos forma parte de los flujos públicos `OpenClaw Release Checks` y `Full Release Validation`, que llaman directamente al flujo de trabajo reutilizable `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`. Esta separación es intencional: mantiene la ruta real de lanzamiento de npm breve, determinista y centrada en los artefactos, mientras que las comprobaciones en vivo más lentas permanecen en su propio carril para que no retrasen ni bloqueen la publicación.
- Las comprobaciones de lanzamiento que contienen secretos deben iniciarse mediante `Full Release Validation` o desde la referencia del flujo de trabajo `main`/release para que la lógica del flujo de trabajo y los secretos permanezcan controlados.
- `OpenClaw Release Checks` acepta una rama, una etiqueta o un SHA completo de confirmación, siempre que la confirmación resuelta sea accesible desde una rama o etiqueta de lanzamiento de OpenClaw.
- La comprobación preliminar exclusivamente de validación `OpenClaw NPM Release` también acepta el SHA completo de 40 caracteres de la confirmación actual de la rama del flujo de trabajo sin exigir una etiqueta enviada. Esa ruta de SHA es exclusivamente para validación y no puede promoverse a una publicación real. En el modo SHA, el flujo de trabajo sintetiza `v<package.json version>` solo para la comprobación de metadatos del paquete; la publicación real sigue requiriendo una etiqueta de lanzamiento real.
- Ambos flujos de trabajo mantienen la ruta real de publicación y promoción en ejecutores alojados en GitHub, mientras que la ruta de validación no mutante puede usar los ejecutores Linux de mayor capacidad de Blacksmith.
- Ese flujo de trabajo ejecuta `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` usando los secretos del flujo de trabajo `OPENAI_API_KEY` y `ANTHROPIC_API_KEY`.
- La comprobación preliminar del lanzamiento de npm ya no espera al carril independiente de comprobaciones de lanzamiento.
- Antes de etiquetar localmente una versión candidata, ejecute `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`. El asistente ejecuta las protecciones rápidas del lanzamiento, las comprobaciones de lanzamiento de plugins para npm/ClawHub, la compilación, la compilación de la interfaz de usuario y `release:openclaw:npm:check` en el orden que detecta los errores habituales que bloquean la aprobación antes de que comience el flujo de trabajo de publicación de GitHub.
- Ejecute `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts` (o la etiqueta correspondiente de versión preliminar/corrección) antes de la aprobación.
- Después de publicar en npm, ejecute `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH` (o la versión beta/corrección correspondiente) para verificar la ruta de instalación desde el registro publicado en un prefijo temporal nuevo.
- Después de publicar una versión beta, ejecute `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` para verificar la incorporación desde el paquete instalado, la configuración de Telegram y el E2E real de Telegram con el paquete de npm publicado mediante el grupo compartido de credenciales arrendadas de Telegram. Para ejecuciones puntuales locales, los responsables de mantenimiento pueden omitir las variables de Convex y proporcionar directamente las tres credenciales de entorno `OPENCLAW_QA_TELEGRAM_*`.
- Para ejecutar la comprobación de humo beta completa posterior a la publicación desde el equipo de un responsable de mantenimiento, use `pnpm release:beta-smoke -- --beta betaN`. El asistente ejecuta la validación de actualización mediante npm y de destino nuevo en Parallels, inicia `NPM Telegram Beta E2E`, consulta periódicamente la ejecución exacta del flujo de trabajo, descarga el artefacto e imprime el informe de Telegram.
- Los responsables de mantenimiento pueden ejecutar la misma comprobación posterior a la publicación desde GitHub Actions mediante el flujo de trabajo manual `NPM Telegram Beta E2E`. Es intencionalmente solo manual y no se ejecuta con cada fusión.
- La automatización de lanzamientos para responsables de mantenimiento usa primero la comprobación preliminar y después la promoción:
  - La publicación real en npm debe superar una ejecución correcta de `preflight_run_id` de npm.
  - La orquestación y la comprobación preliminar de las publicaciones beta y estables habituales usan el elemento de confianza `main` con la etiqueta de destino exacta. La publicación y la comprobación preliminar alfa de Tideclaw usan la rama alfa correspondiente.
  - Los lanzamientos estables de npm usan de forma predeterminada `beta`; la publicación estable de npm puede dirigirse explícitamente a `latest` mediante la entrada del flujo de trabajo.
  - La mutación de etiquetas de distribución de npm basada en tokens reside en `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` porque `npm dist-tag add` todavía necesita `NPM_TOKEN`, mientras que el repositorio de origen conserva la publicación exclusiva mediante OIDC.
  - El flujo público `macOS Release` es exclusivamente de validación; cuando una etiqueta solo existe en una rama de lanzamiento, pero el flujo de trabajo se inicia desde `main`, establezca `public_release_branch=release/YYYY.M.PATCH`.
  - La publicación real para macOS debe superar correctamente `preflight_run_id` y `validate_run_id` de macOS.
  - Las rutas de publicación reales promueven los artefactos preparados en lugar de volver a compilarlos.
- Para lanzamientos de corrección estables como `YYYY.M.PATCH-N`, el verificador posterior a la publicación también comprueba la misma ruta de actualización con prefijo temporal desde `YYYY.M.PATCH` hasta `YYYY.M.PATCH-N`, de modo que las correcciones de lanzamiento no puedan dejar silenciosamente las instalaciones globales anteriores con la carga útil de la versión estable base.
- La comprobación preliminar del lanzamiento de npm se cierra ante errores salvo que el archivo tar incluya tanto `dist/control-ui/index.html` como una carga útil `dist/control-ui/assets/` no vacía, para que no volvamos a distribuir un panel de navegador vacío.
- La verificación posterior a la publicación también comprueba que los puntos de entrada de los plugins publicados y los metadatos del paquete estén presentes en la disposición instalada del registro. Un lanzamiento al que le falten cargas útiles de ejecución de plugins no supera el verificador posterior a la publicación y no puede promoverse a `latest`.
- `pnpm test:install:smoke` también aplica el límite `unpackedSize` de empaquetado de npm al archivo tar de actualización candidato, de modo que el E2E del instalador detecte el crecimiento accidental del paquete antes de la ruta de publicación del lanzamiento.
- Si el trabajo de lanzamiento modificó la planificación de CI, los manifiestos de tiempos de extensiones o las matrices de pruebas de extensiones, regenere y revise antes de la aprobación las salidas de matriz `plugin-prerelease-extension-shard` pertenecientes al planificador desde `.github/workflows/plugin-prerelease.yml`, para que las notas de la versión no describan una disposición de CI obsoleta.
- La preparación de una versión estable para macOS también incluye las superficies del actualizador: la versión de GitHub debe terminar con los elementos empaquetados `.zip`, `.dmg` y `.dSYM.zip`; `appcast.xml` en `main` debe apuntar al nuevo archivo zip estable después de la publicación (el flujo de trabajo de publicación para macOS lo confirma automáticamente o abre una PR del appcast cuando se bloquea el envío directo); la aplicación empaquetada debe conservar un identificador de paquete que no sea de depuración, una URL no vacía del canal de Sparkle y un `CFBundleVersion` igual o superior al mínimo canónico de compilación de Sparkle para esa versión.

## Entornos de prueba de lanzamiento

`Full Release Validation` es la forma en que los operadores inician la matriz completa del producto desde un único punto de entrada. Use el asistente para que cada flujo de trabajo secundario se ejecute desde una rama temporal fijada a un SHA de flujo de trabajo `main` de confianza, mientras que la confirmación solicitada permanece como candidata sometida a pruebas:

```bash
pnpm ci:full-release \
  --sha <code-sha> \
  --target-ref release/YYYY.M.PATCH
```

El asistente obtiene el elemento `origin/main` actual, envía `release-ci/<workflow-sha>-...` en esa confirmación de flujo de trabajo de confianza, deduce `beta` a partir de las versiones alfa/beta del paquete y `stable` en los demás casos, inicia `Full Release Validation` desde la rama temporal con `ref=<target-sha>`, verifica que cada `headSha` de flujo de trabajo secundario coincida con el SHA fijado del flujo de trabajo principal y después elimina la rama temporal. Proporcione `-f reuse_evidence=false` para forzar una ejecución nueva, `-f release_profile=full` para la revisión consultiva amplia o `--workflow-sha <trusted-main-sha>` para fijar una confirmación anterior que todavía sea accesible desde el elemento `origin/main` actual. El propio flujo de trabajo nunca escribe referencias del repositorio. Esto mantiene disponibles las herramientas de lanzamiento exclusivas de la rama principal sin añadir confirmaciones de herramientas a la candidata y evita comprobar accidentalmente una ejecución secundaria más reciente de `main`.

Cuando el SHA del código esté en verde, confirme únicamente `CHANGELOG.md` y ejecute el mismo asistente con el SHA de lanzamiento:

```bash
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH
```

El segundo flujo principal solo reutiliza la evidencia del producto cuando GitHub demuestra que el SHA de lanzamiento desciende del SHA del código y que el conjunto completo de rutas modificadas es exactamente `CHANGELOG.md`. Registra `changelog-only-release-v1` y no inicia ningún flujo secundario del producto. La comprobación preliminar de npm y la aceptación de paquete/instalación siguen ejecutándose en el SHA de lanzamiento porque los bytes de su archivo tar cambiaron.

Para un SHA del código nuevo, el flujo de trabajo resuelve el destino, inicia manualmente `CI` y después inicia `OpenClaw Release Checks`. `OpenClaw Release Checks` distribuye la comprobación de humo de instalación, las comprobaciones de lanzamiento entre sistemas operativos, la cobertura en vivo/E2E de la ruta de lanzamiento de Docker cuando se habilitan las pruebas prolongadas, la aceptación de paquetes con el E2E canónico del paquete de Telegram, la paridad de QA Lab, Matrix en vivo y Telegram en vivo. Una ejecución completa/toda solo es aceptable cuando el resumen `Full Release Validation` muestra `normal_ci`, `plugin_prerelease` y `release_checks` como correctos, salvo que una repetición enfocada haya omitido intencionalmente el flujo secundario independiente `Plugin Prerelease`. Use el flujo secundario independiente `npm-telegram` únicamente para repetir de forma enfocada la prueba de un paquete publicado con `release_package_spec` o `npm_telegram_package_spec`. El resumen final del verificador incluye tablas de los trabajos más lentos de cada ejecución secundaria, para que el responsable del lanzamiento pueda ver la ruta crítica actual sin descargar registros.

El flujo secundario de rendimiento del producto solo genera artefactos en esta ruta de lanzamiento. El
flujo general lo inicia con `publish_reports=false`, y la validación se rechaza
salvo que su protección de solo artefactos demuestre que el publicador de informes de Clawgrit permaneció
omitido.

Consulte [Validación completa del lanzamiento](/es/reference/full-release-validation) para conocer la matriz completa de etapas, los nombres exactos de los trabajos del flujo de trabajo, las diferencias entre los perfiles estable y completo, los artefactos y los identificadores para repeticiones enfocadas.

Los flujos de trabajo secundarios se inician desde la referencia de confianza fijada mediante SHA que ejecuta `Full Release Validation`. Cada ejecución secundaria debe usar el SHA exacto del flujo de trabajo principal. No use inicios directos de `--ref main -f ref=<sha>` como comprobación del lanzamiento; use `pnpm ci:full-release --sha <target-sha> --target-ref release/YYYY.M.PATCH`.

Use `release_profile` para seleccionar la amplitud en vivo/de proveedores:

- `beta`: ruta crítica de lanzamiento más rápida para OpenAI/núcleo en vivo y Docker
- `stable`: beta más cobertura estable de proveedores y backends para la aprobación del lanzamiento
- `full`: estable más cobertura consultiva amplia de proveedores y contenido multimedia

La validación estable y completa siempre ejecuta antes de la promoción la revisión exhaustiva en vivo/E2E, la ruta de lanzamiento de Docker y la revisión acotada de supervivencia a actualizaciones publicadas. Use `run_release_soak=true` para solicitar esa misma revisión para una versión beta. Esa revisión abarca los cuatro paquetes estables más recientes, además de las referencias fijadas `2026.4.23` y `2026.5.2` y la cobertura anterior `2026.4.15`, eliminando las referencias duplicadas y distribuyendo cada referencia en su propio trabajo de ejecución de Docker.

`OpenClaw Release Checks` usa la referencia de confianza del flujo de trabajo para resolver una vez la referencia de destino como `release-package-under-test` y reutiliza ese artefacto en las comprobaciones entre sistemas operativos, la aceptación de paquetes y la ruta de lanzamiento de Docker cuando se ejecutan las pruebas prolongadas. Esto mantiene todos los entornos orientados a paquetes sobre los mismos bytes y evita compilaciones repetidas del paquete. Cuando una versión beta ya esté en npm, establezca `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` para que las comprobaciones del lanzamiento descarguen una vez el paquete distribuido, extraigan su SHA de código fuente de compilación desde `dist/build-info.json` y reutilicen ese artefacto en los carriles entre sistemas operativos, aceptación de paquetes, ruta de lanzamiento de Docker y Telegram del paquete.

La comprobación de humo de instalación de OpenAI entre sistemas operativos usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` cuando se establece la variable del repositorio o la organización; de lo contrario, usa `openai/gpt-5.6-luna`, porque este carril comprueba la instalación del paquete, la incorporación, el inicio del Gateway y un turno de agente en vivo, en lugar de comparar el modelo más capaz. La matriz más amplia de proveedores en vivo sigue siendo el lugar para la cobertura específica de cada modelo.

Use estas variantes según la etapa del lanzamiento:

```bash
# Valida el SHA de código con el producto completo.
pnpm ci:full-release \
  --sha <code-sha> \
  --target-ref release/YYYY.M.PATCH

# Valida el SHA de lanzamiento que solo contiene el registro de cambios reutilizando la evidencia del producto del SHA de código.
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH

# Después de publicar una beta, añade la prueba E2E de Telegram con el paquete publicado.
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH \
  -f release_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

No se debe usar el conjunto global completo como primera repetición tras una corrección específica. Si falla una instancia, se debe usar para la siguiente prueba el flujo de trabajo secundario, el trabajo, la vía de Docker, el perfil de paquete, el proveedor de modelos o la vía de control de calidad que haya fallado. Se debe volver a ejecutar el conjunto global completo únicamente cuando la corrección haya cambiado la orquestación compartida del lanzamiento o haya invalidado la evidencia anterior de todas las instancias. El verificador final del conjunto global vuelve a comprobar los identificadores registrados de las ejecuciones de los flujos de trabajo secundarios; por tanto, después de repetir correctamente un flujo de trabajo secundario, se debe volver a ejecutar únicamente el trabajo principal `Verify full validation` que haya fallado.

`rerun_group=all` puede reutilizar una ejecución correcta anterior del conjunto global cuando coincidan el perfil de lanzamiento,
la configuración efectiva de estabilización y las entradas de validación, y el SHA de destino
sea idéntico o el nuevo destino sea un descendiente cuyo conjunto completo de rutas modificadas
sea exactamente `CHANGELOG.md`. La reutilización del destino exacto registra
`exact-target-full-validation-v1`; el SHA de lanzamiento posterior a la validación registra
`changelog-only-release-v1`. Este último reutiliza únicamente la validación del producto. La comprobación
preliminar de npm, los bytes del paquete, la procedencia de las notas de lanzamiento y la aceptación
de instalación y actualización deben seguir ejecutándose con el SHA de lanzamiento. Cualquier cambio
de versión, fuente, contenido generado, dependencia, paquete o destino propiedad del flujo de trabajo
requiere un nuevo SHA de código y una validación completa nueva. Las ejecuciones más recientes del
conjunto global para la misma referencia `release/*` y el mismo grupo de repetición sustituyen
automáticamente a las que estén en curso. Se debe pasar `reuse_evidence=false` para forzar una ejecución
completa nueva.

Para una recuperación acotada, se debe pasar `rerun_group` al conjunto global. `all` es la ejecución real del candidato a lanzamiento, `ci` ejecuta únicamente el flujo secundario de CI normal, `plugin-prerelease` ejecuta únicamente el flujo secundario de plugins exclusivo del lanzamiento, `release-checks` ejecuta todas las instancias de lanzamiento y los grupos de lanzamiento más específicos son `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` y `npm-telegram`. Las repeticiones específicas de `npm-telegram` requieren `release_package_spec` o `npm_telegram_package_spec`; las ejecuciones completas o de todo el conjunto usan la prueba E2E canónica de Telegram con paquetes dentro de Aceptación de paquetes. Las repeticiones específicas entre sistemas operativos pueden añadir `cross_os_suite_filter=windows/packaged-upgrade` u otro filtro de sistema operativo o conjunto. Los fallos en las comprobaciones de lanzamiento de control de calidad bloquean la validación normal del lanzamiento, incluida la desviación obligatoria de herramientas dinámicas de OpenClaw en el nivel estándar. Las ejecuciones alfa de Tideclaw aún pueden tratar como consultivas las vías de comprobación de lanzamiento que no sean de seguridad de paquetes. Con `release_profile=beta`, los conjuntos de proveedores en vivo `Run repo/live E2E validation` son consultivos (advertencias, no bloqueos); los perfiles estable y completo los mantienen como bloqueantes. Cuando `live_suite_filter` solicita explícitamente una vía de control de calidad en vivo sujeta a una puerta, como Discord, WhatsApp o Slack, debe estar habilitada la variable de repositorio `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` correspondiente; de lo contrario, la captura de entradas falla en lugar de omitir silenciosamente la vía.

### Vitest

La instancia de Vitest es el flujo de trabajo secundario manual `CI`. La CI manual omite intencionadamente el alcance basado en cambios y fuerza el grafo normal de pruebas para el candidato a lanzamiento: fragmentos de Linux con Node, fragmentos de plugins incluidos, fragmentos de contratos de plugins y canales, compatibilidad con Node 22, `check-*`, `check-additional-*`, comprobaciones rápidas de artefactos compilados, comprobaciones de documentación, Skills de Python, Windows, macOS e internacionalización de la interfaz de control. Android se incluye cuando `Full Release Validation` ejecuta la instancia porque el conjunto global pasa `include_android=true`; la CI manual independiente requiere `include_android=true` para cubrir Android.

Esta instancia se usa para responder «¿superó el árbol de fuentes el conjunto completo de pruebas normales?». No equivale a la validación del producto en la ruta de lanzamiento. Evidencia que debe conservarse:

- Resumen de `Full Release Validation` que muestra la URL de la ejecución iniciada de `CI`
- Ejecución de `CI` correcta en el SHA de destino exacto
- Nombres de fragmentos fallidos o lentos de los trabajos de CI al investigar regresiones
- Artefactos de tiempos de Vitest, como `.artifacts/vitest-shard-timings.json`, cuando una ejecución necesita análisis de rendimiento

La CI manual solo debe ejecutarse directamente cuando el lanzamiento necesite una CI normal determinista, pero no las instancias de Docker, QA Lab, proveedores en vivo, múltiples sistemas operativos o paquetes. Se debe usar el primer comando para la CI directa sin Android. Se debe añadir `include_android=true` cuando la CI directa del candidato a lanzamiento deba cubrir Android:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

La instancia de Docker reside en `OpenClaw Release Checks` mediante `openclaw-live-and-e2e-checks-reusable.yml`, además del flujo de trabajo `install-smoke` en modo de lanzamiento. Valida el candidato a lanzamiento mediante entornos Docker empaquetados, en lugar de limitarse a pruebas a nivel de código fuente.

La cobertura de Docker para lanzamientos incluye:

- Prueba rápida de instalación completa con la prueba lenta de instalación global de Bun habilitada
- Preparación y reutilización por SHA de destino de la imagen de prueba rápida del Dockerfile raíz, con los trabajos de QR, raíz/Gateway e instalador/Bun ejecutándose como fragmentos separados de pruebas rápidas de instalación
- Vías E2E del repositorio
- Fragmentos de Docker de la ruta de lanzamiento: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, de `plugins-runtime-install-a` a `plugins-runtime-install-h` y `openwebui`
- Cobertura de OpenWebUI en un ejecutor dedicado con gran capacidad de disco cuando se solicite
- Vías divididas de instalación y desinstalación de plugins incluidos, de `bundled-plugin-install-uninstall-0` a `bundled-plugin-install-uninstall-23`
- Conjuntos de proveedores en vivo/E2E y cobertura de modelos en vivo de Docker cuando las comprobaciones de lanzamiento incluyen conjuntos en vivo

Se deben usar los artefactos de Docker antes de repetir una ejecución. El planificador de la ruta de lanzamiento carga `.artifacts/docker-tests/` con registros de las vías, `summary.json`, `failures.json`, tiempos de las fases, el JSON del plan del planificador y comandos de repetición. Para una recuperación específica, se debe usar `docker_lanes=<lane[,lane]>` en el flujo de trabajo reutilizable en vivo/E2E en lugar de repetir todos los fragmentos de lanzamiento. Los comandos de repetición generados incluyen `package_artifact_run_id` anteriores y entradas de imágenes Docker preparadas cuando estén disponibles, de modo que una vía fallida pueda reutilizar el mismo archivo tar y las mismas imágenes de GHCR.

### QA Lab

La instancia de QA Lab también forma parte de `OpenClaw Release Checks`. Es la puerta de lanzamiento para el comportamiento de agentes y el nivel de canal, independiente de Vitest y de la mecánica de paquetes de Docker.

La cobertura de QA Lab para lanzamientos incluye:

- Vía de paridad simulada que compara la vía candidata de OpenAI con la referencia `anthropic/claude-opus-4-8` mediante el paquete de paridad de agentes
- Perfil de lanzamiento del adaptador en vivo de Matrix mediante el entorno `qa-live-shared`
- Vía de control de calidad de Telegram en vivo mediante arrendamientos de credenciales de CI de Convex
- `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`, `pnpm qa:prometheus:smoke` o `pnpm qa:observability:smoke` cuando la telemetría del lanzamiento necesite pruebas locales explícitas

Esta instancia se usa para responder «¿se comporta correctamente el lanzamiento en los escenarios de control de calidad y los flujos de canales en vivo?». Al aprobar el lanzamiento, se deben conservar las URL de los artefactos de las vías de paridad, Matrix y Telegram. La cobertura completa de Matrix sigue disponible como una ejecución manual fragmentada de QA Lab, en lugar de ser la vía crítica predeterminada para el lanzamiento.

### Paquete

La instancia de paquetes es la puerta del producto instalable. Está respaldada por `Package Acceptance` y el resolutor `scripts/resolve-openclaw-package-candidate.mjs`. El resolutor normaliza un candidato en el archivo tar `package-under-test` consumido por las pruebas E2E de Docker, valida el inventario del paquete, registra la versión y el SHA-256 del paquete y mantiene separadas la referencia del entorno del flujo de trabajo y la referencia de origen del paquete.

Fuentes de candidatos compatibles:

- `source=npm`: `openclaw@beta`, `openclaw@latest` o una versión exacta de lanzamiento de OpenClaw
- `source=ref`: empaquetar una rama, etiqueta o SHA de confirmación completo y de confianza de `package_ref` con el entorno `workflow_ref` seleccionado
- `source=url`: descargar un `.tgz` HTTPS público con `package_sha256` obligatorio; se rechazan las credenciales en la URL, los puertos HTTPS no predeterminados, los nombres de host o las direcciones resueltas privadas, internas o de uso especial y las redirecciones no seguras
- `source=trusted-url`: descargar un `.tgz` HTTPS con `package_sha256` y `trusted_source_id` obligatorios desde una política con nombre en `.github/package-trusted-sources.json`; se debe usar para réplicas empresariales propiedad de los mantenedores o repositorios de paquetes privados, en lugar de añadir a `source=url` una omisión de red privada a nivel de entrada
- `source=artifact`: reutilizar un `.tgz` cargado por otra ejecución de GitHub Actions

`OpenClaw Release Checks` ejecuta Aceptación de paquetes con `source=artifact`, el artefacto preparado del paquete de lanzamiento, `suite_profile=custom`, `docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape`, `telegram_mode=mock-openai`. Aceptación de paquetes mantiene la migración, la actualización, la actualización de VPS gestionada desde la raíz, el reinicio tras una actualización con autenticación configurada, la instalación en vivo de Skills de ClawHub, la limpieza de dependencias obsoletas de plugins, los accesorios de plugins sin conexión, la actualización de plugins, el refuerzo del escape de enlaces de comandos de plugins y el control de calidad de paquetes de Telegram con el mismo archivo tar resuelto. Las comprobaciones de lanzamiento bloqueantes usan como referencia predeterminada el paquete publicado más reciente; el perfil beta con `run_release_soak=true`, `release_profile=stable` o `release_profile=full` amplía el barrido de supervivencia a actualizaciones publicadas a `last-stable-4`, además de las referencias fijadas `2026.4.23`, `2026.5.2` y `2026.4.15` con escenarios `reported-issues`. Se debe usar Aceptación de paquetes con `source=npm` para un candidato ya publicado, `source=ref` para un archivo tar local de npm respaldado por un SHA antes de publicarlo, `source=trusted-url` para una réplica empresarial o privada propiedad de los mantenedores, o `source=artifact` para un archivo tar preparado y cargado por otra ejecución de GitHub Actions.

Es el sustituto nativo de GitHub para la mayor parte de la cobertura de paquetes y actualizaciones que antes requería Parallels. Las comprobaciones de lanzamiento entre sistemas operativos siguen siendo importantes para la incorporación, el instalador y el comportamiento específicos de cada sistema operativo, pero la validación de productos de paquetes y actualizaciones debe dar preferencia a Aceptación de paquetes.

La lista de comprobación canónica para validar actualizaciones y plugins es [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins). Se debe usar para decidir qué vía local, de Docker, de Aceptación de paquetes o de comprobación de lanzamiento demuestra un cambio de instalación o actualización de plugins, limpieza de doctor o migración de paquetes publicados. La migración exhaustiva de actualizaciones publicadas desde cada paquete estable `2026.4.23+` es un flujo de trabajo manual `Update Migration` independiente y no forma parte de la CI completa de lanzamiento.

La tolerancia heredada de Aceptación de paquetes está limitada temporalmente de forma intencionada. Los paquetes hasta `2026.4.25` pueden usar la ruta de compatibilidad para carencias de metadatos ya publicadas en npm: entradas privadas del inventario de control de calidad ausentes del archivo tar, ausencia de `gateway install --wrapper`, archivos de parches ausentes del accesorio de Git derivado del archivo tar, ausencia persistente de `update.channel`, ubicaciones heredadas de los registros de instalación de plugins, ausencia de persistencia de registros de instalación del mercado y migración de metadatos de configuración durante `plugins update`. El paquete publicado `2026.4.26` puede emitir advertencias por archivos locales de sellos de metadatos de compilación que ya se hayan distribuido. Los paquetes posteriores deben satisfacer los contratos modernos de paquetes; esas mismas carencias hacen que falle la validación del lanzamiento.

Se deben usar perfiles más amplios de Aceptación de paquetes cuando la cuestión del lanzamiento se refiera a un paquete instalable real:

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

- `smoke`: vías rápidas de instalación de paquetes/canales/agentes, red del Gateway y recarga de configuración
- `package`: contratos de instalación/actualización/reinicio/paquetes de Plugin, además de prueba en vivo de instalación de Skills de ClawHub; este es el valor predeterminado para la comprobación de versiones
- `product`: `package` más canales MCP, limpieza de Cron/subagentes, búsqueda web de OpenAI y OpenWebUI
- `full`: segmentos de la ruta de publicación de Docker con OpenWebUI
- `custom`: lista exacta de `docker_lanes` para repeticiones de ejecución específicas

Para la prueba de Telegram con un paquete candidato, habilite `telegram_mode=mock-openai` o `telegram_mode=live-frontier` en Package Acceptance. El flujo de trabajo pasa el tarball de `package-under-test` resuelto a la vía de Telegram; el flujo de trabajo independiente de Telegram sigue aceptando una especificación de npm publicada para las comprobaciones posteriores a la publicación.

## Automatización habitual de publicación de versiones

Para la publicación beta, de `latest`, de Plugin, de GitHub Release y de plataformas,
`OpenClaw Release Publish` es el punto de entrada habitual con mutaciones. La ruta mensual
de estabilidad extendida solo para npm de `.33+` no utiliza este orquestador. El
flujo de trabajo habitual orquesta los flujos de trabajo de publicadores de confianza en el orden que
requiere la versión:

1. Obtenga la etiqueta de la versión y resuelva el SHA de su confirmación.
2. Verifique que se pueda acceder a la etiqueta desde `main` o `release/*` (o desde una rama alfa de Tideclaw para versiones preliminares alfa).
3. Ejecute `pnpm plugins:sync:check`.
4. Despache `Plugin NPM Release` con `publish_scope=all-publishable` y `ref=<release-sha>`.
5. Despache `Plugin ClawHub Release` con el mismo ámbito y SHA.
6. Despache `OpenClaw NPM Release` con la etiqueta de la versión, la etiqueta de distribución de npm y el `preflight_run_id` guardado tras verificar el `full_release_validation_run_id` guardado y el intento de ejecución exacto.
7. Para versiones estables, cree o actualice la versión de GitHub como borrador, despache `Windows Node Release` con el `windows_node_tag` explícito y el `windows_node_installer_digests` aprobado para el candidato, y verifique los activos canónicos del instalador de Windows y de suma de comprobación. Despache también `Android Release` para compilar el APK firmado de la etiqueta exacta junto con su suma de comprobación y procedencia. Verifique ambos contratos de activos nativos antes de publicar el borrador.

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

Utilice los flujos de trabajo de nivel inferior `Plugin NPM Release` y `Plugin ClawHub Release` solo para trabajos específicos de reparación o republicación. `OpenClaw Release Publish` rechaza `plugin_publish_scope=selected` cuando `publish_openclaw_npm=true`, de modo que el paquete principal no pueda publicarse sin todos los plugins oficiales publicables, incluido `@openclaw/diffs-language-pack`. Para reparar un Plugin seleccionado, establezca `publish_openclaw_npm=false` con `plugin_publish_scope=selected` y `plugins=@openclaw/name`, o despache directamente el flujo de trabajo secundario.

El arranque inicial para la primera publicación en ClawHub es la excepción: despache `Plugin ClawHub New`
desde el `main` de confianza y pase el SHA completo de la versión de destino mediante `ref`.
Nunca ejecute el propio flujo de trabajo de arranque desde la etiqueta o la rama de la versión:

```bash
gh workflow run plugin-clawhub-new.yml \
  --ref main \
  -f plugins=@openclaw/name \
  -f ref=<full-40-character-release-sha> \
  -f pretag_validation=true \
  -f dry_run=true
```

La validación previa al etiquetado requiere `dry_run=true`, rechaza las entradas de la etiqueta de versión y de la ejecución principal,
y solo acepta un destino exacto al que se pueda acceder desde `main` o `release/*`.
No carga credenciales de ClawHub, publica bytes de paquetes ni cambia la
configuración del publicador de confianza. El flujo de trabajo sigue resolviendo el plan del registro activo,
obtiene y empaqueta el destino únicamente en un trabajo sin secretos, materializa la
cadena de herramientas de ClawHub bloqueada y valida el artefacto inmutable y el
slug/identidad del paquete antes de que exista la etiqueta de versión. Apruebe el entorno
`clawhub-plugin-bootstrap` solo después de que finalicen los trabajos de empaquetado sin secretos;
este trabajo de validación protegido no tiene credenciales ni comandos de mutación.

Una simulación aprobada o un arranque real después del etiquetado debe incluir la
etiqueta de versión exacta, además del id, el intento y la rama de la ejecución principal
`OpenClaw Release Publish`. La ejecución principal certifica el SHA de su propio flujo de trabajo y un SHA
de confianza exacto e independiente de `main` para `Plugin ClawHub New`; la ejecución secundaria y cada aprobación
de entorno protegido deben coincidir con ese SHA secundario aprobado. La etiqueta de versión se
vuelve a comprobar antes de cada intento de publicación y cada mutación del publicador de confianza.

El trabajo de empaquetado
carga un artefacto inmutable cuyo nombre, ID/resumen del artefacto de Actions,
ejecución/intento productor, SHA de destino y SHA-256/tamaño del tarball de cada paquete
se transfieren a los trabajos de validación y protegidos. El trabajo protegido obtiene únicamente
las herramientas de confianza de `main`, valida la tupla del artefacto mediante la API de GitHub, descarga
por ID de artefacto exacto, vuelve a calcular el hash de cada tarball y valida las rutas TAR locales y
la identidad del paquete con las reglas de canonicalización USTAR de la CLI fijada. Después, cada
candidato supera la simulación de publicación de la CLI fijada, que regresa antes de
consultar el registro o realizar la autenticación. El filtro previo del trabajo con credenciales limita los ClawPacks comprimidos
a 120 MiB, la carga total de archivos a 50 MiB, los datos TAR expandidos a 64 MiB y
el número de entradas TAR a 10,000. La reparación del publicador de confianza para paquetes existentes sigue siendo
solo de configuración, pero aun así empaqueta el destino y exige la etiqueta solicitada
junto con la igualdad exacta de los bytes y metadatos del registro antes de cambiar la configuración
del publicador de confianza. La verificación posterior a la publicación descarga el artefacto de ClawHub y
exige el mismo SHA-256 y tamaño. Una recuperación mediante la repetición de una ejecución fallida puede reutilizar el artefacto
del paquete de un intento anterior solo cuando el trabajo productor exacto haya finalizado
correctamente. La evidencia final también vincula la versión bloqueada de ClawHub, el SHA-256
del bloqueo y la integridad de npm. Una discrepancia requiere una nueva versión del paquete.

## Entradas del flujo de trabajo de NPM

`OpenClaw NPM Release` acepta estas entradas controladas por el operador:

- `tag`: etiqueta de versión obligatoria, como `v2026.4.2`, `v2026.4.2-1`, `v2026.4.2-beta.1` o `v2026.4.2-alpha.1`; cuando `preflight_only=true`, también puede ser el SHA completo de 40 caracteres de la confirmación actual de la rama del flujo de trabajo para una comprobación previa exclusivamente de validación
- `preflight_only`: `true` solo para validación/compilación/empaquetado, `false` para la ruta de publicación real
- `preflight_run_id`: id de una ejecución previa correcta existente, obligatorio en la ruta de publicación real para que el flujo de trabajo reutilice el tarball preparado en lugar de volver a compilarlo
- `full_release_validation_run_id`: id de una ejecución correcta de `Full Release Validation` para esta etiqueta/SHA, obligatorio para la publicación real. Las publicaciones beta pueden proceder solo con la comprobación previa y una advertencia, pero la promoción estable/`latest` sigue requiriéndolo.
- `full_release_validation_run_attempt`: intento positivo exacto emparejado con `full_release_validation_run_id`; obligatorio siempre que se proporcione el id de ejecución para que las repeticiones no puedan cambiar la evidencia de autorización durante la publicación.
- `release_publish_run_id`: id de ejecución aprobado de `OpenClaw Release Publish`; obligatorio cuando este flujo de trabajo lo despacha ese proceso principal (llamadas de publicación real efectuadas por el actor bot)
- `plugin_npm_run_id`: id de una ejecución correcta de cabecera exacta de `Plugin NPM Release`; obligatorio para una publicación real del núcleo de `extended-stable`
- `npm_dist_tag`: etiqueta de destino de npm para la ruta de publicación; acepta `alpha`, `beta`, `latest` o `extended-stable` y utiliza `beta` de forma predeterminada. El parche final `33` y los posteriores deben utilizar `extended-stable`; de forma predeterminada, `extended-stable` rechaza los parches anteriores y siempre rechaza las etiquetas no finales.
- `bypass_extended_stable_guard`: booleano solo para pruebas, valor predeterminado `false`; con `npm_dist_tag=extended-stable`, omite la elegibilidad mensual de estabilidad extendida y conserva las comprobaciones de identidad de la versión, artefactos, aprobación y relectura.

`Plugin NPM Release` acepta `npm_dist_tag=default` para el comportamiento de versiones
existente o `npm_dist_tag=extended-stable` para la ruta mensual protegida. La
opción de estabilidad extendida requiere `publish_scope=all-publishable`, una entrada
`plugins` vacía, un parche final igual o superior a `33` y la rama
canónica `extended-stable/YYYY.M.33` en su extremo exacto. Nunca mueve los plugins
`latest` ni `beta`. Las versiones nuevas de paquetes reciben `extended-stable` de forma atómica
mediante la publicación de confianza OIDC (`npm publish --tag extended-stable`); este
flujo de trabajo de origen no utiliza `npm dist-tag add` con autenticación mediante token. Los reintentos
omiten las versiones exactas que ya existen en npm y después se cierran de forma segura, salvo que la
relectura completa confirme que cada paquete exacto y etiqueta `extended-stable` han convergido.

`OpenClaw Release Publish` acepta estas entradas controladas por el operador:

- `tag`: etiqueta de versión obligatoria; ya debe existir
- `preflight_run_id`: id de una ejecución previa correcta de `OpenClaw NPM Release`; obligatorio cuando `publish_openclaw_npm=true` o `plugin_publish_scope=all-publishable`
- `full_release_validation_run_id`: id de una ejecución correcta de `Full Release Validation`; obligatorio cuando `publish_openclaw_npm=true` o `plugin_publish_scope=all-publishable`
- `full_release_validation_run_attempt`: intento positivo exacto emparejado con `full_release_validation_run_id`; obligatorio siempre que se proporcione el id de ejecución
- `windows_node_tag`: etiqueta de versión de `openclaw/openclaw-windows-node` exacta que no sea una versión preliminar; obligatoria para la publicación estable de OpenClaw
- `windows_node_installer_digests`: mapa JSON compacto aprobado para el candidato que relaciona los nombres actuales de los instaladores de Windows con sus resúmenes `sha256:` fijados; obligatorio para la publicación estable de OpenClaw
- `npm_telegram_run_id`: id opcional de una ejecución correcta de `NPM Telegram Beta E2E` para incluirlo en la evidencia final de la versión
- `npm_dist_tag`: etiqueta de destino de npm para el paquete OpenClaw, una de `alpha`, `beta` o `latest`
- `plugin_publish_scope`: utiliza `all-publishable` de forma predeterminada; use `selected` solo para trabajos específicos de reparación exclusiva de plugins con `publish_openclaw_npm=false`
- `plugins`: nombres de paquetes `@openclaw/*` separados por comas cuando `plugin_publish_scope=selected`
- `publish_openclaw_npm`: utiliza `true` de forma predeterminada; establezca `false` solo al utilizar el flujo de trabajo como orquestador de reparaciones exclusivas de plugins
- `release_profile`: perfil de cobertura de la versión utilizado para los resúmenes de evidencia de la versión; utiliza `from-validation` de forma predeterminada, que lo lee del manifiesto de validación, o se puede sustituir por `beta`, `stable` o `full`
- `wait_for_clawhub`: utiliza `false` de forma predeterminada para que la disponibilidad de npm no quede bloqueada por el proceso auxiliar de ClawHub; establezca `true` solo cuando la finalización del flujo de trabajo deba incluir la finalización de ClawHub

`OpenClaw Release Checks` acepta estas entradas controladas por el operador:

- `ref`: rama, etiqueta o SHA completo del commit que se va a validar. Las comprobaciones que utilizan secretos requieren que el commit resuelto sea accesible desde una rama o etiqueta de versión de OpenClaw.
- `run_release_soak`: habilita las pruebas exhaustivas en vivo/E2E, la ruta de lanzamiento de Docker y la prueba prolongada de supervivencia a actualizaciones desde todas las versiones para las comprobaciones de versiones beta. Se activa obligatoriamente mediante `release_profile=stable` y `release_profile=full`.

Reglas:

- Las versiones finales y de corrección normales inferiores al parche `33` pueden publicarse en `beta` o `latest`. Las versiones finales con el parche `33` o superior deben publicarse en `extended-stable`, y se rechazan las versiones con sufijo de corrección en ese límite.
- Las etiquetas de preversión beta solo pueden publicarse en `beta`; las etiquetas de preversión alfa solo pueden publicarse en `alpha`
- Para `OpenClaw NPM Release`, la entrada del SHA completo del commit solo se permite cuando `preflight_only=true`
- `OpenClaw Release Checks` y `Full Release Validation` siempre son exclusivamente de validación
- La ruta de publicación real debe utilizar el mismo `npm_dist_tag` empleado durante la comprobación previa; el flujo de trabajo verifica esos metadatos antes de continuar con la publicación

## Secuencia habitual de lanzamiento beta/estable más reciente

Esta secuencia heredada corresponde al lanzamiento orquestado habitual, que también gestiona los plugins, la versión de GitHub, Windows y el trabajo de otras plataformas. No es la ruta estable extendida mensual de `.33+`, exclusiva de npm, documentada al principio de esta página.

Al preparar un lanzamiento estable orquestado habitual:

1. Ejecute `OpenClaw NPM Release` con `preflight_only=true`. Antes de que exista una etiqueta, se puede utilizar el SHA del commit actual completo de la rama del flujo de trabajo para una ejecución de prueba exclusivamente de validación del flujo de trabajo de comprobación previa.
2. Elija `npm_dist_tag=beta` para el flujo normal que comienza con la beta, o `latest` solo cuando se desee intencionadamente una publicación estable directa.
3. Ejecute `Full Release Validation` en la rama de lanzamiento, la etiqueta de versión o el SHA completo del commit cuando se desee obtener mediante un único flujo de trabajo manual la CI normal, además de cobertura de caché de prompts en vivo, Docker, QA Lab, Matrix y Telegram. Si intencionadamente solo se necesita el grafo determinista de pruebas normales, ejecute en su lugar el flujo de trabajo manual `CI` en la referencia de lanzamiento.
4. Seleccione la etiqueta de versión exacta de `openclaw/openclaw-windows-node`, que no sea una preversión, cuyos instaladores firmados x64 y ARM64 deban distribuirse. Guárdela como `windows_node_tag` y guarde su mapa de resúmenes validado como `windows_node_installer_digests`. La herramienta auxiliar de la versión candidata registra ambos elementos y los incluye en el comando de publicación que genera.
5. Guarde los valores correctos de `preflight_run_id`, `full_release_validation_run_id` y el valor exacto de `full_release_validation_run_attempt`.
6. Ejecute `OpenClaw Release Publish` desde un entorno `main` de confianza con el mismo `tag`, el mismo `npm_dist_tag`, el `windows_node_tag` seleccionado, su `windows_node_installer_digests` guardado, el `preflight_run_id` guardado, `full_release_validation_run_id` y `full_release_validation_run_attempt`. Publica los plugins externalizados en npm y ClawHub antes de promover el paquete npm de OpenClaw.
7. Si la versión se publicó en `beta`, utilice el flujo de trabajo `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` para promover esa versión estable de `beta` a `latest`.
8. Si la versión se publicó intencionadamente de forma directa en `latest` y `beta` debe seguir de inmediato la misma compilación estable, utilice ese mismo flujo de trabajo de lanzamiento para hacer que ambas etiquetas de distribución apunten a la versión estable, o permita que su sincronización autorreparadora programada traslade `beta` más adelante.

La modificación de la etiqueta de distribución reside en el repositorio del registro de lanzamientos porque aún requiere `NPM_TOKEN`, mientras que el repositorio de código fuente mantiene la publicación exclusivamente mediante OIDC. De este modo, tanto la ruta de publicación directa como la ruta de promoción que comienza con la beta permanecen documentadas y visibles para los operadores.

Si un responsable de mantenimiento debe recurrir a la autenticación local de npm, ejecute todos los comandos de la CLI de 1Password (`op`) únicamente dentro de una sesión dedicada de tmux. No invoque `op` directamente desde el shell principal del agente; mantenerlo dentro de tmux permite observar las solicitudes, alertas y la gestión de OTP, y evita alertas repetidas del host.

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

Los responsables de mantenimiento utilizan la documentación privada de lanzamientos de [`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md) como guía operativa real.

## Contenido relacionado

- [Canales de lanzamiento](/es/install/development-channels)
