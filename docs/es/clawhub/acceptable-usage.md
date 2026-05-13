---
read_when:
    - Revisión de cargas para detectar abusos o infracciones de políticas
    - Redacción de documentación de moderación o manuales de procedimientos para revisores
    - Decidir si se debe ocultar una habilidad o vetar a un usuario
summary: 'Política del mercado: lo que ClawHub permite y lo que no alojará.'
x-i18n:
    generated_at: "2026-05-13T02:51:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Uso aceptable

Esta página describe los tipos de Skills y contenido con los que ClawHub está de acuerdo, y los flujos de abuso que no alojará.

Estas reglas son intencionalmente prácticas. Nos importan sobre todo los flujos de abuso de extremo a extremo, no solo palabras clave aisladas. Si un Skill está creado para evadir defensas, abusar de plataformas, estafar a personas, invadir la privacidad o permitir comportamientos no consensuados, no pertenece a ClawHub.

## Patrones recientes con los que estamos explícitamente de acuerdo

- Trabajo de frontend y sistemas de diseño que usa componentes reales, tokens semánticos, estados accesibles y flujos de usuario probados.
- Composición de shadcn/ui que usa componentes de código fuente instalados, alias del proyecto y variantes documentadas en lugar de marcado puntual.
- Conversión de UI5 de JavaScript a TypeScript que conserva comentarios, usa tipos concretos de UI5 y mantiene revisables las interfaces de controles generadas.
- Revisión de seguridad defensiva, herramientas de moderación y prompts de detección de abuso que muestran evidencia y mantienen claros los límites de aprobación humana.
- Automatización de flujos de trabajo basada en consentimiento para cuentas personales o de equipo con credenciales explícitas, configuración transparente y modos de simulación o vista previa.
- Documentación, runbooks de migración, utilidades para desarrolladores y fixtures de prueba delimitados al software al que dan soporte.

## No aceptable

- Flujos de omisión de seguridad o acceso no autorizado.
  - Ejemplos: omisión de autenticación, toma de control de cuentas, omisión de CAPTCHA, evasión de Cloudflare o antibots, omisión de límites de tasa, scraping sigiloso diseñado para derrotar protecciones, toma de control de llamadas en vivo o agentes, robo reutilizable de sesiones, aprobación automática de flujos de emparejamiento para usuarios no aprobados.

- Abuso de plataformas y evasión de bloqueos.
  - Ejemplos: cuentas sigilosas después de bloqueos, calentamiento/cultivo de cuentas, interacción falsa, cultivo de karma o seguidores, automatización de múltiples cuentas, publicación masiva, bots de spam, automatización de marketplaces o redes sociales creada para evitar la detección.

- Fraude, estafas y flujos financieros engañosos.
  - Ejemplos: certificados falsos, facturas falsas, flujos de pago engañosos, contacto para estafas, prueba social falsa, herramientas que permiten gastar o cobrar sin aprobación humana clara y controles transparentes, o flujos de identidad sintética creados para crear cuentas con fines de fraude.

- Scraping, enriquecimiento o vigilancia invasivos para la privacidad.
  - Ejemplos: scraping de datos de contacto a escala para spam, doxxing, acoso, extracción de leads combinada con contacto no solicitado, monitoreo encubierto, búsqueda facial o coincidencia biométrica usada sin consentimiento claro, o compra, publicación, descarga u operacionalización de datos filtrados o volcados de brechas.

- Suplantación no consensuada o manipulación engañosa de identidad.
  - Ejemplos: face swap, gemelos digitales, personas falsas, influencers clonados u otras herramientas de manipulación de identidad usadas para suplantar o engañar.

- Contenido sexual explícito y generación para adultos con seguridad deshabilitada.
  - Ejemplos: generación de imágenes/videos/contenido NSFW, wrappers de contenido para adultos alrededor de APIs de terceros, o Skills cuyo propósito principal es contenido sexual explícito.

- Requisitos de ejecución ocultos, inseguros o engañosos.
  - Ejemplos: comandos de instalación ofuscados, `curl | sh`, requisitos de secretos no declarados, uso no declarado de claves privadas, ejecución remota de `npx @latest` sin revisabilidad clara, metadatos engañosos que ocultan lo que el Skill realmente necesita para ejecutarse.

## Patrones recientes con los que explícitamente no estamos de acuerdo

- “Crear cuentas de vendedor sigilosas después de bloqueos en marketplaces.”
- “Modificar el emparejamiento de Telegram para que usuarios no aprobados reciban automáticamente códigos de emparejamiento.”
- “Cultivar cuentas de Reddit/Twitter con automatización indetectable.”
- “Generar certificados profesionales o facturas para uso arbitrario.”
- “Generar contenido NSFW con las comprobaciones de seguridad deshabilitadas.”
- “Extraer leads, enriquecer contactos y lanzar contacto en frío a escala.”
- “Comprar, publicar o descargar datos filtrados o volcados de brechas.”
- “Crear cuentas de correo o redes sociales en masa con identidades sintéticas o resolución de CAPTCHA.”

## Notas para revisores

- El contexto importa. El mismo tema puede ser legítimo en un entorno defensivo limitado o basado en consentimiento, e inaceptable cuando se empaqueta como un flujo de abuso.
- Debemos inclinarnos hacia la acción cuando un Skill está claramente optimizado para evasión, engaño o uso no consensuado.
- Las cargas repetidas en estas categorías son motivo para ocultar contenido y bloquear la cuenta.

## Cumplimiento

- Podemos ocultar, eliminar o eliminar de forma permanente Skills infractores.
- Podemos revocar tokens, eliminar de forma recuperable contenido asociado y bloquear a infractores reincidentes o graves.
- No garantizamos cumplimiento con advertencia previa para abusos evidentes.
