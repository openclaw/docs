---
read_when:
    - Revisión de cargas para detectar abusos o infracciones de las políticas
    - Redacción de documentación de moderación o manuales operativos para revisores
    - Decidir si se debe ocultar una skill o bloquear a un usuario
sidebarTitle: Acceptable Usage
summary: 'Política del marketplace: qué permite ClawHub y qué no alojará.'
title: Uso aceptable
x-i18n:
    generated_at: "2026-07-12T21:22:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Uso aceptable

ClawHub aloja Skills, plugins, paquetes y metadatos del marketplace para OpenClaw.
Use esta página para decidir si un contenido o comportamiento de publicación corresponde a
ClawHub.

Estas reglas se aplican a lo que hace una publicación, lo que pide a los usuarios que ejecuten, cómo se
presenta y cómo los publicadores usan las funciones de descubrimiento, instalación y
confianza de ClawHub. Para consultar los estados de moderación y la situación de las cuentas, consulte
[Moderación y seguridad de las cuentas](/clawhub/moderation). Para reclamaciones de derechos de autor u otros derechos,
consulte [Solicitudes sobre derechos de contenido](/clawhub/content-rights).

## Contenido permitido

ClawHub acepta contenido que sea útil, comprensible y publicado de
buena fe.

| Categoría                                         | Permitido cuando                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Productividad de los desarrolladores                           | La publicación ayuda a los usuarios a crear, probar, migrar, depurar, documentar u operar software.                                               |
| Flujos de trabajo de interfaz de usuario, datos y automatización               | El alcance es claro, las credenciales necesarias se indican explícitamente y las acciones de riesgo incluyen procesos de revisión, simulación, vista previa o confirmación. |
| Seguridad defensiva, moderación y revisión de abusos | La herramienta se presenta como destinada a revisiones autorizadas, conserva las pruebas y mantiene claros los límites de aprobación humana.                          |
| Flujos de trabajo personales o de equipos                       | El flujo de trabajo utiliza cuentas basadas en el consentimiento, una configuración transparente y permisos explícitos.                                            |
| Catálogos mantenidos                              | Cada publicación es diferente, útil, se describe con precisión y recibe un mantenimiento razonable.                                                |

El contexto es importante. Un mismo tema puede ser aceptable en un entorno defensivo limitado o
basado en el consentimiento e inaceptable cuando se presenta como un flujo de trabajo para cometer abusos.

## Contenido no permitido

ClawHub no aloja contenido cuyo propósito principal sea el abuso, el engaño, la ejecución
insegura o la infracción de derechos.

| Categoría                                                    | No permitido                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Acceso no autorizado o elusión de la seguridad                      | Elusión de la autenticación, apropiación de cuentas, abuso de límites de frecuencia, apropiación de llamadas en directo o agentes, robo de sesiones reutilizables o aprobación automática de procesos de emparejamiento para usuarios no autorizados.                                                                                                                                                   |
| Abuso de plataformas y elusión de prohibiciones                              | Cuentas encubiertas después de una prohibición, preparación o cultivo de cuentas, interacciones falsas, automatización de múltiples cuentas, publicaciones masivas, bots de spam o automatizaciones diseñadas para evitar la detección.                                                                                                                                          |
| Fraude, estafas y flujos financieros engañosos             | Certificados o facturas falsos, flujos de pago engañosos, comunicaciones fraudulentas, pruebas sociales falsas, flujos de trabajo con identidades sintéticas para cometer fraude o herramientas de gasto o cobro sin una aprobación humana clara.                                                                                                                    |
| Enriquecimiento de datos invasivo para la privacidad o vigilancia                 | Extracción de contactos para enviar spam, divulgación de datos personales, acoso, extracción de clientes potenciales combinada con contactos no solicitados, supervisión encubierta, comparación biométrica sin consentimiento o uso de datos filtrados o volcados de filtraciones de seguridad.                                                                                                                  |
| Suplantación sin consentimiento o manipulación de identidades       | Intercambio de rostros, gemelos digitales, influencers clonados, identidades falsas u otras herramientas utilizadas para suplantar o engañar.                                                                                                                                                                                                 |
| Contenido sexual explícito o generación de contenido para adultos con las medidas de seguridad desactivadas | Generación de imágenes, vídeos o contenido NSFW; envoltorios de contenido para adultos sobre API de terceros; o publicaciones cuyo propósito principal sea el contenido sexual explícito.                                                                                                                                                       |
| Requisitos de ejecución ocultos, inseguros o engañosos        | Comandos de instalación ofuscados, instaladores que canalizan contenido al shell, como contenido descargado ejecutado con `sh` o `bash` sin posibilidad clara de revisión, requisitos no declarados de secretos o claves privadas, ejecución remota de `npx @latest` sin posibilidad clara de revisión o metadatos que oculten lo que realmente necesita la publicación para ejecutarse. |
| Material que infringe derechos de autor u otros derechos           | Volver a publicar las Skills, plugins, documentación, recursos de marca o código propietario de otra persona sin permiso; infringir los términos de licencia; o suplantar al autor o publicador original.                                                                                                                            |

## Comportamiento no permitido en el marketplace

ClawHub también revisa cómo usan los publicadores el marketplace. No use ClawHub para
manipular el descubrimiento, las métricas, las señales de confianza, los sistemas de moderación ni la
atención de los usuarios.

El comportamiento no permitido en el marketplace incluye:

- publicar en masa grandes cantidades de publicaciones de poco esfuerzo, duplicadas, provisionales o
  generadas automáticamente que no parezcan aportar valor real a los usuarios
- saturar las búsquedas o categorías con Skills o plugins casi
  idénticos
- publicar cientos de publicaciones con poco o ningún uso, mantenimiento, claridad sobre su origen
  o diferenciación significativa
- inflar artificialmente las instalaciones, descargas, estrellas u otras métricas de
  interacción mediante automatización, bucles de autoinstalación, cuentas falsas, actividad
  coordinada, interacciones pagadas u otros comportamientos no orgánicos
- crear o rotar cuentas para eludir la moderación, las prohibiciones, los límites de los publicadores o la
  revisión del marketplace
- engañar a los usuarios sobre la propiedad, el origen, las capacidades, la seguridad,
  los requisitos de instalación o la afiliación con otro proyecto o publicador
- cargar repetidamente contenido que ya se haya ocultado, eliminado o bloqueado
  sin solucionar el problema subyacente

La publicación de grandes volúmenes no constituye automáticamente un abuso. Los catálogos grandes son aceptables
cuando las publicaciones presentan diferencias significativas, se describen con precisión, reciben mantenimiento
y son utilizadas por usuarios reales. Los catálogos grandes se convierten en un problema de confianza y seguridad cuando
el volumen se combina con publicaciones superficiales, duplicadas, engañosas, sin mantenimiento o
promocionadas artificialmente.

## Derechos de contenido

Si considera que un contenido de ClawHub infringe sus derechos de autor u otros derechos, utilice
[Solicitudes sobre derechos de contenido](/clawhub/content-rights). No utilice los informes normales del marketplace
para reclamaciones de derechos de autor u otros derechos, salvo que la publicación también sea insegura,
maliciosa o engañosa.

## Revisión y aplicación de medidas

ClawHub puede utilizar comprobaciones automatizadas, señales estadísticas de abuso, informes de usuarios y
revisiones del personal para identificar contenido inseguro o comportamientos de publicación abusivos. Una señal
no demuestra por sí sola que exista abuso; ayuda a ClawHub a decidir qué debe revisarse.

Podemos:

- ocultar, retener, eliminar, realizar una eliminación lógica o, cuando el tipo de recurso lo permita,
  eliminar definitivamente las publicaciones infractoras
- bloquear las descargas o instalaciones de versiones inseguras
- revocar tokens de API
- realizar una eliminación lógica del contenido asociado
- restringir el acceso a la publicación
- prohibir el acceso a infractores reincidentes o graves

No garantizamos que se emita una advertencia antes de aplicar medidas ante abusos evidentes. Consulte
[Moderación y seguridad de las cuentas](/clawhub/moderation) para obtener información sobre denuncias, retenciones de moderación,
publicaciones ocultas, prohibiciones y situación de las cuentas.
