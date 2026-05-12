---
read_when:
    - Auditando por que a refatoração da entrada de canais adicionou código demais
    - Mover política de rota, comando, evento, ativação ou grupo de acesso de plugins incluídos para o núcleo
    - Revisando se um auxiliar de entrada de canal realmente exclui código de Plugin empacotado
sidebarTitle: Ingress core deletion
summary: Plano que prioriza a remoção para mover o código de cola repetido de entrada de canais para o núcleo.
title: Plano de exclusão do núcleo de ingresso
x-i18n:
    generated_at: "2026-05-12T00:59:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1fdf1e7c9636d02c48c4b5d2b4a51470317dd64e2270c7fae779777c0d787afc
    source_path: refactor/ingress-core.md
    workflow: 16
---

# Plano de exclusão do núcleo de ingress

A refatoração de ingress não está saudável enquanto adiciona milhares de linhas líquidas. A
centralização no núcleo só conta quando o código de produção dos plugins empacotados fica menor e
a compatibilidade antiga com SDKs de terceiros fica isolada em shims do SDK/núcleo.

Formato de runtime desejado:

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

Plugins empacotados não devem traduzir ingress de volta para formatos locais de `AccessResult`,
`GroupAccessDecision`, `CommandAuthDecision`, `DmCommandAccess` ou
`{ allowed, reasonCode }`, a menos que esse tipo seja uma API pública de Plugin.

## Orçamento

Medido contra a base de mesclagem do PR com `origin/main`, incluindo arquivos
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

Exclusão apenas de comentários não conta como limpeza. A passagem de orçamento anterior foi
generosa demais porque incluiu comentários explicativos restaurados do QQBot; este
documento rastreia apenas movimentação de código executável, documentação e testes.

Meça novamente após cada onda de limpeza:

```sh
base=$(git merge-base HEAD origin/main)
git diff --shortstat "$base"
git diff --numstat "$base" -- src/channels/message-access src/plugin-sdk extensions | sort -nr -k1 | head -n 80
pnpm lint:extensions:no-deprecated-channel-access
```

## Diagnóstico

A primeira passagem adicionou o kernel compartilhado de ingress, depois deixou autorização
local demais nos plugins ao lado dele:

```text
platform facts
  -> shared ingress state and decision
  -> plugin-local DTO or legacy projection
  -> plugin-local if/else ladder
```

Isso duplica o modelo. A produção do núcleo cresceu cerca de 3.376 linhas, enquanto
a produção dos plugins empacotados ficou 1.240 linhas menor. Isso é melhor que a primeira
passagem, mas não está dentro do orçamento mínimo. A correção continua sendo orientada por exclusão:

- excluir DTOs de plugins que apenas renomeiam campos de ingress
- excluir testes que apenas verificam o formato de wrappers
- adicionar helpers de núcleo somente quando o mesmo patch excluir código de plugins empacotados
- manter compatibilidade antiga do SDK somente em shims de SDK/núcleo
- reempacotar o núcleo depois que a exclusão de wrappers expuser o formato estável

## Pontos críticos

Arquivos positivos de produção empacotada que ainda precisam encolher:

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

A branch ainda não está dentro do orçamento mínimo. O trabalho restante relevante para revisão
deve excluir fluxo repetido de autorização, montagem de turnos ou testes de wrapper
antes de adicionar outra abstração no núcleo.

## Leitura atual do código

A interface saudável do núcleo já existe em `src/channels/message-access/runtime.ts`:
ela concentra adaptadores de identidade, listas de permissão efetivas, leituras do repositório de pareamento, descritores
de rota, presets de comando/evento, grupos de acesso e a projeção final resolvida
`ResolvedChannelMessageIngress`.

O crescimento restante é, em sua maior parte, cola de plugins em camadas acima dessa interface:

- `extensions/telegram/src/ingress.ts` envolve decisões do núcleo em helpers específicos do Telegram
  para comandos/eventos, e os pontos de chamada ainda passam listas de permissão normalizadas
  e listas de proprietários pré-computadas.
- `extensions/discord/src/monitor/dm-command-auth.ts`,
  `extensions/feishu/src/policy.ts`, `extensions/googlechat/src/monitor-access.ts`
  e `extensions/matrix/src/matrix/monitor/access-state.ts` ainda mantêm
  DTOs locais de política ou nomes de decisão legados ao lado de ingress.
- `extensions/signal/src/monitor/access-policy.ts` mantém corretamente a normalização
  de identidade do Signal e respostas de pareamento locais, mas ainda tem uma interface
  de wrapper que deve colapsar para consumo direto de ingress.
- `extensions/nextcloud-talk/src/inbound.ts`, `extensions/irc/src/inbound.ts`,
  `extensions/qa-channel/src/inbound.ts`, `extensions/zalo/src/monitor.ts` e
  `extensions/zalouser/src/monitor.ts` ainda repetem montagem de rota/envelope/turno
  que pode ir para helpers compartilhados de turno fora do kernel de ingress.

Conclusão: mover mais código para o núcleo só é útil se isso excluir essas
camadas de wrapper dos plugins no mesmo patch. Adicionar outra abstração enquanto
mantém retornos de wrapper repete o erro.

## Limite

O núcleo controla a política genérica:

- normalização e correspondência de listas de permissão
- expansão e diagnósticos de grupos de acesso
- leituras de listas de permissão de DM no repositório de pareamento
- gates de rota, remetente, comando, evento e ativação
- mapeamento de admissão: despachar, descartar, pular, observar, pareamento
- estado redigido, decisões, diagnósticos e projeções de compatibilidade do SDK
- descritores genéricos reutilizáveis para identidade, rota, comando, evento, ativação
  e resultados

Plugins controlam fatos de transporte e efeitos colaterais:

- autenticidade de Webhook/socket/requisição
- extração de identidade da plataforma e consultas de API
- padrões de política específicos do canal
- entrega de desafios de pareamento, respostas, confirmações, reações, digitação, mídia, histórico,
  configuração, doctor, status, logs e texto visível ao usuário

O núcleo deve permanecer independente de canal: sem Discord, Slack, Telegram, Matrix, sala,
guilda, espaço, cliente de API ou padrão específico de Plugin em
`src/channels/message-access`.

## Regra de aceitação

Todo novo helper de núcleo deve excluir código de produção de plugins empacotados imediatamente.

```text
one bundled caller        reject; keep plugin-local
two bundled callers       accept only if plugin production LOC drops
three or more callers     plugin deletion must be at least 2x new core LOC
compatibility-only helper SDK/core shim only; never bundled hot paths
```

Pare e redesenhe se:

- as LOC de produção dos plugins aumentarem
- os testes crescerem mais rápido do que a produção encolhe
- um caminho quente empacotado retornar um DTO que apenas renomeia `ResolvedChannelMessageIngress`
- um helper de núcleo precisar de um id de canal, objeto de plataforma, cliente de API ou
  padrão específico de canal

## Pacotes de trabalho

1. Congele o orçamento.
   Coloque as LOC no PR, mantenha o lint de ingress obsoleto verde e inclua LOC antes/depois
   nos commits de limpeza.

2. Exclua interfaces finas de DTO.
   Substitua retornos de wrappers locais de plugins por `ResolvedChannelMessageIngress`,
   `senderAccess`, `commandAccess`, `routeAccess` ou `ingress` diretamente. Comece
   com QQBot, Telegram, Slack, Discord, Signal, Feishu, Matrix, iMessage e
   Tlon. Exclua testes de formato de wrapper; mantenha testes de comportamento.

3. Adicione classificação de resultado somente com exclusões.
   Um classificador genérico pode expor `dispatch`, `pairing-required`,
   `skip-activation`, `drop-command`, `drop-route`, `drop-sender` e
   `drop-ingress`. Ele deve derivar do grafo de decisão, não de strings de motivo,
   e migrar pelo menos três plugins no mesmo patch.

4. Adicione construtores de descritores de rota somente com exclusões.
   Helpers genéricos de destino de rota e remetente de rota são aceitáveis somente se
   reduzirem imediatamente plugins pesados em rotas: Google Chat, IRC, Microsoft Teams,
   Nextcloud Talk, Mattermost, Slack, Zalo e Zalo Personal.

5. Adicione presets de comando/evento somente com exclusões.
   Centralize formatos de comando de texto, comando nativo, callback e origem-assunto.
   Consumidores de comando devem usar não autorizado por padrão quando nenhum gate de comando rodou;
   eventos não devem iniciar pareamento.

6. Adicione presets de identidade apenas onde eles removem boilerplate.
   Helpers de id estável, id estável mais aliases, telefone/e164 e múltiplos identificadores
   são permitidos quando valores brutos entram apenas na entrada do adaptador e o estado redigido mantém
   ids/contagens opacos.

7. Compartilhe a montagem de turnos autorizados.
   Fora do kernel de ingress, remova scaffolding repetido de rota/sessão/envelope/resposta
   de QA Channel, IRC, Nextcloud Talk, Zalo e Zalo Personal.
   O núcleo pode controlar sequenciamento de rota/sessão/envelope/despacho; plugins mantêm
   entrega e contexto específico do canal.

8. Isole a compatibilidade.
   Helpers obsoletos do SDK permanecem compatíveis em código-fonte, mas caminhos quentes empacotados não devem
   importar facades obsoletas de ingress ou auth de comandos. Testes de compatibilidade devem
   usar plugins falsos de terceiros, não partes internas de plugins empacotados.

9. Reempacote o núcleo.
   Após a exclusão de wrappers, colapse módulos de uso único, remova exports não usados, mova
   a projeção de compatibilidade para fora de caminhos quentes e mantenha testes focados para identidade,
   rota, comando/evento, ativação, grupos de acesso e shims de compatibilidade.

## Ondas de exclusão

Execute estas etapas em ordem. Cada onda deve reduzir as LOC de produção empacotada.

1. Colapso de wrappers, delta esperado de plugins: -400 a -600.
   Substitua tipos de resultado locais de plugins `resolveXAccess`, `resolveXCommandAccess` e
   `accessFromIngress` por leituras diretas de
   `ResolvedChannelMessageIngress`. Primeiros alvos: auth de comandos de DM do Discord,
   política do Feishu, estado de acesso do Matrix, ingress do Telegram, política de acesso do Signal,
   adaptador de SDK do QQBot.

2. Helpers compartilhados de resultado, delta esperado de plugins: -200 a -350.
   Adicione um classificador genérico somente se ele excluir ladders repetidos de
   `shouldBlockControlCommand`, pareamento, pulo de ativação, bloqueio de rota e bloqueio de remetente
   em pelo menos três plugins.

3. Construtores de descritores de rota, delta esperado de plugins: -200 a -350.
   Mova a montagem repetida de descritores de destino de rota e remetente de rota para helpers
   do núcleo. Primeiros alvos: Google Chat, IRC, Microsoft Teams, Nextcloud Talk,
   Mattermost, Slack, Zalo, Zalo Personal.

4. Compartilhamento da montagem de turnos, delta esperado de plugins: -250 a -450.
   Use sequenciamento comum de rota/sessão/envelope/despacho para plugins simples
   de entrada. Primeiros alvos: QA Channel, IRC, Nextcloud Talk, Zalo, Zalo Personal.

5. Reempacotamento do núcleo, delta esperado do núcleo: -300 a -700.
   Depois que plugins consumirem projeções de runtime diretamente, exclua módulos de uso único,
   mescle arquivos pequenos de volta em `runtime.ts` ou em irmãos focados, e mantenha arquivos de
   compatibilidade do SDK separados de caminhos quentes empacotados.

6. Poda de testes, delta esperado de testes: -300 a -600.
   Exclua testes que apenas verificam formatos de wrappers removidos. Mantenha testes de comportamento para
   negação de comando, fallback de grupo, correspondência de origem-assunto, pulo de ativação,
   grupos de acesso, pareamento e redação.

Formato mínimo esperado para landing após essas ondas:

```text
plugin production     <= -1,500
core production       about +1,800 to +2,200 before final repack
tests                 <= +500
total                 <= +2,000
```

## Não mover

Não mova padrões de configuração de plataforma, UX de configuração, texto de doctor/fix, buscas de API,
verificações de presença do proprietário do Slack, tratamento de alias/verificação do Matrix, parsing de
callbacks do Telegram, parsing de sintaxe de comandos, registro de comandos nativos, parsing de
payloads de reações, respostas de pareamento, respostas de comandos, acks, digitação, mídia, histórico
ou logs.

## Verificação

Loop local direcionado:

```sh
pnpm lint:extensions:no-deprecated-channel-access
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts src/plugin-sdk/access-groups.test.ts
pnpm test extensions/<changed-plugin>/src/...
pnpm plugin-sdk:api:check
pnpm config:docs:check
pnpm check:docs
git diff --check
```

Use Testbox para gates amplos de alterações/prova de suíte completa quando a tendência de LOC estiver
dentro do orçamento.

Cada pacote de trabalho registra:

- LOC antes/depois por categoria
- wrappers de plugins excluídos
- LOC de novos helpers de core, se houver
- testes direcionados executados
- lista de hotspots restantes

## Critérios de saída

- imports de produção empacotados não usam fachadas obsoletas de channel-access ou command-auth
- o código de compatibilidade fica isolado em seams de SDK/core
- plugins empacotados consomem projeções de ingresso ou resultados genéricos diretamente
- LOC de produção de plugins fica pelo menos 1.500 líquido negativo em relação a `origin/main`
- LOC de produção de core fica `<= +1,500`, ou qualquer excedente é compensado enquanto o total
  permanece `<= +2,000`
- testes representativos cobrem mascaramento, rota, comando/evento, ativação,
  grupo de acesso e comportamento de fallback específico do canal
