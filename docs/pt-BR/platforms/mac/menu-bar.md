---
read_when:
    - Ajustando a UI do menu do Mac ou a lógica de status
summary: Lógica de status da barra de menu e o que é apresentado aos usuários
title: Barra de menus
x-i18n:
    generated_at: "2026-05-06T06:03:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: c569ced20b2f6a639d52d373cc8b55a42d7c015a0b234d5154ce67ac03c2eaf6
    source_path: platforms/mac/menu-bar.md
    workflow: 16
---

## O que é exibido

- Exibimos o estado atual de trabalho do agente no ícone da barra de menus e na primeira linha de status do menu.
- O status de integridade fica oculto enquanto há trabalho ativo; ele retorna quando todas as sessões estão ociosas.
- Um submenu raiz "Contexto" contém sessões recentes em vez de expandi-las diretamente no menu raiz.
- O bloco "Nodes" no menu raiz lista apenas **dispositivos** (nodes pareados via `node.list`), não entradas de cliente/presença.
- Uma seção raiz "Uso" aparece abaixo de Contexto quando instantâneos de uso do provedor estão disponíveis, seguida por detalhes de custo de uso quando disponíveis.

## Modelo de estado

- Sessões: eventos chegam com `runId` (por execução) mais `sessionKey` no payload. A sessão "principal" é a chave `main`; se ausente, usamos como fallback a sessão atualizada mais recentemente.
- Prioridade: a principal sempre vence. Se a principal estiver ativa, seu estado é exibido imediatamente. Se a principal estiver ociosa, a sessão não principal ativa mais recentemente é exibida. Não alternamos durante a atividade; só trocamos quando a sessão atual fica ociosa ou a principal se torna ativa.
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
- `workingMain`: selo com glifo, matiz completo, animação de perna "trabalhando".
- `workingOther`: selo com glifo, matiz atenuado, sem correr.
- `overridden`: usa o glifo/matiz escolhido independentemente da atividade.

## Submenu Contexto

- O menu raiz mostra uma linha "Contexto" com uma contagem/status de sessões e abre um submenu.
- O cabeçalho do submenu Contexto mostra a contagem de sessões ativas nas últimas 24 horas.
- Cada linha de sessão mantém sua barra de tokens, idade, prévia, pensando/verboso, ações de redefinir, compactar e excluir.
- Mensagens de carregamento, desconexão e erro de carregamento de sessão aparecem dentro do submenu Contexto.
- Detalhes de uso do provedor e custo de uso permanecem no nível raiz abaixo de Contexto para continuarem visíveis rapidamente sem abrir o submenu.

## Texto da linha de status (menu)

- Enquanto há trabalho ativo: `<Session role> · <activity label>`
  - Exemplos: `Main · exec: pnpm test`, `Other · read: apps/macos/Sources/OpenClaw/AppState.swift`.
- Quando ocioso: usa como fallback o resumo de integridade.

## Ingestão de eventos

- Fonte: eventos `agent` do canal de controle (`ControlChannel.handleAgentEvent`).
- Campos analisados:
  - `stream: "job"` com `data.state` para início/parada.
  - `stream: "tool"` com `data.phase`, `name`, `meta`/`args` opcionais.
- Rótulos:
  - `exec`: primeira linha de `args.command`.
  - `read`/`write`: caminho encurtado.
  - `edit`: caminho mais tipo de alteração inferido a partir de `meta`/contagens de diff.
  - fallback: nome da ferramenta.

## Substituição de depuração

- Ajustes ▸ Depuração ▸ seletor "Substituição de ícone":
  - `System (auto)` (padrão)
  - `Working: main` (por tipo de ferramenta)
  - `Working: other` (por tipo de ferramenta)
  - `Idle`
- Armazenado via `@AppStorage("iconOverride")`; mapeado para `IconState.overridden`.

## Checklist de teste

- Acionar job da sessão principal: verifique se o ícone muda imediatamente e se a linha de status mostra o rótulo principal.
- Acionar job de sessão não principal enquanto a principal está ociosa: ícone/status mostra a não principal; permanece estável até terminar.
- Iniciar a principal enquanto outra está ativa: o ícone muda para a principal instantaneamente.
- Rajadas rápidas de ferramentas: garanta que o selo não pisque (graça de TTL em resultados de ferramentas).
- A linha de integridade reaparece quando todas as sessões ficam ociosas.

## Relacionado

- [app macOS](/pt-BR/platforms/macos)
- [Ícone da barra de menus](/pt-BR/platforms/mac/icon)
