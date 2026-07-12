---
read_when:
    - Alteração do comportamento do ícone da barra de menus
summary: Estados e animações do ícone da barra de menus do OpenClaw no macOS
title: Ícone da barra de menus
x-i18n:
    generated_at: "2026-07-12T15:24:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8a38f1253f0c376ef2ce6c0ae339b67084c472c764964bcc7ad21e10133e2b47
    source_path: platforms/mac/icon.md
    workflow: 16
---

# Estados do ícone da barra de menus

Escopo: aplicativo para macOS (`apps/macos`). Renderização: `CritterIconRenderer.makeIcon(...)`. Vinculação de animação/estado: `CritterStatusLabel` + `CritterStatusLabel+Behavior.swift`.

## Estados

| Estado                   | Acionador                                 | Visual                                                                                                       |
| ------------------------ | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Ocioso                   | Padrão                                    | Animação normal de piscar/balançar; os olhos abertos mantêm um reflexo brilhante                             |
| Pausado                  | `isPaused=true`                           | As antenas ficam caídas ("fora de serviço") com os olhos abertos; sem movimento                              |
| Dormindo                 | Gateway desconectado/não configurado      | As antenas ficam caídas e os olhos se fecham, formando pálpebras `⌣ ⌣`; sem movimento                        |
| Comemoração              | Mensagem enviada (`sendCelebrationTick`)  | Os olhos exibem arcos alegres `∩ ∩` por ~0.9s, acompanhados de um chute com a perna                           |
| Ativação por voz (orelhas grandes) | Palavra de ativação detectada             | As antenas ficam eretas e mais altas (`earScale=1.9`); voltam ao normal após o silêncio                       |
| Trabalhando              | `isWorking=true` ou um `IconState` ativo  | Movimento mais rápido das pernas (`legWiggle` até `1.0`) e um pequeno deslocamento horizontal; somado ao balanço ocioso |

Um indicador de atividade de ferramenta (disco com SF Symbol, por exemplo, `chevron.left.slash.chevron.right` para execução) pode ser renderizado sobre o mesmo ícone da criatura quando uma sessão tem um trabalho ou uma ferramenta ativa. Esse indicador é fornecido por `IconState`/`ActivityKind`; consulte [Barra de menus](/pt-BR/platforms/mac/menu-bar) para ver o modelo de estados completo.

## Orelhas de ativação por voz

- Acionador: `AppStateStore.shared.triggerVoiceEars(ttl: nil)`, chamado pelo pipeline de captura de ativação por voz (`VoiceWakeRuntime`) e pelas ferramentas de depuração/teste de ativação por voz (`VoiceWakeTester`, `VoiceWakeOverlayController`).
- Interrupção: `stopVoiceEars()`, chamado quando a captura é finalizada.
- Janela de silêncio antes da finalização: normalmente `2.0s`; `5.0s` se apenas a palavra de ativação tiver sido detectada, sem nenhuma fala posterior (`VoiceWakeRuntime.silenceWindow` / `triggerOnlySilenceWindow`).
- Enquanto o destaque está ativo, os temporizadores de piscar/balançar/pernas/orelhas do estado ocioso ficam suspensos (`earBoostActive` controla a tarefa de animação em `CritterStatusLabel+Behavior`).

## Formas e tamanhos

- Tela: imagem de modelo de 18x18pt, renderizada em um armazenamento de bitmap de 36x36px (2x) para que o ícone permaneça nítido em telas Retina.
- A escala padrão das orelhas é `1.0`; o destaque de voz define `earScale=1.9` sem alterar o quadro geral.
- `antennaDroop` (0-1) dobra as antenas para baixo nas poses pausada e dormindo.
- O movimento rápido das pernas usa `legWiggle` até `1.0`, com uma pequena oscilação horizontal.

## Observações comportamentais

- Não há alternância externa por CLI/broker para as orelhas nem para o estado de trabalho; ambos são controlados internamente por sinais do aplicativo (`AppState.setWorking`, `AppState.triggerVoiceEars`) para evitar oscilações acidentais.
- Mantenha qualquer novo TTL curto (bem abaixo de 10s) para que o ícone retorne rapidamente ao estado inicial caso um trabalho fique travado.

## Relacionados

- [Barra de menus](/pt-BR/platforms/mac/menu-bar)
- [Aplicativo para macOS](/pt-BR/platforms/macos)
