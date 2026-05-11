---
read_when:
    - Você mantém um Plugin do OpenClaw
    - Você vê um aviso de compatibilidade de Plugin
    - Você está planejando uma migração do SDK de Plugin ou do manifesto
summary: Contratos de compatibilidade de Plugin, metadados de depreciação e expectativas de migração
title: Compatibilidade do Plugin
x-i18n:
    generated_at: "2026-05-11T20:33:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1afd37697f55721ca8419256a6e8187c398d4b20fb11a65776b755050dd5368b
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw mantém contratos de plugins antigos conectados por meio de adaptadores
de compatibilidade nomeados antes de removê-los. Isso protege plugins
agrupados e externos existentes enquanto os contratos do SDK, manifesto,
configuração, config e runtime do agente evoluem.

## Registro de compatibilidade

Os contratos de compatibilidade de plugins são rastreados no registro central em
`src/plugins/compat/registry.ts`.

Cada registro tem:

- um código de compatibilidade estável
- status: `active`, `deprecated`, `removal-pending` ou `removed`
- proprietário: SDK, config, configuração, canal, provedor, execução de plugin, runtime do agente,
  ou core
- datas de introdução e descontinuação quando aplicável
- orientação de substituição
- documentação, diagnósticos e testes que cobrem o comportamento antigo e o novo

O registro é a fonte para o planejamento dos mantenedores e futuras verificações
do inspetor de plugins. Se um comportamento voltado a plugins mudar, adicione ou
atualize o registro de compatibilidade na mesma alteração que adiciona o
adaptador.

A compatibilidade de reparo e migração do Doctor é rastreada separadamente em
`src/commands/doctor/shared/deprecation-compat.ts`. Esses registros cobrem
formatos antigos de config, layouts de ledger de instalação e shims de reparo
que talvez precisem continuar disponíveis depois que o caminho de compatibilidade
de runtime for removido.

Varreduras de release devem verificar ambos os registros. Não exclua uma
migração do Doctor apenas porque o registro correspondente de compatibilidade de
runtime ou config expirou; primeiro verifique se não há um caminho de upgrade
compatível que ainda precise do reparo. Também revalide cada anotação de
substituição durante o planejamento de release, porque a propriedade de plugins
e a área de config podem mudar à medida que provedores e canais saem do core.

## Pacote do inspetor de plugins

O inspetor de plugins deve viver fora do repositório central do OpenClaw como um
pacote/repositório separado respaldado pelos contratos versionados de
compatibilidade e manifesto.

A CLI do primeiro dia deve ser:

```sh
openclaw-plugin-inspector ./my-plugin
```

Ela deve emitir:

- validação de manifesto/schema
- a versão de compatibilidade do contrato sendo verificada
- verificações de metadados de instalação/origem
- verificações de importação de caminhos frios
- avisos de descontinuação e compatibilidade

Use `--json` para saída estável legível por máquina em anotações de CI. O core
do OpenClaw deve expor contratos e fixtures que o inspetor possa consumir, mas
não deve publicar o binário do inspetor a partir do pacote principal
`openclaw`.

### Trilha de aceite dos mantenedores

Use o Blacksmith Testbox com Crabbox para a trilha de aceite de pacote
instalável ao validar o inspetor externo em pacotes de plugins do OpenClaw.
Execute a partir de um checkout limpo do OpenClaw depois que o pacote for
construído:

```sh
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
```

Mantenha essa trilha opcional para mantenedores porque ela instala um pacote npm
externo e pode inspecionar pacotes de plugins clonados fora do repositório. As
guardas do repositório local cobrem o mapa de exportação do SDK, os metadados do
registro de compatibilidade, a eliminação de imports descontinuados do SDK e os
limites de importação de extensões agrupadas; a prova do inspetor no Testbox
cobre o pacote como autores de plugins externos o consomem.

## Política de descontinuação

OpenClaw não deve remover um contrato de plugin documentado na mesma release
que introduz sua substituição.

A sequência de migração é:

1. Adicionar o novo contrato.
2. Manter o comportamento antigo conectado por meio de um adaptador de compatibilidade nomeado.
3. Emitir diagnósticos ou avisos quando autores de plugins puderem agir.
4. Documentar a substituição e o cronograma.
5. Testar os caminhos antigo e novo.
6. Aguardar a janela de migração anunciada.
7. Remover somente com aprovação explícita de release com breaking changes.

Registros descontinuados devem incluir uma data de início do aviso, substituição,
link de documentação e data final de remoção no máximo três meses depois do
início do aviso. Não adicione um caminho de compatibilidade descontinuado com
uma janela de remoção sem prazo, a menos que os mantenedores decidam
explicitamente que é compatibilidade permanente e o marquem como `active`.

## Áreas de compatibilidade atuais

Os registros de compatibilidade atuais incluem:

- imports amplos legados do SDK, como `openclaw/plugin-sdk/compat`
- formatos legados de plugins apenas com hooks e `before_agent_start`
- entrypoints legados de plugin `activate(api)` enquanto plugins migram para
  `register(api)`
- aliases legados do SDK, como `openclaw/extension-api`,
  `openclaw/plugin-sdk/channel-runtime`, builders de status de
  `openclaw/plugin-sdk/command-auth`, `openclaw/plugin-sdk/test-utils` (substituído por subcaminhos de teste
  `openclaw/plugin-sdk/*` focados), e os aliases de tipo `ClawdbotConfig` /
  `OpenClawSchemaType`
- comportamento de allowlist e habilitação de plugins agrupados
- metadados legados de manifesto de variáveis de ambiente de provedor/canal
- hooks legados de plugins de provedor e aliases de tipo enquanto provedores migram para
  hooks explícitos de catálogo, auth, thinking, replay e transporte
- aliases legados de runtime, como `api.runtime.taskFlow`,
  `api.runtime.subagent.getSession`, `api.runtime.stt` e os descontinuados
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
- registro dividido legado de plugin de memória enquanto plugins de memória migram para
  `registerMemoryCapability`
- helpers legados do SDK de canais para schemas de mensagens nativas, gating de menções,
  formatação de envelopes inbound e aninhamento de capacidade de aprovação
- aliases legados de chave de rota de canal e helper de alvo comparável enquanto plugins
  migram para `openclaw/plugin-sdk/channel-route`
- dicas de ativação que estão sendo substituídas pela propriedade de contribuições do manifesto
- fallback de runtime de `setup-api` enquanto descritores de configuração migram para metadados frios
  `setup.requiresRuntime: false`
- hooks de `discovery` de provedores enquanto hooks de catálogo de provedores migram para
  `catalog.run(...)`
- metadados `showConfigured` / `showInSetup` de canais enquanto pacotes de canais migram
  para `openclaw.channel.exposure`
- chaves legadas de config de política de runtime enquanto o Doctor migra operadores para
  `agentRuntime`
- fallback gerado de metadados de config de canais agrupados enquanto metadados
  `channelConfigs` registry-first chegam
- flags de ambiente legadas de desabilitação do registro persistido de plugins e migração de instalação enquanto
  fluxos de reparo migram operadores para `openclaw plugins registry --refresh` e
  `openclaw doctor --fix`
- caminhos legados de config de pesquisa web, busca web e x_search pertencentes a plugins enquanto
  o Doctor os migra para `plugins.entries.<plugin>.config`
- config autorada legada de `plugins.installs` e aliases de caminho de carregamento de plugins agrupados
  enquanto metadados de instalação se movem para o ledger de plugins gerenciado por estado

Novo código de plugin deve preferir a substituição listada no registro e no guia
de migração específico. Plugins existentes podem continuar usando um caminho de
compatibilidade até que a documentação, os diagnósticos e as notas de release
anunciem uma janela de remoção.

## Notas de release

As notas de release devem incluir próximas descontinuações de plugins com datas
alvo e links para a documentação de migração. Esse aviso precisa acontecer antes
que um caminho de compatibilidade passe para `removal-pending` ou `removed`.
