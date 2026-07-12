---
read_when:
    - Buscando definiciones de canales de lanzamiento públicos
    - Ejecución de la validación de la versión o de la aceptación del paquete
    - Buscando la nomenclatura y la cadencia de las versiones
summary: Canales de lanzamiento, lista de verificación del operador, cuadros de validación, nomenclatura de versiones y frecuencia de publicación
title: Política de lanzamientos
x-i18n:
    generated_at: "2026-07-11T23:31:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4270a96560ee908c09d26782ffa75dbc695f4ab83c5a80dfb7abe5befd8ca686
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw ofrece actualmente tres canales de actualización orientados al usuario:

- stable: el canal existente de versiones promocionadas, que todavía se resuelve mediante `latest` de npm hasta que se complete el hito de separación del CLI y el canal
- beta: etiquetas de versión preliminar que se publican en `beta` de npm
- dev: la punta cambiante de `main`

Por separado, los operadores de versiones pueden publicar el paquete principal del último mes completado en `extended-stable` de npm, comenzando en el parche `33`. La línea final regular del mes actual continúa en `latest` de npm; esta separación de publicaciones del lado del operador no cambia por sí sola la resolución de los canales de actualización del CLI.

Las compilaciones alfa de Tideclaw son una línea interna independiente de versiones preliminares (dist-tag `alpha` de npm), descrita en [Entradas del flujo de trabajo de NPM](#npm-workflow-inputs) y [Entornos de prueba de versiones](#release-test-boxes).

## Nomenclatura de versiones

- Versión mensual extended-stable de npm: `YYYY.M.PATCH`, con `PATCH >= 33`, etiqueta de git `vYYYY.M.PATCH`
- Versión final diaria/regular: `YYYY.M.PATCH`, con `PATCH < 33`, etiqueta de git `vYYYY.M.PATCH`
- Versión de corrección alternativa regular: `YYYY.M.PATCH-N`, etiqueta de git `vYYYY.M.PATCH-N`
- Versión preliminar beta: `YYYY.M.PATCH-beta.N`, etiqueta de git `vYYYY.M.PATCH-beta.N`
- Versión preliminar alfa: `YYYY.M.PATCH-alpha.N`, etiqueta de git `vYYYY.M.PATCH-alpha.N`
- Nunca se deben rellenar con ceros el mes ni el parche
- `PATCH` es un número secuencial del ciclo mensual de versiones, no un día del calendario. Las versiones finales regulares y beta hacen avanzar el ciclo actual; las etiquetas exclusivamente alfa nunca consumen ni hacen avanzar el número de parche beta/regular, por lo que se deben ignorar las etiquetas heredadas exclusivamente alfa con números de parche superiores al seleccionar un ciclo beta o regular.
- Las compilaciones alfa/nocturnas usan el siguiente ciclo de parche aún no publicado e incrementan únicamente `alpha.N` para compilaciones repetidas. Cuando ese parche tenga una beta, las nuevas compilaciones alfa pasan al parche siguiente.
- Las versiones de npm son inmutables: nunca se debe eliminar, volver a publicar ni reutilizar una etiqueta publicada. En su lugar, se debe generar el siguiente número de versión preliminar o el siguiente parche mensual.
- `latest` continúa siguiendo la línea npm regular/diaria actual; `beta` es el destino de instalación beta actual
- `extended-stable` designa el paquete npm compatible del mes anterior, comenzando en el parche `33`; el parche `34` y los posteriores son versiones de mantenimiento de esa línea mensual
- Las versiones finales regulares y las correcciones regulares se publican de forma predeterminada en `beta` de npm; los operadores de versiones pueden seleccionar `latest` explícitamente o promocionar más adelante una compilación beta ya validada
- La ruta mensual específica de extended-stable publica el paquete principal de npm y todos los plugins oficiales publicables en npm con exactamente la misma versión. No publica plugins en ClawHub ni publica artefactos de macOS o Windows, una versión de GitHub, dist-tags de repositorios privados, imágenes de Docker, artefactos móviles ni descargas del sitio web.
- Cada versión final regular distribuye conjuntamente el paquete npm, la aplicación para macOS, el APK independiente firmado para Android y los instaladores firmados de Windows Hub. Las versiones beta normalmente validan y publican primero la ruta de npm/paquete; la compilación, firma, notarización y promoción de aplicaciones nativas se reservan para la versión final regular, salvo que se soliciten explícitamente.

## Cadencia de versiones

- Las versiones avanzan primero por beta; stable solo las sigue después de validar la beta más reciente
- Normalmente, los mantenedores crean las versiones desde una rama `release/YYYY.M.PATCH` creada a partir del estado actual de `main`, para que la validación y las correcciones de la versión no bloqueen el nuevo desarrollo en `main`
- Si se ha enviado o publicado una etiqueta beta y necesita una corrección, los mantenedores generan la siguiente etiqueta `-beta.N` en lugar de eliminar o volver a crear la anterior
- El procedimiento detallado de publicación, las aprobaciones, las credenciales y las notas de recuperación son solo para mantenedores

## Publicación mensual extended-stable solo en npm

Esta es una excepción específica al procedimiento regular de publicación descrito a continuación. Para un mes completado `YYYY.M`, se debe crear `extended-stable/YYYY.M.33`; se deben publicar `vYYYY.M.33` y los parches de mantenimiento posteriores desde esa misma rama. La etiqueta de versión, la punta de la rama, el checkout, la versión del paquete, la comprobación previa de npm y la ejecución de Validación completa de la versión deben identificar el mismo commit. La rama protegida `main` ya debe contener una versión final de un mes calendario estrictamente posterior con un parche inferior a `33`; los parches de mantenimiento continúan siendo aptos después de que `main` avance más de un mes.

En la rama extended-stable exacta, se debe actualizar el paquete raíz a `YYYY.M.P`, ejecutar `pnpm release:prep` y verificar que todos los paquetes de extensiones publicables tengan la misma versión. Se deben confirmar y enviar todos los cambios generados, crear y enviar la etiqueta inmutable `vYYYY.M.P` en ese commit, y registrar el SHA completo resultante. Los flujos de trabajo consumen este árbol preparado; no actualizan ni sincronizan las versiones automáticamente.

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

`release_profile=stable` es el perfil existente de profundidad de validación; es independiente del dist-tag `extended-stable` de npm y se mantiene sin cambios deliberadamente.

Cuando ambas ejecuciones finalicen correctamente, se debe publicar cada Plugin oficial publicable en npm desde la punta exacta de la misma rama. El parche `P` debe ser `33` o superior. Se debe pasar el SHA completo de la versión como `ref`, esperar a que se completen toda la matriz y la verificación de lectura del registro y, después, guardar el identificador de la ejecución correcta de la publicación de plugins en NPM:

```bash
RELEASE_SHA="$(git rev-parse HEAD)"
gh workflow run plugin-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f publish_scope=all-publishable \
  -f ref="$RELEASE_SHA" \
  -f npm_dist_tag=extended-stable
```

El flujo de trabajo utiliza el inventario regular preparado de paquetes `all-publishable`, incluidos los paquetes cuyo código fuente no haya cambiado. Antes de finalizar correctamente, verifica cada paquete exacto y cada etiqueta `extended-stable` de los plugins. Si una ejecución parcial falla, se debe volver a ejecutar el mismo comando: se reutilizan los paquetes ya publicados, se concilian las etiquetas de plugins ausentes u obsoletas en el entorno de publicación de npm y la lectura final sigue abarcando el conjunto completo de paquetes.

Cuando el flujo de trabajo de plugins finalice correctamente y el entorno de publicación de npm esté listo, se debe publicar el tarball principal exacto de la comprobación previa. La publicación principal verifica que la ejecución de plugins referenciada tenga el estado `completed/success` en la misma rama canónica y con el SHA exacto del código fuente:

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

Para un ensayo en una bifurcación o un entorno que no sea de producción y que intencionalmente no pueda cumplir la política mensual de `.33` o del mes de la rama protegida `main`, se debe añadir `-f bypass_extended_stable_guard=true` tanto a las ejecuciones de comprobación previa como de publicación de npm. El valor predeterminado es `false`. La omisión solo se acepta con `npm_dist_tag=extended-stable` y se registra en el resumen del flujo de trabajo. No omite la referencia canónica del flujo de trabajo `extended-stable/YYYY.M.33`, la igualdad entre la punta de la rama, la etiqueta y el checkout, la sintaxis de la etiqueta final, la igualdad entre las versiones del paquete y la etiqueta, la identidad de la ejecución y el manifiesto referenciados, la procedencia del tarball, la aprobación del entorno, la verificación de lectura del registro ni las pruebas de reparación del selector.

El flujo de trabajo de publicación verifica las identidades de la comprobación previa, la validación y la ejecución de plugins referenciadas, el resumen criptográfico del tarball preparado y los selectores del registro principal. Después de que el flujo de trabajo finalice correctamente, se debe confirmar el resultado de forma independiente:

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

Ambos comandos deben devolver `YYYY.M.P`. Si la publicación finaliza correctamente, pero falla la verificación de lectura del selector, no se debe volver a publicar la versión inmutable del paquete. Se debe usar el único comando de reparación `npm dist-tag add openclaw@YYYY.M.P extended-stable` que se muestra en el resumen de ejecución permanente del flujo de trabajo fallido y, después, repetir ambas verificaciones de lectura independientes. La reversión al selector anterior es una decisión independiente del operador, no la ruta de reparación de la verificación de lectura.

La documentación pública de compatibilidad designa inicialmente Slack, Discord y Codex como superficies de plugins cubiertas por extended-stable. Esa lista es una declaración de compatibilidad, no una lista de permitidos del código de publicación: todos los plugins oficiales publicables en npm siguen la misma ruta de publicación con la versión exacta.

La lista de comprobación regular que aparece a continuación continúa gestionando beta, `latest`, la versión de GitHub, los plugins, macOS, Windows y la publicación en otras plataformas. No se deben ejecutar esos pasos para esta ruta extended-stable exclusiva de npm.

## Lista de comprobación regular para operadores de versiones

Esta lista de comprobación representa públicamente el flujo de publicación. Las credenciales privadas, la firma, la notarización, la recuperación de dist-tags y los detalles de reversión de emergencia permanecen en el manual de publicación exclusivo para mantenedores.

1. Parta de la versión actual de `main`: obtenga los cambios más recientes, confirme que el commit de destino se haya enviado y confirme que la CI de `main` esté lo suficientemente estable como para crear una rama a partir de ella.
2. Genere la sección superior de `CHANGELOG.md` a partir de las PR fusionadas y de todos los commits directos desde la última etiqueta de versión alcanzable. Mantenga las entradas orientadas al usuario, elimine duplicados entre las entradas de PR y commits directos que se solapen, haga commit, envíe los cambios y vuelva a hacer rebase/obtener cambios una vez más antes de crear la rama. Cuando una etiqueta publicada divergente o una incorporación posterior vuelva a asociar PR ya publicadas, pase esa etiqueta explícitamente como `--shipped-ref`; el verificador utiliza filas de PR explícitas de registros completos de contribuciones en secciones numeradas de la instantánea de la etiqueta, ignora `Unreleased` y registra el inventario exacto y la cantidad de PR excluidas.
3. Revise los registros de compatibilidad de versiones en `src/plugins/compat/registry.ts` y `src/commands/doctor/shared/deprecation-compat.ts`. Elimine la compatibilidad caducada solo cuando la ruta de actualización siga cubierta, o documente por qué se mantiene intencionadamente.
4. Cree `release/YYYY.M.PATCH` a partir de la versión actual de `main`. No realice el trabajo habitual de publicación directamente en `main`.
5. Actualice todas las ubicaciones de versión necesarias para la etiqueta y, a continuación, ejecute `pnpm release:prep`. Esto actualiza, en orden, las versiones de los plugins, los archivos shrinkwrap de npm, el inventario de plugins, el esquema de configuración base, los metadatos de configuración de canales incluidos, la línea base de la documentación de configuración, las exportaciones del SDK de plugins y la línea base de la API del SDK de plugins. Haga commit de cualquier diferencia generada antes de etiquetar y, a continuación, ejecute la comprobación previa local determinista: `pnpm check:test-types`, `pnpm check:architecture`, `pnpm build && pnpm ui:build` y `pnpm release:check`.
6. Ejecute `OpenClaw NPM Release` con `preflight_only=true`. Antes de que exista una etiqueta, se permite un SHA completo de 40 caracteres de la rama de publicación únicamente para la comprobación previa de validación. La comprobación previa genera evidencia de publicación de dependencias para el gráfico exacto de dependencias extraído y la almacena en el artefacto de comprobación previa de npm. Guarde el valor correcto de `preflight_run_id`.
7. Inicie todas las pruebas previas a la publicación con `Full Release Validation` para la rama de publicación, la etiqueta o el SHA completo del commit. Este es el único punto de entrada manual para los cuatro grandes grupos de pruebas de publicación: Vitest, Docker, QA Lab y Package. Guarde `full_release_validation_run_id` y el valor exacto de `full_release_validation_run_attempt`; ambos son entradas obligatorias para `OpenClaw NPM Release` y `OpenClaw Release Publish`.
8. Si la validación falla, corrija el problema en la rama de publicación y vuelva a ejecutar el archivo, carril, trabajo del flujo de trabajo, perfil de paquete, proveedor o lista de permitidos de modelos más pequeño que demuestre la corrección. Vuelva a ejecutar el conjunto completo solo cuando la superficie modificada deje obsoleta la evidencia anterior.
9. Para un candidato beta etiquetado, ejecute `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N` desde la rama `release/YYYY.M.PATCH` correspondiente. Para una versión estable, pase también la versión de origen de Windows obligatoria: `pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`. El asistente utiliza la versión de confianza de `main` como origen del flujo de trabajo, mientras cada flujo de trabajo apunta a la etiqueta exacta. Registra puntos de control de la identidad inmutable del candidato y de las herramientas, así como los identificadores de las ejecuciones iniciadas, en `.artifacts/release-candidate/<tag>/release-candidate-state.json`; volver a ejecutar el mismo comando reanuda esas ejecuciones exactas, mientras que cualquier diferencia en el candidato, las herramientas, el perfil o las opciones provoca un cierre seguro. Antes de iniciar la matriz completa de validación, el asistente renderiza de forma determinista el cuerpo exacto de la versión de GitHub correspondiente a la etiqueta y rechaza la ausencia del encabezado de versión, un cuerpo que exceda el límite y no pueda utilizar el formato compacto canónico, o una procedencia de base/destino de los registros de contribuciones que no sea alcanzable desde la etiqueta. También valida los metadatos explícitos de exclusión de la línea base publicada con respecto a los registros acumulativos de la etiqueta referenciada. A continuación, ejecuta las comprobaciones locales de la versión generada, inicia o verifica la validación completa de la versión y la evidencia de comprobación previa de npm, ejecuta la prueba de instalación nueva/actualización de Parallels con el tarball exacto preparado, además de la prueba del paquete de Telegram, registra los planes de plugins para npm y ClawHub, e imprime el comando exacto `OpenClaw Release Publish` solo cuando el conjunto de evidencias está correcto.

   `OpenClaw Release Publish` inicia en paralelo la publicación en npm de los paquetes de plugins seleccionados o de todos los publicables y del mismo conjunto en ClawHub; después, promociona el artefacto preparado de comprobación previa de npm de OpenClaw con la etiqueta de distribución correspondiente una vez que la publicación de los plugins en npm se completa correctamente. El checkout de la versión sigue siendo la raíz del producto y los datos, mientras que la planificación y la verificación final se ejecutan desde el checkout exacto y de confianza del origen del flujo de trabajo, para que un commit de una versión anterior no pueda utilizar silenciosamente herramientas de publicación obsoletas. Antes de iniciar cualquier proceso secundario de publicación, renderiza y almacena en caché el cuerpo exacto de la versión de GitHub. Cuando la sección completa correspondiente de `CHANGELOG.md` cabe dentro del límite de 125 000 caracteres de GitHub y del límite de seguridad correspondiente de 125 000 bytes del renderizador, la página contiene exactamente esa sección `## YYYY.M.PATCH`, incluido su encabezado. Cuando la sección de origen no cabe, la página conserva exactamente las notas editoriales agrupadas y sustituye el registro de contribuciones sobredimensionado por un enlace estable al registro completo en el archivo `CHANGELOG.md` fijado a la etiqueta; nunca se publican registros parciales ni viñetas truncadas. El flujo de trabajo elige el cuerpo completo o compacto antes de añadir `### Verificación de la versión`; si la sección final de pruebas superara el límite, conserva el cuerpo canónico y utiliza en su lugar la evidencia inmutable adjunta. Las versiones estables publicadas en npm `latest` se convierten en la versión más reciente de GitHub, mientras que las versiones estables de mantenimiento que se conservan en npm `beta` se crean con `latest=false` en GitHub. El flujo de trabajo también carga en la versión de GitHub la evidencia de dependencias de la comprobación previa, el manifiesto de validación completa y la evidencia de verificación del registro posterior a la publicación para responder a incidentes posteriores. Imprime de inmediato los identificadores de las ejecuciones secundarias, aprueba automáticamente las puertas del entorno de publicación que el token del flujo de trabajo puede aprobar, resume los trabajos secundarios fallidos con las últimas líneas de sus registros, crea por adelantado la página de borrador de la versión de GitHub y promociona los artefactos de Windows y Android simultáneamente con la publicación de OpenClaw en npm, finaliza la página de la versión y la evidencia de dependencias una vez que esas etapas se completan correctamente, espera a ClawHub siempre que se publique OpenClaw en npm y, a continuación, ejecuta el verificador beta de la versión de confianza de `main` y carga evidencia posterior a la publicación para la versión de GitHub, el paquete de npm, los paquetes de plugins de npm seleccionados, los paquetes de ClawHub seleccionados, los identificadores de las ejecuciones secundarias del flujo de trabajo y el identificador opcional de la ejecución de NPM Telegram. El verificador de arranque de ClawHub requiere la ruta y el SHA exactos del flujo de trabajo de la versión de confianza de `main`, los intentos de ejecución del productor y del proceso terminal, el SHA de la versión, el conjunto de paquetes solicitado, la tupla inmutable del artefacto de paquetes y el artefacto de lectura final del registro; no se acepta una ejecución correcta heredada basada en una referencia de versión.

   A continuación, ejecute la aceptación del paquete posterior a la publicación con el paquete publicado `openclaw@YYYY.M.PATCH-beta.N` u `openclaw@beta`. Si una versión preliminar enviada o publicada necesita una corrección, cree el siguiente número de versión preliminar correspondiente; nunca elimine ni reescriba la anterior.

10. Para una versión estable, continúe solo después de que la versión beta o el candidato de publicación evaluado disponga de la evidencia de validación obligatoria. La publicación estable en npm también se realiza mediante `OpenClaw Release Publish`, reutilizando el artefacto correcto de comprobación previa mediante `preflight_run_id`. La preparación de la versión estable de macOS también requiere los archivos empaquetados `.zip`, `.dmg` y `.dSYM.zip`, así como el archivo `appcast.xml` actualizado en `main`; el flujo de trabajo de publicación de macOS publica automáticamente el appcast firmado en la versión pública de `main` después de verificar los artefactos de la versión, o abre o actualiza una PR del appcast si la protección de la rama bloquea el envío directo. La preparación estable de Windows Hub requiere los artefactos firmados `OpenClawCompanion-Setup-x64.exe`, `OpenClawCompanion-Setup-arm64.exe` y `OpenClawCompanion-SHA256SUMS.txt` en la versión de GitHub de OpenClaw. Pase la etiqueta exacta de la versión firmada de `openclaw/openclaw-windows-node` como `windows_node_tag` y su mapa de resúmenes de instaladores aprobado para el candidato como `windows_node_installer_digests`; `OpenClaw Release Publish` conserva el borrador de la versión, inicia `Windows Node Release` y verifica los tres artefactos antes de la publicación.
11. Después de publicar, ejecute el verificador posterior a la publicación de npm, la prueba E2E independiente y opcional de Telegram con la versión publicada en npm cuando necesite demostrar el canal después de la publicación, la promoción de la etiqueta de distribución cuando sea necesaria, verifique la página generada de la versión de GitHub, ejecute los pasos del anuncio de la versión y, a continuación, complete el [cierre estable de main](#stable-main-closeout) antes de dar por finalizada una versión estable.

## Cierre estable de main

La publicación estable no está completa hasta que `main` contenga el estado real de la versión publicada.

1. Parta de la versión más reciente y limpia de `main`. Audite `release/YYYY.M.PATCH` con respecto a ella e incorpore hacia delante las correcciones reales que falten en `main`. No fusione a ciegas en una versión más reciente de `main` adaptadores de compatibilidad, pruebas o validación exclusivos de la versión.
2. Configure `main` con la versión estable publicada, no con una futura serie especulativa. Ejecute `pnpm release:prep` después de cambiar la versión raíz y, a continuación, `pnpm deps:shrinkwrap:generate`.
3. Haga que la sección `## YYYY.M.PATCH` de `CHANGELOG.md` en `main` coincida exactamente con la rama de la versión etiquetada. Incluya la actualización estable de `appcast.xml` cuando la versión de macOS haya publicado una.
4. No añada `YYYY.M.PATCH+1`, una versión beta ni una sección futura vacía del registro de cambios a `main` hasta que el operador inicie explícitamente esa serie de versiones.
5. Ejecute `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check` y `OPENCLAW_TESTBOX=1 pnpm check:changed`. Envíe los cambios y, a continuación, compruebe que `origin/main` contenga la versión publicada y el registro de cambios antes de dar por finalizada la versión estable.
6. Mantenga actualizadas las variables del repositorio `RELEASE_ROLLBACK_DRILL_ID` y `RELEASE_ROLLBACK_DRILL_DATE` después de cada simulacro privado de reversión.

`OpenClaw Stable Main Closeout` parte del envío a `main` que contiene la versión publicada, el registro de cambios y el appcast después de la publicación estable. Lee la evidencia inmutable posterior a la publicación para vincular la etiqueta publicada con sus ejecuciones de validación completa de la versión y publicación; a continuación, verifica el estado estable de main, la versión, el periodo de observación estable obligatorio y la evidencia de rendimiento bloqueante. Adjunta a la versión de GitHub un manifiesto de cierre inmutable y su suma de comprobación. El activador automático por envío omite las versiones heredadas anteriores a la evidencia inmutable posterior a la publicación y nunca considera esa omisión como un cierre completado.

Un cierre completo requiere ambos artefactos y una suma de comprobación coincidente. Un manifiesto parcial vuelve a ejecutar el SHA de `main` y el simulacro de reversión que tiene registrados para regenerar bytes idénticos y, a continuación, adjunta la suma de comprobación que falta; un par no válido, o una suma de comprobación sin manifiesto, continúa bloqueando el proceso. Una ejecución activada por envío sin las variables del repositorio del simulacro de reversión se omite sin completar el cierre; la ausencia de un registro del simulacro o uno con más de 90 días de antigüedad sigue bloqueando el cierre manual respaldado por evidencia. Los comandos privados de recuperación permanecen en el manual operativo exclusivo de los mantenedores. Utilice la ejecución manual únicamente para reparar o repetir un cierre estable respaldado por evidencia.

Una etiqueta heredada de corrección alternativa puede reutilizar la evidencia del paquete base solo cuando la etiqueta de corrección se resuelva al mismo commit de origen que la etiqueta estable base. Su versión de Android reutiliza el APK verificado de la etiqueta base y añade la procedencia de la etiqueta de corrección. Una corrección con un origen diferente debe publicar y verificar su propia evidencia del paquete y utilizar un `versionCode` de Android superior.

## Comprobación previa de la versión

- Ejecuta `pnpm check:test-types` antes de la comprobación previa al lanzamiento para que TypeScript de las pruebas siga cubierto fuera de la comprobación local más rápida de `pnpm check`.
- Ejecuta `pnpm check:architecture` antes de la comprobación previa al lanzamiento para que las comprobaciones más amplias de ciclos de importación y límites de arquitectura se completen correctamente fuera de la comprobación local más rápida.
- Ejecuta `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que los artefactos de lanzamiento `dist/*` esperados y el paquete de la interfaz de control existan durante el paso de validación del paquete.
- Ejecuta `pnpm release:prep` después de incrementar la versión raíz y antes de crear la etiqueta. Ejecuta todos los generadores deterministas de lanzamiento que suelen quedar desactualizados tras un cambio de versión, configuración o API: versiones de plugins, archivos shrinkwrap de npm, inventario de plugins, esquema de configuración base, metadatos de configuración de canales incluidos, línea base de la documentación de configuración, exportaciones del SDK de plugins y línea base de la API del SDK de plugins. `pnpm release:check` vuelve a ejecutar esas comprobaciones en modo de verificación (además de una comprobación del presupuesto de superficie del SDK de plugins) e informa de todos los fallos por desajustes generados en una sola pasada antes de ejecutar las comprobaciones de lanzamiento de paquetes.
- La sincronización de versiones de plugins actualiza de forma predeterminada el paquete de entorno de ejecución publicable `@openclaw/ai`, las versiones de los paquetes de plugins oficiales y los límites mínimos existentes de `openclaw.compat.pluginApi` a la versión de lanzamiento de OpenClaw. Considera ese campo como el límite mínimo de la API del SDK o del entorno de ejecución de plugins, no solo como una copia de la versión del paquete: para lanzamientos exclusivos de plugins que mantengan intencionadamente la compatibilidad con hosts de OpenClaw anteriores, conserva el límite mínimo en la API del host compatible más antiguo y documenta esa decisión en las pruebas del lanzamiento del plugin.
- Ejecuta el flujo de trabajo manual `Full Release Validation` antes de aprobar el lanzamiento para iniciar todos los entornos de pruebas previas al lanzamiento desde un único punto de entrada. Acepta una rama, una etiqueta o un SHA completo de confirmación, inicia manualmente `CI` e inicia `OpenClaw Release Checks` para las pruebas rápidas de instalación, la aceptación de paquetes, las comprobaciones de paquetes entre sistemas operativos, la paridad de QA Lab, Matrix y las vías de Telegram. Las ejecuciones estables y completas siempre incluyen pruebas exhaustivas en vivo/E2E y pruebas prolongadas de la ruta de lanzamiento con Docker; `run_release_soak=true` se conserva para una prueba prolongada beta explícita. Package Acceptance proporciona la prueba E2E canónica de Telegram para el paquete durante la validación del candidato, lo que evita un segundo sondeador en vivo simultáneo.

  Proporciona `release_package_spec` después de publicar una beta para reutilizar el paquete npm distribuido en las comprobaciones de lanzamiento, Package Acceptance y las pruebas E2E de Telegram del paquete sin volver a compilar el archivo tar de lanzamiento. Proporciona `npm_telegram_package_spec` solo cuando Telegram deba usar un paquete publicado distinto al del resto de la validación del lanzamiento. Proporciona `package_acceptance_package_spec` cuando Package Acceptance deba usar un paquete publicado distinto al especificado para el lanzamiento. Proporciona `evidence_package_spec` cuando el informe de pruebas del lanzamiento deba demostrar que la validación coincide con un paquete npm publicado sin forzar las pruebas E2E de Telegram.

  ```bash
  gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH
  ```

- Ejecuta el flujo de trabajo manual `Package Acceptance` cuando quieras obtener pruebas por un canal secundario para un paquete candidato mientras continúa el trabajo de lanzamiento. Usa `source=npm` para `openclaw@beta`, `openclaw@latest` o una versión de lanzamiento exacta; `source=ref` para empaquetar una rama, etiqueta o SHA de confianza de `package_ref` con el arnés actual de `workflow_ref`; `source=url` para un archivo tar HTTPS público con un SHA-256 obligatorio y una política estricta de URL públicas; `source=trusted-url` para una política de fuente de confianza identificada que requiera `trusted_source_id` y SHA-256; o `source=artifact` para un archivo tar cargado por otra ejecución de GitHub Actions.

  El flujo de trabajo resuelve el candidato como `package-under-test`, reutiliza el programador de lanzamiento E2E de Docker con ese archivo tar y puede ejecutar el control de calidad de Telegram con el mismo archivo tar mediante `telegram_mode=mock-openai` o `telegram_mode=live-frontier`. Cuando las vías de Docker seleccionadas incluyen `published-upgrade-survivor`, el artefacto del paquete es el candidato y `published_upgrade_survivor_baseline` selecciona la línea base publicada. `update-restart-auth` usa el paquete candidato tanto como CLI instalada como paquete sometido a prueba, de modo que ejercita la ruta de reinicio administrado del comando de actualización candidato.

  Ejemplo:

  ```bash
  gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai
  ```

  Perfiles habituales:
  - `smoke`: vías de instalación/canal/agente, red del Gateway y recarga de configuración
  - `package`: vías de paquete/actualización/reinicio/plugin nativas del artefacto, sin OpenWebUI ni ClawHub en vivo
  - `product`: perfil de paquete más canales MCP, limpieza de Cron/subagentes, búsqueda web de OpenAI y OpenWebUI
  - `full`: bloques de la ruta de lanzamiento de Docker con OpenWebUI
  - `custom`: selección exacta de `docker_lanes` para una repetición específica

- Ejecuta directamente el flujo de trabajo manual `CI` cuando solo necesites la cobertura determinista habitual de CI para el candidato de lanzamiento. Las ejecuciones manuales de CI omiten el filtrado por cambios y fuerzan los fragmentos de Linux con Node, los fragmentos de plugins incluidos, los fragmentos de contratos de plugins y canales, la compatibilidad con Node 22, `check-*`, `check-additional-*`, las pruebas rápidas de artefactos compilados, las comprobaciones de documentación, las Skills de Python, Windows, macOS y las vías de internacionalización de la interfaz de control. Las ejecuciones manuales independientes de CI solo ejecutan Android cuando se inician con `include_android=true`; `Full Release Validation` proporciona ese valor a su ejecución secundaria de CI.

  ```bash
  gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true
  ```

- Ejecuta `pnpm qa:otel:smoke` al validar la telemetría del lanzamiento. Ejercita QA Lab mediante un receptor OTLP/HTTP local y verifica la exportación de trazas, métricas y registros, además de la limitación de los atributos de las trazas y la ocultación de contenido e identificadores, sin requerir Opik, Langfuse ni otro recopilador externo.
- Ejecuta `pnpm qa:otel:collector-smoke` al validar la compatibilidad con el recopilador. Enruta la misma exportación OTLP de QA Lab a través de un contenedor Docker real de OpenTelemetry Collector antes de las verificaciones del receptor local.
- Ejecuta `pnpm qa:prometheus:smoke` al validar el rastreo protegido de Prometheus. Ejercita QA Lab, rechaza los rastreos no autenticados y verifica que las familias de métricas críticas para el lanzamiento no contengan contenido de instrucciones, identificadores sin procesar, tokens de autenticación ni rutas locales.
- Ejecuta `pnpm qa:observability:smoke` para ejecutar consecutivamente las vías de pruebas rápidas de OpenTelemetry y Prometheus desde el repositorio de código fuente.
- Ejecuta `pnpm release:check` antes de cada lanzamiento etiquetado.
- La comprobación previa de `OpenClaw NPM Release` genera pruebas de dependencias del lanzamiento antes de empaquetar el archivo tar de npm. La comprobación de vulnerabilidades de los avisos de npm bloquea el lanzamiento. Los informes de riesgo del manifiesto transitivo, de propiedad/superficie de instalación de dependencias y de cambios de dependencias solo sirven como pruebas del lanzamiento. El informe de cambios de dependencias compara el candidato de lanzamiento con la etiqueta de lanzamiento anterior accesible. La comprobación previa carga las pruebas de dependencias como `openclaw-release-dependency-evidence-<tag>` y también las incorpora en `dependency-evidence/` dentro del artefacto preparado de comprobación previa de npm. La ruta real de publicación reutiliza ese artefacto de comprobación previa y después adjunta las mismas pruebas al lanzamiento de GitHub como `openclaw-<version>-dependency-evidence.zip`.
- Ejecuta `OpenClaw Release Publish` para la secuencia de publicación con cambios después de que exista la etiqueta. Inicia las publicaciones beta y estables normales desde la rama `main` de confianza; la etiqueta de lanzamiento sigue seleccionando la confirmación de destino exacta y puede apuntar a `release/YYYY.M.PATCH`. Las publicaciones alfa de Tideclaw permanecen en su rama alfa correspondiente. Proporciona el `preflight_run_id` de npm de OpenClaw correcto, el `full_release_validation_run_id` correcto y el `full_release_validation_run_attempt` exacto, y conserva el alcance predeterminado de publicación de plugins `all-publishable`, salvo que estés ejecutando deliberadamente una reparación específica. El flujo de trabajo serializa la publicación en npm de plugins, la publicación de plugins en ClawHub y la publicación en npm de OpenClaw para que el paquete principal no se publique antes que sus plugins externalizados; la promoción de Windows y Android se ejecuta simultáneamente con la publicación principal en npm sobre la página de borrador del lanzamiento. Las repeticiones de publicación se pueden reanudar: una versión principal de npm ya publicada omite el inicio de la publicación principal después de que el flujo de trabajo demuestre que el archivo tar del registro coincide con el artefacto de comprobación previa de la etiqueta, y se omite la promoción de Windows/Android cuando el lanzamiento ya contiene el contrato de artefactos verificado, por lo que un reintento solo repite las etapas fallidas. Las reparaciones específicas exclusivas de plugins requieren `plugin_publish_scope=selected` y una lista de plugins no vacía. Las ejecuciones `all-publishable` exclusivas de plugins requieren pruebas completas e inmutables de la comprobación previa y de Full Release Validation; se rechazan las pruebas parciales.
- La publicación estable mediante `OpenClaw Release Publish` requiere un `windows_node_tag` exacto después de que exista el lanzamiento correspondiente no preliminar de `openclaw/openclaw-windows-node`, además del mapa `windows_node_installer_digests` aprobado para el candidato. Antes de iniciar cualquier flujo secundario de publicación, verifica que ese lanzamiento de origen esté publicado, no sea preliminar, contenga los instaladores x64/ARM64 necesarios y siga coincidiendo con el mapa aprobado. Después inicia `Windows Node Release` mientras el lanzamiento de OpenClaw todavía es un borrador y transmite sin cambios el mapa fijado de resúmenes de los instaladores. El flujo de trabajo secundario descarga los instaladores firmados de Windows Hub desde esa etiqueta exacta, los compara con los resúmenes fijados, verifica en un ejecutor de Windows que sus firmas Authenticode utilicen al firmante esperado de OpenClaw Foundation, escribe un manifiesto SHA-256 y carga los instaladores y el manifiesto en el lanzamiento canónico de OpenClaw en GitHub; después vuelve a descargar los artefactos promocionados y verifica su pertenencia al manifiesto y sus hashes. El flujo de trabajo principal verifica el contrato actual de artefactos x64, ARM64 y de sumas de comprobación antes de la publicación. La recuperación directa rechaza los nombres de artefactos `OpenClawCompanion-*` inesperados antes de sustituir los artefactos esperados del contrato por los bytes de origen fijados.

  Inicia manualmente `Windows Node Release` solo para recuperaciones y proporciona siempre una etiqueta exacta, nunca `latest`, además del mapa JSON explícito `expected_installer_digests` del lanzamiento de origen aprobado. Los enlaces de descarga del sitio web deben apuntar a las URL exactas de los artefactos del lanzamiento de OpenClaw estable actual, o a `releases/latest/download/...` únicamente después de verificar que la redirección más reciente de GitHub apunte a ese mismo lanzamiento; no enlaces únicamente a la página de lanzamiento del repositorio complementario.

- Las comprobaciones de lanzamiento ahora se ejecutan en un flujo de trabajo manual independiente: `OpenClaw Release Checks`. También ejecuta el carril de paridad simulada de QA Lab, además del perfil rápido en vivo de Matrix y el carril de QA de Telegram antes de la aprobación del lanzamiento. Los carriles en vivo usan el entorno `qa-live-shared`; Telegram también usa concesiones de credenciales de CI de Convex. Ejecuta el flujo de trabajo manual `QA-Lab - All Lanes` con `matrix_profile=all` y `matrix_shards=true` cuando quieras ejecutar en paralelo el inventario completo de transporte, contenido multimedia y E2EE de Matrix.
- La validación del entorno de ejecución de instalación y actualización entre sistemas operativos forma parte de los flujos públicos `OpenClaw Release Checks` y `Full Release Validation`, que llaman directamente al flujo de trabajo reutilizable `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`. Esta separación es intencional: mantiene la ruta real de lanzamiento en npm breve, determinista y centrada en los artefactos, mientras las comprobaciones en vivo más lentas permanecen en su propio carril para que no retrasen ni bloqueen la publicación.
- Las comprobaciones de lanzamiento que contengan secretos deben iniciarse mediante `Full Release Validation` o desde la referencia del flujo de trabajo de `main` o de lanzamiento, para mantener bajo control la lógica del flujo y los secretos.
- `OpenClaw Release Checks` acepta una rama, una etiqueta o un SHA completo de confirmación, siempre que la confirmación resuelta sea accesible desde una rama o etiqueta de lanzamiento de OpenClaw.
- La comprobación preliminar exclusivamente de validación de `OpenClaw NPM Release` también acepta el SHA completo actual de 40 caracteres de la confirmación de la rama del flujo de trabajo sin requerir una etiqueta enviada. Esa ruta de SHA sirve únicamente para validación y no puede promoverse a una publicación real. En modo SHA, el flujo de trabajo sintetiza `v<package.json version>` solo para comprobar los metadatos del paquete; la publicación real sigue requiriendo una etiqueta de lanzamiento real.
- Ambos flujos de trabajo mantienen la ruta real de publicación y promoción en ejecutores alojados en GitHub, mientras que la ruta de validación que no realiza modificaciones puede usar los ejecutores Linux más grandes de Blacksmith.
- Ese flujo de trabajo ejecuta `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` usando los secretos de flujo de trabajo `OPENAI_API_KEY` y `ANTHROPIC_API_KEY`.
- La comprobación preliminar del lanzamiento en npm ya no espera al carril independiente de comprobaciones de lanzamiento.
- Antes de etiquetar localmente una versión candidata, ejecuta `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`. El auxiliar ejecuta las protecciones rápidas de lanzamiento, las comprobaciones de publicación de plugins en npm y ClawHub, la compilación, la compilación de la interfaz y `release:openclaw:npm:check`, en el orden que permite detectar los errores comunes que bloquean la aprobación antes de que se inicie el flujo de publicación de GitHub.
- Ejecuta `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts` (o la etiqueta correspondiente de versión preliminar o corrección) antes de la aprobación.
- Después de publicar en npm, ejecuta `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH` (o la versión beta o de corrección correspondiente) para verificar la ruta de instalación desde el registro publicado en un prefijo temporal nuevo.
- Después de publicar una beta, ejecuta `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` para verificar la incorporación del paquete instalado, la configuración de Telegram y una prueba E2E real de Telegram contra el paquete publicado en npm mediante el grupo compartido de credenciales de Telegram concedidas. Para ejecuciones locales puntuales, los mantenedores pueden omitir las variables de Convex y proporcionar directamente las tres credenciales de entorno `OPENCLAW_QA_TELEGRAM_*`.
- Para ejecutar la prueba de humo beta completa posterior a la publicación desde el equipo de un mantenedor, usa `pnpm release:beta-smoke -- --beta betaN`. El auxiliar ejecuta la validación de actualización de npm y de destino nuevo en Parallels, inicia `NPM Telegram Beta E2E`, consulta periódicamente la ejecución exacta del flujo de trabajo, descarga el artefacto e imprime el informe de Telegram.
- Los mantenedores pueden ejecutar la misma comprobación posterior a la publicación desde GitHub Actions mediante el flujo de trabajo manual `NPM Telegram Beta E2E`. Es intencionalmente solo manual y no se ejecuta con cada fusión.
- La automatización de lanzamientos para mantenedores usa el esquema comprobación preliminar y luego promoción:
  - La publicación real en npm debe contar con un `preflight_run_id` de npm correcto.
  - La orquestación y comprobación preliminar de publicaciones beta regulares y estables usan la rama `main` de confianza con la etiqueta de destino exacta. La publicación y comprobación preliminar alfa de Tideclaw usan la rama alfa correspondiente.
  - Los lanzamientos estables de npm usan `beta` de forma predeterminada; la publicación estable en npm puede dirigirse explícitamente a `latest` mediante una entrada del flujo de trabajo.
  - La modificación de etiquetas de distribución de npm basada en tokens reside en `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`, porque `npm dist-tag add` aún necesita `NPM_TOKEN`, mientras que el repositorio de origen mantiene una publicación que usa exclusivamente OIDC.
  - El flujo público `macOS Release` es exclusivamente de validación; cuando una etiqueta solo existe en una rama de lanzamiento, pero el flujo de trabajo se inicia desde `main`, establece `public_release_branch=release/YYYY.M.PATCH`.
  - La publicación real para macOS debe contar con valores correctos de `preflight_run_id` y `validate_run_id` de macOS.
  - Las rutas de publicación real promueven los artefactos preparados en lugar de volver a compilarlos.
- Para versiones estables de corrección como `YYYY.M.PATCH-N`, el verificador posterior a la publicación también comprueba la misma ruta de actualización con prefijo temporal desde `YYYY.M.PATCH` hasta `YYYY.M.PATCH-N`, para que las correcciones de lanzamiento no puedan dejar silenciosamente las instalaciones globales anteriores con la carga útil de la versión estable base.
- La comprobación preliminar de lanzamiento en npm genera un fallo cerrado a menos que el archivo tar incluya tanto `dist/control-ui/index.html` como una carga útil no vacía en `dist/control-ui/assets/`, para evitar volver a distribuir un panel de navegador vacío.
- La verificación posterior a la publicación también comprueba que los puntos de entrada de los plugins publicados y los metadatos del paquete estén presentes en la estructura instalada desde el registro. Un lanzamiento al que le falten cargas útiles del entorno de ejecución de plugins no supera el verificador posterior a la publicación y no puede promoverse a `latest`.
- `pnpm test:install:smoke` también aplica el límite de `unpackedSize` del paquete npm al archivo tar de actualización candidato, para que las pruebas E2E del instalador detecten un aumento accidental del tamaño del paquete antes de la ruta de publicación del lanzamiento.
- Si el trabajo de lanzamiento modificó la planificación de CI, los manifiestos de tiempos de extensiones o las matrices de pruebas de extensiones, vuelve a generar y revisa las salidas de la matriz `plugin-prerelease-extension-shard` gestionadas por el planificador desde `.github/workflows/plugin-prerelease.yml` antes de la aprobación, para que las notas de lanzamiento no describan una estructura de CI obsoleta.
- La preparación de un lanzamiento estable para macOS también incluye las superficies del actualizador: el lanzamiento de GitHub debe acabar conteniendo los paquetes `.zip`, `.dmg` y `.dSYM.zip`; `appcast.xml` en `main` debe apuntar al nuevo archivo zip estable después de la publicación (el flujo de publicación de macOS lo confirma automáticamente o abre una solicitud de cambios del appcast cuando se bloquea el envío directo); la aplicación empaquetada debe conservar un identificador de paquete que no sea de depuración, una URL no vacía del canal de Sparkle y un `CFBundleVersion` igual o superior al mínimo canónico de compilación de Sparkle para esa versión del lanzamiento.

## Máquinas de pruebas de lanzamiento

`Full Release Validation` es el mecanismo con el que los operadores inician todas las pruebas previas al lanzamiento desde un único punto de entrada. Para obtener una prueba de una confirmación fijada en una rama que cambia rápidamente, usa el auxiliar para que cada flujo de trabajo secundario se ejecute desde una rama temporal fijada en un SHA de flujo de trabajo de `main` de confianza, mientras la confirmación solicitada sigue siendo la candidata sometida a prueba:

```bash
pnpm ci:full-release --sha <full-sha>
```

El auxiliar obtiene el estado actual de `origin/main`, envía `release-ci/<workflow-sha>-...` en esa confirmación de flujo de trabajo de confianza, inicia `Full Release Validation` desde la rama temporal con `ref=<target-sha>`, reutiliza pruebas estrictas del destino exacto cuando están disponibles, verifica que el `headSha` de cada flujo de trabajo secundario coincida con el SHA fijado del flujo de trabajo principal y después elimina la rama temporal. Proporciona `-f reuse_evidence=false` para forzar una ejecución nueva o `--workflow-sha <trusted-main-sha>` para fijar una confirmación anterior que aún sea accesible desde el estado actual de `origin/main`. El propio flujo de trabajo nunca escribe referencias del repositorio. Esto mantiene disponibles las herramientas de lanzamiento exclusivas de `main` sin añadir confirmaciones de herramientas a la versión candidata y evita demostrar por accidente una ejecución secundaria de una versión de `main` más reciente.

Para validar una rama o etiqueta de lanzamiento, ejecútalo desde la referencia de flujo de trabajo de confianza de `main` y proporciona la rama o etiqueta de lanzamiento como `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

El flujo de trabajo resuelve la referencia de destino, inicia manualmente `CI` con `target_ref=<release-ref>` y después inicia `OpenClaw Release Checks`. `OpenClaw Release Checks` distribuye las pruebas de humo de instalación, las comprobaciones de lanzamiento entre sistemas operativos, la cobertura en vivo y E2E en Docker de la ruta de lanzamiento cuando se activa la ejecución prolongada, la aceptación de paquetes con la prueba E2E canónica del paquete de Telegram, la paridad de QA Lab, Matrix en vivo y Telegram en vivo. Una ejecución completa o de todos los carriles solo es aceptable cuando el resumen de `Full Release Validation` muestra `normal_ci`, `plugin_prerelease` y `release_checks` como correctos, salvo que una repetición específica haya omitido intencionalmente el flujo secundario independiente `Plugin Prerelease`. Usa el flujo secundario independiente `npm-telegram` solo para repetir específicamente la prueba de un paquete publicado con `release_package_spec` o `npm_telegram_package_spec`. El resumen del verificador final incluye tablas de los trabajos más lentos de cada ejecución secundaria, para que el responsable del lanzamiento pueda ver la ruta crítica actual sin descargar registros.

El flujo secundario de rendimiento del producto solo genera artefactos en esta ruta de lanzamiento. El
flujo coordinador lo inicia con `publish_reports=false`, y la validación se rechaza
a menos que su protección de solo artefactos demuestre que el publicador de informes de Clawgrit permaneció
omitido.

Consulta [Validación completa del lanzamiento](/es/reference/full-release-validation) para ver la matriz completa de etapas, los nombres exactos de los trabajos del flujo, las diferencias entre los perfiles estable y completo, los artefactos y los parámetros para repeticiones específicas.

Los flujos de trabajo secundarios se inician desde la referencia de confianza que ejecuta `Full Release Validation`, normalmente `--ref main`, incluso cuando la `ref` de destino apunta a una rama o etiqueta de lanzamiento anterior. Cada ejecución secundaria debe usar el SHA exacto del flujo de trabajo principal; si `main` avanza antes de que se resuelva el inicio de un flujo secundario, el flujo coordinador genera un fallo cerrado. No hay una entrada independiente de referencia de flujo de trabajo para Full Release Validation; elige el sistema de pruebas de confianza mediante la referencia de ejecución del flujo. No uses `--ref main -f ref=<sha>` para demostrar una confirmación exacta en una rama `main` en movimiento; los SHA de confirmaciones sin procesar no pueden usarse como referencias para iniciar flujos de trabajo, así que usa `pnpm ci:full-release --sha <target-sha>` para crear una rama temporal en el estado de confianza de `origin/main` y conservar el SHA de destino como entrada candidata.

Usa `release_profile` para seleccionar la amplitud de proveedores y pruebas en vivo:

- `minimum`: la ruta más rápida de OpenAI y del núcleo, en vivo y en Docker, que es crítica para el lanzamiento
- `stable`: el perfil mínimo más la cobertura estable de proveedores y backends necesaria para aprobar el lanzamiento
- `full`: el perfil estable más una amplia cobertura consultiva de proveedores y contenido multimedia

Las validaciones estable y completa siempre ejecutan antes de la promoción el barrido exhaustivo y acotado de pruebas en vivo y E2E, la ruta de lanzamiento en Docker y la supervivencia a actualizaciones de paquetes publicados. Usa `run_release_soak=true` para solicitar el mismo barrido para una beta. Este barrido abarca los cuatro paquetes estables más recientes, además de las bases fijadas `2026.4.23` y `2026.5.2` y la cobertura anterior de `2026.4.15`; elimina las bases duplicadas y divide cada base en su propio trabajo ejecutor de Docker.

`OpenClaw Release Checks` usa la referencia del flujo de trabajo de confianza para resolver una sola vez la referencia de destino como `release-package-under-test` y reutiliza ese artefacto en las comprobaciones entre sistemas operativos, de aceptación de paquetes y de Docker de la ruta de lanzamiento cuando se ejecuta la prueba prolongada. Esto mantiene todas las máquinas que operan con paquetes sobre los mismos bytes y evita compilaciones repetidas del paquete. Cuando una beta ya esté en npm, establece `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` para que las comprobaciones de lanzamiento descarguen una sola vez el paquete distribuido, extraigan su SHA de origen de compilación desde `dist/build-info.json` y reutilicen ese artefacto en los carriles entre sistemas operativos, de aceptación de paquetes, de Docker de la ruta de lanzamiento y de Telegram con paquete.

La prueba de humo entre sistemas operativos de instalación de OpenAI usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` cuando se ha establecido la variable del repositorio o la organización; de lo contrario usa `openai/gpt-5.6-luna`, porque este carril demuestra la instalación del paquete, la incorporación, el inicio del Gateway y un turno de agente en vivo, en lugar de comparar el rendimiento del modelo más capaz. La matriz más amplia de proveedores en vivo sigue siendo el lugar para la cobertura específica de cada modelo.

Usa estas variantes según la etapa del lanzamiento:

```bash
# Validate an unpublished release candidate branch.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable

# Validate an exact pushed commit.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f provider=openai \
  -f mode=both

# After publishing a beta, add published-package Telegram E2E.
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

No utilices el flujo completo general como primera repetición después de una corrección específica. Si falla un bloque, utiliza el flujo de trabajo secundario, el trabajo, la vía de Docker, el perfil de paquete, el proveedor de modelos o la vía de QA que haya fallado para la siguiente comprobación. Vuelve a ejecutar el flujo completo general solo cuando la corrección haya modificado la orquestación compartida de la versión o haya dejado obsoletas las pruebas anteriores de todos los bloques. El verificador final del flujo general vuelve a comprobar los identificadores registrados de las ejecuciones de los flujos de trabajo secundarios, por lo que, tras repetir correctamente un flujo de trabajo secundario, vuelve a ejecutar únicamente el trabajo superior `Verify full validation` que falló.

`rerun_group=all` puede reutilizar una ejecución general correcta anterior únicamente cuando haya validado exactamente el mismo SHA de destino, perfil de versión, configuración efectiva de la prueba prolongada y entradas de validación. Esta es una recuperación acotada para volver a ejecutar el mismo candidato, no una reutilización de pruebas entre distintos SHA. Para un candidato modificado, incluido un commit que solo cambie el registro de cambios o la versión, vuelve a ejecutar todas las puertas de paquetes, artefactos, instalación, Docker o proveedores afectadas por las rutas modificadas o los hashes de los artefactos. Las ejecuciones generales más recientes para la misma referencia `release/*` y el mismo grupo de repetición sustituyen automáticamente a las que estén en curso. Pasa `reuse_evidence=false` para forzar una ejecución completa nueva.

Para una recuperación acotada, pasa `rerun_group` al flujo general. `all` es la ejecución real del candidato de versión, `ci` ejecuta únicamente el flujo secundario normal de CI, `plugin-prerelease` ejecuta únicamente el flujo secundario de plugins exclusivo de la versión, `release-checks` ejecuta todos los bloques de la versión y los grupos de versión más específicos son `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` y `npm-telegram`. Las repeticiones específicas de `npm-telegram` requieren `release_package_spec` o `npm_telegram_package_spec`; las ejecuciones completas o con `all` utilizan el E2E canónico de Telegram con el paquete dentro de Package Acceptance. Las repeticiones específicas multiplataforma pueden añadir `cross_os_suite_filter=windows/packaged-upgrade` u otro filtro de sistema operativo o conjunto. Los fallos de las comprobaciones de versión de QA bloquean la validación normal de la versión, incluida la desviación obligatoria de las herramientas dinámicas de OpenClaw en el nivel estándar. Las ejecuciones alfa de Tideclaw aún pueden tratar como informativas las vías de comprobación de versión que no estén relacionadas con la seguridad del paquete. Con `release_profile=beta`, los conjuntos con proveedores en vivo de `Run repo/live E2E validation` son informativos —generan advertencias, no bloqueos—; los perfiles estable y completo los mantienen como bloqueantes. Cuando `live_suite_filter` solicita explícitamente una vía de QA en vivo sujeta a una puerta, como Discord, WhatsApp o Slack, debe estar habilitada la variable correspondiente del repositorio `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED`; de lo contrario, falla la captura de entradas en lugar de omitir silenciosamente la vía.

### Vitest

El bloque de Vitest es el flujo de trabajo secundario manual `CI`. El CI manual omite intencionadamente la delimitación por cambios y fuerza el grafo normal de pruebas para el candidato de versión: fragmentos de Linux con Node, fragmentos de plugins incluidos, fragmentos de contratos de plugins y canales, compatibilidad con Node 22, `check-*`, `check-additional-*`, comprobaciones rápidas de artefactos compilados, comprobaciones de documentación, Skills de Python, Windows, macOS e internacionalización de Control UI. Android se incluye cuando `Full Release Validation` ejecuta el bloque porque el flujo general pasa `include_android=true`; el CI manual independiente requiere `include_android=true` para cubrir Android.

Utiliza este bloque para responder «¿el árbol de fuentes superó el conjunto normal completo de pruebas?». No equivale a la validación del producto en la ruta de publicación. Pruebas que deben conservarse:

- resumen de `Full Release Validation` que muestre la URL de la ejecución de `CI` iniciada
- ejecución de `CI` correcta para el SHA de destino exacto
- nombres de los fragmentos fallidos o lentos de los trabajos de CI al investigar regresiones
- artefactos de tiempos de Vitest, como `.artifacts/vitest-shard-timings.json`, cuando una ejecución requiera análisis de rendimiento

Ejecuta directamente el CI manual solo cuando la versión necesite un CI normal determinista, pero no los bloques de Docker, QA Lab, ejecución en vivo, multiplataforma o paquetes. Utiliza el primer comando para un CI directo sin Android. Añade `include_android=true` cuando el CI directo del candidato de versión deba cubrir Android:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

El bloque de Docker se encuentra en `OpenClaw Release Checks` mediante `openclaw-live-and-e2e-checks-reusable.yml`, además del flujo de trabajo `install-smoke` en modo de versión. Valida el candidato de versión mediante entornos Docker empaquetados, en lugar de limitarse a pruebas en el nivel del código fuente.

La cobertura de Docker para versiones incluye:

- comprobación rápida completa de instalación con la comprobación lenta de instalación global de Bun habilitada
- preparación o reutilización de la imagen de comprobación rápida del Dockerfile raíz según el SHA de destino, con trabajos de comprobación rápida de QR, raíz/Gateway e instalador/Bun ejecutados como fragmentos independientes de `install-smoke`
- vías E2E del repositorio
- fragmentos de Docker de la ruta de versión: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, desde `plugins-runtime-install-a` hasta `plugins-runtime-install-h` y `openwebui`
- cobertura de OpenWebUI en un ejecutor específico con disco de gran capacidad cuando se solicite
- vías divididas de instalación y desinstalación de plugins incluidos, desde `bundled-plugin-install-uninstall-0` hasta `bundled-plugin-install-uninstall-23`
- conjuntos de proveedores en vivo/E2E y cobertura de modelos en vivo en Docker cuando las comprobaciones de versión incluyan conjuntos en vivo

Utiliza los artefactos de Docker antes de repetir una ejecución. El planificador de la ruta de versión carga `.artifacts/docker-tests/` con registros de las vías, `summary.json`, `failures.json`, tiempos de las fases, el JSON del plan del planificador y comandos de repetición. Para una recuperación específica, utiliza `docker_lanes=<lane[,lane]>` en el flujo de trabajo reutilizable en vivo/E2E en lugar de volver a ejecutar todos los fragmentos de la versión. Los comandos de repetición generados incluyen el valor anterior de `package_artifact_run_id` y las entradas de las imágenes Docker preparadas cuando están disponibles, por lo que una vía fallida puede reutilizar el mismo archivo tar y las mismas imágenes de GHCR.

### QA Lab

El bloque de QA Lab también forma parte de `OpenClaw Release Checks`. Es la puerta de publicación para el comportamiento agéntico y el nivel de canal, independiente de Vitest y de los mecanismos de paquetes de Docker.

La cobertura de QA Lab para versiones incluye:

- vía de paridad simulada que compara la vía candidata de OpenAI con la referencia `anthropic/claude-opus-4-8` mediante el paquete de paridad agéntica
- perfil rápido de QA en vivo de Matrix que utiliza el entorno `qa-live-shared`
- vía de QA en vivo de Telegram que utiliza arrendamientos de credenciales de CI de Convex
- `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`, `pnpm qa:prometheus:smoke` o `pnpm qa:observability:smoke` cuando la telemetría de la versión necesite una comprobación local explícita

Utiliza este bloque para responder «¿la versión se comporta correctamente en los escenarios de QA y en los flujos de canales en vivo?». Conserva las URL de los artefactos de las vías de paridad, Matrix y Telegram al aprobar la versión. La cobertura completa de Matrix continúa disponible como ejecución manual fragmentada de QA Lab, en lugar de ser la vía predeterminada crítica para la versión.

### Paquete

El bloque de paquete es la puerta del producto instalable. Está respaldado por `Package Acceptance` y el resolutor `scripts/resolve-openclaw-package-candidate.mjs`. El resolutor normaliza un candidato en el archivo tar `package-under-test` consumido por Docker E2E, valida el inventario del paquete, registra la versión y el SHA-256 del paquete y mantiene separadas la referencia del entorno del flujo de trabajo y la referencia de origen del paquete.

Orígenes de candidatos compatibles:

- `source=npm`: `openclaw@beta`, `openclaw@latest` o una versión de publicación exacta de OpenClaw
- `source=ref`: empaqueta una rama, etiqueta o SHA completo de commit de confianza indicado mediante `package_ref`, con el entorno `workflow_ref` seleccionado
- `source=url`: descarga un archivo `.tgz` público mediante HTTPS con el valor obligatorio `package_sha256`; se rechazan las credenciales en la URL, los puertos HTTPS no predeterminados, los nombres de host o direcciones resueltas privados, internos o de uso especial, y las redirecciones no seguras
- `source=trusted-url`: descarga un archivo `.tgz` mediante HTTPS con los valores obligatorios `package_sha256` y `trusted_source_id` desde una política con nombre en `.github/package-trusted-sources.json`; utiliza esta opción para réplicas empresariales administradas por mantenedores o repositorios privados de paquetes, en lugar de añadir a `source=url` una entrada que permita omitir las restricciones de redes privadas
- `source=artifact`: reutiliza un archivo `.tgz` cargado por otra ejecución de GitHub Actions

`OpenClaw Release Checks` ejecuta Package Acceptance con `source=artifact`, el artefacto de paquete preparado para la versión, `suite_profile=custom`, `docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape` y `telegram_mode=mock-openai`. Package Acceptance mantiene la migración, la actualización, la actualización de VPS administrados como usuario raíz, el reinicio tras una actualización con autenticación configurada, la instalación en vivo de Skills desde ClawHub, la limpieza de dependencias obsoletas de plugins, los accesorios de plugins sin conexión, la actualización de plugins, el refuerzo contra escapes en la vinculación de comandos de plugins y la QA del paquete de Telegram utilizando el mismo archivo tar resuelto. Las comprobaciones de versión bloqueantes utilizan como referencia predeterminada el paquete publicado más reciente; el perfil beta con `run_release_soak=true`, `release_profile=stable` o `release_profile=full` amplía el barrido de supervivencia a actualizaciones desde versiones publicadas a `last-stable-4`, además de las referencias fijadas `2026.4.23`, `2026.5.2` y `2026.4.15`, con escenarios de `reported-issues`. Utiliza Package Acceptance con `source=npm` para un candidato ya publicado, `source=ref` para un archivo tar local de npm respaldado por un SHA antes de publicarlo, `source=trusted-url` para una réplica empresarial o privada administrada por mantenedores, o `source=artifact` para un archivo tar preparado y cargado por otra ejecución de GitHub Actions.

Es el sustituto nativo de GitHub para la mayor parte de la cobertura de paquetes y actualizaciones que antes requería Parallels. Las comprobaciones de versión multiplataforma siguen siendo importantes para la incorporación, el instalador y el comportamiento específico de cada plataforma, pero la validación del producto relacionada con paquetes y actualizaciones debe dar preferencia a Package Acceptance.

La lista de comprobación canónica para validar actualizaciones y plugins es [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins). Utilízala al decidir qué vía local, de Docker, de Package Acceptance o de comprobación de versión demuestra un cambio relacionado con la instalación o actualización de un plugin, la limpieza realizada por doctor o la migración de un paquete publicado. La migración exhaustiva de actualizaciones publicadas desde todos los paquetes estables `2026.4.23+` es un flujo de trabajo manual independiente, `Update Migration`, y no forma parte de Full Release CI.

La tolerancia heredada de Package Acceptance está limitada intencionadamente en el tiempo. Los paquetes hasta `2026.4.25` pueden utilizar la ruta de compatibilidad para carencias de metadatos ya publicadas en npm: entradas privadas del inventario de QA ausentes del archivo tar, ausencia de `gateway install --wrapper`, archivos de parches ausentes en el accesorio de git derivado del archivo tar, ausencia de `update.channel` persistente, ubicaciones heredadas de los registros de instalación de plugins, ausencia de persistencia de los registros de instalación del mercado y migración de metadatos de configuración durante `plugins update`. El paquete publicado `2026.4.26` puede advertir sobre archivos locales de sello de metadatos de compilación que ya se distribuyeron. Los paquetes posteriores deben satisfacer los contratos modernos de paquetes; esas mismas carencias hacen que falle la validación de la versión.

Utiliza perfiles más amplios de Package Acceptance cuando la cuestión de la versión se refiera a un paquete instalable real:

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

- `smoke`: pruebas rápidas de instalación de paquetes/canal/agente, red del Gateway y recarga de configuración
- `package`: contratos de instalación/actualización/reinicio/paquetes de plugins, más prueba en vivo de instalación de Skills de ClawHub; es el valor predeterminado para las comprobaciones de versiones
- `product`: `package` más canales MCP, limpieza de Cron/subagentes, búsqueda web de OpenAI y OpenWebUI
- `full`: fragmentos de la ruta de publicación de Docker con OpenWebUI
- `custom`: lista exacta de `docker_lanes` para repeticiones específicas

Para la prueba de Telegram del paquete candidato, habilite `telegram_mode=mock-openai` o `telegram_mode=live-frontier` en Package Acceptance. El flujo de trabajo pasa el archivo tar `package-under-test` resuelto a la prueba de Telegram; el flujo de trabajo independiente de Telegram sigue aceptando una especificación npm publicada para las comprobaciones posteriores a la publicación.

## Automatización habitual de publicación de versiones

Para la publicación de versiones beta, `latest`, plugins, GitHub Release y plataformas,
`OpenClaw Release Publish` es el punto de entrada habitual que realiza cambios. La ruta
mensual de estabilidad extendida `.33+`, exclusiva de npm, no utiliza este orquestador. El
flujo de trabajo habitual orquesta los flujos de trabajo de publicación de confianza en el orden
necesario para la versión:

1. Obtenga la etiqueta de la versión y resuelva el SHA de su commit.
2. Verifique que se pueda alcanzar la etiqueta desde `main` o `release/*` (o desde una rama alfa de Tideclaw para versiones preliminares alfa).
3. Ejecute `pnpm plugins:sync:check`.
4. Inicie `Plugin NPM Release` con `publish_scope=all-publishable` y `ref=<release-sha>`.
5. Inicie `Plugin ClawHub Release` con el mismo ámbito y SHA.
6. Inicie `OpenClaw NPM Release` con la etiqueta de la versión, la etiqueta de distribución de npm y el `preflight_run_id` guardado, después de verificar el `full_release_validation_run_id` guardado y el intento exacto de ejecución.
7. Para versiones estables, cree o actualice la versión de GitHub como borrador, inicie `Windows Node Release` con el `windows_node_tag` explícito y los `windows_node_installer_digests` aprobados para el candidato, y verifique los recursos canónicos del instalador de Windows y sus sumas de comprobación. Inicie también `Android Release` para compilar el APK firmado de la etiqueta exacta, junto con su suma de comprobación y procedencia. Verifique los contratos de ambos recursos nativos antes de publicar el borrador.

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

Utilice los flujos de trabajo de nivel inferior `Plugin NPM Release` y `Plugin ClawHub Release` solo para trabajos específicos de reparación o republicación. `OpenClaw Release Publish` rechaza `plugin_publish_scope=selected` cuando `publish_openclaw_npm=true`, de modo que el paquete principal no pueda publicarse sin todos los plugins oficiales publicables, incluido `@openclaw/diffs-language-pack`. Para reparar un plugin seleccionado, establezca `publish_openclaw_npm=false` con `plugin_publish_scope=selected` y `plugins=@openclaw/name`, o inicie directamente el flujo de trabajo secundario.

La inicialización de la primera publicación en ClawHub es la excepción: inicie `Plugin ClawHub New`
desde la rama `main` de confianza y pase el SHA completo de la versión de destino mediante `ref`.
Nunca ejecute el propio flujo de trabajo de inicialización desde la etiqueta o rama de la versión:

```bash
gh workflow run plugin-clawhub-new.yml \
  --ref main \
  -f plugins=@openclaw/name \
  -f ref=<full-40-character-release-sha> \
  -f pretag_validation=true \
  -f dry_run=true
```

La validación previa al etiquetado requiere `dry_run=true`, rechaza las entradas de etiquetas
de versión y ejecuciones principales, y solo acepta un destino exacto accesible desde `main`
o `release/*`. No carga credenciales de ClawHub, publica bytes de paquetes ni cambia la
configuración del publicador de confianza. El flujo de trabajo sigue resolviendo el plan del
registro activo, obtiene y empaqueta el destino únicamente en un trabajo sin secretos,
materializa la cadena de herramientas bloqueada de ClawHub y valida el artefacto inmutable y el
slug/la identidad del paquete antes de que exista la etiqueta de la versión. Apruebe el entorno
`clawhub-plugin-bootstrap` solo después de que finalicen los trabajos de empaquetado sin secretos;
este trabajo de validación protegido no tiene credenciales ni comandos que realicen cambios.

Una ejecución de prueba aprobada o una inicialización real posterior al etiquetado debe incluir
la etiqueta exacta de la versión, además del identificador de ejecución, el intento y la rama de
la ejecución principal de `OpenClaw Release Publish`. La ejecución principal certifica el SHA de su
propio flujo de trabajo y un SHA exacto e independiente de la rama `main` de confianza para
`Plugin ClawHub New`; la ejecución secundaria y cada aprobación del entorno protegido deben
coincidir con ese SHA secundario aprobado. La etiqueta de la versión se vuelve a comprobar antes
de cada intento de publicación y modificación del publicador de confianza.

El trabajo de empaquetado
carga un artefacto inmutable cuyo nombre, identificador/resumen del artefacto de Actions,
ejecución/intento productor, SHA de destino y SHA-256/tamaño del archivo tar de cada paquete se
transmiten a los trabajos de validación y protegidos. El trabajo protegido obtiene únicamente las
herramientas de la rama `main` de confianza, valida la tupla del artefacto mediante la API de GitHub,
realiza la descarga por el identificador exacto del artefacto, vuelve a calcular el hash de cada
archivo tar y valida las rutas TAR locales y la identidad del paquete con las reglas de
canonización USTAR de la CLI fijada. Después, cada candidato supera la ejecución de prueba de
publicación de la CLI fijada, que finaliza antes de consultar el registro o realizar la
autenticación. El prefiltro del trabajo con credenciales limita los ClawPacks comprimidos a
120 MiB, la carga total de archivos a 50 MiB, los datos TAR expandidos a 64 MiB y el número de
entradas TAR a 10 000. La reparación del publicador de confianza de paquetes existentes sigue
limitándose a la configuración, pero aun así empaqueta el destino y exige que la etiqueta
solicitada coincida exactamente con los bytes y metadatos del registro antes de cambiar la
configuración del publicador de confianza. La verificación posterior a la publicación descarga
el artefacto de ClawHub y exige el mismo SHA-256 y tamaño. Una recuperación mediante repetición
de trabajos fallidos puede reutilizar el artefacto de paquete de un intento anterior únicamente
si el trabajo productor exacto finalizó correctamente. La evidencia final también vincula la
versión bloqueada de ClawHub, el SHA-256 del archivo de bloqueo y la integridad de npm. Una
discrepancia requiere una nueva versión del paquete.

## Entradas del flujo de trabajo de NPM

`OpenClaw NPM Release` acepta estas entradas controladas por el operador:

- `tag`: etiqueta de versión obligatoria, como `v2026.4.2`, `v2026.4.2-1`, `v2026.4.2-beta.1` o `v2026.4.2-alpha.1`; cuando `preflight_only=true`, también puede ser el SHA completo de 40 caracteres del commit actual de la rama del flujo de trabajo para una comprobación preliminar exclusivamente de validación
- `preflight_only`: `true` solo para validación/compilación/empaquetado; `false` para la ruta de publicación real
- `preflight_run_id`: identificador de una ejecución preliminar existente y correcta, obligatorio en la ruta de publicación real para que el flujo de trabajo reutilice el archivo tar preparado en lugar de volver a compilarlo
- `full_release_validation_run_id`: identificador de una ejecución correcta de `Full Release Validation` para esta etiqueta/SHA, obligatorio para la publicación real. Las publicaciones beta pueden continuar únicamente con la comprobación preliminar y una advertencia, pero la promoción estable/a `latest` sigue requiriéndolo.
- `full_release_validation_run_attempt`: intento de ejecución positivo exacto asociado con `full_release_validation_run_id`; es obligatorio siempre que se proporcione el identificador de ejecución para evitar que las repeticiones modifiquen la evidencia de autorización durante la publicación.
- `release_publish_run_id`: identificador de ejecución aprobado de `OpenClaw Release Publish`; obligatorio cuando este flujo de trabajo es iniciado por esa ejecución principal (llamadas de publicación real realizadas por un bot)
- `plugin_npm_run_id`: identificador de una ejecución correcta y con encabezado exacto de `Plugin NPM Release`; obligatorio para una publicación real del paquete principal `extended-stable`
- `npm_dist_tag`: etiqueta de destino de npm para la ruta de publicación; acepta `alpha`, `beta`, `latest` o `extended-stable`, y su valor predeterminado es `beta`. El parche final `33` y los posteriores deben utilizar `extended-stable`; de forma predeterminada, `extended-stable` rechaza los parches anteriores y siempre rechaza las etiquetas no finales.
- `bypass_extended_stable_guard`: booleano exclusivo para pruebas, con valor predeterminado `false`; con `npm_dist_tag=extended-stable`, omite la comprobación mensual de elegibilidad de estabilidad extendida, pero conserva las comprobaciones de identidad de la versión, artefacto, aprobación y relectura.

`Plugin NPM Release` acepta `npm_dist_tag=default` para el comportamiento de publicación
existente o `npm_dist_tag=extended-stable` para la ruta mensual protegida. La opción
de estabilidad extendida requiere `publish_scope=all-publishable`, una entrada
`plugins` vacía, un parche final igual o superior a `33` y la rama canónica
`extended-stable/YYYY.M.33` en su punto exacto. Nunca mueve las etiquetas `latest`
ni `beta` de los plugins. Las nuevas versiones de paquetes reciben `extended-stable`
de forma atómica mediante publicación de confianza con OIDC (`npm publish --tag extended-stable`);
este flujo de trabajo de origen no utiliza `npm dist-tag add` autenticado mediante token. Los
reintentos omiten las versiones exactas ya presentes en npm y, después, se detienen de forma
segura salvo que una relectura completa confirme que todos los paquetes exactos y la etiqueta
`extended-stable` han convergido.

`OpenClaw Release Publish` acepta estas entradas controladas por el operador:

- `tag`: etiqueta de versión obligatoria; ya debe existir
- `preflight_run_id`: identificador de una ejecución preliminar correcta de `OpenClaw NPM Release`; obligatorio cuando `publish_openclaw_npm=true` o `plugin_publish_scope=all-publishable`
- `full_release_validation_run_id`: identificador de una ejecución correcta de `Full Release Validation`; obligatorio cuando `publish_openclaw_npm=true` o `plugin_publish_scope=all-publishable`
- `full_release_validation_run_attempt`: intento positivo exacto asociado con `full_release_validation_run_id`; obligatorio siempre que se proporcione el identificador de ejecución
- `windows_node_tag`: etiqueta exacta de versión no preliminar de `openclaw/openclaw-windows-node`; obligatoria para una publicación estable de OpenClaw
- `windows_node_installer_digests`: mapa JSON compacto, aprobado para el candidato, que asocia los nombres actuales de los instaladores de Windows con sus resúmenes `sha256:` fijados; obligatorio para una publicación estable de OpenClaw
- `npm_telegram_run_id`: identificador opcional de una ejecución correcta de `NPM Telegram Beta E2E` que se incluirá en la evidencia final de la versión
- `npm_dist_tag`: etiqueta de destino de npm para el paquete OpenClaw; una de `alpha`, `beta` o `latest`
- `plugin_publish_scope`: su valor predeterminado es `all-publishable`; utilice `selected` únicamente para trabajos específicos de reparación exclusiva de plugins con `publish_openclaw_npm=false`
- `plugins`: nombres de paquetes `@openclaw/*` separados por comas cuando `plugin_publish_scope=selected`
- `publish_openclaw_npm`: su valor predeterminado es `true`; establézcalo en `false` únicamente cuando utilice el flujo de trabajo como orquestador de reparaciones exclusivas de plugins
- `release_profile`: perfil de cobertura de la versión utilizado para los resúmenes de evidencia de publicación; su valor predeterminado es `from-validation`, que lo lee del manifiesto de validación, o puede sustituirse por `beta`, `stable` o `full`
- `wait_for_clawhub`: su valor predeterminado es `false` para que la disponibilidad en npm no quede bloqueada por el proceso auxiliar de ClawHub; establézcalo en `true` únicamente cuando la finalización del flujo de trabajo deba incluir la finalización de ClawHub

`OpenClaw Release Checks` acepta estas entradas controladas por el operador:

- `ref`: rama, etiqueta o SHA completo del commit que se va a validar. Las comprobaciones que contienen secretos requieren que el commit resuelto sea accesible desde una rama o etiqueta de versión de OpenClaw.
- `run_release_soak`: habilita las pruebas exhaustivas en vivo/E2E, la ruta de publicación de Docker y las pruebas prolongadas de supervivencia a actualizaciones desde todas las versiones para las comprobaciones de versiones beta. Se activa obligatoriamente con `release_profile=stable` y `release_profile=full`.

Reglas:

- Las versiones finales y de corrección normales inferiores al parche `33` pueden publicarse en `beta` o `latest`. Las versiones finales con el parche `33` o superior deben publicarse en `extended-stable`, y las versiones con sufijo de corrección en ese límite se rechazan.
- Las etiquetas de prelanzamiento beta solo pueden publicarse en `beta`; las etiquetas de prelanzamiento alfa solo pueden publicarse en `alpha`
- Para `OpenClaw NPM Release`, solo se permite introducir el SHA completo del commit cuando `preflight_only=true`
- `OpenClaw Release Checks` y `Full Release Validation` siempre se limitan a la validación
- La ruta de publicación real debe usar el mismo `npm_dist_tag` utilizado durante la comprobación previa; el flujo de trabajo verifica esos metadatos antes de continuar con la publicación

## Secuencia normal de lanzamiento estable beta/latest

Esta secuencia heredada corresponde al lanzamiento orquestado normal, que también abarca los plugins, la versión de GitHub, Windows y el trabajo para otras plataformas. No es la ruta mensual `.33+` de estabilidad extendida exclusiva de npm que se documenta al principio de esta página.

Al preparar un lanzamiento estable orquestado normal:

1. Ejecuta `OpenClaw NPM Release` con `preflight_only=true`. Antes de que exista una etiqueta, puedes usar el SHA completo del commit actual de la rama del flujo de trabajo para realizar una ejecución de prueba de solo validación del flujo de comprobación previa.
2. Elige `npm_dist_tag=beta` para el flujo normal que comienza por beta, o `latest` solo cuando quieras publicar intencionadamente una versión estable de forma directa.
3. Ejecuta `Full Release Validation` en la rama de lanzamiento, la etiqueta de lanzamiento o el SHA completo del commit cuando quieras obtener, mediante un único flujo de trabajo manual, la CI normal junto con cobertura de la caché de prompts en vivo, Docker, QA Lab, Matrix y Telegram. Si intencionadamente solo necesitas el grafo determinista de pruebas normales, ejecuta en su lugar el flujo de trabajo manual `CI` sobre la referencia del lanzamiento.
4. Selecciona la etiqueta exacta de versión que no sea de prelanzamiento de `openclaw/openclaw-windows-node` cuyos instaladores firmados para x64 y ARM64 deban distribuirse. Guárdala como `windows_node_tag` y guarda el mapa de resúmenes validado de esos instaladores como `windows_node_installer_digests`. La utilidad de versiones candidatas registra ambos valores y los incluye en el comando de publicación que genera.
5. Guarda el `preflight_run_id`, el `full_release_validation_run_id` y el `full_release_validation_run_attempt` exacto de la ejecución correcta.
6. Ejecuta `OpenClaw Release Publish` desde una rama `main` de confianza con el mismo `tag`, el mismo `npm_dist_tag`, el `windows_node_tag` seleccionado, su `windows_node_installer_digests` guardado, el `preflight_run_id`, el `full_release_validation_run_id` y el `full_release_validation_run_attempt` guardados. Publica los plugins externalizados en npm y ClawHub antes de promover el paquete npm de OpenClaw.
7. Si el lanzamiento se publicó en `beta`, usa el flujo de trabajo `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` para promover esa versión estable de `beta` a `latest`.
8. Si el lanzamiento se publicó intencionadamente directamente en `latest` y `beta` debe apuntar de inmediato a la misma compilación estable, usa ese mismo flujo de trabajo de lanzamiento para hacer que ambas etiquetas de distribución apunten a la versión estable, o deja que su sincronización programada de autorreparación traslade `beta` más adelante.

La modificación de las etiquetas de distribución reside en el repositorio del registro de lanzamientos porque aún requiere `NPM_TOKEN`, mientras que el repositorio de código fuente mantiene una publicación exclusiva mediante OIDC. De este modo, tanto la ruta de publicación directa como la ruta de promoción que comienza por beta quedan documentadas y visibles para los operadores.

Si un mantenedor debe recurrir a la autenticación local de npm, debe ejecutar cualquier comando de la CLI de 1Password (`op`) únicamente dentro de una sesión de tmux dedicada. No se debe invocar `op` directamente desde el shell principal del agente; mantenerlo dentro de tmux permite observar las solicitudes, las alertas y la gestión de OTP, y evita que se repitan las alertas del sistema anfitrión.

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

Los mantenedores usan la documentación privada de lanzamientos de [`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md) como procedimiento operativo real.

## Temas relacionados

- [Canales de lanzamiento](/es/install/development-channels)
