---
read_when:
    - Revisión de cargas para detectar abusos o infracciones de las políticas
    - Redacción de documentación de moderación o guías operativas para revisores
    - Decidir si una Skill debe ocultarse o si se debe bloquear a un usuario
sidebarTitle: Acceptable Usage
summary: 'Política del marketplace: qué permite ClawHub y qué contenido no alojará.'
title: Uso aceptable
x-i18n:
    generated_at: "2026-07-11T22:53:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Uso aceptable

ClawHub aloja Skills, plugins, paquetes y metadatos del mercado para OpenClaw.
Utiliza esta página para determinar si el contenido o el comportamiento de publicación corresponden a
ClawHub.

Estas reglas se aplican a lo que hace una publicación, a lo que pide ejecutar a los usuarios, a cómo
se presenta y a cómo los editores utilizan las superficies de descubrimiento, instalación y
confianza de ClawHub. Para conocer los estados de moderación y la situación de las cuentas, consulta
[Moderación y seguridad de las cuentas](/clawhub/moderation). Para reclamaciones de derechos de autor u otros derechos,
consulta [Solicitudes sobre derechos de contenido](/clawhub/content-rights).

## Contenido permitido

ClawHub acepta contenido útil, comprensible y publicado de
buena fe.

| Categoría                                         | Permitido cuando                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Productividad de los desarrolladores                           | La publicación ayuda a los usuarios a crear, probar, migrar, depurar, documentar u operar software.                                               |
| Flujos de trabajo de interfaz de usuario, datos y automatización               | El alcance es claro, las credenciales necesarias se indican explícitamente y las acciones de riesgo incluyen procesos de revisión, simulación, vista previa o confirmación. |
| Seguridad defensiva, moderación y revisión de abusos | La herramienta está planteada para revisiones autorizadas, conserva las pruebas y mantiene claros los límites de aprobación humana.                          |
| Flujos de trabajo personales o de equipo                       | El flujo de trabajo utiliza cuentas basadas en el consentimiento, una configuración transparente y permisos explícitos.                                            |
| Catálogos mantenidos                              | Cada publicación es distinta, útil, está descrita con precisión y recibe un mantenimiento razonable.                                                |

El contexto importa. Un mismo tema puede ser aceptable en un entorno defensivo limitado o
basado en el consentimiento e inaceptable cuando se presenta como un flujo de trabajo abusivo.

## Contenido no permitido

ClawHub no aloja contenido cuyo propósito principal sea el abuso, el engaño, la ejecución
insegura o la infracción de derechos.

| Categoría                                                    | No permitido                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Acceso no autorizado o elusión de la seguridad                      | Elusión de la autenticación, apropiación de cuentas, abuso de límites de frecuencia, apropiación de llamadas en directo o de agentes, robo de sesiones reutilizables o aprobación automática de procesos de vinculación para usuarios no autorizados.                                                                                                                                                   |
| Abuso de plataformas y evasión de prohibiciones                              | Cuentas encubiertas tras una prohibición, preparación o explotación masiva de cuentas, interacciones falsas, automatización de varias cuentas, publicaciones masivas, bots de spam o automatizaciones diseñadas para evitar la detección.                                                                                                                                          |
| Fraude, estafas y flujos de trabajo financieros engañosos             | Certificados o facturas falsos, flujos de pago engañosos, campañas de estafa, pruebas sociales falsas, flujos de trabajo con identidades sintéticas para cometer fraude o herramientas para gastar o efectuar cargos sin una aprobación humana clara.                                                                                                                    |
| Enriquecimiento de datos invasivo para la privacidad o vigilancia                 | Extracción de contactos para spam, divulgación de datos personales, acoso, extracción de clientes potenciales acompañada de contactos no solicitados, supervisión encubierta, comparación biométrica sin consentimiento o uso de datos filtrados o volcados de brechas de seguridad.                                                                                                                  |
| Suplantación sin consentimiento o manipulación de identidades       | Intercambio de rostros, gemelos digitales, influencers clonados, personajes falsos u otras herramientas utilizadas para suplantar o engañar.                                                                                                                                                                                                 |
| Contenido sexual explícito o generación para adultos con medidas de seguridad desactivadas | Generación de imágenes, vídeos o contenido NSFW; envoltorios de contenido para adultos en torno a API de terceros; o publicaciones cuyo propósito principal sea el contenido sexual explícito.                                                                                                                                                       |
| Requisitos de ejecución ocultos, inseguros o engañosos        | Comandos de instalación ofuscados, instaladores que canalizan contenido directamente al intérprete de comandos, como contenido descargado que se ejecuta con `sh` o `bash` sin permitir una revisión clara, requisitos no declarados de secretos o claves privadas, ejecución remota de `npx @latest` sin permitir una revisión clara o metadatos que ocultan lo que realmente necesita la publicación para ejecutarse. |
| Material que infringe derechos de autor u otros derechos           | Republicar Skills, plugins, documentación, recursos de marca o código propietario de otra persona sin permiso; infringir los términos de una licencia; o suplantar al autor o editor original.                                                                                                                            |

## Comportamiento no permitido en el mercado

ClawHub también revisa cómo utilizan los editores el mercado. No utilices ClawHub para
manipular el descubrimiento, las métricas, las señales de confianza, los sistemas de moderación ni la
atención de los usuarios.

El comportamiento no permitido en el mercado incluye:

- publicar en masa grandes cantidades de publicaciones de baja calidad, duplicadas, provisionales o
  generadas automáticamente que no parezcan aportar valor real a los usuarios
- saturar las superficies de búsqueda o categorías con Skills o plugins casi idénticos
- publicar cientos de publicaciones con poco o ningún uso, mantenimiento, claridad sobre el código fuente
  o diferenciación significativa
- inflar artificialmente las instalaciones, descargas, estrellas u otras métricas de
  interacción mediante automatización, bucles de autoinstalación, cuentas falsas, actividad
  coordinada, interacción pagada u otros comportamientos no orgánicos
- crear o rotar cuentas para eludir la moderación, las prohibiciones, los límites de los editores o la
  revisión del mercado
- engañar a los usuarios sobre la propiedad, el origen, las capacidades, la postura de seguridad,
  los requisitos de instalación o la afiliación con otro proyecto o editor
- subir repetidamente contenido que ya se haya ocultado, eliminado o bloqueado
  sin corregir el problema subyacente

La publicación de grandes volúmenes no constituye automáticamente un abuso. Los catálogos grandes son aceptables
cuando las publicaciones son significativamente diferentes, están descritas con precisión, reciben mantenimiento
y las utilizan usuarios reales. Los catálogos grandes se convierten en un problema de confianza y seguridad cuando
el volumen se combina con publicaciones superficiales, duplicadas, engañosas, sin mantenimiento o
promocionadas artificialmente.

## Derechos sobre el contenido

Si consideras que algún contenido de ClawHub infringe tus derechos de autor u otros derechos, utiliza
[Solicitudes sobre derechos de contenido](/clawhub/content-rights). No utilices los informes normales del mercado
para reclamaciones de derechos de autor u otros derechos, a menos que la publicación también sea insegura,
maliciosa o engañosa.

## Revisión y aplicación

ClawHub puede utilizar comprobaciones automatizadas, señales estadísticas de abuso, informes de usuarios y
revisiones del personal para identificar contenido inseguro o comportamientos de publicación abusivos. Una señal
no demuestra por sí sola que haya abuso; ayuda a ClawHub a decidir qué necesita una revisión.

Podemos:

- ocultar, retener, eliminar, realizar una eliminación reversible o, cuando el tipo de recurso lo permita,
  eliminar permanentemente las publicaciones infractoras
- bloquear descargas o instalaciones de versiones inseguras
- revocar tokens de API
- realizar una eliminación reversible del contenido asociado
- restringir el acceso de publicación
- prohibir el acceso a infractores reincidentes o graves

No garantizamos que se emita una advertencia antes de aplicar medidas ante abusos evidentes. Consulta
[Moderación y seguridad de las cuentas](/clawhub/moderation) para obtener información sobre denuncias, retenciones de moderación,
publicaciones ocultas, prohibiciones y situación de las cuentas.
