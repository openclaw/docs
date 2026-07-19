---
read_when:
    - Buscando definiciones públicas de canales de lanzamiento
    - Ejecución de la validación de la versión o de la aceptación del paquete
    - Buscando la nomenclatura y la cadencia de las versiones
summary: Canales de lanzamiento, lista de verificación del operador, entornos de validación, nomenclatura de versiones y cadencia
title: Política de lanzamientos
x-i18n:
    generated_at: "2026-07-19T02:05:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: db7e2337495368b5d849e44ccbe60078fafa2dbb3d45d657b53e2104ad23a7f9
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw ofrece actualmente tres canales de actualización orientados al usuario:

- stable: el canal de versiones promocionadas existente, que todavía se resuelve mediante npm `latest` hasta que se alcance el hito independiente de CLI/canal
- beta: etiquetas de versiones preliminares que se publican en npm `beta`
- dev: la cabecera cambiante de `main`

Por separado, los operadores de versiones pueden publicar el paquete principal del
último mes completado en npm `extended-stable`, comenzando en el parche `33`. La línea
final regular del mes actual continúa en npm `latest`; esta separación de publicación
del lado del operador no cambia por sí misma la resolución de canales de actualización de la CLI.

Las compilaciones alfa de Tideclaw constituyen una vía interna independiente de versiones preliminares (dist-tag de npm `alpha`), descrita en [Entradas del flujo de trabajo de NPM](#npm-workflow-inputs) y [Entornos de prueba de versiones](#release-test-boxes).

## Nomenclatura de versiones

- Versión mensual extended-stable de npm: `YYYY.M.PATCH`, con `PATCH >= 33`, etiqueta de git `vYYYY.M.PATCH`
- Versión final diaria/regular: `YYYY.M.PATCH`, con `PATCH < 33`, etiqueta de git `vYYYY.M.PATCH`
- Versión regular de corrección alternativa: `YYYY.M.PATCH-N`, etiqueta de git `vYYYY.M.PATCH-N`
- Versión preliminar beta: `YYYY.M.PATCH-beta.N`, etiqueta de git `vYYYY.M.PATCH-beta.N`
- Versión preliminar alfa: `YYYY.M.PATCH-alpha.N`, etiqueta de git `vYYYY.M.PATCH-alpha.N`
- Nunca se deben rellenar con ceros el mes ni el parche
- `PATCH` es un número secuencial del ciclo mensual de versiones, no un día del calendario. Las versiones finales regulares y beta hacen avanzar el ciclo actual; las etiquetas exclusivamente alfa nunca consumen ni hacen avanzar el número de parche beta/regular, por lo que se deben ignorar las etiquetas heredadas exclusivamente alfa con números de parche superiores al seleccionar un ciclo beta o regular.
- Las compilaciones alfa/nocturnas utilizan el siguiente ciclo de parche aún no publicado e incrementan únicamente `alpha.N` para las compilaciones repetidas. Cuando ese parche tenga una beta, las nuevas compilaciones alfa pasan al parche siguiente.
- Las versiones de npm son inmutables: nunca se debe eliminar, volver a publicar ni reutilizar una etiqueta publicada. Se debe crear el siguiente número de versión preliminar o el siguiente parche mensual.
- `latest` continúa siguiendo la línea npm regular/diaria actual; `beta` es el destino actual de instalación beta
- `extended-stable` se refiere al paquete npm compatible del mes anterior, comenzando en el parche `33`; el parche `34` y los posteriores son versiones de mantenimiento de esa línea mensual
- Las versiones finales regulares y las correcciones regulares se publican de forma predeterminada en npm `beta`; los operadores de versiones pueden seleccionar explícitamente `latest` o promocionar más adelante una compilación beta verificada
- La ruta mensual dedicada extended-stable publica el paquete principal de npm y todos los plugins oficiales publicables en npm con exactamente la misma versión. No publica plugins en ClawHub ni artefactos de macOS o Windows, una versión de GitHub, dist-tags de repositorios privados, imágenes de Docker, artefactos móviles ni descargas del sitio web.
- Cada versión final regular distribuye conjuntamente el paquete npm, la aplicación para macOS, el APK independiente firmado para Android y los instaladores firmados de Windows Hub. Por lo general, las versiones beta validan y publican primero la ruta de npm/paquete, mientras que la compilación, firma, notarización y promoción de aplicaciones nativas se reservan para la versión final regular, salvo que se soliciten explícitamente.

## Cadencia de versiones

- Las versiones avanzan primero por beta; stable solo llega después de validar la beta más reciente
- Normalmente, los responsables crean versiones desde una rama `release/YYYY.M.PATCH` creada a partir de la `main` actual, para que la validación y las correcciones de la versión no bloqueen el nuevo desarrollo en `main`
- Si se ha enviado o publicado una etiqueta beta y necesita una corrección, los responsables crean la siguiente etiqueta `-beta.N` en lugar de eliminar o volver a crear la anterior
- El procedimiento detallado de publicación, las aprobaciones, las credenciales y las notas de recuperación son exclusivos de los responsables

## Publicación mensual extended-stable solo en npm

Esta es una excepción específica al procedimiento regular de publicación que aparece a continuación. Para un
mes completado `YYYY.M`, se crea `extended-stable/YYYY.M.33`; se publican
`vYYYY.M.33` y los parches de mantenimiento posteriores desde esa misma rama. La etiqueta de
versión, la punta de la rama, el checkout, la versión del paquete, la comprobación previa de npm y la ejecución de la
Validación completa de la versión deben identificar el mismo commit. La rama protegida `main` ya debe
contener la versión final de un mes natural estrictamente posterior por debajo del parche
`33`; los parches de mantenimiento siguen siendo aptos después de que `main` avance más de un
mes.

En la rama extended-stable exacta, se incrementa el paquete raíz a `YYYY.M.P`, se ejecuta
`pnpm release:prep` y se verifica que todos los paquetes de extensiones publicables tengan la
misma versión. Se confirman y envían todos los cambios generados, se crea y envía la
etiqueta inmutable `vYYYY.M.P` en ese commit y se registra el SHA completo resultante.
Los flujos de trabajo consumen este árbol preparado; no incrementan ni sincronizan
las versiones automáticamente.

Se ejecutan la comprobación previa de npm y la Validación completa de la versión desde la punta exacta de esa rama
preparada y, a continuación, se guardan ambos identificadores de ejecución y el intento correcto de ejecución de la
Validación completa de la versión:

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

Cuando ambas ejecuciones se completen correctamente, se publican todos los plugins oficiales publicables en npm desde la
punta exacta de la misma rama. El parche `P` debe ser `33` o superior. Se pasa el SHA completo de la versión
como `ref`, se espera a que se completen toda la matriz y la lectura del registro y, a continuación, se guarda el
identificador de la ejecución correcta de Plugin NPM Release:

```bash
RELEASE_SHA="$(git rev-parse HEAD)"
gh workflow run plugin-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f publish_scope=all-publishable \
  -f ref="$RELEASE_SHA" \
  -f npm_dist_tag=extended-stable
```

El flujo de trabajo utiliza el inventario regular preparado de paquetes `all-publishable`,
incluidos los paquetes cuyo código fuente no haya cambiado. Antes de completarse correctamente, verifica cada paquete exacto
y cada etiqueta de plugin `extended-stable`. Si una ejecución parcial
falla, se vuelve a ejecutar el mismo comando: se reutilizan los paquetes ya publicados, las etiquetas de plugins
ausentes u obsoletas se concilian en el entorno de publicación de npm y la
lectura final sigue abarcando el conjunto completo de paquetes.

Cuando el flujo de trabajo de plugins se complete correctamente y el entorno de publicación de npm esté preparado,
se publica el tarball exacto de la comprobación previa del paquete principal. La publicación del paquete principal verifica que la
ejecución de plugins referenciada esté `completed/success` en la misma rama canónica y
con el SHA exacto del código fuente:

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

Para un fork o ensayo que no sea de producción y que intencionadamente no pueda satisfacer la
política mensual de `.33` o del mes de la rama protegida `main`, se añade
`-f bypass_extended_stable_guard=true` tanto al envío de la comprobación previa de npm como al de
publicación. El valor predeterminado es `false`. La omisión solo se acepta con
`npm_dist_tag=extended-stable` y se registra en el resumen del flujo de trabajo.
No omite la referencia canónica del flujo de trabajo `extended-stable/YYYY.M.33`,
la igualdad entre la punta de la rama, la etiqueta y el checkout, la sintaxis de la etiqueta final, la igualdad entre las versiones
del paquete y la etiqueta, la identidad de la ejecución y el manifiesto referenciados, la procedencia del tarball,
la aprobación del entorno, la lectura del registro ni las pruebas de reparación de selectores.

El flujo de trabajo de publicación verifica las identidades de las ejecuciones referenciadas de comprobación previa, validación y plugins,
el resumen del tarball preparado y los selectores del registro del paquete principal.
Una vez que el flujo de trabajo se complete correctamente, se confirma el resultado de forma independiente:

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

Ambos comandos deben devolver `YYYY.M.P`. Si la publicación se completa correctamente pero falla la
lectura del selector, no se vuelve a publicar la versión inmutable del paquete. Se utiliza el único
comando de reparación `npm dist-tag add openclaw@YYYY.M.P extended-stable`
impreso en el resumen de ejecución incondicional del flujo de trabajo fallido y, a continuación, se repiten ambas
lecturas independientes. La reversión al selector anterior es una decisión independiente del operador,
no la ruta de reparación de la lectura.

Inicialmente, la documentación pública de soporte designa Slack, Discord y Codex como
superficies de plugins compatibles con extended-stable. Esa lista es una declaración de compatibilidad, no
una lista de permitidos del código de publicación: todos los plugins oficiales publicables en npm siguen la
misma ruta de publicación con la versión exacta.

La lista de comprobación regular que aparece a continuación sigue rigiendo la publicación de beta, `latest`, la versión de GitHub,
los plugins, macOS, Windows y otras plataformas. No se deben ejecutar esos
pasos para esta ruta extended-stable solo en npm.

## Lista de comprobación del operador de versiones regulares

Esta lista de comprobación representa la estructura pública del flujo de publicación. Las credenciales privadas, la firma, la notarización, la recuperación de dist-tags y los detalles de reversión de emergencia permanecen en el manual de publicación exclusivo de los responsables.

1. Se parte de la `main` actual: se obtienen los cambios más recientes, se confirma que el commit de destino esté enviado y se confirma que la CI de `main` esté lo suficientemente correcta como para crear una rama.
2. Se crea `release/YYYY.M.PATCH` desde ese commit. Los backports son opcionales; solo se aplica el conjunto seleccionado por el operador. Se incrementan todas las ubicaciones de versión necesarias, se ejecuta `pnpm release:prep`, se terminan las correcciones de la versión y los forward ports necesarios, y se revisan `src/plugins/compat/registry.ts` y `src/commands/doctor/shared/deprecation-compat.ts`.
3. Se fija el commit anterior al registro de cambios que contiene el producto completo como **SHA del código**. Se ejecuta la comprobación previa determinista del código fuente y, a continuación, se utiliza `node scripts/full-release-validation-at-sha.mjs --sha <code-sha> --target-ref release/YYYY.M.PATCH`. Esto fija las herramientas de confianza del flujo de trabajo mientras la matriz completa de Vitest, Docker, QA, paquetes y rendimiento utiliza como destino el SHA exacto del código.
4. Se clasifican los fallos antes de editar. Un fallo del producto o del código crea un nuevo SHA del código y exige una validación completa correcta para ese SHA. Un fallo del flujo de trabajo, el entorno de pruebas, las credenciales, la aprobación o la infraestructura se corrige en su superficie propietaria y se vuelve a ejecutar con el mismo SHA del código.
5. Solo cuando el SHA del código esté validado correctamente, se genera la sección superior de `CHANGELOG.md` a partir de los pull requests fusionados y los commits directos realizados desde la última etiqueta publicada accesible. Las entradas deben estar orientadas al usuario y no contener duplicados. Cuando una etiqueta publicada divergente o un forward port posterior vuelva a asociar pull requests ya publicados, se pasa explícitamente como `--shipped-ref`.
6. Solo se confirma `CHANGELOG.md`. Este commit es el **SHA de la versión**. El diff completo entre el SHA del código y el SHA de la versión debe ser exactamente `CHANGELOG.md`; cualquier otra ruta modificada devuelve la publicación al paso 2.
7. Se ejecuta la Validación completa de la versión fijada por SHA para el SHA de la versión con la reutilización de pruebas habilitada. El elemento primario ligero debe registrar `changelog-only-release-v1`, apuntar al SHA del código validado correctamente y no iniciar ninguna vía secundaria del producto. Esto reutiliza las pruebas del producto; no reutiliza los bytes del paquete.
8. Se ejecuta `OpenClaw NPM Release` con `preflight_only=true` para el SHA o la etiqueta de la versión. Se guarda el `preflight_run_id` correcto. Esto compila y comprueba los bytes exactos del paquete que incluyen el registro de cambios final.
9. Se etiqueta el SHA de la versión y, a continuación, se ejecuta el auxiliar de candidatos con el elemento primario correcto de validación del SHA de la versión y la comprobación previa de npm, en lugar de volver a iniciar ninguno de ellos:

   ```bash
   pnpm release:candidate -- \
     --tag vYYYY.M.PATCH-beta.N \
     --full-release-run <release-sha-validation-run-id> \
     --npm-preflight-run <preflight-run-id> \
     --skip-dispatch
   ```

   Para estable, pase también `--windows-node-tag vX.Y.Z`. El asistente verifica la procedencia de las notas de la versión, los bytes de la comprobación previa de npm, la prueba de instalación/actualización de Parallels, la prueba del paquete de Telegram y los planes de publicación de plugins y, a continuación, muestra el comando de publicación.

   `OpenClaw Release Publish` envía los paquetes de plugins seleccionados o todos los publicables a npm y el mismo conjunto a ClawHub en paralelo; después, promociona el artefacto preparado de comprobación previa de npm de OpenClaw con la dist-tag correspondiente una vez que la publicación de los plugins en npm se realiza correctamente. El checkout de la versión sigue siendo la raíz del producto y los datos, mientras que la planificación y la verificación final se ejecutan desde el checkout exacto y de confianza del código fuente del flujo de trabajo, de modo que un commit de versión anterior no pueda usar silenciosamente herramientas de publicación obsoletas. Antes de que se inicie cualquier proceso hijo de publicación, renderiza y almacena en caché el cuerpo exacto de la versión de GitHub. Cuando la sección completa correspondiente a `CHANGELOG.md` cabe dentro del límite de 125,000 caracteres de GitHub y del límite de seguridad correspondiente de 125,000 bytes del renderizador, la página contiene exactamente esa sección `## YYYY.M.PATCH`, incluido su encabezado. Cuando la sección de origen no cabe, la página conserva exactamente las notas editoriales agrupadas y sustituye el registro de contribuciones sobredimensionado por un enlace estable al registro completo en el `CHANGELOG.md` fijado a la etiqueta; nunca se publican registros parciales ni viñetas truncadas. El flujo de trabajo elige ese cuerpo completo o compacto antes de añadir `### Release verification`; si el final de la prueba superara el límite, conserva el cuerpo canónico y se basa en la evidencia inmutable adjunta. Las versiones estables publicadas en npm `latest` se convierten en la versión más reciente de GitHub, mientras que las versiones estables de mantenimiento conservadas en npm `beta` se crean con `latest=false` de GitHub. El flujo de trabajo también carga en la versión de GitHub la evidencia de dependencias de la comprobación previa, el manifiesto de validación completa y la evidencia de verificación del registro posterior a la publicación para responder a incidentes posteriores a la versión. Muestra inmediatamente los ID de las ejecuciones hijas, aprueba automáticamente las puertas del entorno de publicación que el token del flujo de trabajo tiene permiso para aprobar, resume los trabajos hijos fallidos con los finales de los registros, crea de antemano la página de borrador de la versión de GitHub y promociona los artefactos de Windows y Android al mismo tiempo que publica OpenClaw en npm, completa la página de la versión y la evidencia de dependencias cuando esas etapas se realizan correctamente, espera a ClawHub siempre que se publique OpenClaw en npm y, a continuación, ejecuta el verificador beta de confianza de la rama principal y carga evidencia posterior a la publicación para la versión de GitHub, el paquete npm, los paquetes npm de plugins seleccionados, los paquetes de ClawHub seleccionados, los ID de las ejecuciones hijas y el ID opcional de la ejecución de Telegram en NPM. El verificador de arranque de ClawHub exige la ruta y el SHA exactos del flujo de trabajo de confianza de la rama principal, los intentos de ejecución del productor y del terminal, el SHA de la versión, el conjunto de paquetes solicitado, la tupla inmutable del artefacto del paquete y el artefacto de lectura posterior del registro del terminal; no se acepta una ejecución correcta heredada de la referencia de la versión.

   A continuación, ejecute la aceptación del paquete posterior a la publicación con el paquete `openclaw@YYYY.M.PATCH-beta.N` o `openclaw@beta` publicado. Si una versión preliminar enviada o publicada necesita una corrección, cree el siguiente número de versión preliminar correspondiente; nunca elimine ni reescriba el anterior.

10. Tras un intento de publicación fallido, mantenga sin cambios el SHA de la versión, salvo que el fallo demuestre un defecto del producto o del registro de cambios. Reanude los procesos hijos y artefactos inmutables correctos; nunca vuelva a compilar ni publicar una versión de paquete que ya se haya publicado correctamente.
11. Para estable, continúe solo después de que la beta o la candidata a versión aprobada tenga la evidencia de validación requerida. La publicación estable en npm también pasa por `OpenClaw Release Publish`, reutilizando mediante `preflight_run_id` el artefacto de comprobación previa correcto. La preparación de la versión estable para macOS también requiere los elementos empaquetados `.zip`, `.dmg`, `.dSYM.zip` y el `appcast.xml` actualizado en `main`; el flujo de trabajo de publicación de macOS publica automáticamente el appcast firmado en el `main` público después de verificar los artefactos de la versión, o abre/actualiza un pull request del appcast si la protección de la rama bloquea el envío directo. La preparación estable de Windows Hub requiere los artefactos firmados `OpenClawCompanion-Setup-x64.exe`, `OpenClawCompanion-Setup-arm64.exe` y `OpenClawCompanion-SHA256SUMS.txt` en la versión de GitHub de OpenClaw. Pase la etiqueta exacta de la versión firmada `openclaw/openclaw-windows-node` como `windows_node_tag` y su mapa de resúmenes de instaladores aprobado para la candidata como `windows_node_installer_digests`; `OpenClaw Release Publish` conserva el borrador de la versión, envía `Windows Node Release` y verifica los tres artefactos antes de la publicación.
12. Después de publicar, ejecute el verificador posterior a la publicación de npm, la prueba E2E independiente y opcional de Telegram con el paquete npm publicado cuando necesite una prueba del canal posterior a la publicación, la promoción de la dist-tag cuando sea necesaria, verifique la página generada de la versión de GitHub, ejecute los pasos del anuncio de la versión y, a continuación, complete el [cierre estable de la rama principal](#stable-main-closeout) antes de considerar finalizada una versión estable.

## Cierre estable de la rama principal

La publicación estable no está completa hasta que `main` contenga el estado real de la versión publicada.

1. Comience desde la versión más reciente y actualizada de `main`. Audite `release/YYYY.M.PATCH` comparándolo con ella y transfiera hacia delante las correcciones reales que no estén presentes en `main`. No fusione a ciegas adaptadores de compatibilidad, pruebas o validación exclusivos de la versión en el `main` más reciente.
2. Para la ruta normal, establezca `main` en la versión estable publicada. Un cierre tardío puede usar `main` después de que haya avanzado a una versión CalVer estable posterior de OpenClaw; no revierta a una versión anterior un ciclo de publicación ya iniciado únicamente para cerrar la versión anterior. El validador sigue exigiendo la sección exacta del registro de cambios publicada y la entrada del appcast, y registra la versión y el SHA reales de `main`. Ejecute `pnpm release:prep` después de cualquier cambio en la versión raíz y, a continuación, `pnpm deps:shrinkwrap:generate`.
3. Haga que la sección `## YYYY.M.PATCH` de `CHANGELOG.md` en `main` coincida exactamente con la rama de publicación etiquetada. Incluya la actualización estable de `appcast.xml` cuando la versión de macOS haya publicado una.
4. No añada `YYYY.M.PATCH+1`, una versión beta ni una sección vacía de un registro de cambios futuro a `main` hasta que el operador inicie explícitamente ese ciclo de publicación.
5. Ejecute `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check` y `OPENCLAW_TESTBOX=1 pnpm check:changed`. Realice el envío y, a continuación, verifique que `origin/main` contenga la versión publicada y el registro de cambios antes de considerar finalizada la versión estable.
6. Mantenga actualizadas las variables del repositorio `RELEASE_ROLLBACK_DRILL_ID` y `RELEASE_ROLLBACK_DRILL_DATE` después de cada simulacro privado de reversión.

`OpenClaw Stable Main Closeout` se inicia a partir del envío a `main` que contiene la versión publicada, el registro de cambios y el appcast después de la publicación estable. Lee la evidencia inmutable posterior a la publicación para vincular la etiqueta publicada con sus ejecuciones de validación completa de la versión y de publicación y, a continuación, verifica el estado estable de la rama principal, la versión, el periodo de observación estable obligatorio y la evidencia de rendimiento bloqueante. Adjunta a la versión de GitHub un manifiesto de cierre inmutable y su suma de comprobación. El desencadenador automático de envío omite las versiones heredadas anteriores a la evidencia inmutable posterior a la publicación y nunca considera esa omisión como un cierre completado.

Un cierre completo requiere ambos artefactos y una suma de comprobación coincidente. Un manifiesto parcial vuelve a ejecutar el SHA `main` y el simulacro de reversión registrados para regenerar bytes idénticos y, a continuación, adjunta la suma de comprobación que falta; un par no válido, o una suma de comprobación sin manifiesto, continúa bloqueando el proceso. Una ejecución desencadenada por un envío que no disponga de las variables del repositorio del simulacro de reversión se omite sin completar el cierre; un registro de simulacro ausente o con más de 90 días de antigüedad sigue bloqueando el cierre manual respaldado por evidencia. Los comandos privados de recuperación permanecen en el manual exclusivo de los mantenedores. Use el envío manual únicamente para reparar o volver a ejecutar un cierre estable respaldado por evidencia.

Si el proceso padre de publicación de la versión falló únicamente después de adjuntar evidencia inmutable de npm/plugins, repare y publique primero todos los artefactos de las plataformas estables. A continuación, un mantenedor puede enviar manualmente el cierre con `allow_failed_publish_recovery=true`; ese modo solo acepta un proceso padre fallido y completado y, además, exige los contratos exactos de los artefactos de Android y Windows, los resúmenes SHA-256 de GitHub, la verificación de sumas de comprobación, la procedencia de Android y una promoción correcta de Windows enviada por el proceso padre cuyas comprobaciones de Authenticode y resúmenes aprobados para la candidata coincidan con los instaladores publicados, además de las comprobaciones habituales de macOS/appcast. El cierre automático mediante envío nunca habilita este modo de recuperación.

Una etiqueta heredada de corrección alternativa puede reutilizar la evidencia del paquete base únicamente cuando la etiqueta de corrección se resuelva al mismo commit de origen que la etiqueta estable base. Su versión de Android reutiliza el APK verificado de la etiqueta base y añade procedencia para la etiqueta de corrección. Una corrección con un origen diferente debe publicar y verificar su propia evidencia del paquete y usar un `versionCode` de Android superior.

## Comprobación previa de la versión

- Ejecute `pnpm check:test-types` antes de la comprobación previa de la versión para que TypeScript de las pruebas siga cubierto fuera de la puerta local más rápida `pnpm check`.
- Ejecute `pnpm check:architecture` antes de la comprobación previa de la versión para que las comprobaciones más amplias de ciclos de importación y límites de arquitectura estén correctas fuera de la puerta local más rápida.
- Ejecute `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que los artefactos esperados de la versión `dist/*` y el paquete de Control UI existan para el paso de validación del paquete.
- Ejecute `pnpm release:prep` después de incrementar la versión raíz y antes de etiquetar. Ejecuta todos los generadores deterministas de la versión que suelen quedar desactualizados después de un cambio de versión/configuración/API: versiones de plugins, archivos shrinkwrap de npm, inventario de plugins, esquema de configuración base, metadatos de configuración de canales incluidos, referencia de la documentación de configuración, exportaciones del SDK de plugins, manifiesto del contrato de API del SDK de plugins y paquetes de configuración regional de Control UI. `pnpm release:check` vuelve a ejecutar esas protecciones en modo de comprobación (incluidas la puerta estricta de configuración regional sin alternativas y el límite de superficie del SDK de plugins) e informa de todos los fallos de desactualización generados en una sola pasada antes de ejecutar las comprobaciones de publicación de paquetes.
- La sincronización de versiones de plugins actualiza de forma predeterminada el paquete de entorno de ejecución publicable `@openclaw/ai`, las versiones de los paquetes de plugins oficiales y los límites inferiores existentes de `openclaw.compat.pluginApi` a la versión de OpenClaw. Trate ese campo como el límite inferior de la API del SDK/entorno de ejecución de plugins, no solo como una copia de la versión del paquete: para versiones exclusivas de plugins que intencionadamente sigan siendo compatibles con hosts antiguos de OpenClaw, mantenga el límite inferior en la API de host compatible más antigua y documente esa decisión en la prueba de publicación del plugin.
- Ejecute el flujo de trabajo manual `Full Release Validation` antes de aprobar la versión para iniciar todos los entornos de prueba previos a la versión desde un único punto de entrada. Acepta una rama, una etiqueta o un SHA completo de commit, envía manualmente `CI` y envía `OpenClaw Release Checks` para las rutas de pruebas rápidas de instalación, aceptación de paquetes, comprobaciones de paquetes entre sistemas operativos, paridad de QA Lab, Matrix y Telegram. Las ejecuciones estables y completas siempre incluyen pruebas exhaustivas en vivo/E2E y un periodo de observación de la ruta de publicación de Docker; `run_release_soak=true` se conserva para un periodo de observación beta explícito. La aceptación de paquetes proporciona la prueba E2E canónica de Telegram con el paquete durante la validación de la candidata, lo que evita un segundo sondeador simultáneo en vivo.

  Proporcione `release_package_spec` después de publicar una beta para reutilizar el paquete npm publicado en las comprobaciones de la versión, la aceptación de paquetes y la prueba E2E de Telegram con el paquete sin volver a compilar el archivo tar de la versión. Proporcione `npm_telegram_package_spec` únicamente cuando Telegram deba usar un paquete publicado diferente del resto de la validación de la versión. Proporcione `package_acceptance_package_spec` cuando la aceptación de paquetes deba usar un paquete publicado diferente de la especificación del paquete de la versión. Proporcione `evidence_package_spec` cuando el informe de evidencia de la versión deba demostrar que la validación coincide con un paquete npm publicado sin forzar la prueba E2E de Telegram.

  ```bash
  node scripts/full-release-validation-at-sha.mjs \
    --sha <code-sha> \
    --target-ref release/YYYY.M.PATCH
  ```

- Ejecute el flujo de trabajo manual `Package Acceptance` cuando necesite pruebas por un canal secundario para un paquete candidato mientras continúa el trabajo de publicación. Use `source=npm` para `openclaw@beta`, `openclaw@latest` o una versión de publicación exacta; `source=ref` para empaquetar una rama/etiqueta/SHA de confianza de `package_ref` con el entorno de pruebas `workflow_ref` actual; `source=url` para un tarball HTTPS público con un SHA-256 obligatorio y una política estricta de URL públicas; `source=trusted-url` para una política de origen de confianza con nombre que use el `trusted_source_id` y el SHA-256 obligatorios; o `source=artifact` para un tarball cargado por otra ejecución de GitHub Actions.

  El flujo de trabajo resuelve el candidato como `package-under-test`, reutiliza el planificador de publicaciones E2E de Docker con ese tarball y puede ejecutar el control de calidad de Telegram con el mismo tarball mediante `telegram_mode=mock-openai` o `telegram_mode=live-frontier`. Cuando los carriles de Docker seleccionados incluyen `published-upgrade-survivor`, el artefacto del paquete es el candidato y `published_upgrade_survivor_baseline` selecciona la referencia publicada. `update-restart-auth` usa el paquete candidato tanto como CLI instalada como paquete sometido a prueba para ejercitar la ruta de reinicio administrado del comando de actualización del candidato.

  Ejemplo:

  ```bash
  gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai
  ```

  Perfiles habituales:
  - `smoke`: carriles de instalación/canal/agente, red del Gateway y recarga de configuración
  - `package`: carriles nativos del artefacto para paquete/actualización/reinicio/plugins sin OpenWebUI ni ClawHub activo
  - `product`: perfil de paquete más canales MCP, limpieza de cron/subagentes, búsqueda web de OpenAI y OpenWebUI
  - `full`: bloques de la ruta de publicación de Docker con OpenWebUI
  - `custom`: selección exacta de `docker_lanes` para una repetición específica

- Ejecute directamente el flujo de trabajo manual `CI` cuando solo necesite una cobertura determinista de CI normal para el candidato de publicación. Los inicios manuales de CI omiten la delimitación por cambios y fuerzan los fragmentos de Linux Node, los fragmentos de plugins incluidos, los fragmentos de contratos de plugins y canales, la compatibilidad con Node 22, `check-*`, `check-additional-*`, las comprobaciones rápidas de artefactos compilados, las comprobaciones de documentación, las Skills de Python, Windows, macOS y los carriles de i18n de la interfaz de control. Las ejecuciones manuales independientes de CI solo ejecutan Android cuando se inician con `include_android=true`; `Full Release Validation` pasa esa entrada a su ejecución secundaria de CI.

  ```bash
  gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true
  ```

- Ejecute `pnpm qa:otel:smoke` al validar la telemetría de la publicación. Ejercita el laboratorio de control de calidad mediante un receptor OTLP/HTTP local y verifica la exportación de trazas, métricas y registros, además de los atributos de traza acotados y la ocultación de contenido e identificadores, sin requerir Opik, Langfuse ni otro recopilador externo.
- Ejecute `pnpm qa:otel:collector-smoke` al validar la compatibilidad con recopiladores. Enruta la misma exportación OTLP del laboratorio de control de calidad a través de un contenedor Docker real de OpenTelemetry Collector antes de las aserciones del receptor local.
- Ejecute `pnpm qa:prometheus:smoke` al validar el sondeo protegido de Prometheus. Ejercita el laboratorio de control de calidad, rechaza los sondeos no autenticados y verifica que las familias de métricas críticas para la publicación no contengan contenido de solicitudes, identificadores sin procesar, tokens de autenticación ni rutas locales.
- Ejecute `pnpm qa:observability:smoke` para ejecutar consecutivamente los carriles de comprobación rápida de OpenTelemetry y Prometheus desde el checkout del código fuente.
- Ejecute `pnpm release:check` antes de cada publicación etiquetada.
- La comprobación preliminar `OpenClaw NPM Release` genera pruebas de dependencias de la publicación antes de empaquetar el tarball de npm. La puerta de vulnerabilidades de avisos de npm bloquea la publicación. Los informes sobre el riesgo del manifiesto transitivo, la propiedad y superficie de instalación de las dependencias y los cambios de dependencias son solo pruebas de la publicación. El informe de cambios de dependencias compara el candidato de publicación con la etiqueta de publicación accesible anterior. La comprobación preliminar carga las pruebas de dependencias como `openclaw-release-dependency-evidence-<tag>` y también las integra en `dependency-evidence/` dentro del artefacto de comprobación preliminar de npm preparado. La ruta de publicación real reutiliza ese artefacto de comprobación preliminar y después adjunta las mismas pruebas a la publicación de GitHub como `openclaw-<version>-dependency-evidence.zip`.
- Ejecute `OpenClaw Release Publish` para la secuencia de publicación que realiza cambios una vez que exista la etiqueta. Inicie las publicaciones beta y estables normales desde `main` de confianza; la etiqueta de publicación seguirá seleccionando el commit de destino exacto y puede apuntar a `release/YYYY.M.PATCH`. Las publicaciones alfa de Tideclaw permanecen en su rama alfa correspondiente. Pase el `preflight_run_id` de npm de OpenClaw correcto, la ejecución correcta de `full_release_validation_run_id` y el `full_release_validation_run_attempt` exacto, y mantenga el ámbito predeterminado de publicación de plugins `all-publishable`, salvo que esté realizando deliberadamente una reparación específica. El flujo de trabajo serializa la publicación de plugins en npm, la publicación de plugins en ClawHub y la publicación de OpenClaw en npm para que el paquete principal no se publique antes que sus plugins externalizados; la promoción de Windows y Android se ejecuta simultáneamente con la publicación del paquete principal en npm sobre la página de publicación en borrador. Las repeticiones de publicación se pueden reanudar: una versión principal de npm ya publicada omite el inicio de la publicación principal después de que el flujo de trabajo compruebe que el tarball del registro coincide con el artefacto de comprobación preliminar de la etiqueta, y se omite la promoción de Windows/Android cuando la publicación ya contiene el contrato de artefactos verificado, de modo que un reintento solo repite las etapas fallidas. Las reparaciones específicas solo de plugins requieren `plugin_publish_scope=selected` y una lista de plugins no vacía. Las ejecuciones de `all-publishable` solo para plugins requieren pruebas completas e inmutables de la comprobación preliminar y de la validación completa de la publicación; las pruebas parciales se rechazan.
- La versión estable de `OpenClaw Release Publish` requiere un `windows_node_tag` exacto después de que exista la publicación `openclaw/openclaw-windows-node` correspondiente que no sea preliminar, además del mapa `windows_node_installer_digests` aprobado para el candidato. Antes de iniciar cualquier flujo secundario de publicación, comprueba que esa publicación de origen esté publicada, no sea preliminar, contenga los instaladores x64/ARM64 requeridos y siga coincidiendo con ese mapa aprobado. Después inicia `Windows Node Release` mientras la publicación de OpenClaw todavía es un borrador y transmite sin cambios el mapa fijado de resúmenes de los instaladores. El flujo de trabajo secundario descarga los instaladores firmados de Windows Hub desde esa etiqueta exacta, los compara con los resúmenes fijados, verifica en un ejecutor de Windows que sus firmas Authenticode usen el firmante esperado de OpenClaw Foundation, escribe un manifiesto SHA-256 y carga los instaladores y el manifiesto en la publicación canónica de OpenClaw en GitHub; después vuelve a descargar los artefactos promocionados y verifica su pertenencia al manifiesto y sus hashes. El flujo principal verifica el contrato actual de artefactos x64, ARM64 y de suma de comprobación antes de la publicación. La recuperación directa rechaza los nombres inesperados de artefactos `OpenClawCompanion-*` antes de sustituir los artefactos previstos por los bytes de origen fijados.

  Inicie manualmente `Windows Node Release` solo para la recuperación y pase siempre una etiqueta exacta, nunca `latest`, además del mapa JSON explícito `expected_installer_digests` de la publicación de origen aprobada. Los enlaces de descarga del sitio web deben apuntar a las URL exactas de los artefactos de la publicación de OpenClaw estable actual, o a `releases/latest/download/...` solo después de comprobar que la redirección a la última versión de GitHub apunta a esa misma publicación; no enlace únicamente a la página de publicación del repositorio complementario.

- Las comprobaciones de la versión ahora se ejecutan en un flujo de trabajo manual independiente: `OpenClaw Release Checks`. También ejecuta la vía de paridad simulada de QA Lab, además del perfil de versión de Matrix y la vía de QA de Telegram, antes de aprobar la versión. Las vías en vivo usan el entorno `qa-live-shared`; Telegram también usa concesiones de credenciales de CI de Convex. Ejecute el flujo de trabajo manual `QA-Lab - All Lanes` con `matrix_profile=all` cuando se necesiten todos los escenarios de Matrix mantenidos; el flujo de trabajo distribuye esa selección entre los perfiles de transporte, medios y E2EE para mantener la comprobación completa dentro de los tiempos de espera de cada trabajo.
- La validación del entorno de ejecución de instalación y actualización entre sistemas operativos forma parte de los flujos públicos `OpenClaw Release Checks` y `Full Release Validation`, que invocan directamente el flujo de trabajo reutilizable `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`. Esta separación es intencional: mantiene la ruta real de publicación en npm breve, determinista y centrada en artefactos, mientras las comprobaciones en vivo más lentas permanecen en su propia vía para no retrasar ni bloquear la publicación.
- Las comprobaciones de versiones que contienen secretos deben iniciarse mediante `Full Release Validation` o desde la referencia del flujo de trabajo `main`/release para mantener bajo control la lógica del flujo de trabajo y los secretos.
- `OpenClaw Release Checks` acepta una rama, una etiqueta o un SHA de confirmación completo, siempre que la confirmación resuelta sea accesible desde una rama o etiqueta de versión de OpenClaw.
- La comprobación preliminar de solo validación `OpenClaw NPM Release` también acepta el SHA completo de 40 caracteres de la confirmación actual de la rama del flujo de trabajo sin exigir una etiqueta enviada. Esa ruta de SHA es solo para validación y no puede promoverse a una publicación real. En el modo SHA, el flujo de trabajo sintetiza `v<package.json version>` únicamente para comprobar los metadatos del paquete; la publicación real sigue requiriendo una etiqueta de versión real.
- Ambos flujos de trabajo mantienen la ruta real de publicación y promoción en ejecutores alojados en GitHub, mientras que la ruta de validación no mutante puede usar los ejecutores Linux de mayor tamaño de Blacksmith.
- Ese flujo de trabajo ejecuta `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` mediante los secretos de flujo de trabajo `OPENAI_API_KEY` y `ANTHROPIC_API_KEY`.
- La comprobación preliminar de publicación en npm ya no espera a la vía independiente de comprobaciones de la versión.
- Antes de etiquetar localmente una versión candidata, ejecute `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`. El auxiliar ejecuta las protecciones rápidas de la versión, las comprobaciones de publicación del plugin en npm/ClawHub, la compilación, la compilación de la interfaz de usuario y `release:openclaw:npm:check`, en el orden que detecta errores comunes que bloquean la aprobación antes de que se inicie el flujo de publicación de GitHub.
- Ejecute `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts` (o la etiqueta de versión preliminar/corrección correspondiente) antes de la aprobación.
- Después de publicar en npm, ejecute `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH` (o la versión beta/corrección correspondiente) para verificar la ruta de instalación desde el registro publicado en un prefijo temporal nuevo.
- Después de publicar una beta, ejecute `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` para verificar la incorporación desde el paquete instalado, la configuración de Telegram y el E2E real de Telegram con el paquete npm publicado mediante el grupo compartido de credenciales de Telegram concedidas. Las ejecuciones puntuales locales de responsables de mantenimiento pueden omitir las variables de Convex y proporcionar directamente las tres credenciales de entorno `OPENCLAW_QA_TELEGRAM_*`.
- Para ejecutar la prueba de humo beta completa posterior a la publicación desde el equipo de un responsable de mantenimiento, use `pnpm release:beta-smoke -- --beta betaN`. El auxiliar ejecuta la validación de actualización de npm y destino nuevo en Parallels, inicia `NPM Telegram Beta E2E`, consulta la ejecución exacta del flujo de trabajo, descarga el artefacto e imprime el informe de Telegram.
- Los responsables de mantenimiento pueden ejecutar la misma comprobación posterior a la publicación desde GitHub Actions mediante el flujo de trabajo manual `NPM Telegram Beta E2E`. Es intencionalmente solo manual y no se ejecuta con cada fusión.
- La automatización de versiones de los responsables de mantenimiento usa primero la comprobación preliminar y después la promoción:
  - La publicación real en npm debe superar una comprobación `preflight_run_id` de npm satisfactoria.
  - La orquestación y la comprobación preliminar de publicaciones beta y estables normales usan el `main` de confianza con la etiqueta de destino exacta. La publicación y la comprobación preliminar alfa de Tideclaw usan la rama alfa correspondiente.
  - Las versiones estables de npm usan `beta` de forma predeterminada; la publicación estable en npm puede dirigirse explícitamente a `latest` mediante una entrada del flujo de trabajo.
  - La mutación de la etiqueta de distribución de npm basada en tokens reside en `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` porque `npm dist-tag add` todavía necesita `NPM_TOKEN`, mientras que el repositorio de origen mantiene la publicación exclusivamente mediante OIDC.
  - El flujo público `macOS Release` es solo de validación; cuando una etiqueta existe únicamente en una rama de versión, pero el flujo de trabajo se inicia desde `main`, establezca `public_release_branch=release/YYYY.M.PATCH`.
  - La publicación real para macOS debe superar satisfactoriamente `preflight_run_id` y `validate_run_id` de macOS.
  - Las rutas de publicación reales promueven los artefactos preparados en lugar de volver a compilarlos.
- Para versiones de corrección estables como `YYYY.M.PATCH-N`, el verificador posterior a la publicación también comprueba la misma ruta de actualización con prefijo temporal desde `YYYY.M.PATCH` hasta `YYYY.M.PATCH-N`, para que las correcciones de versiones no puedan dejar silenciosamente las instalaciones globales anteriores con la carga útil de la versión estable base.
- La comprobación preliminar de publicación en npm falla de forma segura salvo que el archivo tar incluya tanto `dist/control-ui/index.html` como una carga útil `dist/control-ui/assets/` no vacía, para evitar volver a distribuir un panel del navegador vacío.
- La verificación posterior a la publicación también comprueba que los puntos de entrada de los plugins publicados y los metadatos del paquete estén presentes en la disposición instalada del registro. Una versión que distribuya cargas útiles faltantes del entorno de ejecución de plugins falla el verificador posterior a la publicación y no puede promoverse a `latest`.
- `pnpm test:install:smoke` también aplica el presupuesto `unpackedSize` del paquete npm al archivo tar de actualización candidato, para que el E2E del instalador detecte el crecimiento accidental del paquete antes de la ruta de publicación de la versión.
- Si el trabajo de la versión modificó la planificación de CI, los manifiestos de tiempos de las extensiones o las matrices de pruebas de extensiones, regenere y revise antes de la aprobación las salidas de la matriz `plugin-prerelease-extension-shard`, propiedad del planificador, a partir de `.github/workflows/plugin-prerelease.yml`, para que las notas de la versión no describan una disposición de CI obsoleta.
- La preparación de una versión estable para macOS también incluye las superficies del actualizador: la versión de GitHub debe terminar con los archivos empaquetados `.zip`, `.dmg` y `.dSYM.zip`; `appcast.xml` en `main` debe apuntar al nuevo archivo zip estable después de la publicación (el flujo de publicación de macOS lo confirma automáticamente o abre un pull request de appcast cuando se bloquea el envío directo); la aplicación empaquetada debe conservar un identificador de paquete que no sea de depuración, una URL de fuente de Sparkle no vacía y un `CFBundleVersion` igual o superior al mínimo de compilación canónico de Sparkle para esa versión.

## Cajas de pruebas de versiones

`Full Release Validation` es el medio por el que los operadores inician la matriz completa del producto desde un único punto de entrada. Use el auxiliar para que cada flujo de trabajo secundario se ejecute desde una rama temporal fijada en un SHA de flujo de trabajo `main` de confianza, mientras la confirmación solicitada permanece como candidata sometida a prueba:

```bash
pnpm ci:full-release \
  --sha <code-sha> \
  --target-ref release/YYYY.M.PATCH
```

El auxiliar obtiene el `origin/main` actual, envía `release-ci/<workflow-sha>-...` en esa confirmación de flujo de trabajo de confianza, deduce `beta` a partir de las versiones alfa/beta del paquete y `stable` en los demás casos, inicia `Full Release Validation` desde la rama temporal con `ref=<target-sha>`, verifica que cada `headSha` de los flujos de trabajo secundarios coincida con el SHA fijado del flujo de trabajo principal y, después, elimina la rama temporal. Proporcione `-f reuse_evidence=false` para forzar una ejecución nueva, `-f release_profile=full` para el análisis consultivo amplio o `--workflow-sha <trusted-main-sha>` para fijar una confirmación anterior que todavía sea accesible desde el `origin/main` actual. El propio flujo de trabajo nunca escribe referencias del repositorio. Esto mantiene disponibles las herramientas de publicación exclusivas de la rama principal sin añadir confirmaciones de herramientas a la candidata y evita comprobar accidentalmente una ejecución secundaria `main` más reciente.

Una vez que el SHA del código esté en verde, confirme únicamente `CHANGELOG.md` y ejecute el mismo auxiliar con el SHA de la versión:

```bash
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH
```

El segundo flujo principal reutiliza las pruebas del producto únicamente cuando GitHub demuestra que el SHA de la versión desciende del SHA del código y que el conjunto completo de rutas modificadas es exactamente `CHANGELOG.md`. Registra `changelog-only-release-v1` y no inicia ningún flujo secundario del producto. La comprobación preliminar de npm y la aceptación del paquete/instalación todavía se ejecutan con el SHA de la versión porque cambiaron los bytes de su archivo tar.

Para un SHA de código nuevo, el flujo de trabajo resuelve el destino, inicia el flujo manual `CI` y, después, inicia `OpenClaw Release Checks`. `OpenClaw Release Checks` distribuye la prueba de humo de instalación, las comprobaciones de versión entre sistemas operativos, la cobertura en vivo/E2E de la ruta de versión de Docker cuando las pruebas prolongadas están habilitadas, la aceptación del paquete con el E2E canónico del paquete de Telegram, la paridad de QA Lab, Matrix en vivo y Telegram en vivo. Una ejecución completa/total solo es aceptable cuando el resumen `Full Release Validation` muestra `normal_ci`, `plugin_prerelease` y `release_checks` como satisfactorios, salvo que una repetición enfocada haya omitido intencionalmente el flujo secundario independiente `Plugin Prerelease`. Use el flujo secundario independiente `npm-telegram` únicamente para repetir de forma enfocada la prueba del paquete publicado con `release_package_spec` o `npm_telegram_package_spec`. El resumen final del verificador incluye tablas de los trabajos más lentos de cada ejecución secundaria, para que el responsable de la versión pueda ver la ruta crítica actual sin descargar registros.

El flujo secundario de rendimiento del producto solo genera artefactos en esta ruta de versión. El
flujo global lo inicia con `publish_reports=false`, y la validación se rechaza
salvo que su protección de solo artefactos demuestre que el publicador de informes de Clawgrit permaneció
omitido.

Consulte [Validación completa de la versión](/es/reference/full-release-validation) para ver la matriz completa de etapas, los nombres exactos de los trabajos de los flujos, las diferencias entre los perfiles estable y completo, los artefactos y los identificadores para repeticiones enfocadas.

Los flujos de trabajo secundarios se inician desde la referencia de confianza fijada por SHA que ejecuta `Full Release Validation`. Cada ejecución secundaria debe usar el SHA exacto del flujo de trabajo principal. No use inicios sin procesar de `--ref main -f ref=<sha>` como comprobación de la versión; use `pnpm ci:full-release --sha <target-sha> --target-ref release/YYYY.M.PATCH`.

Use `release_profile` para seleccionar la amplitud de proveedores/en vivo:

- `beta`: ruta en vivo y de Docker más rápida y crítica para la versión de OpenAI/núcleo
- `stable`: cobertura de proveedores/backends de beta y estable para aprobar la versión
- `full`: cobertura estable más cobertura consultiva amplia de proveedores/medios

La validación estable y completa siempre ejecuta el análisis exhaustivo en vivo/E2E, de la ruta de versión de Docker y acotado de supervivencia a actualizaciones publicadas antes de la promoción. Use `run_release_soak=true` para solicitar el mismo análisis para una beta. Ese análisis abarca los cuatro paquetes estables más recientes, además de las líneas base fijadas `2026.4.23` y `2026.5.2` y la cobertura anterior de `2026.4.15`; elimina las líneas base duplicadas y divide cada línea base en su propio trabajo ejecutor de Docker.

`OpenClaw Release Checks` usa la referencia del flujo de trabajo de confianza para resolver una vez la referencia de destino como `release-package-under-test` y reutiliza ese artefacto en las comprobaciones entre sistemas operativos, la aceptación del paquete y las comprobaciones de Docker de la ruta de versión cuando se ejecutan las pruebas prolongadas. Esto mantiene todas las cajas orientadas a paquetes sobre los mismos bytes y evita compilaciones repetidas del paquete. Cuando una beta ya esté en npm, establezca `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` para que las comprobaciones de la versión descarguen una vez el paquete distribuido, extraigan su SHA de origen de compilación de `dist/build-info.json` y reutilicen ese artefacto en las vías entre sistemas operativos, de aceptación del paquete, de Docker de la ruta de versión y del paquete de Telegram.

La prueba de humo de instalación de OpenAI entre sistemas operativos usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` cuando la variable del repositorio o de la organización está establecida y, en caso contrario, `openai/gpt-5.6-luna`, porque esta vía comprueba la instalación del paquete, la incorporación, el inicio del Gateway y un turno de agente en vivo, en lugar de medir el rendimiento del modelo más capaz. La matriz más amplia de proveedores en vivo sigue siendo el lugar destinado a la cobertura específica de modelos.

Use estas variantes según la etapa de la versión:

```bash
# Validar el SHA de código con el producto completo.
pnpm ci:full-release \
  --sha <code-sha> \
  --target-ref release/YYYY.M.PATCH

# Validar el SHA de versión solo con el registro de cambios reutilizando la evidencia del producto del SHA de código.
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH

# Después de publicar una beta, añadir el E2E de Telegram del paquete publicado.
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH \
  -f release_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

No se debe usar el conjunto completo como primera repetición tras una corrección específica. Si falla una caja, se debe usar el flujo de trabajo secundario, el trabajo, el carril de Docker, el perfil de paquete, el proveedor de modelos o el carril de QA que haya fallado para la siguiente prueba. El conjunto completo solo se debe volver a ejecutar cuando la corrección haya cambiado la orquestación compartida de la versión o haya invalidado la evidencia anterior de todas las cajas. El verificador final del conjunto vuelve a comprobar los identificadores registrados de las ejecuciones de los flujos de trabajo secundarios, por lo que, después de repetir correctamente un flujo de trabajo secundario, solo se debe repetir el trabajo principal `Verify full validation` que haya fallado.

`rerun_group=all` puede reutilizar una ejecución correcta anterior del conjunto cuando coincidan el perfil de versión,
la configuración efectiva de prueba prolongada y las entradas de validación, y el SHA de destino
sea idéntico o el nuevo destino sea un descendiente cuyo conjunto completo de rutas modificadas
sea exactamente `CHANGELOG.md`. La reutilización del destino exacto registra
`exact-target-full-validation-v1`; el SHA de versión posterior a la validación registra
`changelog-only-release-v1`. Este último reutiliza únicamente la validación del producto. La comprobación
preliminar de npm, los bytes del paquete, la procedencia de las notas de la versión y la aceptación
de instalación/actualización deben seguir ejecutándose con el SHA de versión. Cualquier cambio de
versión, fuente, contenido generado, dependencia, paquete o destino perteneciente al flujo de trabajo
requiere un nuevo SHA de código y una nueva validación completa. Las ejecuciones más recientes del conjunto para la misma referencia `release/*` y
el mismo grupo de repetición sustituyen automáticamente a las que estén en curso. Se debe pasar
`reuse_evidence=false` para forzar una nueva ejecución completa.

Para una recuperación acotada, se debe pasar `rerun_group` al conjunto. `all` es la ejecución real de la candidata a versión, `ci` ejecuta únicamente el flujo secundario normal de CI, `plugin-prerelease` ejecuta únicamente el flujo secundario de plugins exclusivo de la versión, `release-checks` ejecuta todas las cajas de versión y los grupos de versión más específicos son `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` y `npm-telegram`. Las repeticiones específicas `npm-telegram` requieren `release_package_spec` o `npm_telegram_package_spec`; las ejecuciones completas/totales usan el E2E canónico de Telegram del paquete dentro de Package Acceptance. Las repeticiones específicas entre sistemas operativos pueden añadir `cross_os_suite_filter=windows/packaged-upgrade` u otro filtro de sistema operativo/conjunto. Los fallos de las comprobaciones de versión de QA bloquean la validación normal de la versión, incluida la desviación obligatoria de herramientas dinámicas de OpenClaw en el nivel estándar. Las ejecuciones alfa de Tideclaw aún pueden tratar como consultivos los carriles de comprobación de versión que no estén relacionados con la seguridad del paquete. Con `release_profile=beta`, los conjuntos de proveedores en vivo `Run repo/live E2E validation` son consultivos (advertencias, no bloqueos); los perfiles estable y completo mantienen su carácter bloqueante. Cuando `live_suite_filter` solicita explícitamente un carril en vivo de QA sujeto a control, como Discord, WhatsApp o Slack, debe estar habilitada la variable de repositorio `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` correspondiente; de lo contrario, la captura de entradas falla en vez de omitir silenciosamente el carril.

### Vitest

La caja de Vitest es el flujo de trabajo secundario manual `CI`. La CI manual omite deliberadamente el ámbito de los cambios y fuerza el grafo normal de pruebas para la candidata a versión: fragmentos de Linux Node, fragmentos de plugins incluidos, fragmentos de contratos de plugins y canales, compatibilidad con Node 22, `check-*`, `check-additional-*`, comprobaciones rápidas de artefactos compilados, comprobaciones de documentación, Skills de Python, Windows, macOS e i18n de Control UI. Android se incluye cuando `Full Release Validation` ejecuta la caja porque el conjunto pasa `include_android=true`; la CI manual independiente requiere `include_android=true` para cubrir Android.

Esta caja se usa para responder «¿el árbol de fuentes superó el conjunto completo de pruebas normales?». No equivale a la validación del producto en la ruta de publicación. Evidencia que se debe conservar:

- resumen de `Full Release Validation` que muestre la URL de la ejecución de `CI` iniciada
- ejecución correcta de `CI` en el SHA de destino exacto
- nombres de fragmentos fallidos o lentos de los trabajos de CI al investigar regresiones
- artefactos de tiempos de Vitest, como `.artifacts/vitest-shard-timings.json`, cuando una ejecución requiera un análisis de rendimiento

La CI manual solo se debe ejecutar directamente cuando la versión necesite una CI normal determinista, pero no las cajas de Docker, QA Lab, ejecución en vivo, varios sistemas operativos o paquetes. Se debe usar el primer comando para la CI directa sin Android. Se debe añadir `include_android=true` cuando la CI directa de la candidata a versión deba cubrir Android:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

La caja de Docker reside en `OpenClaw Release Checks` mediante `openclaw-live-and-e2e-checks-reusable.yml`, además del flujo de trabajo `install-smoke` en modo de versión. Valida la candidata a versión mediante entornos Docker empaquetados, en lugar de usar únicamente pruebas en el nivel del código fuente.

La cobertura de Docker para versiones incluye:

- comprobación rápida de instalación completa con la comprobación lenta de instalación global de Bun habilitada
- preparación/reutilización de la imagen de comprobación rápida del Dockerfile raíz por SHA de destino, con los trabajos de comprobación rápida de QR, raíz/Gateway e instalador/Bun ejecutados como fragmentos independientes de comprobación de instalación
- carriles E2E del repositorio
- bloques de Docker de la ruta de versión: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, de `plugins-runtime-install-a` a `plugins-runtime-install-h` y `openwebui`
- cobertura de OpenWebUI en un ejecutor dedicado con disco de gran capacidad cuando se solicite
- carriles divididos de instalación/desinstalación de plugins incluidos, de `bundled-plugin-install-uninstall-0` a `bundled-plugin-install-uninstall-23`
- conjuntos de proveedores en vivo/E2E y cobertura de modelos en vivo de Docker cuando las comprobaciones de versión incluyan conjuntos en vivo

Se deben usar los artefactos de Docker antes de repetir la ejecución. El programador de la ruta de versión carga `.artifacts/docker-tests/` con registros de carriles, `summary.json`, `failures.json`, tiempos de las fases, el JSON del plan del programador y comandos de repetición. Para una recuperación específica, se debe usar `docker_lanes=<lane[,lane]>` en el flujo de trabajo reutilizable en vivo/E2E en lugar de repetir todos los bloques de la versión. Los comandos de repetición generados incluyen las entradas anteriores de `package_artifact_run_id` y de las imágenes Docker preparadas cuando están disponibles, de modo que un carril fallido pueda reutilizar el mismo archivo tar y las imágenes de GHCR.

### QA Lab

La caja de QA Lab también forma parte de `OpenClaw Release Checks`. Es la puerta de publicación para el comportamiento agéntico y en el nivel de canal, independiente de Vitest y de la mecánica de paquetes de Docker.

La cobertura de QA Lab para versiones incluye:

- carril de paridad simulado que compara el carril candidato de OpenAI con la referencia `anthropic/claude-opus-4-8` mediante el paquete de paridad agéntica
- perfil de versión del adaptador en vivo de Matrix mediante el entorno `qa-live-shared`
- carril de QA en vivo de Telegram mediante concesiones de credenciales de Convex CI
- `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`, `pnpm qa:prometheus:smoke` o `pnpm qa:observability:smoke` cuando la telemetría de la versión necesite pruebas locales explícitas

Esta caja se usa para responder «¿la versión se comporta correctamente en los escenarios de QA y los flujos de canales en vivo?». Al aprobar la versión, se deben conservar las URL de los artefactos de los carriles de paridad, Matrix y Telegram. La cobertura completa de Matrix sigue disponible como ejecución manual fragmentada de QA Lab, en lugar de ser el carril crítico predeterminado para la versión.

### Paquete

La caja de paquetes es la puerta del producto instalable. Está respaldada por `Package Acceptance` y el solucionador `scripts/resolve-openclaw-package-candidate.mjs`. El solucionador normaliza una candidata en el archivo tar `package-under-test` consumido por Docker E2E, valida el inventario del paquete, registra la versión y el SHA-256 del paquete, y mantiene la referencia del entorno del flujo de trabajo separada de la referencia de origen del paquete.

Fuentes de candidatas admitidas:

- `source=npm`: `openclaw@beta`, `openclaw@latest` o una versión de publicación exacta de OpenClaw
- `source=ref`: empaquetar una rama, etiqueta o SHA de confirmación completo de confianza `package_ref` con el entorno `workflow_ref` seleccionado
- `source=url`: descargar un `.tgz` HTTPS público con el `package_sha256` requerido; se rechazan las credenciales en URL, los puertos HTTPS no predeterminados, los nombres de host o direcciones resueltas privados/internos/de uso especial y las redirecciones inseguras
- `source=trusted-url`: descargar un `.tgz` HTTPS con los valores requeridos `package_sha256` y `trusted_source_id` de una política con nombre en `.github/package-trusted-sources.json`; se debe usar para espejos empresariales mantenidos por el equipo o repositorios de paquetes privados, en lugar de añadir a `source=url` una omisión de red privada en el nivel de entrada
- `source=artifact`: reutilizar un `.tgz` cargado por otra ejecución de GitHub Actions

`OpenClaw Release Checks` ejecuta Package Acceptance con `source=artifact`, el artefacto del paquete de versión preparado, `suite_profile=custom`, `docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape`, `telegram_mode=mock-openai`. Package Acceptance mantiene la migración, la actualización, la actualización de VPS gestionado desde la raíz, el reinicio tras una actualización con autenticación configurada, la instalación en vivo de Skills de ClawHub, la limpieza de dependencias obsoletas de plugins, los accesorios de plugins sin conexión, la actualización de plugins, el refuerzo contra escapes en la vinculación de comandos de plugins y la QA del paquete de Telegram con el mismo archivo tar resuelto. Las comprobaciones bloqueantes de la versión usan como referencia predeterminada el paquete publicado más reciente; el perfil beta con `run_release_soak=true`, `release_profile=stable` o `release_profile=full` amplía el recorrido de supervivencia a actualizaciones publicadas a `last-stable-4` más las referencias fijadas `2026.4.23`, `2026.5.2` y `2026.4.15` con escenarios `reported-issues`. Se debe usar Package Acceptance con `source=npm` para una candidata ya publicada, `source=ref` para un archivo tar local de npm respaldado por un SHA antes de la publicación, `source=trusted-url` para un espejo empresarial/privado mantenido por el equipo o `source=artifact` para un archivo tar preparado y cargado por otra ejecución de GitHub Actions.

Es el sustituto nativo de GitHub para la mayor parte de la cobertura de paquetes/actualizaciones que antes requería Parallels. Las comprobaciones de versiones entre sistemas operativos siguen siendo importantes para la incorporación, el instalador y el comportamiento específico de cada plataforma, pero la validación del producto para paquetes/actualizaciones debe preferir Package Acceptance.

La lista de comprobación canónica para validar actualizaciones y plugins es [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins). Se debe usar al decidir qué carril local, de Docker, Package Acceptance o de comprobación de versión demuestra un cambio de instalación/actualización de plugins, de limpieza de doctor o de migración de un paquete publicado. La migración exhaustiva de actualizaciones publicadas desde cada paquete estable `2026.4.23+` es un flujo de trabajo manual independiente `Update Migration`, no forma parte de la CI completa de versiones.

La tolerancia heredada de Package Acceptance está limitada deliberadamente en el tiempo. Los paquetes hasta `2026.4.25` pueden usar la ruta de compatibilidad para carencias de metadatos ya publicadas en npm: entradas privadas del inventario de QA ausentes del archivo tar, ausencia de `gateway install --wrapper`, archivos de parche ausentes en el accesorio de git derivado del archivo tar, ausencia del valor persistido `update.channel`, ubicaciones heredadas de los registros de instalación de plugins, ausencia de persistencia de los registros de instalación del mercado y migración de metadatos de configuración durante `plugins update`. El paquete publicado `2026.4.26` puede advertir sobre archivos locales de sello de metadatos de compilación que ya se hayan distribuido. Los paquetes posteriores deben satisfacer los contratos modernos de paquetes; esas mismas carencias provocan el fallo de la validación de la versión.

Se deben usar perfiles más amplios de Package Acceptance cuando la cuestión de la versión se refiera a un paquete instalable real:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

Perfiles de paquete habituales:

- `smoke`: vías rápidas de instalación de paquetes/canales/agentes, red del Gateway y recarga de configuración
- `package`: contratos de instalación/actualización/reinicio/paquetes de plugins, además de prueba en vivo de instalación de Skills de ClawHub; esta es la opción predeterminada para la comprobación de versiones
- `product`: `package` más canales MCP, limpieza de cron/subagentes, búsqueda web de OpenAI y OpenWebUI
- `full`: segmentos de la ruta de publicación de Docker con OpenWebUI
- `custom`: lista exacta de `docker_lanes` para repeticiones de ejecución específicas

Para la prueba de Telegram del paquete candidato, habilite `telegram_mode=mock-openai` o `telegram_mode=live-frontier` en Package Acceptance. El flujo de trabajo pasa el tarball `package-under-test` resuelto a la vía de Telegram; el flujo de trabajo independiente de Telegram sigue aceptando una especificación npm publicada para las comprobaciones posteriores a la publicación.

## Automatización habitual de publicación de versiones

Para la publicación beta, `latest`, de plugins, de GitHub Release y de plataformas,
`OpenClaw Release Publish` es el punto de entrada habitual que realiza modificaciones. La ruta mensual
`.33+` de estabilidad extendida solo para npm no utiliza este orquestador. El
flujo de trabajo habitual orquesta los flujos de trabajo de publicación de confianza en el orden que
requiere la versión:

1. Extraer la etiqueta de la versión y resolver el SHA de su commit.
2. Verificar que se pueda llegar a la etiqueta desde `main` o `release/*` (o desde una rama alfa de Tideclaw para versiones preliminares alfa).
3. Ejecutar `pnpm plugins:sync:check`.
4. Iniciar `Plugin NPM Release` con `publish_scope=all-publishable` y `ref=<release-sha>`.
5. Iniciar `Plugin ClawHub Release` con el mismo ámbito y SHA.
6. Iniciar `OpenClaw NPM Release` con la etiqueta de versión, la etiqueta de distribución de npm y el `preflight_run_id` guardado después de verificar el `full_release_validation_run_id` guardado y el intento de ejecución exacto.
7. Para versiones estables, crear o actualizar la versión de GitHub como borrador, iniciar `Windows Node Release` con el `windows_node_tag` explícito y el `windows_node_installer_digests` aprobado para el candidato, y verificar los recursos canónicos del instalador de Windows y sus sumas de comprobación. Iniciar también `Android Release` para compilar el APK firmado de la etiqueta exacta junto con su suma de comprobación y procedencia. Verificar ambos contratos de recursos nativos antes de publicar el borrador.

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

Publicación estable con la etiqueta de distribución beta predeterminada:

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

Utilice los flujos de trabajo de nivel inferior `Plugin NPM Release` y `Plugin ClawHub Release` únicamente para trabajos específicos de reparación o republicación. `OpenClaw Release Publish` rechaza `plugin_publish_scope=selected` cuando `publish_openclaw_npm=true`, de modo que el paquete principal no pueda publicarse sin todos los plugins oficiales publicables, incluido `@openclaw/diffs-language-pack`. Para reparar un plugin seleccionado, establezca `publish_openclaw_npm=false` con `plugin_publish_scope=selected` y `plugins=@openclaw/name`, o inicie directamente el flujo de trabajo secundario.

La inicialización de ClawHub en la primera publicación es la excepción: inicie `Plugin ClawHub New`
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

La validación previa al etiquetado requiere `dry_run=true`, rechaza las entradas de la etiqueta de versión y de la ejecución
principal, y solo acepta un destino exacto accesible desde `main` o `release/*`.
No carga credenciales de ClawHub, publica bytes de paquetes ni modifica la configuración
del publicador de confianza. El flujo de trabajo sigue resolviendo el plan del registro en vivo,
extrae y empaqueta el destino únicamente en un trabajo sin secretos, materializa la
cadena de herramientas bloqueada de ClawHub y valida el artefacto inmutable y el
slug/identidad del paquete antes de que exista la etiqueta de versión. Apruebe el
entorno `clawhub-plugin-bootstrap` únicamente después de que finalicen los trabajos de empaquetado sin secretos;
este trabajo de validación protegido no tiene credenciales ni comandos de modificación.

Una ejecución de prueba aprobada o una inicialización real después del etiquetado debe incluir la
etiqueta de versión exacta, además del identificador, el intento y la rama de la ejecución principal `OpenClaw Release Publish`.
La ejecución principal certifica el SHA de su propio flujo de trabajo y un SHA exacto de confianza
`main` independiente para `Plugin ClawHub New`; la ejecución secundaria y cada aprobación
del entorno protegido deben coincidir con ese SHA secundario aprobado. La etiqueta de versión se
vuelve a comprobar antes de cada intento de publicación y modificación del publicador de confianza.

El trabajo de empaquetado
carga un artefacto inmutable cuyo nombre, identificador/resumen del artefacto de Actions,
ejecución/intento productor, SHA de destino y SHA-256/tamaño del tarball de cada paquete se
transmiten a los trabajos de validación y protegidos. El trabajo protegido extrae únicamente las herramientas
`main` de confianza, valida la tupla del artefacto mediante la API de GitHub, descarga
por el identificador exacto del artefacto, vuelve a calcular el hash de cada tarball y valida las rutas TAR locales y la
identidad del paquete con las reglas de canonicalización USTAR de la CLI fijada. Cada
candidato supera después la ejecución de prueba de publicación de la CLI fijada, que regresa antes
de consultar el registro o realizar la autenticación. El prefiltro del trabajo con credenciales limita los ClawPacks comprimidos
a 120 MiB, la carga total de archivos a 50 MiB, los datos TAR expandidos a 64 MiB y
el número de entradas TAR a 10,000. La reparación del publicador de confianza para paquetes existentes sigue
siendo solo de configuración, pero aun así empaqueta el destino y requiere la etiqueta solicitada
junto con la igualdad exacta de bytes y metadatos del registro antes de modificar la configuración
del publicador de confianza. La verificación posterior a la publicación descarga el artefacto de ClawHub y
exige el mismo SHA-256 y tamaño. Una recuperación mediante la repetición de trabajos fallidos puede reutilizar el
artefacto del paquete de un intento anterior únicamente cuando el trabajo productor exacto haya finalizado
correctamente. La evidencia final también vincula la versión bloqueada de ClawHub, el SHA-256 del archivo de bloqueo
y la integridad de npm. Una discrepancia requiere una nueva versión del paquete.

## Entradas del flujo de trabajo de NPM

`OpenClaw NPM Release` acepta estas entradas controladas por el operador:

- `tag`: etiqueta de versión obligatoria, como `v2026.4.2`, `v2026.4.2-1`, `v2026.4.2-beta.1` o `v2026.4.2-alpha.1`; cuando `preflight_only=true`, también puede ser el SHA completo de 40 caracteres del commit actual de la rama del flujo de trabajo para una comprobación preliminar exclusivamente de validación
- `preflight_only`: `true` solo para validación/compilación/empaquetado, `false` para la ruta de publicación real
- `preflight_run_id`: identificador de una ejecución preliminar correcta existente, obligatorio en la ruta de publicación real para que el flujo de trabajo reutilice el tarball preparado en lugar de volver a compilarlo
- `full_release_validation_run_id`: identificador de una ejecución correcta de `Full Release Validation` para esta etiqueta/SHA, obligatorio para la publicación real. Las publicaciones beta pueden continuar únicamente con la comprobación preliminar y una advertencia, pero la promoción estable/`latest` sigue requiriéndolo.
- `full_release_validation_run_attempt`: intento de ejecución positivo exacto asociado con `full_release_validation_run_id`; obligatorio siempre que se proporcione el identificador de ejecución para que las repeticiones no puedan cambiar la evidencia de autorización durante la publicación.
- `release_publish_run_id`: identificador aprobado de la ejecución `OpenClaw Release Publish`; obligatorio cuando este flujo de trabajo lo inicia ese proceso principal (llamadas de publicación real del actor bot)
- `plugin_npm_run_id`: identificador de una ejecución correcta de cabecera exacta de `Plugin NPM Release`; obligatorio para una publicación principal real de `extended-stable`
- `npm_dist_tag`: etiqueta de destino de npm para la ruta de publicación; acepta `alpha`, `beta`, `latest` o `extended-stable` y su valor predeterminado es `beta`. El parche final `33` y posteriores deben utilizar `extended-stable`; de forma predeterminada, `extended-stable` rechaza los parches anteriores y siempre rechaza las etiquetas no finales.
- `bypass_extended_stable_guard`: booleano exclusivo para pruebas, valor predeterminado `false`; con `npm_dist_tag=extended-stable`, omite los requisitos mensuales de estabilidad extendida mientras mantiene las comprobaciones de identidad de la versión, artefacto, aprobación y lectura posterior.

`Plugin NPM Release` acepta `npm_dist_tag=default` para el comportamiento de versiones
existente o `npm_dist_tag=extended-stable` para la ruta mensual protegida. La
opción de estabilidad extendida requiere `publish_scope=all-publishable`, una entrada
`plugins` vacía, un parche final igual o superior a `33` y la rama
canónica `extended-stable/YYYY.M.33` en su extremo exacto. Nunca desplaza los plugins
`latest` ni `beta`. Las nuevas versiones de paquetes reciben `extended-stable` atómicamente
mediante una publicación de confianza con OIDC (`npm publish --tag extended-stable`); este
flujo de trabajo de origen no utiliza `npm dist-tag add` autenticado mediante token. Los reintentos
omiten las versiones exactas que ya están presentes en npm y después fallan de forma cerrada salvo que una
lectura posterior completa confirme que todos los paquetes exactos y la etiqueta `extended-stable` han convergido.

`OpenClaw Release Publish` acepta estas entradas controladas por el operador:

- `tag`: etiqueta de versión obligatoria; ya debe existir
- `preflight_run_id`: identificador de una ejecución preliminar correcta de `OpenClaw NPM Release`; obligatorio cuando `publish_openclaw_npm=true` o `plugin_publish_scope=all-publishable`
- `full_release_validation_run_id`: identificador de una ejecución correcta de `Full Release Validation`; obligatorio cuando `publish_openclaw_npm=true` o `plugin_publish_scope=all-publishable`
- `full_release_validation_run_attempt`: intento positivo exacto asociado con `full_release_validation_run_id`; obligatorio siempre que se proporcione el identificador de ejecución
- `windows_node_tag`: etiqueta de versión exacta de `openclaw/openclaw-windows-node` que no sea preliminar; obligatoria para la publicación estable de OpenClaw
- `windows_node_installer_digests`: mapa JSON compacto aprobado para el candidato que relaciona los nombres de los instaladores actuales de Windows con sus resúmenes `sha256:` fijados; obligatorio para la publicación estable de OpenClaw
- `npm_telegram_run_id`: identificador opcional de una ejecución correcta de `NPM Telegram Beta E2E` que se incluirá en la evidencia final de la versión
- `npm_dist_tag`: etiqueta de destino de npm para el paquete de OpenClaw, una de `alpha`, `beta` o `latest`
- `plugin_publish_scope`: su valor predeterminado es `all-publishable`; utilice `selected` únicamente para trabajos específicos de reparación exclusiva de plugins con `publish_openclaw_npm=false`
- `plugins`: nombres de paquetes `@openclaw/*` separados por comas cuando `plugin_publish_scope=selected`
- `publish_openclaw_npm`: su valor predeterminado es `true`; establezca `false` únicamente cuando utilice el flujo de trabajo como orquestador de reparaciones exclusivas de plugins
- `release_profile`: perfil de cobertura de la versión utilizado para los resúmenes de evidencia de la versión; su valor predeterminado es `from-validation`, que lo lee del manifiesto de validación, o se puede sustituir por `beta`, `stable` o `full`
- `wait_for_clawhub`: su valor predeterminado es `false` para que la disponibilidad de npm no quede bloqueada por el proceso auxiliar de ClawHub; establezca `true` únicamente cuando la finalización del flujo de trabajo deba incluir la finalización de ClawHub

`OpenClaw Release Checks` acepta estas entradas controladas por el operador:

- `ref`: rama, etiqueta o SHA completo del commit que se va a validar. Las comprobaciones que utilizan secretos requieren que el commit resuelto sea accesible desde una rama o etiqueta de versión de OpenClaw.
- `run_release_soak`: habilita las comprobaciones exhaustivas en vivo/E2E, la ruta de lanzamiento de Docker y la prueba prolongada de supervivencia a actualizaciones desde todas las versiones anteriores para las comprobaciones de versiones beta. Se activa obligatoriamente mediante `release_profile=stable` y `release_profile=full`.

Reglas:

- Las versiones finales y de corrección normales inferiores al parche `33` pueden publicarse en `beta` o `latest`. Las versiones finales con el parche `33` o superior deben publicarse en `extended-stable`, y se rechazan las versiones con sufijo de corrección en ese límite.
- Las etiquetas de prelanzamiento beta solo pueden publicarse en `beta`; las etiquetas de prelanzamiento alfa solo pueden publicarse en `alpha`
- Para `OpenClaw NPM Release`, solo se permite introducir el SHA completo del commit cuando `preflight_only=true`
- `OpenClaw Release Checks` y `Full Release Validation` son siempre exclusivamente para validación
- La ruta de publicación real debe usar el mismo `npm_dist_tag` utilizado durante la comprobación preliminar; el flujo de trabajo verifica esos metadatos antes de continuar con la publicación

## Secuencia habitual de lanzamiento beta/estable más reciente

Esta secuencia heredada corresponde al lanzamiento orquestado habitual, que también abarca los plugins, GitHub Release, Windows y el trabajo en otras plataformas. No corresponde a la ruta mensual de versión estable extendida `.33+` exclusiva de npm documentada al principio de esta página.

Al preparar un lanzamiento estable orquestado habitual:

1. Ejecute `OpenClaw NPM Release` con `preflight_only=true`. Antes de que exista una etiqueta, puede utilizar el SHA del commit actual de la rama del flujo de trabajo completo para una ejecución de prueba exclusivamente de validación del flujo de trabajo de comprobación preliminar.
2. Elija `npm_dist_tag=beta` para el flujo normal que comienza con la beta, o `latest` únicamente cuando desee publicar intencionadamente una versión estable de forma directa.
3. Ejecute `Full Release Validation` en la rama de lanzamiento, la etiqueta de versión o el SHA completo del commit cuando desee obtener la CI normal junto con cobertura en vivo de la caché de prompts, Docker, QA Lab, Matrix y Telegram desde un único flujo de trabajo manual. Si intencionadamente solo necesita el grafo determinista de pruebas normales, ejecute en su lugar el flujo de trabajo manual `CI` en la referencia de lanzamiento.
4. Seleccione la etiqueta de versión `openclaw/openclaw-windows-node` exacta que no sea de prelanzamiento y cuyos instaladores firmados para x64 y ARM64 deban distribuirse. Guárdela como `windows_node_tag` y guarde el mapa de resúmenes validado de esos instaladores como `windows_node_installer_digests`. El asistente de la versión candidata registra ambos valores y los incluye en el comando de publicación que genera.
5. Guarde los valores correctos de `preflight_run_id`, `full_release_validation_run_id` y el valor exacto de `full_release_validation_run_attempt`.
6. Ejecute `OpenClaw Release Publish` desde el entorno de confianza `main` con el mismo `tag`, el mismo `npm_dist_tag`, el valor seleccionado de `windows_node_tag`, su valor guardado de `windows_node_installer_digests`, los valores guardados de `preflight_run_id`, `full_release_validation_run_id` y `full_release_validation_run_attempt`. Publica los plugins externalizados en npm y ClawHub antes de promocionar el paquete npm de OpenClaw.
7. Si la versión se publicó en `beta`, utilice el flujo de trabajo `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` para promocionar esa versión estable de `beta` a `latest`.
8. Si la versión se publicó intencionadamente de forma directa en `latest` y `beta` debe adoptar inmediatamente la misma compilación estable, utilice ese mismo flujo de trabajo de lanzamiento para hacer que ambas etiquetas de distribución apunten a la versión estable, o permita que su sincronización programada de autorreparación traslade `beta` más adelante.

La modificación de las etiquetas de distribución reside en el repositorio del registro de lanzamientos porque sigue requiriendo `NPM_TOKEN`, mientras que el repositorio de código fuente mantiene la publicación exclusivamente mediante OIDC. De este modo, tanto la ruta de publicación directa como la ruta de promoción que comienza con la beta quedan documentadas y visibles para los operadores.

Si un mantenedor debe recurrir a la autenticación local de npm, debe ejecutar cualquier comando de la CLI de 1Password (`op`) únicamente dentro de una sesión de tmux dedicada. No invoque `op` directamente desde el shell principal del agente; mantenerlo dentro de tmux permite observar los mensajes, las alertas y la gestión de OTP, y evita alertas repetidas del host.

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

Los mantenedores utilizan la documentación privada de lanzamientos de [`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md) como manual operativo real.

## Contenido relacionado

- [Canales de lanzamiento](/es/install/development-channels)
