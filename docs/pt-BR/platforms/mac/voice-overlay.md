---
read_when:
    - Ajustando o comportamento da sobreposição de voz
summary: Ciclo de vida da sobreposição de voz quando a palavra de ativação e o modo pressionar para falar se sobrepõem
title: Sobreposição de voz
x-i18n:
    generated_at: "2026-05-06T09:05:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5b30f50512e557bd5a50f0e4e8b7955a847b3b554694347d56638581fcda9514
    source_path: platforms/mac/voice-overlay.md
    workflow: 16
---

# Ciclo de vida da sobreposição de voz (macOS)

Público: colaboradores do app para macOS. Objetivo: manter a sobreposição de voz previsível quando a palavra de ativação e o pressionar para falar se sobrepõem.

## Intenção atual

- Se a sobreposição já estiver visível por causa da palavra de ativação e o usuário pressionar a tecla de atalho, a sessão da tecla de atalho _adota_ o texto existente em vez de redefini-lo. A sobreposição permanece visível enquanto a tecla de atalho estiver pressionada. Quando o usuário solta: envia se houver texto aparado; caso contrário, dispensa.
- Apenas a palavra de ativação ainda envia automaticamente no silêncio; pressionar para falar envia imediatamente ao soltar.

## Implementado (9 de dez. de 2025)

- As sessões de sobreposição agora carregam um token por captura (palavra de ativação ou pressionar para falar). Atualizações parciais/finais/de envio/de dispensa/de nível são descartadas quando o token não corresponde, evitando callbacks obsoletos.
- Pressionar para falar adota qualquer texto de sobreposição visível como prefixo (então pressionar a tecla de atalho enquanto a sobreposição de ativação está visível mantém o texto e acrescenta a nova fala). Ele aguarda até 1,5 s por uma transcrição final antes de recorrer ao texto atual.
- O registro de chime/sobreposição é emitido em `info` nas categorias `voicewake.overlay`, `voicewake.ptt` e `voicewake.chime` (início da sessão, parcial, final, envio, dispensa, motivo do chime).

## Próximos passos

1. **VoiceSessionCoordinator (actor)**
   - Possui exatamente uma `VoiceSession` por vez.
   - API (baseada em token): `beginWakeCapture`, `beginPushToTalk`, `updatePartial`, `endCapture`, `cancel`, `applyCooldown`.
   - Descarta callbacks que carregam tokens obsoletos (impede que reconhecedores antigos reabram a sobreposição).
2. **VoiceSession (modelo)**
   - Campos: `token`, `source` (wakeWord|pushToTalk), texto confirmado/volátil, flags de chime, temporizadores (envio automático, ocioso), `overlayMode` (display|editing|sending), prazo de cooldown.
3. **Vínculo da sobreposição**
   - `VoiceSessionPublisher` (`ObservableObject`) espelha a sessão ativa no SwiftUI.
   - `VoiceWakeOverlayView` renderiza apenas via publisher; nunca altera singletons globais diretamente.
   - Ações do usuário na sobreposição (`sendNow`, `dismiss`, `edit`) chamam de volta o coordenador com o token da sessão.
4. **Caminho unificado de envio**
   - Em `endCapture`: se o texto aparado estiver vazio → dispensar; caso contrário, `performSend(session:)` (toca o chime de envio uma vez, encaminha, dispensa).
   - Pressionar para falar: sem atraso; palavra de ativação: atraso opcional para envio automático.
   - Aplique um cooldown curto ao runtime de ativação após o pressionar para falar terminar, para que a palavra de ativação não seja acionada novamente de imediato.
5. **Registro**
   - O coordenador emite logs `.info` no subsistema `ai.openclaw`, categorias `voicewake.overlay` e `voicewake.chime`.
   - Eventos principais: `session_started`, `adopted_by_push_to_talk`, `partial`, `finalized`, `send`, `dismiss`, `cancel`, `cooldown`.

## Checklist de depuração

- Faça streaming dos logs ao reproduzir uma sobreposição presa:

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- Verifique que há apenas um token de sessão ativo; callbacks obsoletos devem ser descartados pelo coordenador.
- Garanta que soltar o pressionar para falar sempre chame `endCapture` com o token ativo; se o texto estiver vazio, espere `dismiss` sem chime nem envio.

## Etapas de migração (sugeridas)

1. Adicione `VoiceSessionCoordinator`, `VoiceSession` e `VoiceSessionPublisher`.
2. Refatore `VoiceWakeRuntime` para criar/atualizar/encerrar sessões em vez de tocar diretamente em `VoiceWakeOverlayController`.
3. Refatore `VoicePushToTalk` para adotar sessões existentes e chamar `endCapture` ao soltar; aplique cooldown ao runtime.
4. Conecte `VoiceWakeOverlayController` ao publisher; remova chamadas diretas do runtime/PTT.
5. Adicione testes de integração para adoção de sessão, cooldown e dispensa com texto vazio.

## Relacionado

- [App para macOS](/pt-BR/platforms/macos)
- [Ativação por voz (macOS)](/pt-BR/platforms/mac/voicewake)
- [Modo de conversa](/pt-BR/nodes/talk)
