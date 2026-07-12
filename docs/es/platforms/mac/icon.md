---
read_when:
    - Cambiar el comportamiento del icono de la barra de menús
summary: Estados y animaciones del icono de la barra de menús de OpenClaw en macOS
title: Icono de la barra de menús
x-i18n:
    generated_at: "2026-07-12T14:41:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8a38f1253f0c376ef2ce6c0ae339b67084c472c764964bcc7ad21e10133e2b47
    source_path: platforms/mac/icon.md
    workflow: 16
---

# Estados del icono de la barra de menús

Ámbito: aplicación para macOS (`apps/macos`). Renderizado: `CritterIconRenderer.makeIcon(...)`. Conexión de la animación y el estado: `CritterStatusLabel` + `CritterStatusLabel+Behavior.swift`.

## Estados

| Estado                         | Activador                                 | Apariencia                                                                                                                        |
| ------------------------------ | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Inactivo                       | Predeterminado                            | Animación normal de parpadeo/balanceo; los ojos abiertos conservan un destello brillante                                          |
| En pausa                       | `isPaused=true`                           | Las antenas caen («fuera de servicio») con los ojos abiertos; sin movimiento                                                      |
| Durmiendo                      | Gateway desconectado/sin configurar       | Las antenas caen y los ojos se cierran formando párpados `⌣ ⌣`; sin movimiento                                                    |
| Celebración                    | Mensaje enviado (`sendCelebrationTick`)   | Los ojos muestran brevemente arcos alegres `∩ ∩` durante ~0.9s, junto con una patada                                               |
| Activación por voz (orejas grandes) | Se detecta la palabra de activación       | Las antenas se ponen rectas y más altas (`earScale=1.9`); vuelven a bajar después de un período de silencio                        |
| Trabajando                     | `isWorking=true` o un `IconState` activo  | Movimiento más rápido de las patas (`legWiggle` hasta `1.0`) más un pequeño desplazamiento horizontal; se suma al balanceo inactivo |

Una insignia de actividad de herramientas (indicador con un símbolo SF, por ejemplo, `chevron.left.slash.chevron.right` para la ejecución) puede mostrarse encima del mismo icono de la criatura cuando una sesión tiene un trabajo o una herramienta activos. Esa insignia procede de `IconState`/`ActivityKind`; consulte [Barra de menús](/es/platforms/mac/menu-bar) para ver el modelo de estados completo.

## Orejas de activación por voz

- Activador: `AppStateStore.shared.triggerVoiceEars(ttl: nil)`, llamado desde la canalización de captura de activación por voz (`VoiceWakeRuntime`) y desde las herramientas de depuración/prueba de activación por voz (`VoiceWakeTester`, `VoiceWakeOverlayController`).
- Detención: `stopVoiceEars()`, llamado cuando finaliza la captura.
- Ventana de silencio antes de finalizar: normalmente `2.0s`; `5.0s` si solo se detectó la palabra de activación y no hubo más voz después (`VoiceWakeRuntime.silenceWindow` / `triggerOnlySilenceWindow`).
- Mientras están ampliadas, se suspenden los temporizadores de parpadeo, balanceo, patas y orejas del estado inactivo (`earBoostActive` controla la tarea de animación en `CritterStatusLabel+Behavior`).

## Formas y tamaños

- Lienzo: imagen de plantilla de 18x18pt, renderizada en un búfer de mapa de bits de 36x36px (2x) para que el icono se mantenga nítido en pantallas Retina.
- La escala predeterminada de las orejas es `1.0`; la ampliación por voz establece `earScale=1.9` sin cambiar el marco general.
- `antennaDroop` (0-1) pliega las antenas hacia abajo para las poses de pausa y sueño.
- El movimiento rápido de las patas usa `legWiggle` hasta `1.0` con una pequeña oscilación horizontal.

## Notas de comportamiento

- No hay ningún control externo mediante CLI/intermediario para las orejas ni para el estado de trabajo; ambos se controlan internamente mediante señales de la aplicación (`AppState.setWorking`, `AppState.triggerVoiceEars`) para evitar oscilaciones accidentales.
- Mantenga cualquier TTL nuevo breve (muy por debajo de 10s) para que el icono vuelva rápidamente al estado base si un trabajo se bloquea.

## Relacionado

- [Barra de menús](/es/platforms/mac/menu-bar)
- [Aplicación para macOS](/es/platforms/macos)
