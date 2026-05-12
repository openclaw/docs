---
read_when:
    - Revisar los archivos subidos en busca de abuso o infracciones de políticas
    - Redacción de documentación de moderación o guías operativas para revisores
    - Decidir si una skill debe ocultarse o si se debe vetar a un usuario
summary: 'Política del mercado: lo que ClawHub permite y lo que no alojará.'
x-i18n:
    generated_at: "2026-05-12T12:49:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Uso aceptable

Esta página describe los tipos de Skills y contenido que ClawHub acepta, y los flujos de abuso que no alojará.

Estas reglas son intencionalmente prácticas. Nos importan sobre todo los flujos de abuso de extremo a extremo, no solo palabras clave aisladas. Si una skill está creada para evadir defensas, abusar de plataformas, estafar a personas, invadir la privacidad o permitir comportamientos no consentidos, no pertenece a ClawHub.

## Patrones recientes que aceptamos explícitamente

- Trabajo de frontend y sistemas de diseño que usa componentes reales, tokens semánticos, estados accesibles y flujos de usuario probados.
- Composición con shadcn/ui que usa componentes fuente instalados, alias de proyecto y variantes documentadas en lugar de marcado puntual.
- Conversión de JavaScript a TypeScript en UI5 que conserva comentarios, usa tipos concretos de UI5 y mantiene revisables las interfaces de controles generadas.
- Revisión de seguridad defensiva, herramientas de moderación y prompts de detección de abuso que muestran evidencia y mantienen claros los límites de aprobación humana.
- Automatización de flujos basada en consentimiento para cuentas personales o de equipo con credenciales explícitas, configuración transparente y modos de simulación o vista previa.
- Documentación, guías de migración, utilidades para desarrolladores y fixtures de prueba acotados al software que respaldan.

## No aceptable

- Flujos de omisión de seguridad o acceso no autorizado.
  - Ejemplos: omisión de autenticación, toma de control de cuentas, omisión de CAPTCHA, evasión de Cloudflare o sistemas antibots, omisión de límites de tasa, scraping sigiloso diseñado para derrotar protecciones, toma de control de llamadas en vivo o agentes, robo reutilizable de sesiones, aprobación automática de flujos de vinculación para usuarios no aprobados.

- Abuso de plataformas y evasión de bloqueos.
  - Ejemplos: cuentas sigilosas tras bloqueos, calentamiento o cultivo de cuentas, interacción falsa, cultivo de karma o seguidores, automatización de múltiples cuentas, publicación masiva, bots de spam, automatización de marketplaces o redes sociales creada para evitar la detección.

- Fraude, estafas y flujos financieros engañosos.
  - Ejemplos: certificados falsos, facturas falsas, flujos de pago engañosos, campañas de estafa, prueba social falsa, herramientas que permiten gastar o cobrar sin aprobación humana clara y controles transparentes, o flujos de identidad sintética creados para abrir cuentas con fines de fraude.

- Scraping, enriquecimiento o vigilancia invasivos de la privacidad.
  - Ejemplos: scraping de datos de contacto a escala para spam, doxxing, acoso, extracción de leads combinada con contacto no solicitado, monitoreo encubierto, búsqueda facial o coincidencia biométrica usada sin consentimiento claro, o compra, publicación, descarga u operacionalización de datos filtrados o volcados de brechas.

- Suplantación no consentida o manipulación engañosa de identidad.
  - Ejemplos: intercambio de rostros, gemelos digitales, personajes falsos, influencers clonados u otras herramientas de manipulación de identidad usadas para suplantar o engañar.

- Contenido sexual explícito y generación para adultos con seguridad desactivada.
  - Ejemplos: generación de imágenes/videos/contenido NSFW, wrappers de contenido adulto alrededor de APIs de terceros, o skills cuyo propósito principal es contenido sexual explícito.

- Requisitos de ejecución ocultos, inseguros o engañosos.
  - Ejemplos: comandos de instalación ofuscados, `curl | sh`, requisitos de secretos no declarados, uso no declarado de claves privadas, ejecución remota de `npx @latest` sin revisabilidad clara, metadatos engañosos que ocultan lo que la skill realmente necesita para ejecutarse.

## Patrones recientes que explícitamente no aceptamos

- “Crear cuentas de vendedor sigilosas después de bloqueos en marketplaces.”
- “Modificar el emparejamiento de Telegram para que usuarios no aprobados reciban automáticamente códigos de emparejamiento.”
- “Cultivar cuentas de Reddit/Twitter con automatización indetectable.”
- “Generar certificados profesionales o facturas para uso arbitrario.”
- “Generar contenido NSFW con controles de seguridad desactivados.”
- “Extraer leads, enriquecer contactos y lanzar campañas de contacto en frío a escala.”
- “Comprar, publicar o descargar datos filtrados o volcados de brechas.”
- “Crear masivamente cuentas de correo electrónico o redes sociales con identidades sintéticas o resolución de CAPTCHA.”

## Notas para revisores

- El contexto importa. El mismo tema puede ser legítimo en un entorno defensivo o basado en consentimiento de alcance limitado, e inaceptable cuando se empaqueta como un flujo de abuso.
- Debemos inclinarnos por actuar cuando una skill está claramente optimizada para evasión, engaño o uso no consentido.
- Las cargas repetidas en estas categorías son motivo para ocultar contenido y bloquear la cuenta.

## Aplicación

- Podemos ocultar, eliminar o borrar definitivamente skills infractoras.
- Podemos revocar tokens, eliminar de forma recuperable contenido asociado y bloquear a infractores reincidentes o graves.
- No garantizamos una advertencia previa para abusos evidentes.
