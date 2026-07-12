---
read_when:
    - Você vê uma chave de configuração `.experimental` e quer saber se ela é estável
    - Você quer experimentar recursos de runtime em prévia sem confundi-los com os padrões normais
    - Você quer um único lugar para encontrar os sinalizadores experimentais documentados atualmente
summary: O que significam os sinalizadores experimentais no OpenClaw e quais estão documentados atualmente
title: Recursos experimentais
x-i18n:
    generated_at: "2026-07-11T23:52:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1d4f6d066ef80cad2fb8a54c8aecb9fca5b4ed91cd5a3626dad4ad889dc3e8f2
    source_path: concepts/experimental-features.md
    workflow: 16
---

Os recursos experimentais são funcionalidades de prévia opcionais, disponíveis mediante flags explícitas. Eles precisam de mais experiência de uso no mundo real antes de receberem um padrão estável ou um contrato de longa duração.

- Desativados por padrão, a menos que um documento instrua você a ativar algum deles.
- A estrutura e o comportamento podem mudar mais rapidamente do que as configurações estáveis.
- Prefira um caminho estável quando já houver um disponível.
- Faça uma implantação ampla somente após testar primeiro em um ambiente menor.

## Flags documentadas atualmente

| Funcionalidade                    | Chave                                                                                      | Use quando                                                                                                                            | Mais                                                                                              |
| --------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Runtime de modelo local           | `agents.defaults.experimental.localModelLean`, `agents.list[].experimental.localModelLean` | Um backend local menor ou mais rigoroso não consegue lidar com o conjunto completo de ferramentas padrão do OpenClaw                 | [Modelos locais](/pt-BR/gateway/local-models)                                                           |
| Pesquisa de memória               | `agents.defaults.memorySearch.experimental.sessionMemory`                                  | Você quer que `memory_search` indexe transcrições de sessões anteriores e aceita o custo adicional de armazenamento e indexação      | [Referência de configuração de memória](/pt-BR/reference/memory-config#session-memory-search-experimental) |
| Harness do Codex                  | `plugins.entries.codex.config.appServer.experimental.sandboxExecServer`                    | Você quer que o app-server nativo do Codex 0.132.0 ou mais recente use um servidor de execução baseado no sandbox do OpenClaw, em vez de desativar o Modo de Código | [Referência do harness do Codex](/pt-BR/plugins/codex-harness-reference#sandboxed-native-execution) |
| Ferramenta de planejamento estruturado | `tools.experimental.planTool`                                                         | Você quer disponibilizar a ferramenta estruturada `update_plan` para acompanhar trabalhos de várias etapas em runtimes e interfaces compatíveis | [Referência de configuração do Gateway](/pt-BR/gateway/config-tools#toolsexperimental)              |

## Modo enxuto para modelos locais

`agents.defaults.experimental.localModelLean: true` remove, a cada interação, ferramentas opcionais pesadas da interface direta do agente: `browser`, `cron`, `message`, `image_generate`, `music_generate`, `video_generate`, `tts` e `pdf`. Ferramentas explicitamente permitidas ou necessárias para entrega continuam disponíveis, embora a Pesquisa de Ferramentas possa catalogá-las em vez de expô-las diretamente. O modo enxuto também configura por padrão os catálogos de plugins/MCP/clientes para usar a Pesquisa de Ferramentas estruturada (`tool_search`, `tool_describe`, `tool_call`) quando `tools.toolSearch` ainda não estiver definido. Use `agents.list[].experimental.localModelLean` para limitar isso a um agente.

Se você já ajusta a Pesquisa de Ferramentas globalmente, o OpenClaw mantém essa configuração inalterada. Defina `tools.toolSearch: false` para não usar o padrão da Pesquisa de Ferramentas do modo enxuto.

No modo estruturado de `tools`, as execuções enxutas mantêm `exec` diretamente visível ao lado dos controles da Pesquisa de Ferramentas, para que modelos locais ajustados para programação ainda possam escolher o caminho de shell que lhes é familiar. Isso altera somente a visibilidade do esquema: a política normal de ferramentas, o isolamento em sandbox e as aprovações de execução continuam aplicáveis. Os modos explícitos `code` e `directory` mantêm seu comportamento normal de Compaction.

### Por que essas ferramentas

Essas ferramentas têm as descrições mais extensas, os formatos de parâmetros mais abrangentes ou a maior probabilidade de desviar um modelo pequeno do fluxo normal de programação e conversa. Em um backend com contexto reduzido ou compatível com OpenAI mais rigoroso, isso representa a diferença entre:

- Os esquemas das ferramentas caberem no prompt ou ocuparem o espaço do histórico da conversa.
- O modelo escolher a ferramenta certa ou emitir chamadas de ferramenta malformadas devido ao excesso de esquemas semelhantes.
- O adaptador de Chat Completions permanecer dentro dos limites de saída estruturada ou retornar um erro 400 devido ao tamanho do payload da chamada de ferramenta.

Removê-las apenas reduz a lista direta de ferramentas. O modelo ainda tem `read`, `write`, `edit`, `exec`, `apply_patch`, compreensão de imagens, pesquisa/busca na Web (quando configurada), memória e ferramentas de sessão/agente. Os catálogos adicionais permanecem acessíveis por meio da Pesquisa de Ferramentas, a menos que você defina `tools.toolSearch: false`; permissões explícitas de ferramentas podem reintegrar um agente enxuto a um fluxo de trabalho reduzido.

### Quando ativar

Ative o modo enxuto depois de comprovar que o modelo consegue se comunicar com o Gateway, mas as interações completas do agente apresentam problemas:

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` é concluído com sucesso.
2. Uma interação normal do agente falha com chamadas de ferramenta malformadas, prompts grandes demais ou o modelo ignorando suas ferramentas.
3. Ativar `localModelLean: true` elimina a falha.

### Quando deixá-lo desativado

Se o seu backend lida corretamente com o runtime padrão completo, mantenha esta opção desativada. Ela é uma solução alternativa para ambientes locais que precisam de uma interface de ferramentas menor, não um padrão para modelos hospedados ou equipamentos locais com recursos suficientes.

O modo enxuto não substitui `tools.profile`, `tools.allow`/`tools.deny` nem a alternativa de escape `compat.supportsTools: false` do modelo. Para manter permanentemente uma interface de ferramentas mais restrita em um agente específico, prefira essas opções estáveis.

### Ativar

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

Somente para um agente:

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

Reinicie o Gateway após alterar a flag. A filtragem do modo enxuto remove `browser`, `cron`, `message`, `image_generate`, `music_generate`, `video_generate`, `tts` e `pdf`, a menos que você as preserve explicitamente com `tools.allow` ou `tools.alsoAllow`; a Pesquisa de Ferramentas ainda pode catalogar as ferramentas preservadas em vez de expô-las diretamente.

## Experimental não significa oculto

Um recurso experimental deve ser identificado claramente como tal na documentação e no próprio caminho de configuração, e não ficar oculto atrás de uma opção padrão com aparência estável.

## Relacionado

- [Recursos](/pt-BR/concepts/features)
- [Canais de lançamento](/pt-BR/install/development-channels)
