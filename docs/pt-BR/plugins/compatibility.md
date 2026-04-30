---
read_when:
    - Você mantém um Plugin do OpenClaw
    - Você vê um aviso de compatibilidade de Plugin
    - Você está planejando uma migração do SDK de Plugin ou do manifesto
summary: Contratos de compatibilidade de Plugin, metadados de depreciação e expectativas de migração
title: Compatibilidade de Plugin
x-i18n:
    generated_at: "2026-04-30T09:59:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 344dbaac86db7259adc09bc91b7fbe7ba540fc6fdd96cc422918ccf2c34d9cec
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw mantém contratos de plugin mais antigos conectados por meio de adaptadores de compatibilidade nomeados antes de removê-los. Isso protege Plugins empacotados e externos existentes enquanto os contratos de SDK, manifesto, configuração inicial, config e runtime do agente evoluem.

## Registro de compatibilidade

Os contratos de compatibilidade de Plugin são acompanhados no registro central em `src/plugins/compat/registry.ts`.

Cada registro tem:

- um código de compatibilidade estável
- status: `active`, `deprecated`, `removal-pending` ou `removed`
- proprietário: SDK, config, configuração inicial, canal, provedor, execução de Plugin, runtime do agente ou core
- datas de introdução e descontinuação quando aplicável
- orientação de substituição
- docs, diagnósticos e testes que cobrem o comportamento antigo e o novo

O registro é a fonte para o planejamento de mantenedores e futuras verificações do inspetor de Plugins. Se um comportamento voltado a Plugins mudar, adicione ou atualize o registro de compatibilidade na mesma alteração que adiciona o adaptador.

A compatibilidade de reparo e migração do doctor é acompanhada separadamente em `src/commands/doctor/shared/deprecation-compat.ts`. Esses registros cobrem formatos antigos de config, layouts de ledger de instalação e shims de reparo que talvez precisem continuar disponíveis depois que o caminho de compatibilidade de runtime for removido.

Varreduras de release devem verificar ambos os registros. Não exclua uma migração do doctor apenas porque o registro de compatibilidade de runtime ou config correspondente expirou; primeiro verifique se não há um caminho de upgrade com suporte que ainda precise do reparo. Também revalide cada anotação de substituição durante o planejamento de release, porque a propriedade de Plugins e o escopo de config podem mudar conforme provedores e canais saem do core.

## Pacote do inspetor de Plugins

O inspetor de Plugins deve viver fora do repo central do OpenClaw como um pacote/repositório separado apoiado pelos contratos versionados de compatibilidade e manifesto.

A CLI inicial deve ser:

```sh
openclaw-plugin-inspector ./my-plugin
```

Ela deve emitir:

- validação de manifesto/schema
- a versão de compatibilidade de contrato sendo verificada
- verificações de metadados de instalação/origem
- verificações de importação de caminho frio
- avisos de descontinuação e compatibilidade

Use `--json` para saída estável legível por máquina em anotações de CI. O core do OpenClaw deve expor contratos e fixtures que o inspetor possa consumir, mas não deve publicar o binário do inspetor a partir do pacote principal `openclaw`.

### Lane de aceitação de mantenedores

Use o Blacksmith Testbox para a lane de aceitação de pacote instalável ao validar o inspetor externo contra pacotes de Plugins do OpenClaw. Execute-o a partir de um checkout limpo do OpenClaw depois que o pacote for construído:

```sh
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
blacksmith testbox run --id <tbx_id> "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
blacksmith testbox run --id <tbx_id> "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
blacksmith testbox stop <tbx_id>
```

Mantenha essa lane opcional para mantenedores, porque ela instala um pacote npm externo e pode inspecionar pacotes de Plugins clonados fora do repo. As proteções do repo local cobrem o mapa de exports do SDK, metadados do registro de compatibilidade, redução de imports obsoletos do SDK e limites de importação de extensões empacotadas; a prova do inspetor no Testbox cobre o pacote como autores de Plugins externos o consomem.

## Política de descontinuação

O OpenClaw não deve remover um contrato de Plugin documentado no mesmo release que introduz seu substituto.

A sequência de migração é:

1. Adicione o novo contrato.
2. Mantenha o comportamento antigo conectado por meio de um adaptador de compatibilidade nomeado.
3. Emita diagnósticos ou avisos quando autores de Plugins puderem agir.
4. Documente a substituição e o cronograma.
5. Teste os caminhos antigo e novo.
6. Aguarde durante a janela de migração anunciada.
7. Remova somente com aprovação explícita de release incompatível.

Registros descontinuados devem incluir uma data de início do aviso, substituição, link de docs e data final de remoção no máximo três meses após o início do aviso. Não adicione um caminho de compatibilidade descontinuado com uma janela de remoção sem prazo definido, a menos que os mantenedores decidam explicitamente que é compatibilidade permanente e o marquem como `active`.

## Áreas atuais de compatibilidade

Os registros atuais de compatibilidade incluem:

- imports amplos legados do SDK, como `openclaw/plugin-sdk/compat`
- formatos legados de Plugin somente com hooks e `before_agent_start`
- entrypoints legados de Plugin `activate(api)` enquanto Plugins migram para `register(api)`
- aliases legados do SDK, como `openclaw/extension-api`, `openclaw/plugin-sdk/channel-runtime`, builders de status de `openclaw/plugin-sdk/command-auth`, `openclaw/plugin-sdk/test-utils` (substituído por subcaminhos de teste focados `openclaw/plugin-sdk/*`) e os aliases de tipo `ClawdbotConfig` / `OpenClawSchemaType`
- allowlist e comportamento de habilitação de Plugins empacotados
- metadados legados de manifesto de env vars de provedor/canal
- hooks e aliases de tipo legados de Plugin de provedor enquanto provedores migram para hooks explícitos de catálogo, auth, thinking, replay e transporte
- aliases legados de runtime, como `api.runtime.taskFlow`, `api.runtime.subagent.getSession`, `api.runtime.stt` e `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)` descontinuados
- registro dividido legado de Plugin de memória enquanto Plugins de memória migram para `registerMemoryCapability`
- helpers legados do SDK de canal para schemas de mensagem nativos, controle de menção, formatação de envelope de entrada e aninhamento de capacidade de aprovação
- chave de rota de canal legada e aliases de helper de alvo comparável enquanto Plugins migram para `openclaw/plugin-sdk/channel-route`
- dicas de ativação que estão sendo substituídas por propriedade de contribuição de manifesto
- carregamento sidecar implícito legado de inicialização descontinuado para Plugins que não declararam `activation.onStartup`; mantenedores podem testar o comportamento futuro mais estrito com `OPENCLAW_DISABLE_LEGACY_IMPLICIT_STARTUP_SIDECARS=1`
- fallback de runtime `setup-api` enquanto descritores de configuração inicial migram para metadados frios `setup.requiresRuntime: false`
- hooks `discovery` de provedor enquanto hooks de catálogo de provedor migram para `catalog.run(...)`
- metadados `showConfigured` / `showInSetup` de canal enquanto pacotes de canal migram para `openclaw.channel.exposure`
- chaves legadas de config de política de runtime enquanto o doctor migra operadores para `agentRuntime`
- fallback de metadados gerados de config de canal empacotado enquanto metadados registry-first `channelConfigs` chegam
- flags de env de desabilitação do registro de Plugins persistido e migração de instalação enquanto fluxos de reparo migram operadores para `openclaw plugins registry --refresh` e `openclaw doctor --fix`
- caminhos legados de config de pesquisa web, fetch web e x_search de propriedade de Plugin enquanto o doctor os migra para `plugins.entries.<plugin>.config`
- config autorada legada `plugins.installs` e aliases de caminho de carregamento de Plugin empacotado enquanto metadados de instalação migram para o ledger de Plugins gerenciado por estado

Novo código de Plugin deve preferir a substituição listada no registro e no guia de migração específico. Plugins existentes podem continuar usando um caminho de compatibilidade até que as docs, diagnósticos e notas de release anunciem uma janela de remoção.

## Notas de release

As notas de release devem incluir próximas descontinuações de Plugins com datas-alvo e links para docs de migração. Esse aviso precisa acontecer antes que um caminho de compatibilidade passe para `removal-pending` ou `removed`.
