---
read_when:
    - Você mantém um Plugin do OpenClaw
    - Você vê um aviso de compatibilidade de Plugin
    - Você está planejando uma migração de manifesto ou SDK de Plugin
summary: Contratos de compatibilidade de Plugin, metadados de depreciação e expectativas de migração
title: Compatibilidade de Plugin
x-i18n:
    generated_at: "2026-04-26T11:33:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3b4e11dc57c29eac72844b91bec75a9d48005bbd3c89a2a9d7a5634ab782e5fc
    source_path: plugins/compatibility.md
    workflow: 15
---

O OpenClaw mantém contratos antigos de Plugin conectados por meio de adaptadores de compatibilidade nomeados antes de removê-los. Isso protege Plugins existentes, incluídos e externos, enquanto os contratos de SDK, manifesto, setup, config e runtime de agente evoluem.

## Registro de compatibilidade

Contratos de compatibilidade de Plugin são acompanhados no registro central em
`src/plugins/compat/registry.ts`.

Cada registro tem:

- um código de compatibilidade estável
- status: `active`, `deprecated`, `removal-pending` ou `removed`
- owner: SDK, config, setup, channel, provider, execução de plugin, runtime de agente
  ou core
- datas de introdução e depreciação quando aplicável
- orientação de substituição
- docs, diagnósticos e testes que cobrem o comportamento antigo e o novo

O registro é a fonte para planejamento de mantenedores e futuras verificações do
plugin inspector. Se um comportamento voltado a Plugin mudar, adicione ou atualize o
registro de compatibilidade na mesma mudança que adiciona o adaptador.

Compatibilidade de reparo e migração do doctor é acompanhada separadamente em
`src/commands/doctor/shared/deprecation-compat.ts`. Esses registros cobrem formatos antigos
de config, layouts de ledger de instalação e shims de reparo que talvez precisem continuar
disponíveis depois que o caminho de compatibilidade de runtime for removido.

Varreduras de release devem verificar ambos os registros. Não remova uma migração do doctor
apenas porque o registro correspondente de compatibilidade de runtime ou config expirou; primeiro
verifique se não há um caminho de upgrade compatível que ainda precise do reparo. Também
revalide cada anotação de substituição durante o planejamento de release, porque ownership de Plugin
e footprint de config podem mudar à medida que providers e canais saem do
core.

## Pacote plugin inspector

O plugin inspector deve ficar fora do repositório core do OpenClaw como um pacote/repositório
separado, baseado em contratos versionados de compatibilidade e manifesto.

A CLI do primeiro dia deve ser:

```sh
openclaw-plugin-inspector ./my-plugin
```

Ela deve emitir:

- validação de manifesto/schema
- a versão de compatibilidade de contrato que está sendo verificada
- verificações de metadados de instalação/fonte
- verificações de importação de caminho frio
- avisos de depreciação e compatibilidade

Use `--json` para saída estável legível por máquina em anotações de CI. O core do OpenClaw
deve expor contratos e fixtures que o inspector possa consumir, mas não
deve publicar o binário do inspector a partir do pacote principal `openclaw`.

## Política de depreciação

O OpenClaw não deve remover um contrato de Plugin documentado na mesma release
em que introduz sua substituição.

A sequência de migração é:

1. Adicionar o novo contrato.
2. Manter o comportamento antigo conectado por um adaptador de compatibilidade nomeado.
3. Emitir diagnósticos ou avisos quando autores de Plugin puderem agir.
4. Documentar a substituição e o cronograma.
5. Testar os caminhos antigo e novo.
6. Esperar durante a janela de migração anunciada.
7. Remover apenas com aprovação explícita de release que quebra compatibilidade.

Registros deprecated devem incluir uma data de início do aviso, substituição, link de docs
e data final de remoção com no máximo três meses após o início do aviso. Não
adicione um caminho de compatibilidade deprecated com janela de remoção em aberto, a menos que
mantenedores decidam explicitamente que é compatibilidade permanente e o marquem como `active`
em vez disso.

## Áreas atuais de compatibilidade

Os registros atuais de compatibilidade incluem:

- imports amplos legados de SDK como `openclaw/plugin-sdk/compat`
- formatos legados de Plugin apenas com hooks e `before_agent_start`
- entrypoints legados de Plugin `activate(api)` enquanto Plugins migram para
  `register(api)`
- aliases legados de SDK como `openclaw/extension-api`,
  `openclaw/plugin-sdk/channel-runtime`, builders de status de
  `openclaw/plugin-sdk/command-auth`, `openclaw/plugin-sdk/test-utils` e os aliases de tipo `ClawdbotConfig` /
  `OpenClawSchemaType`
- comportamento de allowlist e ativação de Plugin incluído
- metadados legados de manifesto de env-var de provider/channel
- hooks e aliases de tipo legados de Plugins de provider enquanto providers migram para
  hooks explícitos de catálogo, auth, thinking, replay e transporte
- aliases legados de runtime como `api.runtime.taskFlow`,
  `api.runtime.subagent.getSession` e `api.runtime.stt`
- registro dividido legado de Plugin de memória enquanto Plugins de memória migram para
  `registerMemoryCapability`
- helpers legados de SDK de canal para schemas nativos de mensagem, controle por menções,
  formatação de envelope de entrada e aninhamento de capability de aprovação
- dicas de ativação que estão sendo substituídas por ownership de contribuição de manifesto
- fallback de runtime `setup-api` enquanto descritores de setup migram para metadados frios
  `setup.requiresRuntime: false`
- hooks `discovery` de provider enquanto hooks de catálogo de provider migram para
  `catalog.run(...)`
- metadados `showConfigured` / `showInSetup` de canal enquanto pacotes de canal migram
  para `openclaw.channel.exposure`
- chaves legadas de config de política de runtime enquanto o doctor migra operadores para
  `agentRuntime`
- fallback gerado de metadados de config de canal incluído enquanto metadados
  `channelConfigs` com registry-first chegam
- flags de env persistidas para desativação de registro de Plugin e migração de instalação enquanto
  fluxos de reparo migram operadores para `openclaw plugins registry --refresh` e
  `openclaw doctor --fix`
- caminhos legados de config de pesquisa web, busca web e x_search controlados por Plugin enquanto
  o doctor os migra para `plugins.entries.<plugin>.config`
- config legada criada em `plugins.installs` e aliases de caminho de carga de Plugin incluído enquanto
  metadados de instalação migram para o ledger de Plugin gerenciado por estado

Novo código de Plugin deve preferir a substituição listada no registro e no
guia específico de migração. Plugins existentes podem continuar usando um caminho de compatibilidade
até que docs, diagnósticos e notas de release anunciem uma janela de remoção.

## Notas de release

Notas de release devem incluir depreciações futuras de Plugin com datas-alvo e
links para docs de migração. Esse aviso precisa acontecer antes que um caminho de compatibilidade mude para `removal-pending` ou `removed`.
