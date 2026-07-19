---
read_when:
    - Revisión de cargas para detectar abusos o infracciones de las políticas
    - Redacción de documentación de moderación o manuales operativos para revisores
    - Decidir si una skill debe ocultarse o si se debe vetar a un usuario
sidebarTitle: Acceptable Usage
summary: 'Política del marketplace: qué permite ClawHub y qué no alojará.'
title: Uso aceptable
x-i18n:
    generated_at: "2026-07-19T01:48:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Uso aceptable

ClawHub aloja Skills, plugins, paquetes y metadatos del mercado para OpenClaw.
Esta página permite determinar si el contenido o el comportamiento de publicación corresponde a
ClawHub.

Estas reglas se aplican a lo que hace una publicación, a lo que pide ejecutar a los usuarios, a cómo
se presenta y a cómo los publicadores utilizan las funciones de descubrimiento, instalación y
confianza de ClawHub. Para consultar los estados de moderación y la situación de las cuentas, véase
[Moderación y seguridad de las cuentas](/es/clawhub/moderation). Para reclamaciones de derechos de autor u otros derechos,
véase [Solicitudes sobre derechos de contenido](/es/clawhub/content-rights).

## Contenido permitido

ClawHub admite contenido que sea útil, comprensible y publicado de
buena fe.

| Categoría                                         | Permitido cuando                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Productividad de los desarrolladores                           | La publicación ayuda a los usuarios a crear, probar, migrar, depurar, documentar u operar software.                                               |
| Flujos de trabajo de interfaz de usuario, datos y automatización               | El alcance está claro, las credenciales necesarias se indican explícitamente y las acciones arriesgadas incluyen mecanismos de revisión, simulación, vista previa o confirmación. |
| Seguridad defensiva, moderación y revisión de abusos | La herramienta se presenta para revisiones autorizadas, conserva las pruebas y mantiene claros los límites de aprobación humana.                          |
| Flujos de trabajo personales o de equipos                       | El flujo de trabajo utiliza cuentas basadas en el consentimiento, una configuración transparente y permisos explícitos.                                            |
| Catálogos mantenidos                              | Cada publicación es distinta, útil, está descrita con precisión y recibe un mantenimiento razonable.                                                |

El contexto importa. Un mismo tema puede ser aceptable en un entorno defensivo limitado o
basado en el consentimiento e inaceptable cuando se presenta como un flujo de trabajo abusivo.

## Contenido no permitido

ClawHub no aloja contenido cuyo propósito principal sea el abuso, el engaño, la ejecución
insegura o la vulneración de derechos.

| Categoría                                                    | No permitido                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Acceso no autorizado o elusión de la seguridad                      | Elusión de la autenticación, toma de control de cuentas, abuso de límites de frecuencia, toma de control de llamadas en curso o agentes, robo de sesiones reutilizables o aprobación automática de flujos de emparejamiento para usuarios no autorizados.                                                                                                                                                   |
| Abuso de plataformas y evasión de bloqueos                              | Cuentas encubiertas tras bloqueos, preparación o cultivo de cuentas, interacción falsa, automatización de varias cuentas, publicaciones masivas, bots de spam o automatización diseñada para evitar la detección.                                                                                                                                          |
| Fraude, estafas y flujos de trabajo financieros engañosos             | Certificados o facturas falsos, flujos de pago engañosos, captación para estafas, pruebas sociales falsas, flujos de trabajo con identidades sintéticas destinados al fraude o herramientas para gastar o efectuar cargos sin una aprobación humana clara.                                                                                                                    |
| Enriquecimiento invasivo de la privacidad o vigilancia                 | Recopilación de contactos para spam, divulgación de datos personales, acoso, extracción de clientes potenciales combinada con contactos no solicitados, supervisión encubierta, cotejo biométrico sin consentimiento o uso de datos filtrados o volcados de brechas de seguridad.                                                                                                                  |
| Suplantación o manipulación de identidades sin consentimiento       | Intercambio de rostros, gemelos digitales, influencers clonados, identidades falsas u otras herramientas utilizadas para suplantar o engañar.                                                                                                                                                                                                 |
| Contenido sexual explícito o generación de contenido para adultos con las medidas de seguridad desactivadas | Generación de imágenes, vídeos o contenido NSFW; envoltorios de contenido para adultos sobre API de terceros; o publicaciones cuyo propósito principal sea el contenido sexual explícito.                                                                                                                                                       |
| Requisitos de ejecución ocultos, inseguros o engañosos        | Comandos de instalación ofuscados, instaladores que canalizan contenido al intérprete de comandos, como contenido descargado que se ejecuta con `sh` o `bash` sin que pueda revisarse claramente, requisitos no declarados de secretos o claves privadas, ejecución remota de `npx @latest` sin que pueda revisarse claramente o metadatos que ocultan lo que la publicación necesita realmente para ejecutarse. |
| Material que infringe derechos de autor u otros derechos           | Volver a publicar Skills, plugins, documentación, recursos de marca o código propietario de otra persona sin permiso; infringir los términos de la licencia; o suplantar al autor o publicador original.                                                                                                                            |

## Comportamiento no permitido en el mercado

ClawHub también revisa cómo utilizan el mercado los publicadores. No se debe utilizar ClawHub para
manipular el descubrimiento, las métricas, los indicadores de confianza, los sistemas de moderación ni la
atención de los usuarios.

El comportamiento no permitido en el mercado incluye:

- publicar en masa grandes cantidades de publicaciones de poco esfuerzo, duplicadas, provisionales o
  generadas automáticamente que no parezcan tener un valor real para los usuarios
- saturar las superficies de búsqueda o categorías con Skills o plugins casi idénticos
- publicar cientos de publicaciones con poco o ningún uso, mantenimiento, claridad sobre el código fuente
  o diferenciación significativa
- inflar artificialmente las instalaciones, descargas, estrellas u otras métricas de
  interacción mediante automatización, ciclos de autoinstalación, cuentas falsas, actividad
  coordinada, interacción pagada u otros comportamientos no orgánicos
- crear o rotar cuentas para evadir la moderación, los bloqueos, los límites de los publicadores o la
  revisión del mercado
- engañar a los usuarios sobre la propiedad, el código fuente, las capacidades, la postura de seguridad,
  los requisitos de instalación o la afiliación con otro proyecto o publicador
- subir repetidamente contenido que ya se haya ocultado, eliminado o bloqueado
  sin corregir el problema subyacente

La publicación de grandes volúmenes no constituye abuso automáticamente. Los catálogos grandes son aceptables
cuando las publicaciones son significativamente distintas, están descritas con precisión, reciben mantenimiento
y las utilizan usuarios reales. Los catálogos grandes se convierten en un problema de confianza y seguridad cuando
el volumen se combina con publicaciones superficiales, duplicadas, engañosas, sin mantenimiento o
promocionadas artificialmente.

## Derechos sobre el contenido

Si se considera que un contenido de ClawHub infringe derechos de autor u otros derechos, debe utilizarse
[Solicitudes sobre derechos de contenido](/es/clawhub/content-rights). No se deben utilizar los informes normales del mercado
para reclamaciones de derechos de autor u otros derechos, salvo que la publicación también sea insegura,
maliciosa o engañosa.

## Revisión y medidas de cumplimiento

ClawHub puede utilizar comprobaciones automatizadas, indicadores estadísticos de abuso, informes de usuarios y
revisiones del personal para identificar contenido inseguro o comportamientos de publicación abusivos. Un indicador
no demuestra el abuso por sí solo; ayuda a ClawHub a decidir qué necesita revisión.

Podemos:

- ocultar, retener, eliminar, realizar una eliminación lógica o, cuando el tipo de recurso lo permita,
  eliminar definitivamente las publicaciones que infrinjan las reglas
- bloquear las descargas o instalaciones de versiones inseguras
- revocar tokens de API
- realizar una eliminación lógica del contenido asociado
- restringir el acceso a la publicación
- bloquear a los infractores reincidentes o graves

No se garantiza que se emita una advertencia antes de aplicar medidas en casos de abuso evidente. Véase
[Moderación y seguridad de las cuentas](/es/clawhub/moderation) para obtener información sobre informes, retenciones de moderación,
publicaciones ocultas, bloqueos y situación de las cuentas.
