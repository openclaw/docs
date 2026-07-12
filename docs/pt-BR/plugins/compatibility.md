---
read_when:
    - Você mantém um plugin do OpenClaw
    - Você vê um aviso de compatibilidade de plugin
    - Você está planejando uma migração do SDK de plugins ou do manifesto
summary: Contratos de compatibilidade de Plugins, metadados de descontinuação e expectativas de migração
title: Compatibilidade de plugins
x-i18n:
    generated_at: "2026-07-12T15:23:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 26f737e40175652cb24327c91d2af9dbf72b1b254011115f5b512a309707711c
    source_path: plugins/compatibility.md
    workflow: 16
---

O OpenClaw mantém contratos de Plugin antigos conectados por meio de adaptadores de compatibilidade nomeados antes de removê-los. Isso protege Plugins existentes, tanto integrados quanto externos, enquanto os contratos do SDK, do manifesto, da configuração inicial, da configuração e do runtime do agente evoluem.

## Registro de compatibilidade

Os contratos de compatibilidade de Plugins são rastreados no registro principal em `src/plugins/compat/registry.ts`. Cada registro tem:

- um código de compatibilidade estável
- status: `active`, `deprecated`, `removal-pending` ou `removed`
- proprietário: `sdk`, `config`, `setup`, `channel`, `provider`, `plugin-execution`, `agent-runtime` ou `core`
- datas de introdução e descontinuação, quando aplicável
- orientações para substituição
- documentação, diagnósticos e testes que abrangem o comportamento antigo e o novo

O registro é a fonte para o planejamento dos mantenedores e para futuras verificações do inspetor de Plugins. Se um comportamento voltado a Plugins mudar, adicione ou atualize o registro de compatibilidade na mesma alteração que adiciona o adaptador.

A compatibilidade de reparo e migração do Doctor é rastreada separadamente em `src/commands/doctor/shared/deprecation-compat.ts`. Esses registros abrangem formatos antigos de configuração, layouts do registro de instalações e adaptações de reparo que talvez precisem continuar disponíveis depois que o caminho de compatibilidade do runtime for removido.

As verificações de release devem conferir ambos os registros. Não exclua uma migração do Doctor apenas porque o registro correspondente de compatibilidade do runtime ou da configuração expirou; primeiro, verifique se não existe um caminho de atualização compatível que ainda precise do reparo. Revalide também cada anotação de substituição durante o planejamento da release, pois a propriedade dos Plugins e a área de configuração podem mudar à medida que provedores e canais saem do núcleo.

## Política de descontinuação

O OpenClaw não deve remover um contrato de Plugin documentado na mesma release que introduz sua substituição. Sequência de migração:

1. Adicione o novo contrato.
2. Mantenha o comportamento antigo conectado por meio de um adaptador de compatibilidade nomeado.
3. Emita diagnósticos ou avisos quando os autores de Plugins puderem agir.
4. Documente a substituição e o cronograma.
5. Teste os caminhos antigo e novo.
6. Aguarde durante o período de migração anunciado.
7. Remova somente com aprovação explícita para uma release com mudanças incompatíveis.

Registros descontinuados devem incluir uma data de início dos avisos, uma substituição, um link para a documentação e uma data final de remoção que não seja posterior a três meses após o início dos avisos. Não adicione um caminho de compatibilidade descontinuado com prazo de remoção indefinido, a menos que os mantenedores decidam explicitamente que se trata de compatibilidade permanente e o marquem como `active`.

## Áreas de compatibilidade atuais

Atualmente, o registro acompanha cerca de 70 códigos de compatibilidade nestas áreas. Novos códigos de Plugins devem usar a substituição em cada área e no guia de migração específico; Plugins existentes podem continuar usando um caminho de compatibilidade até que a documentação, os diagnósticos e as notas de release anunciem um prazo de remoção.

- importações amplas legadas do SDK, como `openclaw/plugin-sdk/compat`
- formatos legados de Plugins somente com hooks e `before_agent_start`
- nomes legados de hooks de limpeza `api.on("deactivate", ...)` enquanto os Plugins migram para `gateway_stop`
- pontos de entrada legados de Plugins `activate(api)` enquanto os Plugins migram para `register(api)`
- aliases legados do SDK, como `openclaw/extension-api`, `openclaw/plugin-sdk/channel-runtime`, criadores de status de `openclaw/plugin-sdk/command-auth`, `openclaw/plugin-sdk/test-utils` (substituído por subcaminhos de teste específicos `openclaw/plugin-sdk/*`) e os aliases de tipo `ClawdbotConfig` / `OpenClawSchemaType`
- comportamento de lista de permissões e ativação de Plugins integrados
- metadados legados de manifesto de variáveis de ambiente de provedores/canais
- hooks e aliases de tipo legados de Plugins de provedores enquanto os provedores migram para hooks explícitos de catálogo, autenticação, raciocínio, reprodução e transporte
- aliases legados de runtime, como `api.runtime.taskFlow`, `api.runtime.subagent.getSession`, `api.runtime.stt` e os descontinuados `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
- campos simples de callback `WebInboundMessage` do WhatsApp (veja abaixo)
- campos de admissão de nível superior de `WebInboundMessage` do WhatsApp (veja abaixo)
- registro dividido legado de Plugins de memória enquanto os Plugins de memória migram para `registerMemoryCapability`
- registro legado de provedores de embeddings específico de memória enquanto os provedores de embeddings migram para `api.registerEmbeddingProvider(...)` e `contracts.embeddingProviders`
- auxiliares legados do SDK de canais para esquemas nativos de mensagens, controle por menções, formatação do envelope de entrada e aninhamento de recursos de aprovação
- aliases legados da chave de rota de canal e do auxiliar de destinos comparáveis enquanto os Plugins migram para `openclaw/plugin-sdk/channel-route`
- dicas de ativação sendo substituídas pela propriedade das contribuições do manifesto
- fallback de runtime de `setup-api` enquanto os descritores de configuração inicial migram para metadados frios `setup.requiresRuntime: false`
- hooks de `discovery` de provedores enquanto os hooks de catálogo de provedores migram para `catalog.run(...)`
- metadados de canal `showConfigured` / `showInSetup` enquanto os pacotes de canais migram para `openclaw.channel.exposure`
- chaves legadas de configuração da política de runtime enquanto o Doctor migra os operadores para `agentRuntime`
- fallback de metadados gerados de configuração de canais integrados enquanto os metadados `channelConfigs` centrados no registro são implementados
- flags de ambiente persistidas para desativação do registro de Plugins e migração de instalações enquanto os fluxos de reparo migram os operadores para `openclaw plugins registry --refresh` e `openclaw doctor --fix`
- caminhos legados de configuração pertencentes a Plugins para pesquisa na web, busca de conteúdo da web e x_search enquanto o Doctor os migra para `plugins.entries.<plugin>.config`
- configuração legada criada em `plugins.installs` e aliases de caminhos de carregamento de Plugins integrados enquanto os metadados de instalação migram para o registro de Plugins gerenciado pelo estado

### Aliases simples de callbacks de entrada do WhatsApp

Os callbacks do runtime do WhatsApp fornecem `WebInboundMessage`: os contextos canônicos aninhados `event`, `payload`, `quote`, `group` e `platform`, além de aliases simples descontinuados para os campos de callback distribuídos. Novos códigos de callback devem ler os contextos aninhados. Códigos que constroem mensagens de callback aninhadas e limpas podem usar `WebInboundCallbackMessage`; listeners de compatibilidade que ainda injetam mensagens simples antigas de teste ou de Plugins devem usar `LegacyFlatWebInboundMessage` ou `WebInboundMessageInput`.

Os aliases simples permanecem disponíveis até **2026-08-30**; esse prazo se aplica somente ao acesso aos aliases simples, não ao formato aninhado, que é o contrato canônico do runtime. A anotação TypeScript `@deprecated` de cada alias simples identifica sua substituição aninhada exata. Exemplos comuns:

- `id`, `timestamp` e `isBatched` passam para `event`.
- `body`, `mediaPath`, `mediaType`, `mediaFileName`, `mediaUrl`, `location` e `untrustedStructuredContext` passam para `payload`.
- `to`, `chatId`, campos de remetente/do próprio usuário, `sendComposing`, `reply(...)` e `sendMedia(...)` passam para `platform`.
- Os campos `replyTo*` passam para `quote`; os campos de assunto/participante/menção do grupo passam para `group`.

`payload.untrustedStructuredContext` é extraído de payloads de entrada dos provedores. Os Plugins devem inspecionar `label`, `source` e `type` antes de tratar seu `payload` como autoritativo.

### Campos de admissão de entrada do WhatsApp

As mensagens de callback aceitas do WhatsApp contêm `admission`, um envelope seguro para exposição pública referente à decisão de controle de acesso que admitiu a mensagem. Novos códigos de callback devem ler os fatos de admissão em `msg.admission`, em vez dos campos de admissão de nível superior mais antigos.

Os campos de nível superior permanecem disponíveis até **2026-08-30**. A anotação TypeScript `@deprecated` de cada campo identifica sua substituição:

- `from` e `conversationId` passam para `admission.conversation.id`.
- `accountId` passa para `admission.accountId`.
- `accessControlPassed` é uma visão de compatibilidade derivada de `admission.ingress.decision === "allow"`; em mensagens que já contêm `admission`, gravar o booleano legado não reescreve o grafo de entrada.
- `chatType` passa para `admission.conversation.kind`.

## Pacote do inspetor de Plugins

O inspetor de Plugins deve residir fora do repositório principal do OpenClaw, como um pacote/repositório separado baseado nos contratos versionados de compatibilidade e de manifesto. A CLI inicial deve ser:

```sh
openclaw-plugin-inspector ./my-plugin
```

Ela deve emitir a validação do manifesto/esquema, a versão de compatibilidade do contrato sendo verificada, verificações de metadados de instalação/origem, verificações de importação de caminho frio e avisos de descontinuação/compatibilidade. Use `--json` para uma saída estável e legível por máquina em anotações de CI. O núcleo do OpenClaw deve expor contratos e fixtures que o inspetor possa consumir, mas não deve publicar o binário do inspetor pelo pacote principal `openclaw`.

### Etapa de aceitação dos mantenedores

Use o Blacksmith Testbox baseado em Crabbox para a etapa de aceitação do pacote instalável ao validar o inspetor externo em relação aos pacotes de Plugins do OpenClaw. Execute-a a partir de um checkout limpo do OpenClaw depois que o pacote for criado:

```sh
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
```

Mantenha essa etapa opcional para os mantenedores, pois ela instala um pacote npm externo e pode inspecionar pacotes de Plugins clonados fora do repositório. As proteções do repositório local abrangem o mapa de exportações do SDK, os metadados do registro de compatibilidade, a eliminação gradual de importações descontinuadas do SDK e os limites de importação das extensões integradas; a comprovação do inspetor no Testbox abrange o pacote da forma como autores externos de Plugins o consomem.

## Notas de release

As notas de release devem incluir as próximas descontinuações de Plugins, com datas previstas e links para a documentação de migração, antes que um caminho de compatibilidade passe para `removal-pending` ou `removed`.
