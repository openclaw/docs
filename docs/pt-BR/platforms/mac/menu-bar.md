---
read_when:
    - Ajuste da interface do menu do Mac ou da lógica de status
summary: Lógica de status da barra de menus e o que é exibido aos usuários
title: Barra de menus
x-i18n:
    generated_at: "2026-07-12T00:06:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 480a85f383a6495c0e45850a322c0c67c4cc35e21d2d29b4bd86f42fdbf9430a
    source_path: platforms/mac/menu-bar.md
    workflow: 16
---

## O que é exibido

- O estado de trabalho atual do agente é exibido no ícone da barra de menus e na primeira linha de status do menu.
- O status de integridade fica oculto enquanto há trabalho em andamento; ele retorna quando todas as sessões ficam ociosas.
- Um item "Contexto" na raiz abre um submenu com as sessões recentes, em vez de expandi-las no menu raiz.
- Um bloco "Nodes" no menu raiz lista apenas **dispositivos** pareados (de `node.list`), não entradas de cliente/presença.
- Uma seção "Uso" na raiz aparece abaixo de Contexto quando há instantâneos de uso do provedor disponíveis, seguida por detalhes de custo quando disponíveis.

## Modelo de estado

- Origem: `WorkActivityStore` (`apps/macos/Sources/OpenClaw/WorkActivityStore.swift`).
- Os eventos chegam como `ControlAgentEvent` com um `runId`; o manipulador (`ControlChannel.routeWorkActivity`) lê `sessionKey` da carga útil do evento e usa `"main"` como padrão caso esteja ausente.
- Prioridade: a sessão principal (`sessionKey == "main"` por padrão) sempre prevalece. Se a principal estiver ativa, seu estado será exibido imediatamente. Se a principal estiver ociosa, será exibida a sessão não principal ativa mais recentemente. O armazenamento não alterna durante uma atividade; ele só muda quando a sessão atual fica ociosa ou a principal se torna ativa.
- Tipos de atividade:
  - `job`: execução de comando de alto nível (`state: started|streaming|done|error|...`).
  - `tool`: `phase: start|result` com `name` e `meta`/`args` opcionais.

## Enumeração IconState (Swift)

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)` (substituição para depuração)

### ActivityKind -> símbolo do indicador

`ActivityKind` encapsula um `ToolKind` (`bash`, `read`, `write`, `edit`, `attach`, `other`) ou um `job` simples. Cada um é mapeado para um indicador de SF Symbol desenhado sobre o ícone da criatura (`IconState.badgeSymbolName`):

| Tipo            | Símbolo                            |
| --------------- | ---------------------------------- |
| `bash`          | `chevron.left.slash.chevron.right` |
| `read`          | `doc`                              |
| `write`         | `pencil`                           |
| `edit`          | `pencil.tip`                       |
| `attach`        | `paperclip`                        |
| `other` / `job` | `gearshape.fill`                   |

### Mapeamento visual

- `idle`: criatura normal, sem indicador.
- `workingMain`: indicador com símbolo, tonalidade completa (destaque `.primary`), animação de "trabalho" das pernas.
- `workingOther`: indicador com símbolo, tonalidade atenuada (destaque `.secondary`), sem movimento apressado.
- `overridden`: usa o símbolo e a tonalidade escolhidos, independentemente da atividade real.

## Submenu de contexto

- O menu raiz mostra uma linha "Contexto" com a contagem/o status das sessões; ela abre um submenu (`MenuSessionsInjector`).
- O cabeçalho do submenu mostra a contagem de sessões ativas nas últimas 24 horas.
- Cada linha de sessão mantém sua barra de tokens, idade, prévia, opção de ativar/desativar raciocínio/detalhamento e ações de redefinir, compactar e excluir.
- As mensagens de carregamento, desconexão e erro ao carregar sessões são exibidas no submenu de contexto.
- As seções de uso e custo permanecem no nível raiz, abaixo de Contexto, para que continuem visíveis rapidamente sem abrir o submenu.

## Texto da linha de status (menu)

- Enquanto o trabalho estiver ativo: `<Session role> · <activity label>` (`"\(roleLabel) · \(activity.label)"` em `MenuContentView`), em que o rótulo da função é `Main` ou `Other`.
- Quando estiver ocioso: volta para o resumo de integridade.

## Ingestão de eventos

- Origem: eventos `agent` do canal de controle, encaminhados por `ControlChannel.routeWorkActivity(from:)`.
- Campos analisados:
  - `stream: "job"` com `data.state` para início/interrupção.
  - `stream: "tool"` com `data.phase`, `data.name` e, opcionalmente, `data.meta`/`data.args`.
- Os rótulos das ferramentas vêm de `ToolDisplayRegistry.resolve(name:args:meta:)`; nomes não resolvidos usam o nome bruto da ferramenta como alternativa.

## Substituição para depuração

- Seletor Settings > Debug > "Icon override":
  - `System (auto)` (padrão)
  - `Working: main` / `Working: other` (por tipo de ferramenta: bash, leitura, gravação, edição, outro)
  - `Idle`
- Armazenado na chave `openclaw.iconOverride` de `UserDefaults`; mapeado para `IconState.overridden`.

## Lista de verificação de testes

- Acione um trabalho da sessão principal: o ícone muda imediatamente e a linha de status exibe o rótulo principal.
- Acione um trabalho de uma sessão não principal enquanto a principal estiver ociosa: o ícone/status exibe a sessão não principal e permanece estável até a conclusão.
- Inicie a sessão principal enquanto outra sessão estiver ativa: o ícone muda instantaneamente para a principal.
- Rajadas rápidas de ferramentas: o indicador não pisca (janela de tolerância de 2 s antes de limpar uma ferramenta concluída, `WorkActivityStore.toolResultGrace`).
- A linha de integridade reaparece quando todas as sessões ficam ociosas.

## Relacionado

- [Aplicativo para macOS](/pt-BR/platforms/macos)
- [Ícone da barra de menus](/pt-BR/platforms/mac/icon)
