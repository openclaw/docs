---
read_when:
    - Você mantém um plugin do OpenClaw
    - Você vê um aviso de compatibilidade de Plugin
    - Você está planejando um SDK de Plugin ou uma migração de manifesto
summary: Contratos de compatibilidade de Plugin, metadados de descontinuação e expectativas de migração
title: Compatibilidade de Plugin
x-i18n:
    generated_at: "2026-06-27T17:47:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e17881c393e3649cb6accb13996d83a855f434735da2e84738f823ac4eba0f5
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw mantém contratos de plugins antigos conectados por adaptadores de
compatibilidade nomeados antes de removê-los. Isso protege plugins agrupados e
externos existentes enquanto os contratos do SDK, manifesto, configuração,
config e runtime do agente evoluem.

## Registro de compatibilidade

Contratos de compatibilidade de plugins são rastreados no registro central em
`src/plugins/compat/registry.ts`.

Cada registro tem:

- um código de compatibilidade estável
- status: `active`, `deprecated`, `removal-pending` ou `removed`
- proprietário: SDK, config, configuração, canal, provedor, execução de plugin,
  runtime do agente ou núcleo
- datas de introdução e depreciação quando aplicável
- orientação de substituição
- docs, diagnósticos e testes que cobrem o comportamento antigo e o novo

O registro é a fonte para o planejamento dos mantenedores e verificações futuras
do inspetor de plugins. Se um comportamento voltado a plugins mudar, adicione ou
atualize o registro de compatibilidade na mesma alteração que adiciona o
adaptador.

A compatibilidade de reparo e migração do doctor é rastreada separadamente em
`src/commands/doctor/shared/deprecation-compat.ts`. Esses registros cobrem
formatos antigos de config, layouts do livro-razão de instalação e shims de
reparo que talvez precisem continuar disponíveis depois que o caminho de
compatibilidade do runtime for removido.

Varreduras de release devem verificar ambos os registros. Não exclua uma
migração do doctor só porque o registro correspondente de compatibilidade de
runtime ou config expirou; primeiro verifique se não há um caminho de upgrade
compatível que ainda precise do reparo. Também revalide cada anotação de
substituição durante o planejamento de release, porque a propriedade de plugins
e a presença em config podem mudar à medida que provedores e canais saem do
núcleo.

## Pacote do inspetor de plugins

O inspetor de plugins deve ficar fora do repositório central do OpenClaw como um
pacote/repositório separado apoiado pelos contratos versionados de
compatibilidade e manifesto.

A CLI do primeiro dia deve ser:

```sh
openclaw-plugin-inspector ./my-plugin
```

Ela deve emitir:

- validação de manifesto/schema
- a versão de compatibilidade do contrato que está sendo verificada
- verificações de metadados de instalação/origem
- verificações de importação de caminho frio
- avisos de depreciação e compatibilidade

Use `--json` para saída estável legível por máquina em anotações de CI. O núcleo
do OpenClaw deve expor contratos e fixtures que o inspetor possa consumir, mas
não deve publicar o binário do inspetor pelo pacote principal `openclaw`.

### Faixa de aceitação dos mantenedores

Use Blacksmith Testbox apoiado por Crabbox para a faixa de aceitação de pacote
instalável ao validar o inspetor externo contra pacotes de plugins do OpenClaw.
Execute-a de um checkout limpo do OpenClaw depois que o pacote for construído:

```sh
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
```

Mantenha essa faixa como opt-in para mantenedores, porque ela instala um pacote
npm externo e pode inspecionar pacotes de plugins clonados fora do repositório.
As proteções locais do repositório cobrem o mapa de exportação do SDK, metadados
do registro de compatibilidade, redução de importações de SDK depreciadas e
fronteiras de importação de extensões agrupadas; a prova do inspetor no Testbox
cobre o pacote como autores de plugins externos o consomem.

## Política de depreciação

O OpenClaw não deve remover um contrato de plugin documentado na mesma release
que introduz sua substituição.

A sequência de migração é:

1. Adicionar o novo contrato.
2. Manter o comportamento antigo conectado por um adaptador de compatibilidade
   nomeado.
3. Emitir diagnósticos ou avisos quando autores de plugins puderem agir.
4. Documentar a substituição e o cronograma.
5. Testar os caminhos antigo e novo.
6. Aguardar durante a janela de migração anunciada.
7. Remover somente com aprovação explícita de release com quebra.

Registros depreciados devem incluir uma data de início de aviso, substituição,
link de docs e data final de remoção no máximo três meses depois do início do
aviso. Não adicione um caminho de compatibilidade depreciado com uma janela de
remoção indefinida, a menos que os mantenedores decidam explicitamente que ele é
compatibilidade permanente e o marquem como `active`.

## Áreas de compatibilidade atuais

Registros de compatibilidade atuais incluem:

- importações amplas legadas do SDK, como `openclaw/plugin-sdk/compat`
- formatos de plugins legados somente com hooks e `before_agent_start`
- nomes legados de hooks de limpeza `api.on("deactivate", ...)` enquanto
  plugins migram para `gateway_stop`
- entrypoints legados de plugin `activate(api)` enquanto plugins migram para
  `register(api)`
- aliases legados do SDK, como `openclaw/extension-api`,
  `openclaw/plugin-sdk/channel-runtime`, builders de status
  `openclaw/plugin-sdk/command-auth`, `openclaw/plugin-sdk/test-utils`
  (substituído por subcaminhos de teste focados `openclaw/plugin-sdk/*`) e os
  aliases de tipo `ClawdbotConfig` / `OpenClawSchemaType`
- allowlist de plugins agrupados e comportamento de habilitação
- metadados legados de manifesto de variáveis de ambiente de provedor/canal
- hooks e aliases de tipo legados de plugin de provedor enquanto provedores
  migram para hooks explícitos de catálogo, autenticação, pensamento, replay e
  transporte
- aliases legados de runtime, como `api.runtime.taskFlow`,
  `api.runtime.subagent.getSession`, `api.runtime.stt` e
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
  depreciados
- campos achatados de callback `WebInboundMessage` do WhatsApp, como `body`,
  `chatId`, `reply(...)` e `mediaPath`, enquanto consumidores de callbacks
  migram para os contextos aninhados `event`, `payload`, `quote`, `group` e
  `platform` de `WebInboundCallbackMessage`
- campos de admissão de nível superior de `WebInboundMessage` do WhatsApp, como
  `from`, `conversationId`, `accountId`, `accessControlPassed` e `chatType`,
  enquanto consumidores de callbacks migram para o envelope `admission`
- registro dividido legado de plugin de memória enquanto plugins de memória
  migram para `registerMemoryCapability`
- registro legado de provedor de embedding específico de memória enquanto
  provedores de embedding migram para `api.registerEmbeddingProvider(...)` e
  `contracts.embeddingProviders`
- helpers legados do SDK de canal para schemas de mensagens nativas, gating de
  menções, formatação de envelopes de entrada e aninhamento de capacidade de
  aprovação
- aliases legados de chave de rota de canal e helper de destino comparável
  enquanto plugins migram para `openclaw/plugin-sdk/channel-route`
- dicas de ativação que estão sendo substituídas por propriedade de contribuição
  do manifesto
- fallback de runtime `setup-api` enquanto descritores de configuração migram
  para metadados frios `setup.requiresRuntime: false`
- hooks `discovery` de provedor enquanto hooks de catálogo de provedores migram
  para `catalog.run(...)`
- metadados `showConfigured` / `showInSetup` de canal enquanto pacotes de canal
  migram para `openclaw.channel.exposure`
- chaves legadas de config de runtime-policy enquanto o doctor migra operadores
  para `agentRuntime`
- fallback de metadados gerados de config de canal agrupado enquanto metadados
  `channelConfigs` registry-first entram
- flags persistidas de ambiente de desativação do registro de plugins e migração
  de instalação enquanto fluxos de reparo migram operadores para
  `openclaw plugins registry --refresh` e `openclaw doctor --fix`
- caminhos legados de config de web search, web fetch e x_search pertencentes a
  plugins enquanto o doctor os migra para `plugins.entries.<plugin>.config`
- config autorada legada `plugins.installs` e aliases de caminho de carregamento
  de plugins agrupados enquanto metadados de instalação migram para o
  livro-razão de plugins gerenciado pelo estado

Novo código de plugin deve preferir a substituição listada no registro e no guia
de migração específico. Plugins existentes podem continuar usando um caminho de
compatibilidade até que docs, diagnósticos e notas de release anunciem uma janela
de remoção.

### Aliases achatados de callback de entrada do WhatsApp

Callbacks de runtime do WhatsApp entregam `WebInboundMessage`: os contextos
canônicos aninhados `event`, `payload`, `quote`, `group` e `platform`, mais
aliases achatados depreciados para os campos de callback enviados. Novo código
de callback deve ler os contextos aninhados. Código que constrói mensagens de
callback aninhadas limpas pode usar `WebInboundCallbackMessage`; listeners de
compatibilidade que ainda injetam mensagens antigas achatadas de teste ou plugin
devem usar `LegacyFlatWebInboundMessage` ou `WebInboundMessageInput`.

Os aliases achatados permanecem disponíveis até **2026-08-30**. Essa janela de
remoção se aplica apenas ao acesso por alias achatado; o formato aninhado de
callback é o contrato canônico de runtime. As anotações TypeScript `@deprecated`
em cada alias achatado nomeiam sua substituição aninhada exata. Exemplos comuns:

- `id`, `timestamp` e `isBatched` passam para `event`.
- `body`, `mediaPath`, `mediaType`, `mediaFileName`, `mediaUrl`, `location` e
  `untrustedStructuredContext` passam para `payload`.
- `to`, `chatId`, campos de remetente/próprio, `sendComposing`, `reply(...)` e
  `sendMedia(...)` passam para `platform`.
- campos `replyTo*` passam para `quote`, e campos de assunto/participante/menção
  de grupo passam para `group`.

`payload.untrustedStructuredContext` é extraído de payloads de provedores de
entrada. Plugins devem inspecionar `label`, `source` e `type` antes de tratar seu
`payload` como autoritativo.

### Campos de admissão de entrada do WhatsApp

Mensagens aceitas de callback do WhatsApp agora carregam `admission`, um
envelope público e seguro para a decisão de controle de acesso que admitiu a
mensagem. Novo código de callback deve ler fatos de admissão de `msg.admission`
em vez dos campos de admissão antigos de nível superior.

Os campos de nível superior permanecem disponíveis até **2026-08-30**. As
anotações TypeScript `@deprecated` nomeiam cada substituição:

- `from` e `conversationId` passam para `admission.conversation.id`.
- `accountId` passa para `admission.accountId`.
- `accessControlPassed` é uma visualização derivada de compatibilidade de
  `admission.ingress.decision === "allow"`; em mensagens que já carregam
  `admission`, escrever o booleano legado não reescreve o grafo de ingresso.
- `chatType` passa para `admission.conversation.kind`.

## Notas de release

Notas de release devem incluir próximas depreciações de plugins com datas-alvo e
links para docs de migração. Esse aviso precisa acontecer antes de um caminho de
compatibilidade passar para `removal-pending` ou `removed`.
