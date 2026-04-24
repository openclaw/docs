---
read_when:
    - Ajustar o comportamento da sobreposição de voz
summary: Ciclo de vida da sobreposição de voz quando wake-word e push-to-talk se sobrepõem
title: Sobreposição de voz
x-i18n:
    generated_at: "2026-04-24T06:01:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3ae98afad57dffe73e2c878eef4f3253e4464d68cadf531e9239b017cc160f28
    source_path: platforms/mac/voice-overlay.md
    workflow: 15
---

# Ciclo de vida da sobreposição de voz (macOS)

Público: contribuidores do app do macOS. Objetivo: manter a sobreposição de voz previsível quando wake-word e push-to-talk se sobrepõem.

## Intenção atual

- Se a sobreposição já estiver visível por causa da wake-word e o usuário pressionar a hotkey, a sessão da hotkey _adota_ o texto existente em vez de redefini-lo. A sobreposição permanece ativa enquanto a hotkey estiver pressionada. Quando o usuário solta: envia se houver texto aparado; caso contrário, dispensa.
- A wake-word sozinha ainda envia automaticamente no silêncio; push-to-talk envia imediatamente ao soltar.

## Implementado (9 de dezembro de 2025)

- Sessões de sobreposição agora carregam um token por captura (wake-word ou push-to-talk). Atualizações de parcial/final/send/dismiss/level são descartadas quando o token não corresponde, evitando callbacks obsoletos.
- Push-to-talk adota qualquer texto de sobreposição visível como prefixo (então pressionar a hotkey enquanto a sobreposição de wake estiver ativa mantém o texto e acrescenta nova fala). Ele espera até 1,5s por uma transcrição final antes de recorrer ao texto atual.
- Logging de chime/sobreposição é emitido em `info` nas categorias `voicewake.overlay`, `voicewake.ptt` e `voicewake.chime` (início de sessão, parcial, final, envio, dispensa, motivo do chime).

## Próximas etapas

1. **VoiceSessionCoordinator (actor)**
   - Controla exatamente uma `VoiceSession` por vez.
   - API (baseada em token): `beginWakeCapture`, `beginPushToTalk`, `updatePartial`, `endCapture`, `cancel`, `applyCooldown`.
   - Descarta callbacks que carregam tokens obsoletos (evita que reconhecedores antigos reabram a sobreposição).
2. **VoiceSession (model)**
   - Campos: `token`, `source` (wakeWord|pushToTalk), texto committed/volatile, flags de chime, timers (envio automático, inatividade), `overlayMode` (display|editing|sending), prazo de cooldown.
3. **Binding da sobreposição**
   - `VoiceSessionPublisher` (`ObservableObject`) espelha a sessão ativa em SwiftUI.
   - `VoiceWakeOverlayView` renderiza apenas por meio do publisher; ela nunca altera singletons globais diretamente.
   - Ações do usuário na sobreposição (`sendNow`, `dismiss`, `edit`) fazem callback para o coordinator com o token da sessão.
4. **Caminho de envio unificado**
   - Em `endCapture`: se o texto aparado estiver vazio → dispensa; caso contrário `performSend(session:)` (toca o chime de envio uma vez, encaminha, dispensa).
   - Push-to-talk: sem atraso; wake-word: atraso opcional para envio automático.
   - Aplique um cooldown curto ao runtime de wake depois que push-to-talk terminar para que a wake-word não seja reacionada imediatamente.
5. **Logging**
   - O coordinator emite logs `.info` no subsistema `ai.openclaw`, categorias `voicewake.overlay` e `voicewake.chime`.
   - Eventos principais: `session_started`, `adopted_by_push_to_talk`, `partial`, `finalized`, `send`, `dismiss`, `cancel`, `cooldown`.

## Checklist de depuração

- Faça streaming dos logs enquanto reproduz uma sobreposição persistente:

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- Verifique se existe apenas um token de sessão ativo; callbacks obsoletos devem ser descartados pelo coordinator.
- Garanta que a liberação de push-to-talk sempre chame `endCapture` com o token ativo; se o texto estiver vazio, espere `dismiss` sem chime nem envio.

## Etapas de migração (sugeridas)

1. Adicionar `VoiceSessionCoordinator`, `VoiceSession` e `VoiceSessionPublisher`.
2. Refatorar `VoiceWakeRuntime` para criar/atualizar/encerrar sessões em vez de tocar diretamente em `VoiceWakeOverlayController`.
3. Refatorar `VoicePushToTalk` para adotar sessões existentes e chamar `endCapture` ao soltar; aplicar cooldown de runtime.
4. Conectar `VoiceWakeOverlayController` ao publisher; remover chamadas diretas de runtime/PTT.
5. Adicionar testes de integração para adoção de sessão, cooldown e dispensa com texto vazio.

## Relacionado

- [App do macOS](/pt-BR/platforms/macos)
- [Voice wake (macOS)](/pt-BR/platforms/mac/voicewake)
- [Modo talk](/pt-BR/nodes/talk)
