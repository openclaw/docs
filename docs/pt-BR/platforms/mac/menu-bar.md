---
read_when:
    - Ajustando a interface do menu do macOS ou a lógica de status
summary: Lógica de status da barra de menus e o que é exibido aos usuários
title: Barra de menus
x-i18n:
    generated_at: "2026-07-12T15:21:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 480a85f383a6495c0e45850a322c0c67c4cc35e21d2d29b4bd86f42fdbf9430a
    source_path: platforms/mac/menu-bar.md
    workflow: 16
---

## O que é exibido

- O estado de trabalho atual do agente é exibido no ícone da barra de menus e na primeira linha de status do menu.
- O status de integridade fica oculto enquanto há trabalho ativo; ele volta a ser exibido quando todas as sessões ficam ociosas.
- Um item "Contexto" na raiz abre um submenu com as sessões recentes, em vez de expandi-las no menu raiz.
- Um bloco "Nodes" no menu raiz lista apenas **dispositivos** pareados (de `node.list`), e não entradas de cliente/presença.
- Uma seção "Uso" na raiz aparece abaixo de Contexto quando há snapshots de uso do provedor disponíveis, seguida pelos detalhes de custo, quando disponíveis.

## Modelo de estado

- Origem: `WorkActivityStore` (`apps/macos/Sources/OpenClaw/WorkActivityStore.swift`).
- Os eventos chegam como `ControlAgentEvent` com um `runId`; o manipulador (`ControlChannel.routeWorkActivity`) lê `sessionKey` da carga útil do evento e usa `"main"` como padrão quando ele está ausente.
- Prioridade: a sessão principal (`sessionKey == "main"` por padrão) sempre prevalece. Se a sessão principal estiver ativa, seu estado será exibido imediatamente. Se estiver ociosa, será exibida a sessão não principal que esteve ativa mais recentemente. O armazenamento não alterna durante uma atividade; ele só muda quando a sessão atual fica ociosa ou quando a sessão principal se torna ativa.
- Tipos de atividade:
  - `job`: execução de comando de alto nível (`state: started|streaming|done|error|...`).
  - `tool`: `phase: start|result` com `name` e `meta`/`args` opcionais.

## Enum IconState (Swift)

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)` (substituição para depuração)

### ActivityKind -> símbolo do emblema

`ActivityKind` encapsula um `ToolKind` (`bash`, `read`, `write`, `edit`, `attach`, `other`) ou um `job` simples. Cada um é mapeado para um emblema de SF Symbol desenhado sobre o ícone da criatura (`IconState.badgeSymbolName`):

| Tipo            | Símbolo                            |
| --------------- | ---------------------------------- |
| `bash`          | `chevron.left.slash.chevron.right` |
| `read`          | `doc`                              |
| `write`         | `pencil`                           |
| `edit`          | `pencil.tip`                       |
| `attach`        | `paperclip`                        |
| `other` / `job` | `gearshape.fill`                   |

### Mapeamento visual

- `idle`: criatura normal, sem emblema.
- `workingMain`: emblema com símbolo, tonalidade integral (destaque `.primary`), animação de "trabalho" das pernas.
- `workingOther`: emblema com símbolo, tonalidade atenuada (destaque `.secondary`), sem movimento rápido.
- `overridden`: usa o símbolo e a tonalidade escolhidos, independentemente da atividade real.

## Submenu de contexto

- O menu raiz mostra uma linha "Contexto" com a contagem/status das sessões; ela abre um submenu (`MenuSessionsInjector`).
- O cabeçalho do submenu mostra a contagem de sessões ativas nas últimas 24 horas.
- Cada linha de sessão mantém sua barra de tokens, tempo decorrido, prévia, alternância entre raciocínio/detalhamento e ações de redefinir, compactar e excluir.
- As mensagens de carregamento, desconexão e erro ao carregar sessões são exibidas dentro do submenu de contexto.
- As seções de uso e custo permanecem no nível raiz abaixo de Contexto para que possam ser consultadas rapidamente sem abrir o submenu.

## Texto da linha de status (menu)

- Enquanto o trabalho está em andamento: `<Session role> · <activity label>` (`"\(roleLabel) · \(activity.label)"` em `MenuContentView`), em que o rótulo da função é `Main` ou `Other`.
- Quando ocioso: volta para o resumo de integridade.

## Ingestão de eventos

- Origem: eventos `agent` do canal de controle, encaminhados por `ControlChannel.routeWorkActivity(from:)`.
- Campos analisados:
  - `stream: "job"` com `data.state` para início/parada.
  - `stream: "tool"` com `data.phase`, `data.name` e `data.meta`/`data.args` opcionais.
- Os rótulos das ferramentas vêm de `ToolDisplayRegistry.resolve(name:args:meta:)`; nomes não resolvidos usam o nome bruto da ferramenta como alternativa.

## Substituição de depuração

- Seletor Settings > Debug > "Icon override":
  - `System (auto)` (padrão)
  - `Working: main` / `Working: other` (por tipo de ferramenta: bash, leitura, gravação, edição, outro)
  - `Idle`
- Armazenado na chave `openclaw.iconOverride` de `UserDefaults`; mapeado para `IconState.overridden`.

## Lista de verificação de testes

- Acione uma tarefa da sessão principal: o ícone muda imediatamente e a linha de status exibe o rótulo principal.
- Acione uma tarefa de uma sessão não principal enquanto a principal estiver ociosa: o ícone/status exibe a sessão não principal e permanece estável até que ela termine.
- Inicie a sessão principal enquanto outra sessão estiver ativa: o ícone muda instantaneamente para a principal.
- Rajadas rápidas de ferramentas: o indicador não pisca (janela de tolerância de 2s antes de limpar uma ferramenta concluída, `WorkActivityStore.toolResultGrace`).
- A linha de integridade reaparece quando todas as sessões ficam ociosas.

## Relacionados

- [Aplicativo para macOS](/pt-BR/platforms/macos)
- [Ícone da barra de menus](/pt-BR/platforms/mac/icon)
