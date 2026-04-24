---
read_when:
    - Ajustando a UI ou a lógica de status do menu do Mac
summary: Lógica de status da barra de menu e o que é exibido aos usuários
title: Barra de menu
x-i18n:
    generated_at: "2026-04-24T06:01:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89b03f3b0f9e56057d4cbf10bd1252372c65a2b2ae5e0405a844e9a59b51405d
    source_path: platforms/mac/menu-bar.md
    workflow: 15
---

# Lógica de status da barra de menu

## O que é mostrado

- Exibimos o estado atual de trabalho do agente no ícone da barra de menu e na primeira linha de status do menu.
- O status de integridade fica oculto enquanto o trabalho está ativo; ele retorna quando todas as sessões estão ociosas.
- O bloco “Nodes” no menu lista apenas **dispositivos** (Nodes pareados via `node.list`), não entradas de cliente/presença.
- Uma seção “Usage” aparece em Context quando snapshots de uso do provedor estão disponíveis.

## Modelo de estado

- Sessões: os eventos chegam com `runId` (por execução) mais `sessionKey` no payload. A sessão “main” é a chave `main`; se estiver ausente, usamos fallback para a sessão atualizada mais recentemente.
- Prioridade: main sempre vence. Se main estiver ativa, seu estado é mostrado imediatamente. Se main estiver ociosa, a sessão não-main ativa mais recentemente é mostrada. Não fazemos flip-flop no meio da atividade; só trocamos quando a sessão atual fica ociosa ou quando main se torna ativa.
- Tipos de atividade:
  - `job`: execução de comando em alto nível (`state: started|streaming|done|error`).
  - `tool`: `phase: start|result` com `toolName` e `meta/args`.

## Enum `IconState` (Swift)

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)` (substituição de depuração)

### `ActivityKind` → glifo

- `exec` → 💻
- `read` → 📄
- `write` → ✍️
- `edit` → 📝
- `attach` → 📎
- padrão → 🛠️

### Mapeamento visual

- `idle`: critter normal.
- `workingMain`: badge com glifo, tonalidade total, animação de pernas “working”.
- `workingOther`: badge com glifo, tonalidade suavizada, sem correria.
- `overridden`: usa o glifo/tonalidade escolhidos independentemente da atividade.

## Texto da linha de status (menu)

- Enquanto o trabalho está ativo: `<Session role> · <activity label>`
  - Exemplos: `Main · exec: pnpm test`, `Other · read: apps/macos/Sources/OpenClaw/AppState.swift`.
- Quando ocioso: volta ao resumo de integridade.

## Ingestão de eventos

- Origem: eventos `agent` do canal de controle (`ControlChannel.handleAgentEvent`).
- Campos analisados:
  - `stream: "job"` com `data.state` para início/parada.
  - `stream: "tool"` com `data.phase`, `name`, `meta`/`args` opcionais.
- Rótulos:
  - `exec`: primeira linha de `args.command`.
  - `read`/`write`: caminho encurtado.
  - `edit`: caminho mais tipo de alteração inferido de `meta`/contagens de diff.
  - fallback: nome da ferramenta.

## Substituição de depuração

- Settings ▸ Debug ▸ seletor “Icon override”:
  - `System (auto)` (padrão)
  - `Working: main` (por tipo de ferramenta)
  - `Working: other` (por tipo de ferramenta)
  - `Idle`
- Armazenado via `@AppStorage("iconOverride")`; mapeado para `IconState.overridden`.

## Checklist de teste

- Acione um job da sessão main: verifique se o ícone muda imediatamente e se a linha de status mostra o rótulo main.
- Acione um job de sessão não-main enquanto main estiver ociosa: ícone/status mostram a não-main; permanecem estáveis até ela terminar.
- Inicie main enquanto outra estiver ativa: o ícone muda para main instantaneamente.
- Rajadas rápidas de ferramentas: garanta que o badge não pisque (período de tolerância TTL nos resultados de ferramentas).
- A linha de integridade reaparece quando todas as sessões ficam ociosas.

## Relacionado

- [app macOS](/pt-BR/platforms/macos)
- [Ícone da barra de menu](/pt-BR/platforms/mac/icon)
