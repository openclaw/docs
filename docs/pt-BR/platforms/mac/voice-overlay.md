---
read_when:
    - Ajustando o comportamento da sobreposição de voz
summary: Ciclo de vida da sobreposição de voz quando a palavra de ativação e o pressionar para falar se sobrepõem
title: Sobreposição de voz
x-i18n:
    generated_at: "2026-07-12T15:22:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: eef571c3e8d41a97779537b1b373fab25b08f63575b50e5019f6c5fbcb782c52
    source_path: platforms/mac/voice-overlay.md
    workflow: 16
---

# Ciclo de vida da sobreposição de voz (macOS)

Público-alvo: colaboradores do aplicativo para macOS. Objetivo: manter o comportamento da sobreposição de voz previsível quando a palavra de ativação e o pressionar para falar se sobrepõem.

## Comportamento

- Se a sobreposição já estiver visível devido à palavra de ativação e o usuário pressionar a tecla de atalho, a sessão da tecla de atalho adota o texto existente em vez de redefini-lo. A sobreposição permanece visível enquanto a tecla de atalho estiver pressionada. Ao soltá-la: envia se houver texto sem espaços em branco nas extremidades; caso contrário, fecha.
- A palavra de ativação usada isoladamente ainda envia automaticamente após o silêncio; o pressionar para falar envia imediatamente quando a tecla é solta.

## Implementação

- `VoiceSessionCoordinator` (`apps/macos/Sources/OpenClaw/VoiceSessionCoordinator.swift`) é o único proprietário da sessão de voz ativa. É um singleton `@MainActor @Observable`, não um ator. API: `startSession`, `updatePartial`, `finalize`, `sendNow`, `dismiss`, `updateLevel`, `snapshot`. Cada sessão contém um token `UUID`; chamadas com um token obsoleto ou incompatível são descartadas.
- `VoiceWakeOverlayController` (`VoiceWakeOverlayController+Session.swift`) renderiza a sobreposição e encaminha as ações do usuário (`requestSend`, `dismiss`) de volta pelo coordenador usando o token da sessão. Ele nunca gerencia o estado da sessão.
- O pressionar para falar (`VoicePushToTalk.begin()`) adota qualquer texto visível na sobreposição como `adoptedPrefix` (por meio de `VoiceSessionCoordinator.shared.snapshot()`), de modo que pressionar a tecla de atalho enquanto a sobreposição de ativação está visível preserva o texto e acrescenta a nova fala. Ao soltar a tecla, ele aguarda até 1.5s por uma transcrição final antes de recorrer ao texto atual.
- Em `dismiss`, a sobreposição chama `VoiceSessionCoordinator.overlayDidDismiss`, que aciona `VoiceWakeRuntime.refresh(state:)` para que o fechamento manual pelo X, o fechamento por texto vazio e o fechamento após o envio retomem a escuta da palavra de ativação.
- Caminho de envio unificado: se o texto sem espaços em branco nas extremidades estiver vazio, fecha; caso contrário, `sendNow` reproduz o som de envio uma vez, encaminha por meio de `VoiceWakeForwarder` e então fecha.

## Registro em log

O subsistema de voz é `ai.openclaw`; cada componente registra em sua própria categoria:

| Categoria               | Componente                                      |
| ----------------------- | ----------------------------------------------- |
| `voicewake.coordinator` | `VoiceSessionCoordinator`                       |
| `voicewake.overlay`     | `VoiceWakeOverlayController`/`VoiceWakeOverlay` |
| `voicewake.ptt`         | Tecla de atalho e captura do pressionar para falar |
| `voicewake.runtime`     | Runtime da palavra de ativação                  |
| `voicewake.chime`       | Reprodução do som                               |
| `voicewake.sync`        | Sincronização das configurações globais         |
| `voicewake.forward`     | Encaminhamento da transcrição                   |
| `voicewake.meter`       | Monitor do nível do microfone                   |

## Lista de verificação para depuração

- Transmita os logs durante a reprodução de uma sobreposição persistente:

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- Verifique se há apenas um token de sessão ativo; retornos de chamada obsoletos são descartados pelo coordenador.
- Confirme que, ao soltar a tecla do pressionar para falar, `end()` sempre seja chamado com o token ativo; se o texto estiver vazio, espere um fechamento sem som nem envio.

## Relacionado

- [Aplicativo para macOS](/pt-BR/platforms/macos)
- [Ativação por voz (macOS)](/pt-BR/platforms/mac/voicewake)
- [Modo de conversa](/pt-BR/nodes/talk)
