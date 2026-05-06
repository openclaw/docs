---
read_when:
    - Cambiar el comportamiento del icono de la barra de menús
summary: Estados y animaciones del icono de la barra de menús para OpenClaw en macOS
title: Icono de la barra de menús
x-i18n:
    generated_at: "2026-05-06T09:05:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5497927721ff7486e9585a8a3edc2d5140408b2b0707acdcef2388e87bca20ec
    source_path: platforms/mac/icon.md
    workflow: 16
---

# Estados del icono de la barra de menús

Autor: steipete · Actualizado: 2025-12-06 · Alcance: aplicación macOS (`apps/macos`)

- **Inactivo:** Animación normal del icono (parpadeo, oscilación ocasional).
- **En pausa:** El elemento de estado usa `appearsDisabled`; sin movimiento.
- **Activación por voz (orejas grandes):** El detector de activación por voz llama a `AppState.triggerVoiceEars(ttl: nil)` cuando se oye la palabra de activación, manteniendo `earBoostActive=true` mientras se captura la expresión. Las orejas aumentan de tamaño (1.9x), reciben orificios circulares para mejorar la legibilidad y luego vuelven a su estado normal mediante `stopVoiceEars()` después de 1 s de silencio. Solo se activa desde la canalización de voz dentro de la aplicación.
- **Trabajando (agente en ejecución):** `AppState.isWorking=true` impulsa un micromovimiento de "correteo de cola/patas": oscilación más rápida de las patas y un ligero desplazamiento mientras el trabajo está en curso. Actualmente se activa alrededor de las ejecuciones del agente de WebChat; añade la misma activación alrededor de otras tareas largas cuando las conectes.

Puntos de conexión

- Activación por voz: la llamada de runtime/probador llama a `AppState.triggerVoiceEars(ttl: nil)` al activarse y a `stopVoiceEars()` después de 1 s de silencio para coincidir con la ventana de captura.
- Actividad del agente: define `AppStateStore.shared.setWorking(true/false)` alrededor de los intervalos de trabajo (ya hecho en la llamada del agente de WebChat). Mantén los intervalos cortos y restablécelos en bloques `defer` para evitar animaciones atascadas.

Formas y tamaños

- El icono base se dibuja en `CritterIconRenderer.makeIcon(blink:legWiggle:earWiggle:earScale:earHoles:)`.
- La escala de las orejas tiene un valor predeterminado de `1.0`; el refuerzo de voz define `earScale=1.9` y activa `earHoles=true` sin cambiar el marco general (imagen de plantilla de 18×18 pt renderizada en un búfer de respaldo Retina de 36×36 px).
- El correteo usa una oscilación de patas de hasta ~1.0 con una pequeña sacudida horizontal; es aditivo a cualquier oscilación inactiva existente.

Notas de comportamiento

- No hay activación externa de CLI/intermediario para orejas/trabajo; mantenla interna a las propias señales de la aplicación para evitar cambios accidentales repetidos.
- Mantén los TTL cortos (&lt;10 s) para que el icono vuelva rápidamente al estado base si una tarea se cuelga.

## Relacionado

- [Barra de menús](/es/platforms/mac/menu-bar)
- [Aplicación macOS](/es/platforms/macos)
