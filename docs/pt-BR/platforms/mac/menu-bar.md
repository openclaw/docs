---
read_when:
    - Ajustando a interface do menu do Mac ou a lógica de status
summary: Lógica de status da barra de menus e o que é exibido aos usuários
title: Barra de menus
x-i18n:
    generated_at: "2026-05-02T05:50:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 340b86a2e222fb1fe7fda4f0f0434127af1393a64348ea033ea284ba52866beb
    source_path: platforms/mac/menu-bar.md
    workflow: 16
---

# Lógica de status da barra de menus

## O que é mostrado

- Exibimos o estado de trabalho atual do agente no ícone da barra de menus e na primeira linha de status do menu.
- O status de integridade fica oculto enquanto há trabalho ativo; ele retorna quando todas as sessões estão ociosas.
- Um submenu raiz “Contexto” contém sessões recentes em vez de expandi-las diretamente no menu raiz.
- O bloco “Nodes” no menu raiz lista apenas **dispositivos** (nodes pareados via `node.list`), não entradas de cliente/presença.
- Uma seção raiz “Uso” aparece abaixo de Contexto quando snapshots de uso do provedor estão disponíveis, seguida por detalhes de custo de uso quando disponíveis.

## Modelo de estado

- Sessões: eventos chegam com `runId` (por execução) mais `sessionKey` no payload. A sessão “main” é a chave `main`; se estiver ausente, recorremos à sessão atualizada mais recentemente.
- Prioridade: main sempre vence. Se main estiver ativa, seu estado é mostrado imediatamente. Se main estiver ociosa, a sessão não main ativa mais recentemente é mostrada. Não alternamos durante a atividade; só trocamos quando a sessão atual fica ociosa ou main se torna ativa.
- Tipos de atividade:
  - `job`: execução de comando de alto nível (`state: started|streaming|done|error`).
  - `tool`: `phase: start|result` com `toolName` e `meta/args`.

## Enum IconState (Swift)

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)` (substituição de depuração)

### ActivityKind → glifo

- `exec` → 💻
- `read` → 📄
- `write` → ✍️
- `edit` → 📝
- `attach` → 📎
- padrão → 🛠️

### Mapeamento visual

- `idle`: criatura normal.
- `workingMain`: badge com glifo, tonalidade completa, animação de perna “trabalhando”.
- `workingOther`: badge com glifo, tonalidade atenuada, sem correria.
- `overridden`: usa o glifo/tonalidade escolhidos independentemente da atividade.

## Submenu de contexto

- O menu raiz mostra uma linha “Contexto” com uma contagem/status de sessões e abre um submenu.
- O cabeçalho do submenu de contexto mostra a contagem de sessões ativas nas últimas 24 horas.
- Cada linha de sessão mantém sua barra de tokens, idade, prévia, ações de pensamento/detalhado, redefinir, compactar e excluir.
- Mensagens de carregamento, desconexão e erro ao carregar sessão aparecem dentro do submenu de contexto.
- Os detalhes de uso do provedor e custo de uso permanecem no nível raiz abaixo de Contexto, para que continuem visíveis rapidamente sem abrir o submenu.

## Texto da linha de status (menu)

- Enquanto o trabalho estiver ativo: `<Session role> · <activity label>`
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
  - `edit`: caminho mais o tipo de alteração inferido de `meta`/contagens de diff.
  - fallback: nome da ferramenta.

## Substituição de depuração

- Seletor Configurações ▸ Depuração ▸ “Substituição de ícone”:
  - `System (auto)` (padrão)
  - `Working: main` (por tipo de ferramenta)
  - `Working: other` (por tipo de ferramenta)
  - `Idle`
- Armazenado via `@AppStorage("iconOverride")`; mapeado para `IconState.overridden`.

## Lista de verificação de testes

- Acione um trabalho da sessão principal: verifique se o ícone muda imediatamente e se a linha de status mostra o rótulo principal.
- Acione um trabalho de sessão não principal enquanto a principal estiver ociosa: o ícone/status mostra a não principal; permanece estável até terminar.
- Inicie a principal enquanto outra estiver ativa: o ícone muda para a principal instantaneamente.
- Rajadas rápidas de ferramentas: garanta que o emblema não pisque (carência de TTL nos resultados de ferramentas).
- A linha de integridade reaparece quando todas as sessões ficam ociosas.

## Relacionado

- [aplicativo macOS](/pt-BR/platforms/macos)
- [Ícone da barra de menus](/pt-BR/platforms/mac/icon)
