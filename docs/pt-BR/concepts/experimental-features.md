---
read_when:
    - Você vê uma chave de configuração `.experimental` e quer saber se ela é estável
    - Você quer experimentar recursos de tempo de execução em prévia sem confundi-los com os padrões normais
    - Você quer um único lugar para encontrar os sinalizadores experimentais documentados atualmente
summary: O que as flags experimentais significam no OpenClaw e quais delas estão documentadas atualmente
title: Recursos experimentais
x-i18n:
    generated_at: "2026-06-27T17:24:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0f42e6b574c5db9508412c9c5d9919d1a54a16fe00edea43664f3a01e8e38f5
    source_path: concepts/experimental-features.md
    workflow: 16
---

Recursos experimentais no OpenClaw são **superfícies de prévia opcionais**. Eles ficam
atrás de flags explícitas porque ainda precisam de uso no mundo real antes de
merecerem um padrão estável ou um contrato público duradouro.

Trate-os de forma diferente da configuração normal:

- Mantenha-os **desativados por padrão**, a menos que a documentação relacionada diga para você experimentar um.
- Espere que **forma e comportamento mudem** mais rapidamente do que na configuração estável.
- Prefira primeiro o caminho estável quando já houver um.
- Se você estiver implantando o OpenClaw em larga escala, teste flags experimentais em um ambiente
  menor antes de incorporá-las a uma base compartilhada.

## Flags documentadas atualmente

| Superfície               | Chave                                                                                      | Use quando                                                                                                                        | Mais                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Runtime de modelo local  | `agents.defaults.experimental.localModelLean`, `agents.list[].experimental.localModelLean` | Um backend local menor ou mais rigoroso engasga com a superfície completa de ferramentas padrão do OpenClaw                       | [Modelos locais](/pt-BR/gateway/local-models)                                                       |
| Busca de memória         | `agents.defaults.memorySearch.experimental.sessionMemory`                                  | Você quer que `memory_search` indexe transcrições de sessões anteriores e aceita o custo extra de armazenamento/indexação          | [Referência de configuração de memória](/pt-BR/reference/memory-config#session-memory-search-experimental) |
| Harness do Codex         | `plugins.entries.codex.config.appServer.experimental.sandboxExecServer`                    | Você quer que o app-server nativo do Codex 0.132.0 ou mais recente use um exec-server apoiado pelo sandbox do OpenClaw em vez de desativar o Modo de Código | [Referência do harness do Codex](/pt-BR/plugins/codex-harness-reference#sandboxed-native-execution) |
| Ferramenta de planejamento estruturado | `tools.experimental.planTool`                                                    | Você quer a ferramenta estruturada `update_plan` exposta para acompanhamento de trabalho em várias etapas em runtimes e UIs compatíveis | [Referência de configuração do Gateway](/pt-BR/gateway/config-tools#toolsexperimental)              |

## Modo enxuto de modelo local

`agents.defaults.experimental.localModelLean: true` é uma válvula de alívio para configurações de modelo local mais fracas. Quando ativado, o OpenClaw remove três ferramentas padrão — `browser`, `cron` e `message` — da superfície de ferramentas do agente em cada turno. Ele também faz esse run usar por padrão controles estruturados de Tool Search quando `tools.toolSearch` não está configurado explicitamente, para que catálogos maiores de ferramentas de Plugin, MCP ou cliente fiquem atrás de `tool_search`, `tool_describe` e `tool_call` em vez de serem despejados no prompt. Runs que exigem entrega direta por `message` mantêm essa ferramenta direta em vez de habilitar o padrão de Tool Search do modo enxuto. Use `agents.list[].experimental.localModelLean` para habilitar ou desabilitar o mesmo comportamento para um agente configurado.

### Por que estas três ferramentas

Estas três ferramentas têm as maiores descrições e a maior quantidade de formatos de parâmetros no runtime padrão do OpenClaw. Em um backend compatível com OpenAI com contexto pequeno ou mais rigoroso, essa é a diferença entre:

- Esquemas de ferramentas caberem limpidamente no prompt vs. ocuparem o espaço do histórico da conversa.
- O modelo escolher a ferramenta certa vs. emitir chamadas de ferramenta malformadas porque há esquemas demais com aparência semelhante.
- O adaptador de Chat Completions permanecer dentro dos limites de saída estruturada do servidor vs. disparar um 400 por tamanho do payload de chamada de ferramenta.

Removê-las não reconecta o OpenClaw silenciosamente — apenas encurta a lista direta de ferramentas. O modelo ainda tem `read`, `write`, `edit`, `exec`, `apply_patch`, busca/busca de conteúdo na web (quando configurada), memória e ferramentas de sessão/agente disponíveis. Catálogos extras continuam chamáveis por meio do Tool Search, a menos que você defina explicitamente `tools.toolSearch: false`.

### Quando ativar

Habilite o modo enxuto quando você já tiver comprovado que o modelo consegue falar com o Gateway, mas turnos completos do agente se comportam mal. A cadeia típica de sinais é:

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` funciona.
2. Um turno normal do agente falha com chamadas de ferramenta malformadas, prompts grandes demais ou o modelo ignorando suas ferramentas.
3. Alternar `localModelLean: true` elimina a falha.

### Quando deixar desativado

Se o seu backend lida bem com o runtime padrão completo, deixe isto desativado. O modo enxuto é uma solução alternativa, não um padrão. Ele existe porque algumas pilhas locais precisam de uma superfície de ferramentas menor para se comportar; modelos hospedados e rigs locais bem dimensionados não precisam.

O modo enxuto também não substitui `tools.profile`, `tools.allow`/`tools.deny` nem a válvula de escape `compat.supportsTools: false` do modelo. Se você precisa de uma superfície de ferramentas permanentemente mais estreita para um agente específico, prefira esses controles estáveis em vez da flag experimental.

Se você já ajusta o Tool Search globalmente, o OpenClaw deixa essa configuração do operador intacta. Defina `tools.toolSearch: false` para sair do padrão de Tool Search do modo enxuto.

### Habilitar

```json5
{
  agents: {
    defaults: {
      experimental: {
        localModelLean: true,
      },
    },
  },
}
```

Apenas para um agente:

```json5
{
  agents: {
    list: [
      {
        id: "local",
        model: "lmstudio/gemma-4-e4b-it",
        experimental: {
          localModelLean: true,
        },
      },
    ],
  },
}
```

Reinicie o Gateway depois de alterar a flag e confirme a lista reduzida de ferramentas com:

```bash
openclaw status --deep
```

A saída de status profundo lista as ferramentas ativas do agente; `browser`, `cron` e `message` devem estar ausentes quando o modo enxuto estiver ativado, a menos que o modo de entrega atual force respostas diretas por `message`.

## Experimental não significa oculto

Se um recurso é experimental, o OpenClaw deve dizer isso claramente na documentação e no
próprio caminho de configuração. O que ele **não** deve fazer é infiltrar comportamento de prévia em um
controle com aparência estável e fingir que isso é normal. É assim que superfícies de
configuração ficam bagunçadas.

## Relacionado

- [Recursos](/pt-BR/concepts/features)
- [Canais de lançamento](/pt-BR/install/development-channels)
