---
read_when:
    - Buscando definiciones públicas de canales de lanzamiento
    - Ejecución de la validación de la versión o la aceptación del paquete
    - Buscando la nomenclatura y la cadencia de las versiones
summary: Canales de lanzamiento, lista de verificación del operador, entornos de validación, nomenclatura de versiones y cadencia
title: Política de lanzamientos
x-i18n:
    generated_at: "2026-07-12T14:47:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4270a96560ee908c09d26782ffa75dbc695f4ab83c5a80dfb7abe5befd8ca686
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw expone actualmente tres canales de actualización orientados al usuario:

- stable: el canal de versiones promocionadas existente, que aún se resuelve mediante `latest` de npm hasta que se complete el hito independiente de CLI/canales
- beta: etiquetas de versiones preliminares que se publican en `beta` de npm
- dev: la punta móvil de `main`

Por separado, los operadores de versiones pueden publicar en `extended-stable` de npm el paquete principal del último mes completado, comenzando en el parche `33`. La línea final regular del mes actual continúa en `latest` de npm; esta separación de publicaciones del lado del operador no cambia por sí sola la resolución de los canales de actualización de la CLI.

Las compilaciones alfa de Tideclaw constituyen una línea interna independiente de versiones preliminares (dist-tag `alpha` de npm), descrita en [Entradas del flujo de trabajo de NPM](#npm-workflow-inputs) y [Entornos de prueba de versiones](#release-test-boxes).

## Nomenclatura de versiones

- Versión mensual extended-stable de npm: `YYYY.M.PATCH`, con `PATCH >= 33`, etiqueta de git `vYYYY.M.PATCH`
- Versión final diaria/regular: `YYYY.M.PATCH`, con `PATCH < 33`, etiqueta de git `vYYYY.M.PATCH`
- Versión regular de corrección alternativa: `YYYY.M.PATCH-N`, etiqueta de git `vYYYY.M.PATCH-N`
- Versión preliminar beta: `YYYY.M.PATCH-beta.N`, etiqueta de git `vYYYY.M.PATCH-beta.N`
- Versión preliminar alfa: `YYYY.M.PATCH-alpha.N`, etiqueta de git `vYYYY.M.PATCH-alpha.N`
- Nunca se rellenan con ceros el mes ni el parche
- `PATCH` es un número secuencial mensual del ciclo de versiones, no un día calendario. Las versiones finales regulares y beta hacen avanzar el ciclo actual; las etiquetas exclusivamente alfa nunca consumen ni hacen avanzar el número de parche beta/regular, por lo que deben ignorarse las etiquetas heredadas exclusivamente alfa con números de parche superiores al seleccionar un ciclo beta o regular.
- Las compilaciones alfa/nocturnas utilizan el siguiente ciclo de parche aún no publicado y, para compilaciones repetidas, solo incrementan `alpha.N`. Cuando ese parche tiene una beta, las nuevas compilaciones alfa pasan al parche siguiente.
- Las versiones de npm son inmutables: nunca se debe eliminar, volver a publicar ni reutilizar una etiqueta publicada. Se debe crear el siguiente número de versión preliminar o el siguiente parche mensual.
- `latest` continúa siguiendo la línea npm regular/diaria actual; `beta` es el destino de instalación beta actual
- `extended-stable` representa el paquete npm compatible del mes anterior, comenzando en el parche `33`; los parches `34` y posteriores son versiones de mantenimiento de esa línea mensual
- Las versiones finales regulares y las correcciones regulares se publican en `beta` de npm de forma predeterminada; los operadores de versiones pueden seleccionar `latest` explícitamente o promover más adelante una compilación beta validada
- La ruta mensual dedicada de extended-stable publica el paquete principal de npm y todos los plugins oficiales publicables en npm con exactamente la misma versión. No publica plugins en ClawHub ni artefactos de macOS o Windows, una versión de GitHub, dist-tags de repositorios privados, imágenes de Docker, artefactos móviles ni descargas del sitio web.
- Cada versión final regular distribuye conjuntamente el paquete npm, la aplicación para macOS, el APK independiente firmado para Android y los instaladores firmados de Windows Hub. Normalmente, las versiones beta validan y publican primero la ruta de npm/paquetes, mientras que la compilación, firma, notarización y promoción de aplicaciones nativas se reservan para la versión final regular, salvo que se soliciten explícitamente.

## Cadencia de versiones

- Las versiones avanzan primero por beta; stable solo las sigue después de validar la beta más reciente
- Normalmente, los responsables crean las versiones desde una rama `release/YYYY.M.PATCH` creada a partir del estado actual de `main`, para que la validación y las correcciones de la versión no bloqueen el desarrollo nuevo en `main`
- Si se ha enviado o publicado una etiqueta beta y necesita una corrección, los responsables crean la siguiente etiqueta `-beta.N` en lugar de eliminar o volver a crear la anterior
- El procedimiento detallado de publicación, las aprobaciones, las credenciales y las notas de recuperación son exclusivos de los responsables

## Publicación mensual extended-stable solo en npm

Esta es una excepción específica al procedimiento habitual de publicación que aparece más adelante. Para un mes completado `YYYY.M`, se debe crear `extended-stable/YYYY.M.33`; se deben publicar `vYYYY.M.33` y los parches de mantenimiento posteriores desde esa misma rama. La etiqueta de versión, la punta de la rama, el checkout, la versión del paquete, la comprobación previa de npm y la ejecución de Validación completa de la versión deben identificar el mismo commit. La rama protegida `main` ya debe contener una versión final de un mes calendario estrictamente posterior con un parche inferior a `33`; los parches de mantenimiento siguen siendo aptos después de que `main` avance más de un mes.

En la rama extended-stable exacta, se debe actualizar el paquete raíz a `YYYY.M.P`, ejecutar `pnpm release:prep` y verificar que todos los paquetes de extensiones publicables tengan la misma versión. Se deben confirmar y enviar todos los cambios generados, crear y enviar la etiqueta inmutable `vYYYY.M.P` en ese commit y registrar el SHA completo resultante. Los flujos de trabajo consumen este árbol preparado; no actualizan ni sincronizan las versiones automáticamente.

Se deben ejecutar la comprobación previa de npm y la Validación completa de la versión desde la punta exacta de esa rama preparada y, a continuación, guardar ambos identificadores de ejecución y el intento de ejecución correcto de la Validación completa de la versión:

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

`release_profile=stable` es el perfil existente de profundidad de validación; es independiente del dist-tag `extended-stable` de npm y permanece intencionadamente sin cambios.

Cuando ambas ejecuciones finalicen correctamente, se debe publicar cada plugin oficial publicable en npm desde la punta exacta de la misma rama. El parche `P` debe ser `33` o superior. Se debe proporcionar el SHA completo de la versión como `ref`, esperar a que se completen toda la matriz y la lectura de comprobación del registro y, a continuación, guardar el identificador de la ejecución correcta de Plugin NPM Release:

```bash
RELEASE_SHA="$(git rev-parse HEAD)"
gh workflow run plugin-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f publish_scope=all-publishable \
  -f ref="$RELEASE_SHA" \
  -f npm_dist_tag=extended-stable
```

El flujo de trabajo utiliza el inventario habitual de paquetes `all-publishable` preparado, incluidos los paquetes cuyo código fuente no cambió. Antes de finalizar correctamente, verifica cada paquete exacto y cada etiqueta `extended-stable` de los plugins. Si una ejecución parcial falla, se debe volver a ejecutar el mismo comando: los paquetes ya publicados se reutilizan, las etiquetas de plugins ausentes u obsoletas se concilian en el entorno de publicación de npm y la lectura de comprobación final sigue abarcando el conjunto completo de paquetes.

Cuando el flujo de trabajo de plugins finalice correctamente y el entorno de publicación de npm esté listo, se debe publicar el tarball principal exacto de la comprobación previa. La publicación del paquete principal verifica que la ejecución de plugins indicada tenga el estado `completed/success` en la misma rama canónica y con el SHA exacto del código fuente:

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

Para un ensayo en un fork o fuera de producción que intencionadamente no pueda satisfacer la política mensual de `.33` o del mes de la rama protegida `main`, se debe añadir `-f bypass_extended_stable_guard=true` tanto a los lanzamientos de comprobación previa como de publicación de npm. El valor predeterminado es `false`. La omisión solo se acepta con `npm_dist_tag=extended-stable` y queda registrada en el resumen del flujo de trabajo. No omite la referencia canónica `extended-stable/YYYY.M.33` del flujo de trabajo, la igualdad entre la punta de la rama, la etiqueta y el checkout, la sintaxis de la etiqueta final, la igualdad entre la versión del paquete y la etiqueta, la identidad de las ejecuciones y el manifiesto indicados, la procedencia del tarball, la aprobación del entorno, la lectura de comprobación del registro ni las pruebas de reparación del selector.

El flujo de trabajo de publicación verifica las identidades de la comprobación previa, la validación y la ejecución de plugins indicadas, el resumen criptográfico del tarball preparado y los selectores del registro del paquete principal. Una vez que el flujo de trabajo finalice correctamente, se debe confirmar el resultado de forma independiente:

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

Ambos comandos deben devolver `YYYY.M.P`. Si la publicación finaliza correctamente, pero falla la lectura de comprobación del selector, no se debe volver a publicar la versión inmutable del paquete. Se debe utilizar el único comando de reparación `npm dist-tag add openclaw@YYYY.M.P extended-stable` que aparece en el resumen de ejecución obligatoria del flujo de trabajo fallido y, a continuación, repetir ambas lecturas de comprobación independientes. Volver al selector anterior es una decisión independiente del operador, no la ruta de reparación de la lectura de comprobación.

La documentación pública de soporte designa inicialmente Slack, Discord y Codex como superficies de plugins cubiertas por extended-stable. Esa lista es una declaración de soporte, no una lista de elementos permitidos en el código de publicación: cada plugin oficial publicable en npm sigue la misma ruta de publicación con la versión exacta.

La lista de comprobación habitual que aparece a continuación sigue rigiendo las publicaciones beta, `latest`, GitHub Release, plugins, macOS, Windows y otras plataformas. No se deben ejecutar esos pasos para esta ruta extended-stable exclusiva de npm.

## Lista de comprobación habitual para operadores de versiones

Esta lista de comprobación representa la forma pública del flujo de publicación. Las credenciales privadas, la firma, la notarización, la recuperación de dist-tags y los detalles de reversión de emergencia permanecen en el manual de publicación exclusivo de los responsables.

1. Parta de la versión actual de `main`: obtenga los últimos cambios, confirme que el commit de destino se haya enviado y confirme que la CI de `main` esté lo suficientemente estable como para crear una rama a partir de ella.
2. Genere la sección superior de `CHANGELOG.md` a partir de los PR fusionados y todos los commits directos desde la última etiqueta de versión alcanzable. Mantenga las entradas orientadas al usuario, elimine las duplicadas entre PR y commits directos que se solapen, haga commit, envíe los cambios y vuelva a hacer rebase u obtener los cambios una vez más antes de crear la rama. Cuando una etiqueta publicada divergente o un forward-port posterior vuelva a asociar PR ya publicados, pase esa etiqueta explícitamente como `--shipped-ref`; el verificador usa filas explícitas de PR procedentes de registros completos de contribuciones en las secciones numeradas de la instantánea de la etiqueta, ignora `Unreleased` y registra el inventario exacto y la cantidad de PR excluidos.
3. Revise los registros de compatibilidad de versiones en `src/plugins/compat/registry.ts` y `src/commands/doctor/shared/deprecation-compat.ts`. Elimine la compatibilidad caducada únicamente cuando la ruta de actualización siga cubierta, o documente por qué se mantiene intencionadamente.
4. Cree `release/YYYY.M.PATCH` a partir de la versión actual de `main`. No realice el trabajo normal de publicación directamente en `main`.
5. Incremente la versión en cada ubicación requerida para la etiqueta y, a continuación, ejecute `pnpm release:prep`. Actualiza, en orden, las versiones de los plugins, los archivos shrinkwrap de npm, el inventario de plugins, el esquema de configuración base, los metadatos de configuración de los canales incluidos, la base de referencia de la documentación de configuración, las exportaciones del SDK de plugins y la base de referencia de la API del SDK de plugins. Haga commit de cualquier cambio generado antes de etiquetar y, a continuación, ejecute la comprobación previa determinista local: `pnpm check:test-types`, `pnpm check:architecture`, `pnpm build && pnpm ui:build` y `pnpm release:check`.
6. Ejecute `OpenClaw NPM Release` con `preflight_only=true`. Antes de que exista una etiqueta, se permite un SHA completo de 40 caracteres de la rama de publicación para una comprobación previa destinada únicamente a validación. La comprobación previa genera evidencias de publicación de dependencias para el grafo exacto de dependencias extraído y las almacena en el artefacto de comprobación previa de npm. Guarde el valor correcto de `preflight_run_id`.
7. Inicie todas las pruebas previas a la publicación con `Full Release Validation` para la rama de publicación, la etiqueta o el SHA completo del commit. Este es el único punto de entrada manual para los cuatro grandes grupos de pruebas de publicación: Vitest, Docker, QA Lab y Package. Guarde `full_release_validation_run_id` y el valor exacto de `full_release_validation_run_attempt`; ambos son entradas obligatorias para `OpenClaw NPM Release` y `OpenClaw Release Publish`.
8. Si la validación falla, corríjalo en la rama de publicación y vuelva a ejecutar el archivo, carril, tarea del flujo de trabajo, perfil de paquete, proveedor o lista de modelos permitidos de menor alcance que demuestre la corrección. Vuelva a ejecutar el conjunto completo únicamente cuando la superficie modificada invalide las evidencias anteriores.
9. Para un candidato beta etiquetado, ejecute `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N` desde la rama `release/YYYY.M.PATCH` correspondiente. Para la versión estable, pase también la versión de origen de Windows obligatoria: `pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`. La utilidad usa la versión de confianza de `main` como origen del flujo de trabajo, mientras cada flujo de trabajo apunta a la etiqueta exacta. Registra como puntos de control la identidad inmutable del candidato y de las herramientas, así como los identificadores de las ejecuciones iniciadas, en `.artifacts/release-candidate/<tag>/release-candidate-state.json`; volver a ejecutar el mismo comando reanuda exactamente esas ejecuciones, mientras que cualquier divergencia del candidato, las herramientas, el perfil o las opciones provoca un cierre seguro. Antes de iniciar la matriz completa de validación, la utilidad representa de forma determinista el cuerpo de la versión de GitHub correspondiente a la etiqueta exacta y rechaza un encabezado de versión ausente, un cuerpo que supere el límite y no pueda usar la forma compacta canónica, o una procedencia de base/destino de los registros de contribuciones que no sea alcanzable desde la etiqueta. También valida cualquier metadato explícito de exclusión de la referencia de versiones publicadas con respecto a los registros acumulativos de las etiquetas indicadas. A continuación, ejecuta las comprobaciones locales de la versión generada; inicia o verifica las evidencias de la validación completa de la versión y de la comprobación previa de npm; ejecuta las pruebas de instalación nueva y actualización de Parallels con el tarball exacto preparado, además de la prueba del paquete de Telegram; registra los planes de npm y ClawHub para los plugins; y muestra el comando exacto de `OpenClaw Release Publish` únicamente cuando el conjunto de evidencias es satisfactorio.

   `OpenClaw Release Publish` despacha en paralelo a npm los paquetes de Plugin seleccionados o todos los publicables, y el mismo conjunto a ClawHub; después, promociona el artefacto de comprobación preliminar de npm de OpenClaw preparado con la dist-tag correspondiente una vez que la publicación de los Plugins en npm se realiza correctamente. El checkout de la versión permanece como raíz del producto y de los datos, mientras que la planificación y la verificación final se ejecutan desde el checkout exacto y de confianza del código fuente del workflow, para impedir que un commit de una versión anterior pueda usar silenciosamente herramientas de publicación obsoletas. Antes de que se inicie cualquier proceso secundario de publicación, representa y almacena en caché el cuerpo exacto de la versión de GitHub. Cuando la sección completa correspondiente a `CHANGELOG.md` cabe dentro del límite de 125,000 caracteres de GitHub y del límite de seguridad correspondiente de 125,000 bytes del representador, la página contiene esa sección exacta de `## YYYY.M.PATCH`, incluido su encabezado. Cuando la sección de origen no cabe, la página conserva las notas editoriales agrupadas exactas y sustituye el registro de contribuciones sobredimensionado por un enlace estable al registro completo en el `CHANGELOG.md` fijado a la etiqueta; nunca se publican registros parciales ni viñetas truncadas. El workflow elige ese cuerpo completo o compacto antes de añadir `### Release verification`; si la parte final de las pruebas superara el límite, conserva el cuerpo canónico y se basa en las pruebas inmutables adjuntas. Las versiones estables publicadas en npm `latest` se convierten en la versión más reciente de GitHub, mientras que las versiones estables de mantenimiento conservadas en npm `beta` se crean con GitHub `latest=false`. El workflow también carga en la versión de GitHub las pruebas de dependencias de la comprobación preliminar, el manifiesto de validación completa y las pruebas de verificación del registro posteriores a la publicación para responder a incidentes posteriores a la publicación. Imprime inmediatamente los identificadores de las ejecuciones secundarias, aprueba automáticamente las puertas del entorno de publicación que el token del workflow tiene permitido aprobar, resume los trabajos secundarios fallidos con las partes finales de sus registros, crea de antemano la página de borrador de la versión de GitHub y promociona los recursos de Windows y Android simultáneamente con la publicación de OpenClaw en npm, finaliza la página de la versión y las pruebas de dependencias cuando esas etapas se completan correctamente, espera a ClawHub siempre que se publique OpenClaw en npm y, después, ejecuta el verificador beta de la rama principal de confianza y carga pruebas posteriores a la publicación para la versión de GitHub, el paquete npm, los paquetes npm de Plugin seleccionados, los paquetes de ClawHub seleccionados, los identificadores de las ejecuciones secundarias y el identificador opcional de la ejecución de NPM Telegram. El verificador de arranque de ClawHub exige la ruta y el SHA exactos del workflow de la rama principal de confianza, los intentos de ejecución del productor y del terminal, el SHA de la versión, el conjunto de paquetes solicitado, la tupla inmutable del artefacto del paquete y el artefacto de lectura de confirmación del registro del terminal; no se acepta una ejecución heredada correcta de la referencia de la versión.

   A continuación, ejecute la aceptación del paquete posterior a la publicación con el paquete publicado `openclaw@YYYY.M.PATCH-beta.N` u `openclaw@beta`. Si una versión preliminar enviada o publicada necesita una corrección, publique el siguiente número de versión preliminar correspondiente; nunca elimine ni reescriba el anterior.

10. Para la versión estable, continúe solo después de que la beta o la versión candidata examinada cuente con la evidencia de validación requerida. La publicación estable en npm también se realiza mediante `OpenClaw Release Publish`, reutilizando el artefacto de comprobación preliminar correcto mediante `preflight_run_id`. La preparación de la versión estable para macOS también requiere los archivos empaquetados `.zip`, `.dmg` y `.dSYM.zip`, así como el archivo `appcast.xml` actualizado en `main`; el flujo de trabajo de publicación de macOS publica automáticamente el appcast firmado en el repositorio público `main` después de verificar los recursos de la versión, o abre o actualiza una solicitud de incorporación de cambios del appcast si la protección de la rama bloquea el envío directo. La preparación de la versión estable de Windows Hub requiere los recursos firmados `OpenClawCompanion-Setup-x64.exe`, `OpenClawCompanion-Setup-arm64.exe` y `OpenClawCompanion-SHA256SUMS.txt` en la versión de OpenClaw en GitHub. Pase la etiqueta exacta de la versión firmada `openclaw/openclaw-windows-node` como `windows_node_tag` y su mapa de resúmenes criptográficos del instalador aprobado para la versión candidata como `windows_node_installer_digests`; `OpenClaw Release Publish` conserva el borrador de la versión, activa `Windows Node Release` y verifica los tres recursos antes de la publicación.
11. Después de la publicación, ejecute el verificador posterior a la publicación de npm, la prueba E2E independiente y opcional de Telegram con la versión publicada en npm cuando necesite una prueba del canal posterior a la publicación, la promoción de la etiqueta de distribución cuando sea necesario, verifique la página generada de la versión en GitHub, ejecute los pasos del anuncio de la versión y, a continuación, complete el [cierre de la rama principal para la versión estable](#stable-main-closeout) antes de considerar finalizada una versión estable.

## Cierre de la rama principal estable

La publicación estable no se completa hasta que `main` contiene el estado de la versión realmente publicada.

1. Parta de la versión más reciente y actualizada de `main`. Audite `release/YYYY.M.PATCH` comparándola con esta y aplique en `main` los cambios de las correcciones reales que falten. No fusione a ciegas en la versión más reciente de `main` adaptadores de compatibilidad, pruebas o validación exclusivos de la versión.
2. Establezca `main` en la versión estable publicada, no en una futura serie de versiones especulativa. Ejecute `pnpm release:prep` después de cambiar la versión raíz y, a continuación, `pnpm deps:shrinkwrap:generate`.
3. Haga que la sección `## YYYY.M.PATCH` de `CHANGELOG.md` en `main` coincida exactamente con la rama de la versión etiquetada. Incluya la actualización estable de `appcast.xml` cuando se haya publicado una versión para Mac que la incluya.
4. No añada `YYYY.M.PATCH+1`, una versión beta ni una sección vacía del registro de cambios futuro a `main` hasta que el operador inicie explícitamente esa serie de versiones.
5. Ejecute `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check` y `OPENCLAW_TESTBOX=1 pnpm check:changed`. Envíe los cambios y, antes de dar por finalizada la versión estable, verifique que `origin/main` contenga la versión publicada y el registro de cambios.
6. Mantenga actualizadas las variables del repositorio `RELEASE_ROLLBACK_DRILL_ID` y `RELEASE_ROLLBACK_DRILL_DATE` después de cada simulacro privado de reversión.

`OpenClaw Stable Main Closeout` parte del envío a `main` que contiene la versión publicada, el registro de cambios y el appcast tras la publicación estable. Lee las pruebas inmutables posteriores a la publicación para vincular la etiqueta publicada con sus ejecuciones de Validación completa de la versión y Publicación y, a continuación, verifica el estado estable de main, la versión, el período de observación estable obligatorio y las pruebas de rendimiento bloqueantes. Adjunta a la versión de GitHub un manifiesto de cierre inmutable y su suma de comprobación. El activador automático por envío omite las versiones heredadas anteriores a las pruebas inmutables posteriores a la publicación y nunca considera que esa omisión constituya un cierre completado.

Un cierre completo requiere ambos recursos y una suma de comprobación coincidente. Un manifiesto parcial vuelve a ejecutar el SHA de `main` y el simulacro de reversión que tiene registrados para regenerar bytes idénticos y, a continuación, adjunta la suma de comprobación que falta; un par no válido, o una suma de comprobación sin manifiesto, sigue siendo bloqueante. Una ejecución activada por un envío sin las variables del repositorio del simulacro de reversión se omite sin completar el cierre; la ausencia de un registro de simulacro, o uno con más de 90 días de antigüedad, sigue bloqueando el cierre manual respaldado por pruebas. Los comandos privados de recuperación permanecen en el manual operativo exclusivo para mantenedores. Use el despacho manual únicamente para reparar o volver a ejecutar un cierre estable respaldado por pruebas.

Una etiqueta de corrección alternativa heredada puede reutilizar las pruebas del paquete base únicamente cuando la etiqueta de corrección se resuelva al mismo commit de origen que la etiqueta estable base. Su versión para Android reutiliza el APK verificado de la etiqueta base y añade la procedencia de la etiqueta de corrección. Una corrección con un origen diferente debe publicar y verificar sus propias pruebas del paquete y usar un `versionCode` de Android superior.

## Comprobaciones previas de la versión

- Ejecuta `pnpm check:test-types` antes de la comprobación preliminar de la versión para que el código TypeScript de las pruebas siga cubierto fuera de la comprobación local más rápida de `pnpm check`.
- Ejecuta `pnpm check:architecture` antes de la comprobación preliminar de la versión para que las comprobaciones más amplias de ciclos de importación y límites de arquitectura se completen correctamente fuera de la comprobación local más rápida.
- Ejecuta `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que los artefactos de versión `dist/*` esperados y el paquete de la interfaz de control existan para el paso de validación del paquete.
- Ejecuta `pnpm release:prep` después de incrementar la versión raíz y antes de crear la etiqueta. Ejecuta todos los generadores deterministas de versiones que suelen quedar desactualizados después de un cambio de versión, configuración o API: versiones de plugins, archivos shrinkwrap de npm, inventario de plugins, esquema de configuración base, metadatos de configuración de canales incluidos, referencia de la documentación de configuración, exportaciones del SDK de plugins y referencia de la API del SDK de plugins. `pnpm release:check` vuelve a ejecutar esas protecciones en modo de comprobación (además de una comprobación del límite de superficie del SDK de plugins) e informa de todos los errores de divergencia generada en una sola pasada antes de ejecutar las comprobaciones de publicación de paquetes.
- La sincronización de versiones de plugins actualiza de forma predeterminada el paquete publicable del entorno de ejecución `@openclaw/ai`, las versiones de los paquetes de plugins oficiales y los límites mínimos existentes de `openclaw.compat.pluginApi` a la versión de OpenClaw. Trata ese campo como el límite mínimo de la API del SDK o del entorno de ejecución de plugins, no solo como una copia de la versión del paquete: para las versiones exclusivas de plugins que intencionadamente sigan siendo compatibles con hosts de OpenClaw anteriores, conserva como límite mínimo la API del host compatible más antiguo y documenta esa elección en la evidencia de publicación del plugin.
- Ejecuta manualmente el flujo de trabajo `Full Release Validation` antes de aprobar la versión para iniciar todos los entornos de prueba previos a la publicación desde un único punto de entrada. Acepta una rama, una etiqueta o un SHA completo de commit, inicia manualmente `CI` e inicia `OpenClaw Release Checks` para las pruebas rápidas de instalación, la aceptación de paquetes, las comprobaciones de paquetes entre sistemas operativos, la paridad de QA Lab y las vías de Matrix y Telegram. Las ejecuciones estables y completas siempre incluyen pruebas exhaustivas en vivo/E2E y una prueba prolongada de la ruta de publicación con Docker; `run_release_soak=true` se conserva para solicitar explícitamente una prueba prolongada de una beta. Package Acceptance proporciona la prueba E2E canónica de Telegram para el paquete durante la validación del candidato, lo que evita un segundo sondeador en vivo simultáneo.

  Proporciona `release_package_spec` después de publicar una beta para reutilizar el paquete de npm publicado en las comprobaciones de versión, Package Acceptance y la prueba E2E del paquete de Telegram sin volver a compilar el archivo tar de la versión. Proporciona `npm_telegram_package_spec` solo cuando Telegram deba usar un paquete publicado distinto del resto de la validación de la versión. Proporciona `package_acceptance_package_spec` cuando Package Acceptance deba usar un paquete publicado distinto de la especificación del paquete de la versión. Proporciona `evidence_package_spec` cuando el informe de evidencias de la versión deba demostrar que la validación coincide con un paquete de npm publicado sin forzar la prueba E2E de Telegram.

  ```bash
  gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH
  ```

- Ejecuta manualmente el flujo de trabajo `Package Acceptance` cuando se necesite una evidencia por un canal paralelo para un paquete candidato mientras continúa el trabajo de publicación. Usa `source=npm` para `openclaw@beta`, `openclaw@latest` o una versión exacta; `source=ref` para empaquetar una rama, etiqueta o SHA de confianza indicada por `package_ref` con el entorno de pruebas actual de `workflow_ref`; `source=url` para un archivo tar HTTPS público con un SHA-256 obligatorio y una política estricta de URL públicas; `source=trusted-url` para una política de origen de confianza con nombre que use `trusted_source_id` y SHA-256 obligatorios; o `source=artifact` para un archivo tar cargado por otra ejecución de GitHub Actions.

  El flujo de trabajo resuelve el candidato como `package-under-test`, reutiliza el programador de pruebas E2E de publicación con Docker para ese archivo tar y puede ejecutar el control de calidad de Telegram con el mismo archivo tar mediante `telegram_mode=mock-openai` o `telegram_mode=live-frontier`. Cuando las vías de Docker seleccionadas incluyen `published-upgrade-survivor`, el artefacto del paquete es el candidato y `published_upgrade_survivor_baseline` selecciona la referencia publicada. `update-restart-auth` usa el paquete candidato tanto como CLI instalada como paquete sometido a prueba, para comprobar la ruta de reinicio gestionado del comando de actualización del candidato.

  Ejemplo:

  ```bash
  gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai
  ```

  Perfiles comunes:
  - `smoke`: vías de instalación/canal/agente, red del Gateway y recarga de configuración
  - `package`: vías nativas del artefacto para paquete/actualización/reinicio/plugin sin OpenWebUI ni ClawHub en vivo
  - `product`: perfil de paquete más canales MCP, limpieza de Cron/subagentes, búsqueda web de OpenAI y OpenWebUI
  - `full`: segmentos de la ruta de publicación con Docker y OpenWebUI
  - `custom`: selección exacta de `docker_lanes` para una repetición específica

- Ejecuta manualmente el flujo de trabajo `CI` de forma directa cuando solo se necesite la cobertura determinista de la CI normal para el candidato de publicación. Las ejecuciones manuales de CI omiten el filtrado por cambios y fuerzan los fragmentos de Linux con Node, los fragmentos de plugins incluidos, los fragmentos de contratos de plugins y canales, la compatibilidad con Node 22, `check-*`, `check-additional-*`, las pruebas rápidas de artefactos compilados, las comprobaciones de documentación, las Skills de Python, Windows, macOS y las vías de internacionalización de la interfaz de control. Las ejecuciones manuales independientes de CI solo ejecutan Android cuando se inician con `include_android=true`; `Full Release Validation` pasa ese parámetro a su ejecución secundaria de CI.

  ```bash
  gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true
  ```

- Ejecuta `pnpm qa:otel:smoke` al validar la telemetría de la versión. Comprueba QA Lab mediante un receptor OTLP/HTTP local y verifica la exportación de trazas, métricas y registros, además de la limitación de los atributos de traza y la supresión de contenido e identificadores, sin requerir Opik, Langfuse ni otro recopilador externo.
- Ejecuta `pnpm qa:otel:collector-smoke` al validar la compatibilidad con recopiladores. Enruta la misma exportación OTLP de QA Lab a través de un contenedor Docker real de OpenTelemetry Collector antes de realizar las verificaciones del receptor local.
- Ejecuta `pnpm qa:prometheus:smoke` al validar la extracción protegida de Prometheus. Comprueba QA Lab, rechaza las extracciones sin autenticar y verifica que las familias de métricas críticas para la publicación no contengan contenido de prompts, identificadores sin procesar, tokens de autenticación ni rutas locales.
- Ejecuta `pnpm qa:observability:smoke` para ejecutar consecutivamente las vías de pruebas rápidas de OpenTelemetry y Prometheus desde el repositorio de código fuente.
- Ejecuta `pnpm release:check` antes de cada versión etiquetada.
- La comprobación preliminar de `OpenClaw NPM Release` genera evidencias sobre las dependencias de la versión antes de empaquetar el archivo tar de npm. La comprobación de vulnerabilidades de avisos de npm bloquea la publicación. Los informes de riesgo del manifiesto transitivo, propiedad y superficie de instalación de dependencias, y cambios de dependencias son únicamente evidencias de la versión. El informe de cambios de dependencias compara el candidato de publicación con la etiqueta de versión anterior alcanzable. La comprobación preliminar carga las evidencias de dependencias como `openclaw-release-dependency-evidence-<tag>` y también las incorpora en `dependency-evidence/` dentro del artefacto preparado de la comprobación preliminar de npm. La ruta de publicación real reutiliza ese artefacto de comprobación preliminar y después adjunta las mismas evidencias a la versión de GitHub como `openclaw-<version>-dependency-evidence.zip`.
- Ejecuta `OpenClaw Release Publish` para la secuencia de publicación con cambios después de que exista la etiqueta. Inicia las publicaciones beta y estables normales desde `main` de confianza; la etiqueta de versión sigue seleccionando el commit de destino exacto y puede apuntar a `release/YYYY.M.PATCH`. Las publicaciones alfa de Tideclaw permanecen en su rama alfa correspondiente. Proporciona el valor correcto de `preflight_run_id` de npm de OpenClaw, el valor correcto de `full_release_validation_run_id` y el valor exacto de `full_release_validation_run_attempt`, y conserva el ámbito de publicación predeterminado de plugins `all-publishable`, salvo que se esté realizando deliberadamente una reparación específica. El flujo de trabajo ejecuta en serie la publicación en npm de plugins, la publicación de plugins en ClawHub y la publicación en npm de OpenClaw, para que el paquete principal no se publique antes que sus plugins externalizados; la promoción de Windows y Android se ejecuta simultáneamente con la publicación del paquete principal en npm sobre la página de versión en borrador. Las repeticiones de la publicación se pueden reanudar: una versión principal ya publicada en npm omite la ejecución del paquete principal después de que el flujo de trabajo demuestre que el archivo tar del registro coincide con el artefacto de comprobación preliminar de la etiqueta, y se omite la promoción de Windows/Android cuando la versión ya contiene el contrato de artefactos verificado, por lo que un nuevo intento solo repite las etapas fallidas. Las reparaciones específicas exclusivas de plugins requieren `plugin_publish_scope=selected` y una lista de plugins no vacía. Las ejecuciones exclusivas de plugins con `all-publishable` requieren evidencias completas e inmutables de la comprobación preliminar y de Full Release Validation; las evidencias parciales se rechazan.
- La versión estable de `OpenClaw Release Publish` requiere un valor exacto de `windows_node_tag` después de que exista la versión correspondiente, no preliminar, de `openclaw/openclaw-windows-node`, además del mapa `windows_node_installer_digests` aprobado para el candidato. Antes de iniciar cualquier flujo secundario de publicación, verifica que esa versión de origen esté publicada, no sea preliminar, contenga los instaladores x64/ARM64 necesarios y siga coincidiendo con ese mapa aprobado. Después inicia `Windows Node Release` mientras la versión de OpenClaw todavía está en borrador, conservando sin cambios el mapa fijado de resúmenes de los instaladores. El flujo secundario descarga los instaladores firmados de Windows Hub desde esa etiqueta exacta, los compara con los resúmenes fijados, verifica en un ejecutor de Windows que sus firmas Authenticode usen el firmante esperado de OpenClaw Foundation, escribe un manifiesto SHA-256 y carga los instaladores y el manifiesto en la versión canónica de OpenClaw en GitHub; después vuelve a descargar los artefactos promocionados y verifica su inclusión en el manifiesto y sus hashes. El flujo principal verifica el contrato vigente de artefactos x64, ARM64 y de suma de comprobación antes de la publicación. La recuperación directa rechaza los nombres de artefactos `OpenClawCompanion-*` inesperados antes de reemplazar los artefactos esperados del contrato con los bytes fijados del origen.

  Inicia manualmente `Windows Node Release` solo para recuperaciones y proporciona siempre una etiqueta exacta, nunca `latest`, además del mapa JSON explícito `expected_installer_digests` de la versión de origen aprobada. Los enlaces de descarga del sitio web deben apuntar a las URL exactas de los artefactos de la versión estable actual de OpenClaw, o a `releases/latest/download/...` únicamente después de verificar que la redirección de la versión más reciente de GitHub apunte a esa misma versión; no enlaces únicamente a la página de publicación del repositorio complementario.

- Las comprobaciones de lanzamiento ahora se ejecutan en un flujo de trabajo manual independiente: `OpenClaw Release Checks`. También ejecuta el carril de paridad simulada de QA Lab, además del perfil rápido de Matrix en vivo y el carril de QA de Telegram antes de la aprobación del lanzamiento. Los carriles en vivo usan el entorno `qa-live-shared`; Telegram también usa arrendamientos de credenciales de CI de Convex. Ejecute el flujo de trabajo manual `QA-Lab - All Lanes` con `matrix_profile=all` y `matrix_shards=true` cuando quiera ejecutar en paralelo el inventario completo de transporte, contenido multimedia y E2EE de Matrix.
- La validación del entorno de ejecución de instalación y actualización entre sistemas operativos forma parte de los flujos públicos `OpenClaw Release Checks` y `Full Release Validation`, que llaman directamente al flujo reutilizable `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`. Esta separación es intencional: mantiene la ruta real de lanzamiento en npm breve, determinista y centrada en artefactos, mientras las comprobaciones en vivo más lentas permanecen en su propio carril para que no retrasen ni bloqueen la publicación.
- Las comprobaciones de lanzamiento que utilizan secretos deben iniciarse mediante `Full Release Validation` o desde la referencia del flujo de trabajo de `main`/lanzamiento, para que la lógica del flujo y los secretos permanezcan bajo control.
- `OpenClaw Release Checks` acepta una rama, etiqueta o SHA completo de confirmación, siempre que se pueda llegar a la confirmación resuelta desde una rama o etiqueta de lanzamiento de OpenClaw.
- La comprobación previa de solo validación de `OpenClaw NPM Release` también acepta el SHA completo actual de 40 caracteres de la confirmación de la rama del flujo de trabajo sin requerir una etiqueta enviada. Esa ruta de SHA sirve únicamente para validación y no se puede promover a una publicación real. En el modo SHA, el flujo de trabajo sintetiza `v<package.json version>` solo para comprobar los metadatos del paquete; la publicación real sigue requiriendo una etiqueta de lanzamiento real.
- Ambos flujos mantienen la ruta de publicación y promoción real en ejecutores alojados en GitHub, mientras que la ruta de validación sin mutaciones puede usar los ejecutores Linux de mayor capacidad de Blacksmith.
- Ese flujo ejecuta `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` mediante los secretos del flujo de trabajo `OPENAI_API_KEY` y `ANTHROPIC_API_KEY`.
- La comprobación previa del lanzamiento en npm ya no espera al carril independiente de comprobaciones de lanzamiento.
- Antes de etiquetar localmente una versión candidata, ejecute `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`. La utilidad ejecuta las medidas de protección rápidas del lanzamiento, las comprobaciones de lanzamiento de plugins en npm/ClawHub, la compilación, la compilación de la interfaz de usuario y `release:openclaw:npm:check`, en un orden que detecta errores comunes que bloquean la aprobación antes de que se inicie el flujo de publicación de GitHub.
- Ejecute `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts` (o la etiqueta correspondiente de versión preliminar/corrección) antes de la aprobación.
- Después de publicar en npm, ejecute `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH` (o la versión beta/de corrección correspondiente) para verificar la ruta de instalación del registro publicado en un prefijo temporal nuevo.
- Después de publicar una versión beta, ejecute `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` para verificar la incorporación del paquete instalado, la configuración de Telegram y el E2E real de Telegram con el paquete publicado en npm mediante el grupo compartido de credenciales arrendadas de Telegram. Para ejecuciones locales puntuales, el personal de mantenimiento puede omitir las variables de Convex y proporcionar directamente las tres credenciales de entorno `OPENCLAW_QA_TELEGRAM_*`.
- Para ejecutar la comprobación completa de humo posterior a la publicación de la versión beta desde el equipo de una persona encargada del mantenimiento, use `pnpm release:beta-smoke -- --beta betaN`. La utilidad ejecuta la validación de actualización de npm y de destino nuevo en Parallels, inicia `NPM Telegram Beta E2E`, consulta periódicamente la ejecución exacta del flujo, descarga el artefacto e imprime el informe de Telegram.
- El personal de mantenimiento puede ejecutar la misma comprobación posterior a la publicación desde GitHub Actions mediante el flujo manual `NPM Telegram Beta E2E`. Es intencionalmente solo manual y no se ejecuta con cada fusión.
- La automatización de lanzamientos para el personal de mantenimiento usa el esquema comprobación previa y después promoción:
  - La publicación real en npm debe tener un `preflight_run_id` de npm correcto.
  - La orquestación y la comprobación previa de publicaciones beta y estables normales usan una versión de confianza de `main` con la etiqueta de destino exacta. La publicación y comprobación previa alfa de Tideclaw usan la rama alfa correspondiente.
  - Los lanzamientos estables de npm usan `beta` de forma predeterminada; la publicación estable en npm puede dirigirse explícitamente a `latest` mediante la entrada del flujo de trabajo.
  - La mutación de etiquetas de distribución de npm basada en tokens se encuentra en `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`, porque `npm dist-tag add` todavía necesita `NPM_TOKEN`, mientras que el repositorio de origen mantiene la publicación exclusivamente mediante OIDC.
  - El flujo público `macOS Release` sirve únicamente para validación; cuando una etiqueta solo existe en una rama de lanzamiento, pero el flujo se inicia desde `main`, establezca `public_release_branch=release/YYYY.M.PATCH`.
  - La publicación real para macOS debe tener valores correctos de `preflight_run_id` y `validate_run_id` de macOS.
  - Las rutas de publicación reales promueven los artefactos preparados en vez de volver a compilarlos.
- Para lanzamientos estables de corrección como `YYYY.M.PATCH-N`, el verificador posterior a la publicación también comprueba la misma ruta de actualización con prefijo temporal desde `YYYY.M.PATCH` hasta `YYYY.M.PATCH-N`, de modo que las correcciones de lanzamiento no puedan dejar silenciosamente las instalaciones globales anteriores con la carga útil de la versión estable base.
- La comprobación previa del lanzamiento en npm falla de forma cerrada, salvo que el archivo tar incluya tanto `dist/control-ui/index.html` como una carga útil no vacía en `dist/control-ui/assets/`, para evitar volver a distribuir un panel del navegador vacío.
- La verificación posterior a la publicación también comprueba que los puntos de entrada de plugins publicados y los metadatos del paquete estén presentes en la disposición instalada del registro. Si un lanzamiento carece de cargas útiles del entorno de ejecución de plugins, el verificador posterior a la publicación falla y el lanzamiento no se puede promover a `latest`.
- `pnpm test:install:smoke` también aplica el presupuesto de `unpackedSize` del paquete npm al archivo tar de actualización candidato, para que el E2E del instalador detecte aumentos accidentales del tamaño del paquete antes de la ruta de publicación del lanzamiento.
- Si el trabajo de lanzamiento modificó la planificación de CI, los manifiestos de tiempos de extensiones o las matrices de pruebas de extensiones, regenere y revise las salidas de matriz `plugin-prerelease-extension-shard`, propiedad del planificador, de `.github/workflows/plugin-prerelease.yml` antes de la aprobación, para que las notas de la versión no describan una disposición de CI obsoleta.
- La preparación del lanzamiento estable para macOS también incluye las superficies del actualizador: el lanzamiento de GitHub debe terminar con los archivos empaquetados `.zip`, `.dmg` y `.dSYM.zip`; `appcast.xml` en `main` debe apuntar al nuevo archivo zip estable después de la publicación (el flujo de publicación para macOS lo confirma automáticamente o abre una solicitud de incorporación para appcast cuando el envío directo está bloqueado); la aplicación empaquetada debe conservar un identificador de paquete que no sea de depuración, una URL no vacía para el canal de Sparkle y un `CFBundleVersion` igual o superior al mínimo canónico de compilación de Sparkle para esa versión del lanzamiento.

## Entornos de prueba de lanzamiento

`Full Release Validation` permite a los operadores iniciar todas las pruebas previas al lanzamiento desde un único punto de entrada. Para obtener una prueba de una confirmación fijada en una rama que cambia rápidamente, use la utilidad para que cada flujo secundario se ejecute desde una rama temporal fijada en un SHA de flujo de trabajo de confianza de `main`, mientras la confirmación solicitada permanece como candidata sometida a prueba:

```bash
pnpm ci:full-release --sha <full-sha>
```

La utilidad obtiene el estado actual de `origin/main`, envía `release-ci/<workflow-sha>-...` en esa confirmación de flujo de trabajo de confianza, inicia `Full Release Validation` desde la rama temporal con `ref=<target-sha>`, reutiliza evidencia estricta del destino exacto cuando está disponible, verifica que el `headSha` de cada flujo secundario coincida con el SHA fijado del flujo principal y, después, elimina la rama temporal. Proporcione `-f reuse_evidence=false` para forzar una ejecución nueva o `--workflow-sha <trusted-main-sha>` para fijar una confirmación anterior a la que todavía se pueda llegar desde el estado actual de `origin/main`. El propio flujo nunca escribe referencias del repositorio. Esto mantiene disponibles las herramientas de lanzamiento exclusivas de main sin añadir confirmaciones de herramientas a la versión candidata y evita demostrar por accidente una ejecución secundaria de un `main` más reciente.

Para validar una rama o etiqueta de lanzamiento, ejecútelo desde la referencia de confianza del flujo de trabajo de `main` y proporcione la rama o etiqueta de lanzamiento como `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

El flujo resuelve la referencia de destino, inicia manualmente `CI` con `target_ref=<release-ref>` y, después, inicia `OpenClaw Release Checks`. `OpenClaw Release Checks` distribuye la comprobación de humo de instalación, las comprobaciones de lanzamiento entre sistemas operativos, la cobertura en vivo/E2E mediante Docker de la ruta de lanzamiento cuando la prueba prolongada está habilitada, Package Acceptance con el E2E canónico del paquete de Telegram, la paridad de QA Lab, Matrix en vivo y Telegram en vivo. Una ejecución completa/de todos los componentes solo es aceptable cuando el resumen de `Full Release Validation` muestra `normal_ci`, `plugin_prerelease` y `release_checks` como correctos, salvo que una repetición de ejecución específica haya omitido intencionalmente el flujo secundario independiente `Plugin Prerelease`. Use el flujo secundario independiente `npm-telegram` solo para repetir específicamente una ejecución del paquete publicado con `release_package_spec` o `npm_telegram_package_spec`. El resumen del verificador final incluye tablas de los trabajos más lentos de cada ejecución secundaria, para que la persona responsable del lanzamiento pueda ver la ruta crítica actual sin descargar registros.

El flujo secundario de rendimiento del producto solo produce artefactos en esta ruta de lanzamiento. El
flujo general lo inicia con `publish_reports=false`, y la validación se rechaza
salvo que su protección exclusiva para artefactos demuestre que el publicador de informes de Clawgrit permaneció
omitido.

Consulte [Validación completa del lanzamiento](/es/reference/full-release-validation) para conocer la matriz completa de etapas, los nombres exactos de los trabajos del flujo, las diferencias entre los perfiles estable y completo, los artefactos y los controles para repetir ejecuciones específicas.

Los flujos secundarios se inician desde la referencia de confianza que ejecuta `Full Release Validation`, normalmente `--ref main`, incluso cuando la `ref` de destino apunta a una rama o etiqueta de lanzamiento anterior. Cada ejecución secundaria debe usar el SHA exacto del flujo principal; si `main` avanza antes de que se resuelva el inicio de un flujo secundario, el flujo general falla de forma cerrada. No existe una entrada independiente de referencia de flujo para Full Release Validation; elija el entorno de confianza mediante la referencia de ejecución del flujo. No use `--ref main -f ref=<sha>` para demostrar una confirmación exacta en un `main` que cambia; los SHA de confirmación sin procesar no pueden usarse como referencias de inicio de flujos, así que use `pnpm ci:full-release --sha <target-sha>` para crear una rama temporal en el estado de confianza de `origin/main`, manteniendo el SHA de destino como entrada candidata.

Use `release_profile` para seleccionar la amplitud de proveedores y comprobaciones en vivo:

- `minimum`: la ruta más rápida y esencial para el lanzamiento de OpenAI/núcleo en vivo y mediante Docker
- `stable`: el mínimo más la cobertura estable de proveedores y backends para aprobar el lanzamiento
- `full`: el perfil estable más una amplia cobertura consultiva de proveedores y contenido multimedia

Las validaciones estable y completa siempre ejecutan el barrido exhaustivo en vivo/E2E, de la ruta de lanzamiento mediante Docker y acotado de supervivencia a actualizaciones publicadas antes de la promoción. Use `run_release_soak=true` para solicitar ese mismo barrido para una versión beta. Ese barrido abarca los cuatro paquetes estables más recientes, además de las bases fijadas `2026.4.23` y `2026.5.2`, y la cobertura anterior de `2026.4.15`; se eliminan las bases duplicadas y cada base se divide en su propio trabajo de ejecutor de Docker.

`OpenClaw Release Checks` usa la referencia de confianza del flujo para resolver una sola vez la referencia de destino como `release-package-under-test` y reutiliza ese artefacto en las comprobaciones entre sistemas operativos, Package Acceptance y las comprobaciones mediante Docker de la ruta de lanzamiento cuando se ejecuta la prueba prolongada. Esto mantiene todos los entornos que procesan paquetes sobre los mismos bytes y evita repetir compilaciones del paquete. Cuando una versión beta ya esté en npm, establezca `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` para que las comprobaciones de lanzamiento descarguen una sola vez el paquete distribuido, extraigan su SHA de origen de compilación de `dist/build-info.json` y reutilicen ese artefacto en los carriles entre sistemas operativos, Package Acceptance, Docker de la ruta de lanzamiento y Telegram del paquete.

La comprobación de humo de instalación de OpenAI entre sistemas operativos usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` cuando está establecida la variable del repositorio o de la organización; de lo contrario, usa `openai/gpt-5.6-luna`, porque este carril demuestra la instalación del paquete, la incorporación, el inicio del Gateway y un turno de agente en vivo, en lugar de evaluar comparativamente el modelo más capaz. La matriz más amplia de proveedores en vivo sigue siendo el lugar destinado a la cobertura específica de cada modelo.

Use estas variantes según la etapa del lanzamiento:

```bash
# Valida una rama candidata a versión aún no publicada.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable

# Valida un commit enviado exacto.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f provider=openai \
  -f mode=both

# Después de publicar una versión beta, añade la prueba E2E de Telegram del paquete publicado.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f release_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

No utilice el conjunto completo como primera repetición después de una corrección específica. Si falla un entorno, utilice el flujo de trabajo secundario, el trabajo, la vía de Docker, el perfil de paquete, el proveedor del modelo o la vía de control de calidad que haya fallado para la siguiente comprobación. Vuelva a ejecutar el conjunto completo solo cuando la corrección haya modificado la orquestación compartida de la versión o haya dejado obsoletas las pruebas anteriores de todos los entornos. El verificador final del conjunto vuelve a comprobar los identificadores registrados de las ejecuciones de los flujos de trabajo secundarios, por lo que, después de repetir correctamente un flujo de trabajo secundario, vuelva a ejecutar únicamente el trabajo principal fallido `Verify full validation`.

`rerun_group=all` puede reutilizar una ejecución correcta anterior del conjunto solo cuando haya validado
exactamente el mismo SHA de destino, perfil de versión, configuración efectiva de la prueba prolongada y
entradas de validación. Esta es una recuperación limitada para volver a ejecutar el mismo candidato,
no una reutilización de pruebas entre distintos SHA. Para un candidato modificado, incluido un commit que
solo cambie el registro de cambios o la versión, vuelva a ejecutar cada comprobación de paquete, artefacto,
instalación, Docker o proveedor afectada por las rutas modificadas o los hashes de los artefactos. Las ejecuciones
más recientes del conjunto para la misma referencia `release/*`
y el mismo grupo de repetición reemplazan automáticamente a las que estén en curso. Pase
`reuse_evidence=false` para forzar una ejecución completa nueva.

Para una recuperación acotada, pase `rerun_group` al flujo general. `all` es la ejecución real del candidato de lanzamiento, `ci` ejecuta únicamente el proceso secundario normal de CI, `plugin-prerelease` ejecuta únicamente el proceso secundario de plugins exclusivo del lanzamiento, `release-checks` ejecuta todos los entornos de lanzamiento, y los grupos de lanzamiento más específicos son `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` y `npm-telegram`. Las reejecuciones específicas de `npm-telegram` requieren `release_package_spec` o `npm_telegram_package_spec`; las ejecuciones completas o de todas las pruebas usan el E2E canónico de Telegram del paquete dentro de Package Acceptance. Las reejecuciones específicas multiplataforma pueden añadir `cross_os_suite_filter=windows/packaged-upgrade` u otro filtro de sistema operativo o conjunto de pruebas. Los fallos de comprobación de lanzamiento de QA bloquean la validación normal del lanzamiento, incluida la desviación obligatoria de herramientas dinámicas de OpenClaw en el nivel estándar. Las ejecuciones alfa de Tideclaw aún pueden tratar como orientativos los procesos de comprobación de lanzamiento no relacionados con la seguridad del paquete. Con `release_profile=beta`, los conjuntos de pruebas de proveedores activos de `Run repo/live E2E validation` son orientativos (advertencias, no bloqueos); los perfiles estable y completo mantienen su carácter bloqueante. Cuando `live_suite_filter` solicita explícitamente un proceso activo de QA sujeto a una condición de habilitación, como Discord, WhatsApp o Slack, debe habilitarse la variable correspondiente del repositorio `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED`; de lo contrario, la captura de entradas falla en lugar de omitir silenciosamente el proceso.

### Vitest

El bloque de Vitest es el flujo de trabajo secundario manual de `CI`. El CI manual omite intencionadamente la delimitación por cambios y fuerza el grafo de pruebas normal para la versión candidata: particiones de Linux Node, particiones de plugins incluidos, particiones de contratos de plugins y canales, compatibilidad con Node 22, `check-*`, `check-additional-*`, comprobaciones rápidas de artefactos compilados, comprobaciones de documentación, Skills de Python, Windows, macOS e i18n de Control UI. Android se incluye cuando `Full Release Validation` ejecuta el bloque porque el flujo general pasa `include_android=true`; el CI manual independiente requiere `include_android=true` para incluir Android.

Utilice este bloque para responder «¿el árbol de código fuente superó el conjunto completo de pruebas normales?». No equivale a la validación del producto en la ruta de lanzamiento. Evidencia que debe conservarse:

- resumen de `Full Release Validation` que muestra la URL de la ejecución de `CI` iniciada
- ejecución de `CI` correcta en el SHA de destino exacto
- nombres de los shards fallidos o lentos de los trabajos de CI al investigar regresiones
- artefactos de tiempos de Vitest, como `.artifacts/vitest-shard-timings.json`, cuando una ejecución requiere un análisis de rendimiento

Ejecute CI manualmente de forma directa solo cuando la versión requiera una CI normal determinista, pero no los entornos de Docker, QA Lab, ejecución en vivo, sistemas operativos múltiples o paquetes. Use el primer comando para la CI directa sin Android. Añada `include_android=true` cuando la CI directa de la versión candidata deba incluir Android:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

El entorno de Docker se encuentra en `OpenClaw Release Checks` mediante `openclaw-live-and-e2e-checks-reusable.yml`, junto con el flujo de trabajo `install-smoke` en modo de versión. Valida la versión candidata mediante entornos de Docker empaquetados, en lugar de limitarse a pruebas en el código fuente.

La cobertura de Docker para versiones incluye:

- prueba de humo de instalación completa con la prueba de humo lenta de instalación global de Bun habilitada
- preparación o reutilización de la imagen de prueba de humo del Dockerfile raíz según el SHA de destino, con los trabajos de prueba de humo de QR, raíz/Gateway e instalador/Bun ejecutándose como shards independientes de install-smoke
- vías E2E del repositorio
- fragmentos de Docker de la ruta de publicación: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, desde `plugins-runtime-install-a` hasta `plugins-runtime-install-h` y `openwebui`
- cobertura de OpenWebUI en un ejecutor dedicado con gran capacidad de disco cuando se solicita
- vías divididas de instalación y desinstalación de plugins incluidos, desde `bundled-plugin-install-uninstall-0` hasta `bundled-plugin-install-uninstall-23`
- conjuntos de pruebas de proveedores en vivo/E2E y cobertura de modelos en vivo mediante Docker cuando las comprobaciones de la versión incluyen conjuntos de pruebas en vivo

Use los artefactos de Docker antes de volver a ejecutar. El programador de la ruta de publicación carga `.artifacts/docker-tests/` con registros de las vías, `summary.json`, `failures.json`, tiempos de las fases, el JSON del plan del programador y comandos de reejecución. Para una recuperación específica, use `docker_lanes=<lane[,lane]>` en el flujo de trabajo reutilizable en vivo/E2E, en lugar de volver a ejecutar todos los fragmentos de la versión. Los comandos de reejecución generados incluyen el `package_artifact_run_id` anterior y las entradas de imágenes de Docker preparadas cuando están disponibles, por lo que una vía fallida puede reutilizar el mismo archivo tar y las imágenes de GHCR.

### Laboratorio de QA

El entorno del Laboratorio de QA también forma parte de `OpenClaw Release Checks`. Es la barrera de lanzamiento para el comportamiento agéntico y en el nivel de los canales, independiente de Vitest y de la mecánica de paquetes de Docker.

La cobertura del Laboratorio de QA para lanzamientos incluye:

- una vía de paridad simulada que compara la vía candidata de OpenAI con la referencia `anthropic/claude-opus-4-8` mediante el paquete de paridad agéntica
- un perfil rápido de QA en vivo para Matrix que usa el entorno `qa-live-shared`
- una vía de QA en vivo para Telegram que usa arrendamientos de credenciales de CI de Convex
- `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`, `pnpm qa:prometheus:smoke` o `pnpm qa:observability:smoke` cuando la telemetría del lanzamiento necesita una comprobación local explícita

Use este entorno para responder «¿el lanzamiento se comporta correctamente en los escenarios de QA y los flujos de canales en vivo?». Conserve las URL de los artefactos de las vías de paridad, Matrix y Telegram al aprobar el lanzamiento. La cobertura completa de Matrix sigue disponible como una ejecución manual fragmentada del Laboratorio de QA, en lugar de ser la vía crítica para el lanzamiento de forma predeterminada.

### Paquete

El entorno de Paquete es la barrera del producto instalable. Está respaldado por `Package Acceptance` y el solucionador `scripts/resolve-openclaw-package-candidate.mjs`. El solucionador normaliza un candidato en el tarball `package-under-test` consumido por las pruebas E2E de Docker, valida el inventario del paquete, registra la versión y el SHA-256 del paquete y mantiene la referencia del arnés del flujo de trabajo separada de la referencia de origen del paquete.

Orígenes de candidatos compatibles:

- `source=npm`: `openclaw@beta`, `openclaw@latest` o una versión de lanzamiento exacta de OpenClaw
- `source=ref`: empaqueta una rama, etiqueta o SHA completo de confirmación de confianza de `package_ref` con el arnés `workflow_ref` seleccionado
- `source=url`: descarga un `.tgz` HTTPS público con el valor obligatorio `package_sha256`; se rechazan las credenciales en la URL, los puertos HTTPS no predeterminados, los nombres de host o las direcciones resueltas privados, internos o de uso especial y las redirecciones no seguras
- `source=trusted-url`: descarga un `.tgz` HTTPS con los valores obligatorios `package_sha256` y `trusted_source_id` desde una política con nombre en `.github/package-trusted-sources.json`; use esta opción para réplicas empresariales gestionadas por mantenedores o repositorios de paquetes privados, en lugar de añadir a `source=url` una omisión de red privada en el nivel de entrada
- `source=artifact`: reutiliza un `.tgz` cargado por otra ejecución de GitHub Actions

`OpenClaw Release Checks` ejecuta Package Acceptance con `source=artifact`, el artefacto del paquete de lanzamiento preparado, `suite_profile=custom`, `docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape`, `telegram_mode=mock-openai`. Package Acceptance mantiene la migración, la actualización, la actualización de VPS gestionados como root, el reinicio tras actualizar con la autenticación configurada, la instalación en vivo de Skills desde ClawHub, la limpieza de dependencias obsoletas de plugins, los recursos de prueba de plugins sin conexión, la actualización de plugins, el refuerzo contra el escape de la vinculación de comandos de plugins y la QA del paquete de Telegram en el mismo tarball resuelto. Las comprobaciones de lanzamiento bloqueantes usan como referencia predeterminada el paquete publicado más reciente; el perfil beta con `run_release_soak=true`, `release_profile=stable` o `release_profile=full` amplía el barrido de supervivencia a actualizaciones publicadas a `last-stable-4`, además de las referencias fijadas `2026.4.23`, `2026.5.2` y `2026.4.15`, con escenarios `reported-issues`. Use Package Acceptance con `source=npm` para un candidato ya publicado, `source=ref` para un tarball npm local respaldado por un SHA antes de publicarlo, `source=trusted-url` para una réplica empresarial o privada gestionada por mantenedores, o `source=artifact` para un tarball preparado y cargado por otra ejecución de GitHub Actions.

Es el reemplazo nativo de GitHub para la mayor parte de la cobertura de paquetes y actualizaciones que anteriormente requería Parallels. Las comprobaciones de lanzamiento entre sistemas operativos siguen siendo importantes para la incorporación, el instalador y el comportamiento específico de cada plataforma, pero la validación del producto para paquetes y actualizaciones debe preferir Package Acceptance.

La lista de comprobación canónica para validar actualizaciones y plugins es [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins). Úsela para decidir qué vía local, de Docker, de Package Acceptance o de comprobación de lanzamiento demuestra un cambio en la instalación o actualización de un plugin, la limpieza mediante doctor o la migración de un paquete publicado. La migración exhaustiva de actualizaciones publicadas desde cada paquete estable `2026.4.23+` es un flujo de trabajo manual `Update Migration` independiente, no forma parte de Full Release CI.

La tolerancia heredada de aceptación de paquetes está limitada deliberadamente en el tiempo. Los paquetes hasta `2026.4.25` pueden usar la ruta de compatibilidad para carencias de metadatos ya publicadas en npm: entradas privadas del inventario de QA ausentes del tarball, ausencia de `gateway install --wrapper`, archivos de parche ausentes en el recurso de prueba de Git derivado del tarball, ausencia de persistencia de `update.channel`, ubicaciones heredadas de registros de instalación de plugins, ausencia de persistencia de registros de instalación del marketplace y migración de metadatos de configuración durante `plugins update`. El paquete publicado `2026.4.26` puede emitir advertencias por archivos de marca de metadatos de compilación local que ya se distribuyeron. Los paquetes posteriores deben cumplir los contratos modernos de paquetes; esas mismas carencias hacen que falle la validación del lanzamiento.

Use perfiles más amplios de Package Acceptance cuando la cuestión del lanzamiento se refiera a un paquete instalable real:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

Perfiles comunes de paquetes:

- `smoke`: vías rápidas de instalación del paquete/canal/agente, red del Gateway y recarga de configuración
- `package`: contratos de instalación/actualización/reinicio/paquetes de Plugin, además de una prueba en vivo de instalación de Skills desde ClawHub; esta es la opción predeterminada para las comprobaciones de lanzamiento
- `product`: `package` más canales MCP, limpieza de cron/subagentes, búsqueda web de OpenAI y OpenWebUI
- `full`: segmentos de la ruta de lanzamiento de Docker con OpenWebUI
- `custom`: lista exacta de `docker_lanes` para repeticiones específicas

Para la prueba de Telegram de un paquete candidato, habilite `telegram_mode=mock-openai` o `telegram_mode=live-frontier` en Package Acceptance. El flujo de trabajo pasa el tarball `package-under-test` resuelto a la vía de Telegram; el flujo de trabajo independiente de Telegram sigue aceptando una especificación npm publicada para comprobaciones posteriores a la publicación.

## Automatización de publicación de lanzamientos regulares

Para la publicación beta, `latest`, de plugins, de GitHub Release y de plataformas,
`OpenClaw Release Publish` es el punto de entrada normal con capacidad de modificación. La ruta
mensual de estabilidad extendida `.33+`, exclusiva de npm, no utiliza este orquestador. El
flujo de trabajo regular orquesta los flujos de trabajo de publicación de confianza en el orden que
requiere el lanzamiento:

1. Extraer la etiqueta de lanzamiento y resolver el SHA de su commit.
2. Verificar que la etiqueta sea accesible desde `main` o `release/*` (o desde una rama alfa de Tideclaw para prelanzamientos alfa).
3. Ejecutar `pnpm plugins:sync:check`.
4. Despachar `Plugin NPM Release` con `publish_scope=all-publishable` y `ref=<release-sha>`.
5. Despachar `Plugin ClawHub Release` con el mismo ámbito y SHA.
6. Despachar `OpenClaw NPM Release` con la etiqueta de lanzamiento, la etiqueta de distribución de npm y el `preflight_run_id` guardado después de verificar el `full_release_validation_run_id` guardado y el intento exacto de ejecución.
7. Para lanzamientos estables, crear o actualizar el lanzamiento de GitHub como borrador, despachar `Windows Node Release` con el `windows_node_tag` explícito y los `windows_node_installer_digests` aprobados para el candidato, y verificar los activos canónicos del instalador de Windows y sus sumas de comprobación. Despachar también `Android Release` para compilar el APK firmado de la etiqueta exacta, junto con su suma de comprobación y procedencia. Verificar ambos contratos de activos nativos antes de publicar el borrador.

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

Utilice los flujos de trabajo de nivel inferior `Plugin NPM Release` y `Plugin ClawHub Release` solo para trabajos específicos de reparación o republicación. `OpenClaw Release Publish` rechaza `plugin_publish_scope=selected` cuando `publish_openclaw_npm=true`, para que el paquete principal no pueda publicarse sin todos los plugins oficiales publicables, incluido `@openclaw/diffs-language-pack`. Para reparar un Plugin seleccionado, establezca `publish_openclaw_npm=false` con `plugin_publish_scope=selected` y `plugins=@openclaw/name`, o despache directamente el flujo de trabajo secundario.

La inicialización de ClawHub para una primera publicación es la excepción: despache `Plugin ClawHub New`
desde un `main` de confianza y pase el SHA completo del lanzamiento de destino mediante `ref`.
Nunca ejecute el propio flujo de trabajo de inicialización desde la etiqueta o rama de lanzamiento:

```bash
gh workflow run plugin-clawhub-new.yml \
  --ref main \
  -f plugins=@openclaw/name \
  -f ref=<full-40-character-release-sha> \
  -f pretag_validation=true \
  -f dry_run=true
```

La validación previa al etiquetado requiere `dry_run=true`, rechaza entradas de etiquetas de lanzamiento y ejecuciones
principales, y solo acepta un destino exacto accesible desde `main` o `release/*`.
No carga credenciales de ClawHub, publica bytes de paquetes ni cambia la configuración de
publicadores de confianza. El flujo de trabajo sigue resolviendo el plan del registro en vivo,
extrae y empaqueta el destino únicamente en un trabajo sin secretos, materializa la
cadena de herramientas bloqueada de ClawHub y valida el artefacto inmutable y el
slug/identidad del paquete antes de que exista la etiqueta de lanzamiento. Apruebe el entorno
`clawhub-plugin-bootstrap` solo después de que finalicen los trabajos de empaquetado sin secretos;
este trabajo de validación protegido no tiene credenciales ni comandos de modificación.

Una ejecución de prueba aprobada o una inicialización real después del etiquetado debe incluir la
etiqueta de lanzamiento exacta, además del identificador, intento y rama de la ejecución principal
`OpenClaw Release Publish`. La ejecución principal certifica su propio SHA del flujo de trabajo y un SHA
exacto y separado de un `main` de confianza para `Plugin ClawHub New`; la ejecución secundaria y cada
aprobación de entorno protegido deben coincidir con ese SHA secundario aprobado. La etiqueta de lanzamiento se
vuelve a comprobar antes de cada intento de publicación y modificación del publicador de confianza.

El trabajo de empaquetado
carga un artefacto inmutable cuyo nombre, ID/resumen del artefacto de Actions,
ejecución/intento productor, SHA de destino y SHA-256/tamaño del tarball de cada paquete se
transmiten a los trabajos de validación y protegidos. El trabajo protegido extrae únicamente
herramientas de un `main` de confianza, valida la tupla del artefacto mediante la API de GitHub, lo descarga
por su ID de artefacto exacto, vuelve a calcular el hash de cada tarball y valida las rutas TAR locales y
la identidad del paquete con las reglas de canonicalización USTAR de la CLI fijada. Después,
cada candidato supera la ejecución de prueba de publicación de la CLI fijada, que finaliza antes de
consultar el registro o realizar la autenticación. El prefiltro del trabajo con credenciales limita los ClawPacks comprimidos
a 120 MiB, la carga total de archivos a 50 MiB, los datos TAR expandidos a 64 MiB y
el número de entradas TAR a 10,000. La reparación del publicador de confianza para paquetes existentes continúa
siendo únicamente de configuración, pero aun así empaqueta el destino y exige la etiqueta solicitada,
además de una igualdad exacta de bytes y metadatos del registro, antes de cambiar la configuración del publicador
de confianza. La verificación posterior a la publicación descarga el artefacto de ClawHub y
exige el mismo SHA-256 y tamaño. Una recuperación mediante la repetición de trabajos fallidos puede reutilizar el
artefacto del paquete de un intento anterior solo cuando el trabajo productor exacto se haya completado
correctamente. La evidencia final también vincula la versión bloqueada de ClawHub, el
SHA-256 del bloqueo y la integridad de npm. Una discrepancia requiere una nueva versión del paquete.

## Entradas del flujo de trabajo de NPM

`OpenClaw NPM Release` acepta estas entradas controladas por el operador:

- `tag`: etiqueta de lanzamiento obligatoria, como `v2026.4.2`, `v2026.4.2-1`, `v2026.4.2-beta.1` o `v2026.4.2-alpha.1`; cuando `preflight_only=true`, también puede ser el SHA completo de 40 caracteres del commit actual de la rama del flujo de trabajo para una validación preliminar exclusivamente de validación
- `preflight_only`: `true` solo para validación/compilación/empaquetado, `false` para la ruta de publicación real
- `preflight_run_id`: identificador de una ejecución preliminar correcta existente, obligatorio en la ruta de publicación real para que el flujo de trabajo reutilice el tarball preparado en lugar de volver a compilarlo
- `full_release_validation_run_id`: identificador de una ejecución correcta de `Full Release Validation` para esta etiqueta/SHA, obligatorio para la publicación real. Las publicaciones beta pueden continuar solo con la validación preliminar y una advertencia, pero la promoción estable/a `latest` sigue requiriéndolo.
- `full_release_validation_run_attempt`: intento de ejecución positivo exacto asociado con `full_release_validation_run_id`; obligatorio siempre que se proporcione el identificador de ejecución, para que las repeticiones no puedan cambiar la evidencia de autorización durante la publicación.
- `release_publish_run_id`: identificador de ejecución aprobado de `OpenClaw Release Publish`; obligatorio cuando este flujo de trabajo es despachado por esa ejecución principal (llamadas de publicación real de actores bot)
- `plugin_npm_run_id`: identificador de ejecución correcta y de cabecera exacta de `Plugin NPM Release`; obligatorio para una publicación principal `extended-stable` real
- `npm_dist_tag`: etiqueta de destino de npm para la ruta de publicación; acepta `alpha`, `beta`, `latest` o `extended-stable` y el valor predeterminado es `beta`. El parche final `33` y posteriores deben usar `extended-stable`; de forma predeterminada, `extended-stable` rechaza parches anteriores y siempre rechaza etiquetas no finales.
- `bypass_extended_stable_guard`: booleano exclusivo para pruebas, con valor predeterminado `false`; con `npm_dist_tag=extended-stable`, omite la comprobación de elegibilidad mensual de estabilidad extendida sin omitir las comprobaciones de identidad del lanzamiento, artefactos, aprobación y lectura posterior.

`Plugin NPM Release` acepta `npm_dist_tag=default` para el comportamiento de lanzamiento
existente o `npm_dist_tag=extended-stable` para la ruta mensual protegida. La
opción de estabilidad extendida requiere `publish_scope=all-publishable`, una entrada
`plugins` vacía, un parche final igual o superior a `33` y la rama canónica
`extended-stable/YYYY.M.33` en su punta exacta. Nunca mueve las etiquetas
`latest` ni `beta` de los plugins. Las nuevas versiones de paquetes reciben `extended-stable` de forma atómica
mediante publicación de confianza OIDC (`npm publish --tag extended-stable`); este
flujo de trabajo de origen no utiliza `npm dist-tag add` autenticado mediante token. Los reintentos
omiten las versiones exactas ya presentes en npm y después fallan de forma cerrada, salvo que una
lectura posterior completa confirme que cada paquete exacto y la etiqueta `extended-stable` han convergido.

`OpenClaw Release Publish` acepta estas entradas controladas por el operador:

- `tag`: etiqueta de lanzamiento obligatoria; ya debe existir
- `preflight_run_id`: identificador de una ejecución preliminar correcta de `OpenClaw NPM Release`; obligatorio cuando `publish_openclaw_npm=true` o `plugin_publish_scope=all-publishable`
- `full_release_validation_run_id`: identificador de una ejecución correcta de `Full Release Validation`; obligatorio cuando `publish_openclaw_npm=true` o `plugin_publish_scope=all-publishable`
- `full_release_validation_run_attempt`: intento positivo exacto asociado con `full_release_validation_run_id`; obligatorio siempre que se proporcione el identificador de ejecución
- `windows_node_tag`: etiqueta de lanzamiento exacta y no preliminar de `openclaw/openclaw-windows-node`; obligatoria para la publicación estable de OpenClaw
- `windows_node_installer_digests`: mapa JSON compacto aprobado para el candidato que relaciona los nombres actuales de los instaladores de Windows con sus resúmenes `sha256:` fijados; obligatorio para la publicación estable de OpenClaw
- `npm_telegram_run_id`: identificador opcional de una ejecución correcta de `NPM Telegram Beta E2E` que se incluirá en la evidencia final del lanzamiento
- `npm_dist_tag`: etiqueta de destino de npm para el paquete OpenClaw, una de `alpha`, `beta` o `latest`
- `plugin_publish_scope`: el valor predeterminado es `all-publishable`; utilice `selected` solo para trabajos específicos de reparación exclusiva de plugins con `publish_openclaw_npm=false`
- `plugins`: nombres de paquetes `@openclaw/*` separados por comas cuando `plugin_publish_scope=selected`
- `publish_openclaw_npm`: el valor predeterminado es `true`; establézcalo en `false` solo cuando utilice el flujo de trabajo como orquestador de reparación exclusiva de plugins
- `release_profile`: perfil de cobertura del lanzamiento utilizado para los resúmenes de evidencia del lanzamiento; el valor predeterminado es `from-validation`, que lo lee del manifiesto de validación, o puede sustituirse por `beta`, `stable` o `full`
- `wait_for_clawhub`: el valor predeterminado es `false` para que la disponibilidad de npm no quede bloqueada por el proceso auxiliar de ClawHub; establézcalo en `true` solo cuando la finalización del flujo de trabajo deba incluir la finalización de ClawHub

`OpenClaw Release Checks` acepta estas entradas controladas por el operador:

- `ref`: rama, etiqueta o SHA completo del commit que se validará. Las comprobaciones que contienen secretos requieren que el commit resuelto sea accesible desde una rama o etiqueta de lanzamiento de OpenClaw.
- `run_release_soak`: permite incluir pruebas exhaustivas en vivo/E2E, la ruta de lanzamiento de Docker y pruebas prolongadas de supervivencia de actualizaciones desde todas las versiones para las comprobaciones de lanzamientos beta. Se activa obligatoriamente mediante `release_profile=stable` y `release_profile=full`.

Reglas:

- Las versiones finales regulares y las versiones de corrección por debajo del parche `33` pueden publicarse en `beta` o `latest`. Las versiones finales con parche `33` o superior deben publicarse en `extended-stable`, y las versiones con sufijo de corrección en ese límite se rechazan.
- Las etiquetas de prelanzamiento beta solo pueden publicarse en `beta`; las etiquetas de prelanzamiento alfa solo pueden publicarse en `alpha`
- Para `OpenClaw NPM Release`, solo se permite introducir el SHA completo del commit cuando `preflight_only=true`
- `OpenClaw Release Checks` y `Full Release Validation` siempre se limitan a la validación
- La ruta de publicación real debe usar el mismo `npm_dist_tag` utilizado durante la comprobación previa; el flujo de trabajo verifica esos metadatos antes de continuar la publicación

## Secuencia regular de lanzamiento estable beta/latest

Esta secuencia heredada corresponde al lanzamiento regular orquestado que también gestiona los plugins, GitHub Release, Windows y el trabajo para otras plataformas. No es la ruta mensual `.33+` de estabilidad extendida exclusiva de npm que se documenta al principio de esta página.

Al preparar un lanzamiento estable regular orquestado:

1. Ejecute `OpenClaw NPM Release` con `preflight_only=true`. Antes de que exista una etiqueta, puede usar el SHA completo del commit actual de la rama del flujo de trabajo para realizar una ejecución de prueba, exclusivamente de validación, del flujo de trabajo de comprobación previa.
2. Elija `npm_dist_tag=beta` para el flujo normal que comienza por beta, o `latest` solo cuando se quiera realizar intencionadamente una publicación estable directa.
3. Ejecute `Full Release Validation` en la rama de lanzamiento, la etiqueta de lanzamiento o el SHA completo del commit cuando se quiera obtener desde un único flujo de trabajo manual la CI normal, además de cobertura de la caché de prompts en vivo, Docker, QA Lab, Matrix y Telegram. Si intencionadamente solo se necesita el grafo determinista de pruebas normales, ejecute en su lugar el flujo de trabajo manual `CI` sobre la referencia de lanzamiento.
4. Seleccione la etiqueta de lanzamiento exacta, que no sea de prelanzamiento, de `openclaw/openclaw-windows-node` cuyos instaladores firmados x64 y ARM64 deban distribuirse. Guárdela como `windows_node_tag` y guarde su mapa de resúmenes validado como `windows_node_installer_digests`. El asistente de candidatos de lanzamiento registra ambos y los incluye en el comando de publicación que genera.
5. Guarde el `preflight_run_id`, el `full_release_validation_run_id` y el `full_release_validation_run_attempt` exacto de las ejecuciones correctas.
6. Ejecute `OpenClaw Release Publish` desde un `main` de confianza con la misma `tag`, el mismo `npm_dist_tag`, el `windows_node_tag` seleccionado, su `windows_node_installer_digests` guardado, el `preflight_run_id`, el `full_release_validation_run_id` y el `full_release_validation_run_attempt` guardados. Publica los plugins externalizados en npm y ClawHub antes de promocionar el paquete npm de OpenClaw.
7. Si el lanzamiento se publicó en `beta`, use el flujo de trabajo `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` para promocionar esa versión estable de `beta` a `latest`.
8. Si el lanzamiento se publicó intencionadamente directamente en `latest` y `beta` debe usar de inmediato la misma compilación estable, utilice ese mismo flujo de trabajo de lanzamiento para dirigir ambas etiquetas de distribución a la versión estable, o permita que su sincronización programada de autorreparación traslade `beta` posteriormente.

La modificación de las etiquetas de distribución reside en el repositorio del registro de lanzamientos porque todavía requiere `NPM_TOKEN`, mientras que el repositorio del código fuente mantiene una publicación exclusivamente mediante OIDC. Esto permite que tanto la ruta de publicación directa como la ruta de promoción que comienza por beta estén documentadas y sean visibles para los operadores.

Si un mantenedor debe recurrir a la autenticación local de npm, debe ejecutar cualquier comando de la CLI de 1Password (`op`) únicamente dentro de una sesión dedicada de tmux. No llame a `op` directamente desde el shell principal del agente; mantenerlo dentro de tmux permite observar las solicitudes, alertas y la gestión de OTP, y evita que se repitan las alertas del host.

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

Los mantenedores utilizan la documentación privada de lanzamientos en [`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md) como manual operativo real.

## Contenido relacionado

- [Canales de lanzamiento](/es/install/development-channels)
