---
read_when:
    - Revisión de cargas para detectar abuso o infracciones de políticas
    - Redacción de documentación de moderación o guías operativas para revisores
    - Decidir si una skill debe ocultarse o si se debe prohibir a un usuario
sidebarTitle: Acceptable Usage
summary: 'Política del mercado: lo que ClawHub permite y lo que no alojará.'
title: Uso aceptable
x-i18n:
    generated_at: "2026-06-30T22:05:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Uso aceptable

ClawHub aloja Skills, Plugins, paquetes y metadatos del marketplace para OpenClaw.
Usa esta página para decidir si el contenido o el comportamiento de publicación
pertenece a ClawHub.

Estas reglas se aplican a lo que hace un listado, lo que pide a los usuarios que
ejecuten, cómo se representa a sí mismo y cómo los publicadores usan las
superficies de descubrimiento, instalación y confianza de ClawHub. Para los
estados de moderación y la situación de la cuenta, consulta
[Moderación y seguridad de la cuenta](/clawhub/moderation). Para reclamaciones de
copyright u otros derechos, consulta [Solicitudes de derechos de contenido](/clawhub/content-rights).

## Contenido permitido

ClawHub acepta contenido que sea útil, comprensible y publicado de buena fe.

| Categoría                                        | Permitido cuando                                                                                                                     |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Productividad para desarrolladores               | El listado ayuda a los usuarios a compilar, probar, migrar, depurar, documentar u operar software.                                  |
| Flujos de trabajo de UI, datos y automatización  | El alcance es claro, las credenciales requeridas son explícitas y las acciones riesgosas incluyen rutas de revisión, ejecución de prueba, vista previa o confirmación. |
| Seguridad defensiva, moderación y revisión de abuso | La herramienta está presentada para revisión autorizada, preserva evidencia y mantiene claros los límites de aprobación humana.       |
| Flujos de trabajo personales o de equipo         | El flujo de trabajo usa cuentas basadas en consentimiento, configuración transparente y permisos explícitos.                          |
| Catálogos mantenidos                             | Cada listado es distinto, útil, descrito con precisión y razonablemente mantenido.                                                    |

El contexto importa. El mismo tema puede ser aceptable en un entorno defensivo
estrecho o basado en consentimiento, e inaceptable cuando se empaqueta como un
flujo de trabajo de abuso.

## Contenido no permitido

ClawHub no aloja contenido cuyo propósito principal sea el abuso, el engaño, la
ejecución insegura o la infracción de derechos.

| Categoría                                                   | No permitido                                                                                                                                                                                                                                                                                                            |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Acceso no autorizado o evasión de seguridad                 | Evasión de autenticación, toma de cuentas, abuso de límites de frecuencia, toma de llamadas en vivo o de agentes, robo de sesiones reutilizables, o flujos de emparejamiento con aprobación automática para usuarios no aprobados.                                                                                      |
| Abuso de plataformas y evasión de bloqueos                  | Cuentas sigilosas después de bloqueos, preparación o cultivo de cuentas, interacción falsa, automatización de varias cuentas, publicación masiva, bots de spam o automatización creada para evitar la detección.                                                                                                         |
| Fraude, estafas y flujos financieros engañosos              | Certificados o facturas falsos, flujos de pago engañosos, contacto para estafas, prueba social falsa, flujos de trabajo de identidad sintética para fraude, o herramientas de gasto/cobro sin aprobación humana clara.                                                                                                  |
| Enriquecimiento o vigilancia invasivos de la privacidad     | Extracción de contactos para spam, doxxing, acoso, extracción de prospectos combinada con contacto no solicitado, monitoreo encubierto, coincidencia biométrica no consentida, o uso de datos filtrados o volcados de brechas.                                                                                          |
| Suplantación no consentida o manipulación de identidad      | Intercambio de rostros, gemelos digitales, influencers clonados, identidades falsas u otras herramientas usadas para suplantar o engañar.                                                                                                                                                                                |
| Contenido sexual explícito o generación adulta con seguridad deshabilitada | Generación de imágenes, videos o contenido NSFW; envoltorios de contenido adulto alrededor de API de terceros; o listados cuyo propósito principal sea contenido sexual explícito.                                                                                                                                       |
| Requisitos de ejecución ocultos, inseguros o engañosos      | Comandos de instalación ofuscados, instaladores que canalizan a shell, como contenido descargado ejecutado con `sh` o `bash` sin revisabilidad clara, requisitos no declarados de secretos o claves privadas, ejecución remota de `npx @latest` sin revisabilidad clara, o metadatos que ocultan lo que el listado realmente necesita para ejecutarse. |
| Material que infringe copyright o viola derechos            | Republicar la Skill, el Plugin, la documentación, los activos de marca o el código propietario de otra persona sin permiso; violar términos de licencia; o suplantar al autor o publicador original.                                                                                                                     |

## Comportamiento no permitido en el marketplace

ClawHub también revisa cómo los publicadores usan el marketplace. No uses
ClawHub para manipular el descubrimiento, las métricas, las señales de confianza,
los sistemas de moderación o la atención de los usuarios.

El comportamiento no permitido en el marketplace incluye:

- publicar en bloque grandes cantidades de listados de bajo esfuerzo, duplicados,
  de marcador de posición o generados por máquina que no parecen tener valor real
  para los usuarios
- inundar las superficies de búsqueda o categoría con Skills o Plugins casi
  idénticos
- publicar cientos de listados con poco o ningún uso, mantenimiento, claridad de
  origen o diferenciación significativa
- inflar artificialmente instalaciones, descargas, estrellas u otras métricas de
  interacción mediante automatización, bucles de autoinstalación, cuentas falsas,
  actividad coordinada, interacción pagada u otro comportamiento no orgánico
- crear o rotar cuentas para evadir moderación, bloqueos, límites de publicador o
  revisión del marketplace
- engañar a los usuarios sobre propiedad, origen, capacidades, postura de
  seguridad, requisitos de instalación o afiliación con otro proyecto o publicador
- subir repetidamente contenido que ya se ha ocultado, eliminado o bloqueado sin
  corregir el problema subyacente

La publicación de alto volumen no es abuso automáticamente. Los catálogos grandes
son aceptables cuando los listados son significativamente diferentes, están
descritos con precisión, se mantienen y son usados por usuarios reales. Los
catálogos grandes se convierten en un problema de confianza y seguridad cuando el
volumen se combina con listados superficiales, duplicados, engañosos, sin
mantenimiento o promocionados artificialmente.

## Derechos de contenido

Si crees que contenido en ClawHub infringe tu copyright u otros derechos, usa
[Solicitudes de derechos de contenido](/clawhub/content-rights). No uses los
reportes normales del marketplace para reclamaciones de copyright o derechos a
menos que el listado también sea inseguro, malicioso o engañoso.

## Revisión y aplicación

ClawHub puede usar comprobaciones automatizadas, señales estadísticas de abuso,
reportes de usuarios y revisión del personal para identificar contenido inseguro
o comportamiento de publicación abusivo. Una señal no prueba abuso por sí sola;
ayuda a ClawHub a decidir qué necesita revisión.

Podemos:

- ocultar, retener, eliminar, eliminar de forma reversible o, cuando el tipo de
  recurso lo admita, eliminar definitivamente listados infractores
- bloquear descargas o instalaciones de versiones inseguras
- revocar tokens de API
- eliminar de forma reversible contenido asociado
- restringir el acceso de publicación
- bloquear a infractores reincidentes o graves

No garantizamos aplicación con advertencia previa para abuso evidente. Consulta
[Moderación y seguridad de la cuenta](/clawhub/moderation) para reportes,
retenciones de moderación, listados ocultos, bloqueos y situación de la cuenta.
