---
read_when:
    - Cambiar el comportamiento del icono de la barra de menús
summary: Estados y animaciones del icono de la barra de menús para OpenClaw en macOS
title: Icono de la barra de menús
x-i18n:
    generated_at: "2026-04-24T05:38:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6900d702358afcf0481f713ea334236e1abf973d0eeff60eaf0afcf88f9327b2
    source_path: platforms/mac/icon.md
    workflow: 15
---

# Estados del icono de la barra de menús

Autor: steipete · Actualizado: 2025-12-06 · Alcance: app de macOS (`apps/macos`)

- **Inactivo:** animación normal del icono (parpadeo, pequeño balanceo ocasional).
- **En pausa:** el elemento de estado usa `appearsDisabled`; sin movimiento.
- **Activación por voz (orejas grandes):** el detector de activación por voz llama a `AppState.triggerVoiceEars(ttl: nil)` cuando se oye la palabra de activación, manteniendo `earBoostActive=true` mientras se captura la locución. Las orejas se amplían (1.9x), muestran orificios circulares para mejorar la legibilidad y luego vuelven a su estado normal mediante `stopVoiceEars()` tras 1 s de silencio. Solo se activa desde la canalización de voz integrada en la app.
- **Trabajando (agente en ejecución):** `AppState.isWorking=true` impulsa una micromovilidad de “carrera de cola/patas”: movimiento de patas más rápido y ligero desplazamiento mientras el trabajo está en curso. Actualmente se activa en torno a las ejecuciones del agente de WebChat; añade el mismo control alrededor de otras tareas largas cuando las conectes.

Puntos de conexión

- Activación por voz: el runtime/probador llama a `AppState.triggerVoiceEars(ttl: nil)` al activarse y a `stopVoiceEars()` tras 1 s de silencio para ajustarse a la ventana de captura.
- Actividad del agente: establece `AppStateStore.shared.setWorking(true/false)` alrededor de los intervalos de trabajo (ya hecho en la llamada del agente de WebChat). Mantén los intervalos cortos y restablécelos en bloques `defer` para evitar animaciones bloqueadas.

Formas y tamaños

- El icono base se dibuja en `CritterIconRenderer.makeIcon(blink:legWiggle:earWiggle:earScale:earHoles:)`.
- La escala de las orejas usa `1.0` de forma predeterminada; el refuerzo por voz establece `earScale=1.9` y activa `earHoles=true` sin cambiar el marco general (imagen de plantilla de 18×18 pt renderizada en un búfer Retina de 36×36 px).
- La carrera usa un movimiento de patas de hasta ~1.0 con una pequeña sacudida horizontal; se suma a cualquier balanceo inactivo existente.

Notas de comportamiento

- No hay control externo por CLI/broker para orejas/trabajando; mantenlo interno a las propias señales de la app para evitar cambios accidentales continuos.
- Mantén TTL cortos (&lt;10s) para que el icono vuelva rápidamente a la línea base si una tarea se queda colgada.

## Relacionado

- [Barra de menús](/es/platforms/mac/menu-bar)
- [App de macOS](/es/platforms/macos)
