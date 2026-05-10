---
read_when:
    - Auditando por que a refatoração de entrada de canais adicionou código demais
    - Mover políticas de rota, comando, evento, ativação ou grupo de acesso de plugins incluídos para o núcleo
    - Revisando se um auxiliar de ingresso de canal realmente exclui o código de Plugin incluído
sidebarTitle: Ingress core deletion
summary: Plano com prioridade à remoção para mover o código de integração repetido de entrada de canais para o núcleo.
title: Plano de exclusão do núcleo de entrada
x-i18n:
    generated_at: "2026-05-10T19:48:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71afcf5d4f58c57ecfe7b388325279700a723ec1fcd926f644095106b662c3d0
    source_path: refactor/ingress-core.md
    workflow: 16
---

# Plano de exclusão do núcleo de entrada

A refatoração de entrada não está saudável enquanto adiciona milhares de linhas
líquidas. A centralização no núcleo só conta quando o código de produção de
Plugins incluídos fica menor e a compatibilidade antiga do SDK de terceiros fica
confinada a shims de SDK/núcleo.

Forma desejada em runtime:

```text
bundled plugin event
  -> extract platform facts locally
  -> resolve shared ingress once when facts are available
  -> branch on generic ingress projections/outcomes
  -> perform platform side effects locally

old third-party helper
  -> SDK compatibility shim
  -> shared ingress-compatible projection where possible
  -> old return shape preserved
```

Plugins incluídos não devem traduzir a entrada de volta para formatos locais de
`AccessResult`, `GroupAccessDecision`, `CommandAuthDecision`, `DmCommandAccess`
ou `{ allowed, reasonCode }`, a menos que esse tipo seja uma API pública de
Plugin.

## Orçamento

Medido em relação à base de merge do PR com `origin/main`, incluindo arquivos
não rastreados.

```text
merge-base            1671e7532adb

current:
core production       +3,922 / -546    = +3,376
docs                  +601 / -17       = +584
other                 +145 / -2        = +143
plugin production     +4,148 / -5,388  = -1,240
tests                 +2,326 / -2,414  = -88
total                 +11,142 / -8,367 = +2,775

required:
plugin production     <= -1,500
core production       <= +1,500, or paid for by larger plugin deletion
tests                 <= +1,000
total                 <= +2,000

stretch:
plugin production     <= -2,500
core production       <= +1,200
total                 <= 0
```

Limpeza mínima restante:

```text
plugin production     needs 260 more net deleted lines
total                 needs 775 more net deleted lines
core production       still +1,876 over standalone budget, unless paid down by plugin deletion
```

A exclusão apenas de comentários não conta como limpeza. A passagem anterior do
orçamento foi generosa demais porque incluiu comentários explicativos restaurados
do QQBot; este documento acompanha apenas a movimentação de código executável,
documentação e testes.

Meça novamente após cada onda de limpeza:

```sh
base=$(git merge-base HEAD origin/main)
git diff --shortstat "$base"
git diff --numstat "$base" -- src/channels/message-access src/plugin-sdk extensions | sort -nr -k1 | head -n 80
pnpm lint:extensions:no-deprecated-channel-access
```

## Diagnóstico

A primeira passagem adicionou o kernel compartilhado de entrada e depois deixou
autorização local demais nos Plugins ao lado dele:

```text
platform facts
  -> shared ingress state and decision
  -> plugin-local DTO or legacy projection
  -> plugin-local if/else ladder
```

Isso duplica o modelo. A produção do núcleo cresceu cerca de 3.376 linhas,
enquanto a produção dos Plugins incluídos ficou 1.240 linhas menor. Isso é melhor
do que a primeira passagem, mas ainda não está dentro do orçamento mínimo. A
correção continua sendo priorizar exclusão:

- excluir DTOs de Plugin que apenas renomeiam campos de entrada
- excluir testes que apenas verificam o formato de wrappers
- adicionar helpers de núcleo somente quando o mesmo patch excluir código de Plugins incluídos
- manter a compatibilidade antiga do SDK apenas em shims de SDK/núcleo
- recompactar o núcleo depois que a exclusão de wrappers expuser o formato estável

## Pontos Críticos

Arquivos positivos de produção incluída que ainda precisam encolher:

```text
extensions/telegram/src/ingress.ts                        +126
extensions/discord/src/monitor/dm-command-auth.ts         +101
extensions/signal/src/monitor/access-policy.ts             +92
extensions/feishu/src/policy.ts                            +85
extensions/slack/src/monitor/auth.ts                       +64
extensions/googlechat/src/monitor-access.ts                +59
extensions/nextcloud-talk/src/inbound.ts                   +51
extensions/matrix/src/matrix/monitor/access-state.ts       +49
extensions/irc/src/inbound.ts                              +44
extensions/imessage/src/monitor/inbound-processing.ts      +36
extensions/qa-channel/src/inbound.ts                       +34
extensions/qqbot/src/bridge/sdk-adapter.ts                 +33
extensions/tlon/src/monitor/utils.ts                       +30
extensions/twitch/src/access-control.ts                    +22
extensions/qqbot/src/engine/commands/slash-command-handler.ts +20
extensions/telegram/src/bot-handlers.runtime.ts            +19
```

A branch ainda não está dentro do orçamento mínimo. O trabalho restante relevante
para revisão deve excluir fluxo de autorização repetido, scaffolding de turnos ou
testes de wrappers antes de adicionar outra abstração ao núcleo.

## Leitura Atual do Código

A divisa saudável do núcleo já existe em `src/channels/message-access/runtime.ts`:
ela é responsável por adaptadores de identidade, allowlists efetivas, leituras do
armazenamento de pareamento, descritores de rota, presets de comandos/eventos,
grupos de acesso e a projeção final resolvida
`ResolvedChannelMessageIngress`.

O crescimento restante é principalmente cola de Plugin sobreposta a essa divisa:

- `extensions/telegram/src/ingress.ts` encapsula decisões do núcleo em helpers
  específicos do Telegram para comandos/eventos, e os locais de chamada ainda
  passam allowlists normalizadas e listas de proprietários pré-computadas.
- `extensions/discord/src/monitor/dm-command-auth.ts`,
  `extensions/feishu/src/policy.ts`, `extensions/googlechat/src/monitor-access.ts`
  e `extensions/matrix/src/matrix/monitor/access-state.ts` ainda mantêm
  DTOs de política locais ou nomes de decisão legados ao lado da entrada.
- `extensions/signal/src/monitor/access-policy.ts` mantém corretamente a
  normalização de identidade do Signal e respostas de pareamento locais, mas
  ainda tem uma divisa de wrapper que deve colapsar para consumo direto da
  entrada.
- `extensions/nextcloud-talk/src/inbound.ts`, `extensions/irc/src/inbound.ts`,
  `extensions/qa-channel/src/inbound.ts`, `extensions/zalo/src/monitor.ts` e
  `extensions/zalouser/src/monitor.ts` ainda repetem a montagem de
  rota/envelope/turno que pode ir para helpers de turno compartilhados fora do
  kernel de entrada.

Conclusão: mover mais código para o núcleo só é útil se isso excluir essas
camadas de wrappers de Plugin no mesmo patch. Adicionar outra abstração enquanto
mantém retornos de wrappers repete o erro.

## Limite

O núcleo é responsável pela política genérica:

- normalização e correspondência de allowlist
- expansão e diagnósticos de grupos de acesso
- leituras de allowlist de DM no armazenamento de pareamento
- portões de rota, remetente, comando, evento e ativação
- mapeamento de admissão: despachar, descartar, pular, observar, pareamento
- estado redigido, decisões, diagnósticos e projeções de compatibilidade do SDK
- descritores genéricos reutilizáveis para identidade, rota, comando, evento,
  ativação e resultados

Plugins são responsáveis por fatos de transporte e efeitos colaterais:

- autenticidade de webhook/socket/requisição
- extração de identidade da plataforma e consultas de API
- padrões de política específicos do canal
- entrega de desafios de pareamento, respostas, confirmações, reações, digitação,
  mídia, histórico, configuração, doctor, status, logs e texto voltado ao usuário

O núcleo deve permanecer agnóstico a canais: nada de Discord, Slack, Telegram,
Matrix, sala, guilda, espaço, cliente de API ou padrão específico de Plugin em
`src/channels/message-access`.

## Regra de Aceitação

Todo novo helper do núcleo deve excluir imediatamente código de produção de
Plugins incluídos.

```text
one bundled caller        reject; keep plugin-local
two bundled callers       accept only if plugin production LOC drops
three or more callers     plugin deletion must be at least 2x new core LOC
compatibility-only helper SDK/core shim only; never bundled hot paths
```

Pare e redesenhe se:

- a LOC de produção de Plugins aumentar
- testes crescerem mais rápido do que a produção encolhe
- um caminho quente incluído retornar um DTO que apenas renomeia `ResolvedChannelMessageIngress`
- um helper do núcleo precisar de um id de canal, objeto de plataforma, cliente de API ou
  padrão específico de canal

## Pacotes de Trabalho

1. Congele o orçamento.
   Coloque a LOC no PR, mantenha o lint de entrada obsoleta verde e inclua LOC
   antes/depois nos commits de limpeza.

2. Exclua divisas finas de DTO.
   Substitua retornos de wrappers locais de Plugin por `ResolvedChannelMessageIngress`,
   `senderAccess`, `commandAccess`, `routeAccess` ou `ingress` diretamente. Comece
   com QQBot, Telegram, Slack, Discord, Signal, Feishu, Matrix, iMessage e
   Tlon. Exclua testes de formato de wrapper; mantenha testes de comportamento.

3. Adicione classificação de resultados somente com exclusões.
   Um classificador genérico pode expor `dispatch`, `pairing-required`,
   `skip-activation`, `drop-command`, `drop-route`, `drop-sender` e
   `drop-ingress`. Ele deve derivar do grafo de decisões, não de strings de
   motivo, e migrar pelo menos três Plugins no mesmo patch.

4. Adicione builders de descritor de rota somente com exclusões.
   Helpers genéricos de destino de rota e remetente de rota são aceitáveis apenas
   se reduzirem imediatamente Plugins pesados em rotas: Google Chat, IRC,
   Microsoft Teams, Nextcloud Talk, Mattermost, Slack, Zalo e Zalo Personal.

5. Adicione presets de comando/evento somente com exclusões.
   Centralize formatos de comando de texto, comando nativo, callback e
   origem-assunto. Consumidores de comandos devem padronizar para não autorizado
   quando nenhum portão de comando tiver executado; eventos não devem iniciar
   pareamento.

6. Adicione presets de identidade somente onde removem boilerplate.
   Helpers de id estável, id estável mais aliases, telefone/e164 e múltiplos
   identificadores são permitidos quando valores brutos entram apenas na entrada
   do adaptador e o estado redigido mantém ids/contagens opacos.

7. Compartilhe a montagem de turnos autorizados.
   Fora do kernel de entrada, remova scaffolding repetido de
   rota/envelope/contexto/resposta de QA Channel, IRC, Nextcloud Talk, Zalo e
   Zalo Personal. O núcleo pode ser responsável pelo sequenciamento de
   rota/sessão/envelope/despacho; Plugins mantêm entrega e contexto específico
   do canal.

8. Confine a compatibilidade.
   Helpers obsoletos do SDK permanecem compatíveis no código-fonte, mas caminhos
   quentes incluídos não devem importar fachadas obsoletas de entrada ou
   autenticação de comandos. Testes de compatibilidade devem usar Plugins
   falsos de terceiros, não internals de Plugins incluídos.

9. Recompacte o núcleo.
   Após a exclusão de wrappers, colapse módulos de uso único, remova exports não
   usados, mova a projeção de compatibilidade para fora dos caminhos quentes e
   mantenha testes focados para identidade, rota, comando/evento, ativação,
   grupos de acesso e shims de compatibilidade.

## Ondas de Exclusão

Execute nesta ordem. Cada onda deve reduzir a LOC de produção incluída.

1. Colapso de wrappers, delta esperado de Plugins: -400 a -600.
   Substitua tipos de resultado locais de Plugin `resolveXAccess`,
   `resolveXCommandAccess` e `accessFromIngress` por leituras diretas de
   `ResolvedChannelMessageIngress`. Primeiros alvos: autenticação de comandos DM
   do Discord, política do Feishu, estado de acesso do Matrix, entrada do
   Telegram, política de acesso do Signal, adaptador do SDK do QQBot.

2. Helpers de resultado compartilhados, delta esperado de Plugins: -200 a -350.
   Adicione um classificador genérico somente se ele excluir escadas repetidas de
   `shouldBlockControlCommand`, pareamento, pulo de ativação, bloqueio de rota e
   bloqueio de remetente em pelo menos três Plugins.

3. Builders de descritor de rota, delta esperado de Plugins: -200 a -350.
   Mova a montagem repetida de descritores de destino de rota e remetente de rota
   para helpers do núcleo. Primeiros alvos: Google Chat, IRC, Microsoft Teams,
   Nextcloud Talk, Mattermost, Slack, Zalo, Zalo Personal.

4. Compartilhamento de montagem de turno, delta esperado de Plugins: -250 a -450.
   Use sequenciamento comum de rota/sessão/envelope/despacho para Plugins
   inbound simples. Primeiros alvos: QA Channel, IRC, Nextcloud Talk, Zalo, Zalo
   Personal.

5. Recompactação do núcleo, delta esperado do núcleo: -300 a -700.
   Depois que Plugins consumirem diretamente projeções de runtime, exclua módulos
   de uso único, mescle arquivos pequenos de volta em `runtime.ts` ou irmãos
   focados e mantenha arquivos de compatibilidade do SDK separados dos caminhos
   quentes incluídos.

6. Poda de testes, delta esperado de testes: -300 a -600.
   Exclua testes que apenas verificam formatos de wrappers removidos. Mantenha
   testes de comportamento para negação de comandos, fallback de grupos,
   correspondência de origem-assunto, pulo de ativação, grupos de acesso,
   pareamento e redação.

Forma mínima esperada para landing após essas ondas:

```text
plugin production     <= -1,500
core production       about +1,800 to +2,200 before final repack
tests                 <= +500
total                 <= +2,000
```

## Não Mover

Não mova padrões de configuração de plataforma, UX de configuração, texto de doctor/fix, consultas de API,
verificações de presença do proprietário no Slack, tratamento de alias/verificação do Matrix, análise de
callbacks do Telegram, análise de sintaxe de comandos, registro de comandos nativos, análise de
carga útil de reação, respostas de pareamento, respostas de comando, confirmações, digitação,
mídia, histórico ou registros.

## Verificação

Ciclo local direcionado:

```sh
pnpm lint:extensions:no-deprecated-channel-access
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts src/plugin-sdk/access-groups.test.ts
pnpm test extensions/<changed-plugin>/src/...
pnpm plugin-sdk:api:check
pnpm config:docs:check
pnpm check:docs
git diff --check
```

Use o Testbox para provas amplas de gates alterados/suite completa quando a tendência de LOC estiver
dentro do orçamento.

Cada pacote de trabalho registra:

- LOC antes/depois por categoria
- wrappers de Plugin excluídos
- LOC de novos helpers principais, se houver
- testes direcionados executados
- lista de hotspots restantes

## Critérios de Saída

- imports de produção agrupados não usam facades obsoletas de acesso a canais ou autorização de comandos
- o código de compatibilidade está isolado nas interfaces do SDK/núcleo
- Plugins agrupados consomem projeções de ingresso ou resultados genéricos diretamente
- LOC de produção de Plugin é pelo menos 1.500 líquido negativo em relação a `origin/main`
- LOC de produção do núcleo é <= +1.500, ou qualquer excedente é compensado enquanto o total permanece
  <= +2.000
- testes representativos cobrem redação, rota, comando/evento, ativação,
  grupo de acesso e comportamento de fallback específico de canal
