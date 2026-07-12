---
read_when:
    - Você mantém um plugin do OpenClaw
    - Você vê um aviso de compatibilidade de plugin
    - Você está planejando uma migração do SDK de Plugin ou do manifesto
summary: Contratos de compatibilidade de Plugins, metadados de descontinuação e expectativas de migração
title: Compatibilidade de Plugins
x-i18n:
    generated_at: "2026-07-12T00:09:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 26f737e40175652cb24327c91d2af9dbf72b1b254011115f5b512a309707711c
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw mantém contratos de Plugin mais antigos conectados por meio de adaptadores
de compatibilidade nomeados antes de removê-los. Isso protege os plugins integrados
e externos existentes enquanto os contratos do SDK, do manifesto, da configuração
inicial, da configuração e do runtime do agente evoluem.

## Registro de compatibilidade

Os contratos de compatibilidade de plugins são rastreados no registro central em
`src/plugins/compat/registry.ts`. Cada registro contém:

- um código de compatibilidade estável
- status: `active`, `deprecated`, `removal-pending` ou `removed`
- responsável: `sdk`, `config`, `setup`, `channel`, `provider`, `plugin-execution`,
  `agent-runtime` ou `core`
- datas de introdução e descontinuação, quando aplicável
- orientações para substituição
- documentação, diagnósticos e testes que abrangem o comportamento antigo e o novo

O registro é a fonte para o planejamento dos mantenedores e futuras verificações
do inspetor de plugins. Se um comportamento voltado a plugins for alterado,
adicione ou atualize o registro de compatibilidade na mesma alteração que adiciona
o adaptador.

A compatibilidade de reparo e migração do doctor é rastreada separadamente em
`src/commands/doctor/shared/deprecation-compat.ts`. Esses registros abrangem
formatos antigos de configuração, estruturas do livro-razão de instalações e
adaptações de reparo que talvez precisem continuar disponíveis após a remoção do
caminho de compatibilidade do runtime.

As revisões de lançamento devem verificar ambos os registros. Não exclua uma
migração do doctor apenas porque o registro correspondente de compatibilidade do
runtime ou da configuração expirou; primeiro verifique se não há um caminho de
atualização compatível que ainda precise do reparo. Revalide também cada anotação
de substituição durante o planejamento do lançamento, pois a responsabilidade
pelos plugins e o escopo da configuração podem mudar à medida que provedores e
canais saem do núcleo.

## Política de descontinuação

OpenClaw não deve remover um contrato de Plugin documentado no mesmo lançamento
que introduz sua substituição. Sequência de migração:

1. Adicione o novo contrato.
2. Mantenha o comportamento antigo conectado por meio de um adaptador de compatibilidade nomeado.
3. Emita diagnósticos ou avisos quando os autores de plugins puderem agir.
4. Documente a substituição e o cronograma.
5. Teste os caminhos antigo e novo.
6. Aguarde até o fim da janela de migração anunciada.
7. Remova somente com aprovação explícita para um lançamento com alterações incompatíveis.

Registros descontinuados devem incluir uma data de início dos avisos, a substituição,
um link para a documentação e uma data final de remoção de, no máximo, três meses
após o início dos avisos. Não adicione um caminho de compatibilidade descontinuado
com uma janela de remoção sem prazo definido, a menos que os mantenedores decidam
explicitamente que se trata de compatibilidade permanente e o marquem como `active`.

## Áreas atuais de compatibilidade

Atualmente, o registro rastreia cerca de 70 códigos de compatibilidade nestas
áreas. Novos códigos de plugins devem usar a substituição em cada área e no guia
de migração específico; plugins existentes podem continuar usando um caminho de
compatibilidade até que a documentação, os diagnósticos e as notas de lançamento
anunciem uma janela de remoção.

- importações amplas legadas do SDK, como `openclaw/plugin-sdk/compat`
- formatos legados de plugins somente com hooks e `before_agent_start`
- nomes legados do hook de limpeza `api.on("deactivate", ...)` enquanto os plugins
  migram para `gateway_stop`
- pontos de entrada legados de plugins `activate(api)` enquanto os plugins migram
  para `register(api)`
- aliases legados do SDK, como `openclaw/extension-api`,
  `openclaw/plugin-sdk/channel-runtime`, construtores de status de
  `openclaw/plugin-sdk/command-auth`, `openclaw/plugin-sdk/test-utils`
  (substituído por subcaminhos de teste específicos de `openclaw/plugin-sdk/*`)
  e os aliases de tipos `ClawdbotConfig` / `OpenClawSchemaType`
- lista de permissões e comportamento de ativação dos plugins integrados
- metadados legados do manifesto de variáveis de ambiente de provedores/canais
- hooks e aliases de tipos legados de plugins de provedores enquanto os provedores
  migram para hooks explícitos de catálogo, autenticação, raciocínio, reprodução e transporte
- aliases legados do runtime, como `api.runtime.taskFlow`,
  `api.runtime.subagent.getSession`, `api.runtime.stt` e os métodos descontinuados
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
- campos simples de callback `WebInboundMessage` do WhatsApp (veja abaixo)
- campos de admissão de nível superior de `WebInboundMessage` do WhatsApp (veja abaixo)
- registro dividido legado de plugins de memória enquanto os plugins de memória
  migram para `registerMemoryCapability`
- registro legado de provedores de embeddings específico de memória enquanto os
  provedores de embeddings migram para `api.registerEmbeddingProvider(...)` e
  `contracts.embeddingProviders`
- auxiliares legados do SDK de canais para esquemas de mensagens nativas, controle
  de menções, formatação de envelopes de entrada e aninhamento de recursos de aprovação
- aliases legados de chave de rota de canal e de auxiliares de destinos comparáveis
  enquanto os plugins migram para `openclaw/plugin-sdk/channel-route`
- dicas de ativação sendo substituídas pela responsabilidade das contribuições do manifesto
- fallback de runtime de `setup-api` enquanto os descritores de configuração inicial
  migram para metadados frios `setup.requiresRuntime: false`
- hooks `discovery` de provedores enquanto os hooks de catálogo de provedores migram
  para `catalog.run(...)`
- metadados de canal `showConfigured` / `showInSetup` enquanto os pacotes de canais
  migram para `openclaw.channel.exposure`
- chaves legadas de configuração de política de runtime enquanto o doctor migra os
  operadores para `agentRuntime`
- fallback de metadados gerados de configuração de canais integrados enquanto os
  metadados `channelConfigs`, com prioridade para o registro, são implementados
- sinalizadores de ambiente persistentes para desativação do registro de plugins e
  migração de instalações enquanto os fluxos de reparo migram os operadores para
  `openclaw plugins registry --refresh` e `openclaw doctor --fix`
- caminhos legados de configuração de pesquisa na web, obtenção de conteúdo da web
  e x_search pertencentes a plugins enquanto o doctor os migra para
  `plugins.entries.<plugin>.config`
- configuração legada `plugins.installs` criada manualmente e aliases de caminhos de
  carregamento de plugins integrados enquanto os metadados de instalação migram para
  o livro-razão de plugins gerenciado pelo estado

### Aliases simples do callback de entrada do WhatsApp

Os callbacks do runtime do WhatsApp entregam `WebInboundMessage`: os contextos
canônicos aninhados `event`, `payload`, `quote`, `group` e `platform`, além de
aliases simples descontinuados para os campos de callback já distribuídos. Novos
códigos de callback devem ler os contextos aninhados. Códigos que constroem
mensagens de callback aninhadas e limpas podem usar `WebInboundCallbackMessage`;
listeners de compatibilidade que ainda injetam mensagens de testes ou plugins no
formato simples antigo devem usar `LegacyFlatWebInboundMessage` ou
`WebInboundMessageInput`.

Os aliases simples permanecem disponíveis até **2026-08-30**; essa janela se
aplica somente ao acesso aos aliases simples, e não ao formato aninhado, que é o
contrato canônico do runtime. A anotação TypeScript `@deprecated` de cada alias
simples identifica sua substituição aninhada exata. Exemplos comuns:

- `id`, `timestamp` e `isBatched` passam para `event`.
- `body`, `mediaPath`, `mediaType`, `mediaFileName`, `mediaUrl`, `location`
  e `untrustedStructuredContext` passam para `payload`.
- `to`, `chatId`, campos de remetente/próprio, `sendComposing`, `reply(...)` e
  `sendMedia(...)` passam para `platform`.
- Campos `replyTo*` passam para `quote`; campos de assunto, participante e menção
  de grupo passam para `group`.

`payload.untrustedStructuredContext` é extraído dos payloads de entrada dos
provedores. Os plugins devem inspecionar `label`, `source` e `type` antes de
tratar seu `payload` como autoritativo.

### Campos de admissão de entrada do WhatsApp

As mensagens aceitas de callback do WhatsApp contêm `admission`, um envelope
seguro para exposição pública da decisão de controle de acesso que admitiu a
mensagem. Novos códigos de callback devem ler os fatos de admissão em
`msg.admission`, em vez dos campos antigos de admissão no nível superior.

Os campos de nível superior permanecem disponíveis até **2026-08-30**. A anotação
TypeScript `@deprecated` de cada campo identifica sua substituição:

- `from` e `conversationId` passam para `admission.conversation.id`.
- `accountId` passa para `admission.accountId`.
- `accessControlPassed` é uma visão de compatibilidade derivada de
  `admission.ingress.decision === "allow"`; em mensagens que já contêm
  `admission`, gravar o booleano legado não reescreve o grafo de entrada.
- `chatType` passa para `admission.conversation.kind`.

## Pacote do inspetor de plugins

O inspetor de plugins deve residir fora do repositório central do OpenClaw, como
um pacote/repositório separado sustentado pelos contratos versionados de
compatibilidade e manifesto. A CLI inicial deve ser:

```sh
openclaw-plugin-inspector ./my-plugin
```

Ela deve emitir a validação do manifesto/esquema, a versão de compatibilidade do
contrato que está sendo verificada, verificações dos metadados de instalação/origem,
verificações de importação em caminhos frios e avisos de descontinuação/compatibilidade.
Use `--json` para uma saída estável e legível por máquina em anotações de CI. O núcleo
do OpenClaw deve expor contratos e fixtures que o inspetor possa consumir, mas não
deve publicar o binário do inspetor no pacote principal `openclaw`.

### Etapa de aceitação para mantenedores

Use o Blacksmith Testbox com Crabbox para a etapa de aceitação do pacote instalável
ao validar o inspetor externo em relação aos pacotes de plugins do OpenClaw. Execute-a
a partir de um checkout limpo do OpenClaw após a compilação do pacote:

```sh
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
```

Mantenha essa etapa opcional para os mantenedores, pois ela instala um pacote npm
externo e pode inspecionar pacotes de plugins clonados fora do repositório. As
proteções do repositório local abrangem o mapa de exportações do SDK, os metadados
do registro de compatibilidade, a redução progressiva de importações descontinuadas
do SDK e os limites de importação das extensões integradas; a comprovação do inspetor
no Testbox abrange o pacote da forma como os autores externos de plugins o consomem.

## Notas de lançamento

As notas de lançamento devem incluir as próximas descontinuações de plugins, com
datas previstas e links para a documentação de migração, antes que um caminho de
compatibilidade passe para `removal-pending` ou `removed`.
