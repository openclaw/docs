---
read_when:
    - Revisión de cargas para detectar abuso o infracciones de políticas
    - Redacción de documentación de moderación o manuales operativos para revisores
    - Decidir si se debe ocultar una Skill o bloquear a un usuario
summary: 'Política del mercado: qué permite ClawHub y qué no alojará.'
x-i18n:
    generated_at: "2026-05-12T08:44:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Uso Aceptable

Esta página describe los tipos de Skills y contenido con los que ClawHub está conforme, y los flujos de trabajo de abuso que no alojará.

Estas reglas son intencionalmente prácticas. Nos importan sobre todo los flujos de trabajo de abuso de extremo a extremo, no solo palabras clave aisladas. Si una Skill está creada para evadir defensas, abusar de plataformas, estafar a personas, invadir la privacidad o habilitar comportamientos no consensuados, no pertenece a ClawHub.

## Patrones recientes con los que estamos explícitamente conformes

- Trabajo de interfaz y sistemas de diseño que usa componentes reales, tokens semánticos, estados accesibles y flujos de usuario probados.
- Composición con shadcn/ui que usa componentes fuente instalados, alias del proyecto y variantes documentadas en lugar de marcado único.
- Conversión de JavaScript a TypeScript en UI5 que conserva los comentarios, usa tipos concretos de UI5 y mantiene revisables las interfaces de controles generadas.
- Revisión de seguridad defensiva, herramientas de moderación y prompts de detección de abuso que muestran evidencia y mantienen claros los límites de aprobación humana.
- Automatización de flujos de trabajo basada en consentimiento para cuentas personales o de equipo con credenciales explícitas, configuración transparente y modos de ejecución de prueba o vista previa.
- Documentación, guías de migración, utilidades para desarrolladores y fixtures de prueba delimitados al software al que dan soporte.

## No permitido

- Flujos de trabajo de elusión de seguridad o acceso no autorizado.
  - Ejemplos: elusión de autenticación, toma de control de cuentas, elusión de CAPTCHA, evasión de Cloudflare o de sistemas antibots, elusión de límites de tasa, scraping encubierto diseñado para derrotar protecciones, toma de control de llamadas en vivo o agentes, robo reutilizable de sesiones, aprobación automática de flujos de emparejamiento para usuarios no aprobados.

- Abuso de plataformas y evasión de prohibiciones.
  - Ejemplos: cuentas encubiertas tras prohibiciones, calentamiento o cultivo de cuentas, interacción falsa, cultivo de karma o seguidores, automatización de múltiples cuentas, publicación masiva, bots de spam, automatización de mercados o redes sociales creada para evitar la detección.

- Fraude, estafas y flujos de trabajo financieros engañosos.
  - Ejemplos: certificados falsos, facturas falsas, flujos de pago engañosos, contacto para estafas, prueba social falsa, herramientas que permiten gastar o cobrar sin aprobación humana clara y controles transparentes, o flujos de trabajo de identidad sintética creados para generar cuentas con fines de fraude.

- Scraping, enriquecimiento o vigilancia invasivos de la privacidad.
  - Ejemplos: scraping de datos de contacto a escala para spam, doxxing, acoso, extracción de prospectos combinada con contacto no solicitado, monitoreo encubierto, búsqueda facial o coincidencia biométrica usada sin consentimiento claro, o compra, publicación, descarga u operacionalización de datos filtrados o volcados de brechas.

- Suplantación no consensuada o manipulación engañosa de identidad.
  - Ejemplos: intercambio de rostros, gemelos digitales, personas falsas, influencers clonados u otras herramientas de manipulación de identidad usadas para suplantar o engañar.

- Contenido sexual explícito y generación para adultos con seguridad desactivada.
  - Ejemplos: generación de imágenes, videos o contenido NSFW, envoltorios de contenido para adultos alrededor de API de terceros, o Skills cuyo propósito principal es contenido sexual explícito.

- Requisitos de ejecución ocultos, inseguros o engañosos.
  - Ejemplos: comandos de instalación ofuscados, `curl | sh`, requisitos de secretos no declarados, uso no declarado de claves privadas, ejecución remota de `npx @latest` sin revisabilidad clara, metadatos engañosos que ocultan lo que la Skill realmente necesita para ejecutarse.

## Patrones recientes con los que explícitamente no estamos conformes

- “Crear cuentas de vendedor encubiertas tras prohibiciones en mercados.”
- “Modificar el emparejamiento de Telegram para que usuarios no aprobados reciban automáticamente códigos de emparejamiento.”
- “Cultivar cuentas de Reddit/Twitter con automatización indetectable.”
- “Generar certificados profesionales o facturas para uso arbitrario.”
- “Generar contenido NSFW con comprobaciones de seguridad desactivadas.”
- “Extraer prospectos, enriquecer contactos y lanzar contacto en frío a escala.”
- “Comprar, publicar o descargar datos filtrados o volcados de brechas.”
- “Crear en masa cuentas de correo o redes sociales con identidades sintéticas o resolución de CAPTCHA.”

## Notas para revisores

- El contexto importa. El mismo tema puede ser legítimo en un entorno defensivo estrecho o basado en consentimiento, e inaceptable cuando se empaqueta como un flujo de trabajo de abuso.
- Debemos inclinarnos hacia la acción cuando una Skill está claramente optimizada para la evasión, el engaño o el uso no consensuado.
- Las cargas repetidas en estas categorías son motivo para ocultar contenido y prohibir la cuenta.

## Aplicación

- Podemos ocultar, eliminar o borrar definitivamente Skills infractoras.
- Podemos revocar tokens, eliminar temporalmente contenido asociado y prohibir a infractores reincidentes o graves.
- No garantizamos una aplicación con advertencia previa en casos de abuso evidente.
