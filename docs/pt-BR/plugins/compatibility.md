---
read_when:
    - Você mantém um Plugin do OpenClaw
    - Você vê um aviso de compatibilidade de Plugin
    - Você está planejando uma migração do SDK de Plugin ou de manifesto
summary: Contratos de compatibilidade de Plugin, metadados de descontinuação e expectativas de migração
title: Compatibilidade do Plugin
x-i18n:
    generated_at: "2026-05-02T05:51:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: eecf94743cf34c5b773bfa8066164f90b7c8a75667c43f3f1002d32ec1d04902
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw mantém contratos de plugins mais antigos conectados por meio de adaptadores
de compatibilidade nomeados antes de removê-los. Isso protege plugins agrupados e
externos existentes enquanto os contratos do SDK, manifesto, configuração, config
e runtime do agente evoluem.

## Registro de compatibilidade

Os contratos de compatibilidade de plugins são rastreados no registro central em
`src/plugins/compat/registry.ts`.

Cada registro tem:

- um código de compatibilidade estável
- status: `active`, `deprecated`, `removal-pending` ou `removed`
- proprietário: SDK, config, configuração, canal, provedor, execução de plugin,
  runtime do agente ou core
- datas de introdução e depreciação quando aplicável
- orientação de substituição
- docs, diagnósticos e testes que cobrem o comportamento antigo e novo

O registro é a fonte para o planejamento dos mantenedores e futuras verificações
do inspetor de plugins. Se um comportamento voltado para plugins mudar, adicione
ou atualize o registro de compatibilidade na mesma alteração que adiciona o
adaptador.

A compatibilidade de reparo e migração do Doctor é rastreada separadamente em
`src/commands/doctor/shared/deprecation-compat.ts`. Esses registros cobrem
formatos antigos de config, layouts de registro de instalação e shims de reparo
que talvez precisem permanecer disponíveis depois que o caminho de
compatibilidade de runtime for removido.

Varreduras de release devem verificar ambos os registros. Não exclua uma
migração do Doctor apenas porque o registro correspondente de compatibilidade de
runtime ou config expirou; primeiro verifique se não há nenhum caminho de
atualização com suporte que ainda precise do reparo. Revalide também cada
anotação de substituição durante o planejamento da release, porque a propriedade
de plugins e a superfície de config podem mudar à medida que provedores e canais
saem do core.

## Pacote do inspetor de plugins

O inspetor de plugins deve ficar fora do repositório principal do OpenClaw como
um pacote/repositório separado, apoiado pelos contratos versionados de
compatibilidade e manifesto.

A CLI do primeiro dia deve ser:

```sh
openclaw-plugin-inspector ./my-plugin
```

Ela deve emitir:

- validação de manifesto/esquema
- a versão de compatibilidade de contrato que está sendo verificada
- verificações de metadados de instalação/origem
- verificações de importação de caminho frio
- avisos de depreciação e compatibilidade

Use `--json` para saída estável legível por máquina em anotações de CI. O core do
OpenClaw deve expor contratos e fixtures que o inspetor possa consumir, mas não
deve publicar o binário do inspetor a partir do pacote principal `openclaw`.

### Linha de aceitação para mantenedores

Use Blacksmith Testbox para a linha de aceitação do pacote instalável ao validar
o inspetor externo contra pacotes de plugins do OpenClaw. Execute a partir de um
checkout limpo do OpenClaw depois que o pacote for compilado:

```sh
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
blacksmith testbox run --id <tbx_id> "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
blacksmith testbox run --id <tbx_id> "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
blacksmith testbox stop <tbx_id>
```

Mantenha essa linha opt-in para mantenedores, porque ela instala um pacote npm
externo e pode inspecionar pacotes de plugins clonados fora do repositório. As
proteções do repositório local cobrem o mapa de exportação do SDK, metadados do
registro de compatibilidade, redução de importações obsoletas do SDK e limites de
importação de extensões agrupadas; a prova do inspetor no Testbox cobre o pacote
como autores externos de plugins o consomem.

## Política de depreciação

O OpenClaw não deve remover um contrato de plugin documentado na mesma release
que introduz sua substituição.

A sequência de migração é:

1. Adicione o novo contrato.
2. Mantenha o comportamento antigo conectado por meio de um adaptador de compatibilidade nomeado.
3. Emita diagnósticos ou avisos quando autores de plugins puderem agir.
4. Documente a substituição e o cronograma.
5. Teste os caminhos antigo e novo.
6. Aguarde durante a janela de migração anunciada.
7. Remova somente com aprovação explícita de release com breaking change.

Registros obsoletos devem incluir uma data de início do aviso, substituição, link
de docs e data final de remoção não mais que três meses após o início do aviso.
Não adicione um caminho de compatibilidade obsoleto com uma janela de remoção sem
prazo definido, a menos que os mantenedores decidam explicitamente que é
compatibilidade permanente e o marquem como `active`.

## Áreas de compatibilidade atuais

Os registros de compatibilidade atuais incluem:

- importações amplas legadas do SDK, como `openclaw/plugin-sdk/compat`
- formatos legados de plugin somente com hooks e `before_agent_start`
- pontos de entrada legados de plugin `activate(api)` enquanto plugins migram para
  `register(api)`
- aliases legados do SDK, como `openclaw/extension-api`,
  `openclaw/plugin-sdk/channel-runtime`, construtores de status
  `openclaw/plugin-sdk/command-auth`, `openclaw/plugin-sdk/test-utils` (substituídos
  por subcaminhos de teste focados de `openclaw/plugin-sdk/*`) e os aliases de tipo
  `ClawdbotConfig` / `OpenClawSchemaType`
- comportamento de allowlist e ativação de plugins agrupados
- metadados legados de manifesto de variáveis de ambiente de provedor/canal
- hooks legados de plugins de provedor e aliases de tipo enquanto provedores migram
  para hooks explícitos de catálogo, autenticação, raciocínio, reprodução e transporte
- aliases legados de runtime, como `api.runtime.taskFlow`,
  `api.runtime.subagent.getSession`, `api.runtime.stt` e os obsoletos
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
- registro dividido legado de plugin de memória enquanto plugins de memória migram
  para `registerMemoryCapability`
- helpers legados do SDK de canal para esquemas de mensagens nativas, bloqueio por
  menções, formatação de envelope de entrada e aninhamento de capacidade de aprovação
- aliases legados de chave de rota de canal e helper de destino comparável enquanto
  plugins migram para `openclaw/plugin-sdk/channel-route`
- dicas de ativação que estão sendo substituídas por propriedade de contribuições
  de manifesto
- fallback de runtime de `setup-api` enquanto descritores de configuração migram
  para metadados frios `setup.requiresRuntime: false`
- hooks `discovery` de provedor enquanto hooks de catálogo de provedor migram para
  `catalog.run(...)`
- metadados de canal `showConfigured` / `showInSetup` enquanto pacotes de canal migram
  para `openclaw.channel.exposure`
- chaves legadas de config de política de runtime enquanto o Doctor migra operadores
  para `agentRuntime`
- fallback gerado de metadados de config de canal agrupado enquanto metadados
  `channelConfigs` com registro primeiro são lançados
- flags de ambiente persistidas de desativação do registro de plugins e migração de
  instalação enquanto fluxos de reparo migram operadores para
  `openclaw plugins registry --refresh` e `openclaw doctor --fix`
- caminhos legados de config de pesquisa web, busca web e x_search pertencentes a
  plugins enquanto o Doctor os migra para `plugins.entries.<plugin>.config`
- config autorada legada de `plugins.installs` e aliases de caminho de carregamento
  de plugins agrupados enquanto metadados de instalação migram para o registro de
  plugins gerenciado por estado

Novo código de plugin deve preferir a substituição listada no registro e no guia
de migração específico. Plugins existentes podem continuar usando um caminho de
compatibilidade até que docs, diagnósticos e notas de release anunciem uma janela
de remoção.

## Notas de release

As notas de release devem incluir depreciações futuras de plugins com datas-alvo
e links para docs de migração. Esse aviso precisa acontecer antes que um caminho
de compatibilidade passe para `removal-pending` ou `removed`.
