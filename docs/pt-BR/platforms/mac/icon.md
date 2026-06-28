---
read_when:
    - Alterando o comportamento do ícone da barra de menus
summary: Estados e animações do ícone da barra de menus do OpenClaw no macOS
title: Ícone da barra de menus
x-i18n:
    generated_at: "2026-05-06T06:03:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5497927721ff7486e9585a8a3edc2d5140408b2b0707acdcef2388e87bca20ec
    source_path: platforms/mac/icon.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# Estados do ícone da barra de menus

Autor: steipete · Atualizado: 2025-12-06 · Escopo: app para macOS (`apps/macos`)

- **Ocioso:** Animação normal do ícone (piscar, balanço ocasional).
- **Pausado:** O item de status usa `appearsDisabled`; sem movimento.
- **Acionador de voz (orelhas grandes):** O detector de ativação por voz chama `AppState.triggerVoiceEars(ttl: nil)` quando a palavra de ativação é ouvida, mantendo `earBoostActive=true` enquanto a fala é capturada. As orelhas aumentam de escala (1,9x), recebem furos circulares para facilitar a leitura e depois retornam via `stopVoiceEars()` após 1s de silêncio. Acionado somente pelo pipeline de voz dentro do app.
- **Trabalhando (agente em execução):** `AppState.isWorking=true` aciona uma micromovimentação de "corrida da cauda/perna": balanço mais rápido da perna e leve deslocamento enquanto o trabalho está em andamento. Atualmente alternado em torno das execuções do agente do WebChat; adicione a mesma alternância em torno de outras tarefas longas quando conectá-las.

Pontos de conexão

- Ativação por voz: a chamada de runtime/testador usa `AppState.triggerVoiceEars(ttl: nil)` no acionamento e `stopVoiceEars()` após 1s de silêncio para corresponder à janela de captura.
- Atividade do agente: defina `AppStateStore.shared.setWorking(true/false)` em torno dos intervalos de trabalho (já feito na chamada do agente do WebChat). Mantenha os intervalos curtos e redefina em blocos `defer` para evitar animações travadas.

Formas e tamanhos

- Ícone base desenhado em `CritterIconRenderer.makeIcon(blink:legWiggle:earWiggle:earScale:earHoles:)`.
- A escala das orelhas é `1.0` por padrão; o reforço de voz define `earScale=1.9` e alterna `earHoles=true` sem alterar o quadro geral (imagem de modelo de 18×18 pt renderizada em um armazenamento de apoio Retina de 36×36 px).
- A corrida usa balanço da perna até ~1,0 com uma pequena oscilação horizontal; é aditiva a qualquer balanço ocioso existente.

Observações comportamentais

- Sem alternância externa de CLI/broker para orelhas/trabalho; mantenha isso interno aos próprios sinais do app para evitar oscilação acidental.
- Mantenha os TTLs curtos (&lt;10s) para que o ícone retorne rapidamente ao estado inicial se uma tarefa travar.

## Relacionados

- [Barra de menus](/pt-BR/platforms/mac/menu-bar)
- [App para macOS](/pt-BR/platforms/macos)
