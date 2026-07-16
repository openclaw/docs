---
read_when:
    - Revisión de las cargas para detectar abusos o infracciones de las políticas
    - Redacción de documentación de moderación o guías operativas para revisores
    - Decidir si una skill debe ocultarse o si se debe bloquear a un usuario
sidebarTitle: Acceptable Usage
summary: 'Política del marketplace: qué permite ClawHub y qué no alojará.'
title: Uso aceptable
x-i18n:
    generated_at: "2026-07-16T11:23:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Uso aceptable

ClawHub aloja Skills, plugins, paquetes y metadatos del marketplace para OpenClaw.
Esta página permite determinar si un contenido o comportamiento de publicación
corresponde a ClawHub.

Estas reglas se aplican a lo que hace una publicación, lo que pide ejecutar a los usuarios, cómo
se presenta y cómo utilizan los editores las funciones de descubrimiento, instalación y
confianza de ClawHub. Para consultar los estados de moderación y la situación de las cuentas, véase
[Moderación y seguridad de las cuentas](/clawhub/moderation). Para reclamaciones de derechos de autor u otros derechos,
véase [Solicitudes sobre derechos de contenido](/clawhub/content-rights).

## Contenido permitido

ClawHub acepta contenido útil, comprensible y publicado de
buena fe.

| Categoría                                         | Permitido cuando                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Productividad de desarrollo                           | La publicación ayuda a crear, probar, migrar, depurar, documentar u operar software.                                               |
| Flujos de trabajo de interfaz de usuario, datos y automatización               | El alcance es claro, las credenciales necesarias se indican explícitamente y las acciones arriesgadas incluyen opciones de revisión, ejecución de prueba, vista previa o confirmación. |
| Seguridad defensiva, moderación y revisión de abusos | La herramienta se presenta para revisiones autorizadas, conserva las pruebas y mantiene claros los límites de aprobación humana.                          |
| Flujos de trabajo personales o de equipo                       | El flujo de trabajo utiliza cuentas basadas en el consentimiento, una configuración transparente y permisos explícitos.                                            |
| Catálogos mantenidos                              | Cada publicación es distinta, útil, se describe con precisión y recibe un mantenimiento razonable.                                                |

El contexto es importante. Un mismo tema puede ser aceptable en un entorno defensivo limitado o
basado en el consentimiento, e inaceptable cuando se ofrece como un flujo de trabajo para cometer abusos.

## Contenido no permitido

ClawHub no aloja contenido cuyo propósito principal sea el abuso, el engaño, la ejecución
insegura o la vulneración de derechos.

| Categoría                                                    | No permitido                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Acceso no autorizado o elusión de la seguridad                      | Elusión de la autenticación, apropiación de cuentas, abuso de límites de frecuencia, apropiación de llamadas en directo o agentes, robo de sesiones reutilizables o aprobación automática de procesos de vinculación para usuarios no autorizados.                                                                                                                                                   |
| Abuso de plataformas y evasión de bloqueos                              | Cuentas encubiertas tras un bloqueo, preparación o explotación masiva de cuentas, interacción falsa, automatización de varias cuentas, publicaciones masivas, bots de spam o automatizaciones creadas para evitar la detección.                                                                                                                                          |
| Fraude, estafas y flujos de trabajo financieros engañosos             | Certificados o facturas falsos, flujos de pago engañosos, campañas fraudulentas, pruebas sociales falsas, flujos de trabajo de identidades sintéticas para cometer fraudes o herramientas de gasto o cobro sin una aprobación humana clara.                                                                                                                    |
| Enriquecimiento de datos invasivo para la privacidad o vigilancia                 | Extracción de contactos para enviar spam, divulgación de datos personales, acoso, extracción de clientes potenciales combinada con comunicaciones no solicitadas, supervisión encubierta, cotejo biométrico sin consentimiento o uso de datos filtrados o volcados de filtraciones.                                                                                                                  |
| Suplantación no consentida o manipulación de la identidad       | Intercambio de rostros, gemelos digitales, influencers clonados, identidades falsas u otras herramientas utilizadas para suplantar o engañar.                                                                                                                                                                                                 |
| Contenido sexual explícito o generación para adultos con las medidas de seguridad desactivadas | Generación de imágenes, vídeos o contenido NSFW; envoltorios de contenido para adultos en torno a API de terceros; o publicaciones cuyo propósito principal sea el contenido sexual explícito.                                                                                                                                                       |
| Requisitos de ejecución ocultos, inseguros o engañosos        | Comandos de instalación ofuscados, instaladores que canalizan contenido al intérprete de comandos, como contenido descargado que se ejecuta con `sh` o `bash` sin que pueda revisarse claramente, requisitos no declarados de secretos o claves privadas, ejecución remota de `npx @latest` sin que pueda revisarse claramente o metadatos que ocultan lo que la publicación necesita realmente para ejecutarse. |
| Material que infringe derechos de autor u otros derechos           | Volver a publicar Skills, plugins, documentación, recursos de marca o código propietario de otra persona sin permiso; infringir los términos de la licencia; o suplantar al autor o editor original.                                                                                                                            |

## Comportamiento no permitido en el marketplace

ClawHub también revisa cómo utilizan los editores el marketplace. No se debe usar ClawHub para
manipular el descubrimiento, las métricas, las señales de confianza, los sistemas de moderación ni la
atención de los usuarios.

El comportamiento no permitido en el marketplace incluye:

- publicar masivamente grandes cantidades de publicaciones de baja calidad, duplicadas, provisionales o
  generadas automáticamente que no parezcan aportar un valor real a los usuarios
- saturar las búsquedas o las categorías con Skills o plugins casi idénticos
- publicar cientos de publicaciones con poco o ningún uso, mantenimiento, claridad sobre el código fuente
  o diferenciación significativa
- inflar artificialmente las instalaciones, descargas, estrellas u otras métricas de
  interacción mediante automatización, ciclos de autoinstalación, cuentas falsas, actividad
  coordinada, interacción pagada u otros comportamientos no orgánicos
- crear o rotar cuentas para eludir la moderación, los bloqueos, los límites de los editores o la
  revisión del marketplace
- engañar a los usuarios acerca de la propiedad, el código fuente, las capacidades, la postura de seguridad,
  los requisitos de instalación o la afiliación con otro proyecto o editor
- subir repetidamente contenido que ya se haya ocultado, eliminado o bloqueado
  sin corregir el problema subyacente

La publicación de grandes volúmenes no constituye automáticamente un abuso. Los catálogos grandes son aceptables
cuando las publicaciones son significativamente distintas, se describen con precisión, reciben mantenimiento
y las utilizan usuarios reales. Los catálogos grandes se convierten en un problema de confianza y seguridad cuando
el volumen se combina con publicaciones superficiales, duplicadas, engañosas, sin mantenimiento o
promocionadas artificialmente.

## Derechos sobre el contenido

Si se considera que un contenido de ClawHub infringe derechos de autor u otros derechos, debe utilizarse
[Solicitudes sobre derechos de contenido](/clawhub/content-rights). No deben utilizarse los informes normales del marketplace
para reclamaciones de derechos de autor u otros derechos, a menos que la publicación también sea insegura,
maliciosa o engañosa.

## Revisión y aplicación de medidas

ClawHub puede utilizar comprobaciones automatizadas, señales estadísticas de abuso, informes de usuarios y
revisiones del personal para identificar contenido inseguro o comportamientos de publicación abusivos. Una señal
no demuestra por sí sola que exista un abuso; ayuda a ClawHub a decidir qué necesita revisión.

Podemos:

- ocultar, retener, eliminar, realizar una eliminación lógica o, cuando sea compatible con el tipo de recurso,
  eliminar permanentemente las publicaciones infractoras
- bloquear descargas o instalaciones de versiones inseguras
- revocar tokens de API
- realizar una eliminación lógica del contenido asociado
- restringir el acceso para publicar
- bloquear a los infractores reincidentes o graves

No se garantiza que se emita primero una advertencia ante abusos evidentes. Véase
[Moderación y seguridad de las cuentas](/clawhub/moderation) para obtener información sobre denuncias, retenciones de moderación,
publicaciones ocultas, bloqueos y situación de las cuentas.
