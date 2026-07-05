---
read_when:
    - Cambiar el comportamiento del icono de la barra de menús
summary: Estados y animaciones del icono de la barra de menús para OpenClaw en macOS
title: Icono de la barra de menús
x-i18n:
    generated_at: "2026-07-05T11:29:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b7a096ad148e83f368624e750c1e50c965d8a34a6255a09a19c568e7e88a5868
    source_path: platforms/mac/icon.md
    workflow: 16
---

# Estados del icono de la barra de menús

Ámbito: app de macOS (`apps/macos`). Renderizado: `CritterIconRenderer.makeIcon(...)`. Cableado de animación/estado: `CritterStatusLabel` + `CritterStatusLabel+Behavior.swift`.

## Estados

| Estado                | Activador                                 | Visual                                                                                              |
| --------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Inactivo              | Predeterminado                            | Animación normal de parpadeo/meneo                                                                 |
| Pausado               | `isPaused=true`                           | El elemento de estado usa `appearsDisabled`; sin movimiento                                         |
| Activación por voz (orejas grandes) | Se oyó la palabra de activación           | Las orejas escalan a `1.9x` con `earHoles=true` (agujeros circulares para legibilidad); desaparece tras el silencio |
| Trabajando            | `isWorking=true` o un `IconState` activo  | Meneo de patas más rápido (`legWiggle` hasta `1.0`) más un pequeño desplazamiento horizontal; aditivo al meneo inactivo |

Una insignia de actividad de herramienta (puck de SF Symbol, por ejemplo `chevron.left.slash.chevron.right` para exec) puede renderizarse encima del mismo icono de criatura cuando una sesión tiene un trabajo o una herramienta activos. Esa insignia proviene de `IconState`/`ActivityKind`; consulta [Barra de menús](/es/platforms/mac/menu-bar) para ver el modelo de estado completo.

## Orejas de activación por voz

- Activador: `AppStateStore.shared.triggerVoiceEars(ttl: nil)`, llamado desde la canalización de captura de activación por voz (`VoiceWakeRuntime`) y desde las herramientas de depuración/prueba de activación por voz (`VoiceWakeTester`, `VoiceWakeOverlayController`).
- Detener: `stopVoiceEars()`, llamado cuando finaliza la captura.
- Ventana de silencio antes de finalizar: `2.0s` normalmente, `5.0s` si solo se oyó la palabra activadora y no siguió más habla (`VoiceWakeRuntime.silenceWindow` / `triggerOnlySilenceWindow`).
- Mientras está reforzado, los temporizadores inactivos de parpadeo/meneo/patas/orejas se suspenden (`earBoostActive` controla la tarea de animación en `CritterStatusLabel+Behavior`).

## Formas y tamaños

- Lienzo: imagen de plantilla de 18x18 pt, renderizada en un almacén de respaldo de mapa de bits de 36x36 px (2x) para que el icono se mantenga nítido en Retina.
- La escala de orejas predeterminada es `1.0`; el refuerzo por voz establece `earScale=1.9` y `earHoles=true` sin cambiar el marco general.
- El correteo de patas usa `legWiggle` hasta `1.0` con una pequeña sacudida horizontal.

## Notas de comportamiento

- No hay interruptor externo de CLI/broker para las orejas o el estado de trabajo; ambos se controlan internamente mediante señales de la app (`AppState.setWorking`, `AppState.triggerVoiceEars`) para evitar oscilaciones accidentales.
- Mantén cualquier TTL nuevo corto (muy por debajo de 10 s) para que el icono vuelva rápidamente al estado base si un trabajo se cuelga.

## Relacionado

- [Barra de menús](/es/platforms/mac/menu-bar)
- [app de macOS](/es/platforms/macos)
