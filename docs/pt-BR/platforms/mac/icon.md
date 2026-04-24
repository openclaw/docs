---
read_when:
    - Alterando o comportamento do ícone da barra de menus
summary: Estados e animações do ícone da barra de menus do OpenClaw no macOS
title: Ícone da barra de menus
x-i18n:
    generated_at: "2026-04-24T06:01:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6900d702358afcf0481f713ea334236e1abf973d0eeff60eaf0afcf88f9327b2
    source_path: platforms/mac/icon.md
    workflow: 15
---

# Estados do ícone da barra de menus

Autor: steipete · Atualizado: 2025-12-06 · Escopo: app macOS (`apps/macos`)

- **Idle:** animação normal do ícone (piscar, leve balançar ocasional).
- **Paused:** o item de status usa `appearsDisabled`; sem movimento.
- **Voice trigger (orelhas grandes):** o detector de voice wake chama `AppState.triggerVoiceEars(ttl: nil)` quando a palavra de ativação é ouvida, mantendo `earBoostActive=true` enquanto a fala é capturada. As orelhas aumentam (1.9x), ganham furos circulares para legibilidade e depois voltam ao normal via `stopVoiceEars()` após 1s de silêncio. Disparado apenas pelo pipeline de voz no app.
- **Working (agente em execução):** `AppState.isWorking=true` aciona um micromovimento de “correria de cauda/perna”: movimento mais rápido das pernas e leve deslocamento enquanto o trabalho está em andamento. Atualmente é alternado em torno das execuções de agente do WebChat; adicione o mesmo controle em outras tarefas longas quando você conectá-las.

Pontos de ligação

- Voice wake: runtime/tester chama `AppState.triggerVoiceEars(ttl: nil)` no disparo e `stopVoiceEars()` após 1s de silêncio para corresponder à janela de captura.
- Atividade do agente: defina `AppStateStore.shared.setWorking(true/false)` em torno de intervalos de trabalho (já feito na chamada do agente WebChat). Mantenha os intervalos curtos e redefina em blocos `defer` para evitar animações travadas.

Formas e tamanhos

- Ícone base desenhado em `CritterIconRenderer.makeIcon(blink:legWiggle:earWiggle:earScale:earHoles:)`.
- A escala das orelhas usa `1.0` por padrão; o boost de voz define `earScale=1.9` e ativa `earHoles=true` sem alterar o quadro geral (imagem template de 18×18 pt renderizada em um backing store Retina de 36×36 px).
- Scurry usa movimento de pernas até ~1.0 com uma pequena oscilação horizontal; é aditivo a qualquer balançar idle existente.

Observações de comportamento

- Não há alternância externa por CLI/broker para ears/working; mantenha isso interno aos sinais do próprio app para evitar oscilações acidentais.
- Mantenha TTLs curtos (&lt;10s) para que o ícone volte rapidamente à linha de base se uma tarefa travar.

## Relacionados

- [Menu bar](/pt-BR/platforms/mac/menu-bar)
- [macOS app](/pt-BR/platforms/macos)
