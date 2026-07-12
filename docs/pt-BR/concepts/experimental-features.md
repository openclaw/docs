---
read_when:
    - Você vê uma chave de configuração `.experimental` e quer saber se ela é estável
    - Você quer experimentar recursos de runtime em versão prévia sem confundi-los com os padrões normais
    - Você quer um único lugar para encontrar os sinalizadores experimentais documentados atualmente
summary: O que significam os sinalizadores experimentais no OpenClaw e quais estão documentados atualmente
title: Recursos experimentais
x-i18n:
    generated_at: "2026-07-12T15:08:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 1d4f6d066ef80cad2fb8a54c8aecb9fca5b4ed91cd5a3626dad4ad889dc3e8f2
    source_path: concepts/experimental-features.md
    workflow: 16
---

Recursos experimentais são superfícies de prévia opcionais, protegidas por flags explícitas. Eles precisam de mais experiência de uso no mundo real antes de receberem um padrão estável ou um contrato de longa duração.

- Desativados por padrão, a menos que uma documentação instrua você a ativar um deles.
- A estrutura e o comportamento podem mudar mais rapidamente do que a configuração estável.
- Prefira um caminho estável quando já existir um.
- Faça uma implantação ampla somente após testar primeiro em um ambiente menor.

## Flags documentadas atualmente

| Superfície                    | Chave                                                                                      | Use quando                                                                                                                               | Mais                                                                                                  |
| ----------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Runtime de modelo local       | `agents.defaults.experimental.localModelLean`, `agents.list[].experimental.localModelLean` | Um backend local menor ou mais rígido não consegue lidar com a superfície completa de ferramentas padrão do OpenClaw                    | [Modelos locais](/pt-BR/gateway/local-models)                                                               |
| Pesquisa de memória           | `agents.defaults.memorySearch.experimental.sessionMemory`                                  | Você quer que `memory_search` indexe transcrições de sessões anteriores e aceita o custo adicional de armazenamento e indexação          | [Referência de configuração de memória](/pt-BR/reference/memory-config#session-memory-search-experimental)  |
| Harness do Codex              | `plugins.entries.codex.config.appServer.experimental.sandboxExecServer`                    | Você quer que o app-server nativo do Codex 0.132.0 ou mais recente use como destino um exec-server do sandbox do OpenClaw, em vez de desativar o Code Mode | [Referência do harness do Codex](/pt-BR/plugins/codex-harness-reference#sandboxed-native-execution)          |
| Ferramenta de planejamento estruturado | `tools.experimental.planTool`                                                       | Você quer que a ferramenta estruturada `update_plan` seja disponibilizada para acompanhar trabalhos com várias etapas em runtimes e interfaces compatíveis | [Referência de configuração do Gateway](/pt-BR/gateway/config-tools#toolsexperimental)                       |

## Modo enxuto de modelo local

`agents.defaults.experimental.localModelLean: true` remove ferramentas opcionais pesadas da superfície direta do agente a cada turno: `browser`, `cron`, `message`, `image_generate`, `music_generate`, `video_generate`, `tts` e `pdf`. Ferramentas permitidas explicitamente ou necessárias para entrega continuam disponíveis, embora a Pesquisa de Ferramentas possa catalogá-las em vez de expô-las diretamente. O modo enxuto também configura por padrão os catálogos de plugins/MCP/clientes para usar a Pesquisa de Ferramentas estruturada (`tool_search`, `tool_describe`, `tool_call`) quando `tools.toolSearch` ainda não estiver definido. Use `agents.list[].experimental.localModelLean` para limitar isso a um agente.

Se você já ajusta a Pesquisa de Ferramentas globalmente, o OpenClaw não altera essa configuração. Defina `tools.toolSearch: false` para não usar o padrão de Pesquisa de Ferramentas do modo enxuto.

No modo estruturado de `tools`, as execuções enxutas mantêm `exec` diretamente visível ao lado dos controles da Pesquisa de Ferramentas, para que modelos locais ajustados para programação ainda possam escolher o caminho de shell com o qual estão familiarizados. Isso altera somente a visibilidade do esquema: a política normal de ferramentas, o sandbox e as aprovações de execução continuam se aplicando. Os modos explícitos `code` e `directory` mantêm seu comportamento normal de Compaction.

### Por que essas ferramentas

Essas ferramentas têm as descrições mais extensas, os formatos de parâmetros mais amplos ou a maior probabilidade de desviar um modelo pequeno do fluxo normal de programação e conversa. Em um backend compatível com OpenAI, com contexto pequeno ou mais rígido, essa é a diferença entre:

- Os esquemas de ferramentas caberem no prompt ou ocuparem o espaço do histórico da conversa.
- O modelo escolher a ferramenta correta ou emitir chamadas de ferramenta malformadas devido ao excesso de esquemas semelhantes.
- O adaptador de Chat Completions permanecer dentro dos limites de saída estruturada ou retornar um erro 400 devido ao tamanho da carga de chamadas de ferramenta.

Removê-las apenas encurta a lista direta de ferramentas. O modelo ainda tem `read`, `write`, `edit`, `exec`, `apply_patch`, compreensão de imagens, pesquisa/busca na web (quando configurada), memória e ferramentas de sessão/agente. Catálogos adicionais continuam acessíveis por meio da Pesquisa de Ferramentas, a menos que você defina `tools.toolSearch: false`; permissões explícitas de ferramentas podem reincluir um agente enxuto em um fluxo de trabalho reduzido.

### Quando ativá-lo

Ative o modo enxuto depois de comprovar que o modelo consegue se comunicar com o Gateway, mas os turnos completos do agente apresentam problemas:

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` é bem-sucedido.
2. Um turno normal do agente falha com chamadas de ferramenta malformadas, prompts grandes demais ou o modelo ignorando suas ferramentas.
3. Alterar `localModelLean: true` elimina a falha.

### Quando mantê-lo desativado

Se o seu backend lida corretamente com o runtime padrão completo, mantenha essa opção desativada. Ela é uma solução alternativa para pilhas locais que precisam de uma superfície de ferramentas menor, não um padrão para modelos hospedados ou máquinas locais com bons recursos.

O modo enxuto não substitui `tools.profile`, `tools.allow`/`tools.deny` nem a alternativa `compat.supportsTools: false` do modelo. Para uma superfície de ferramentas permanentemente mais restrita em um agente específico, prefira essas opções estáveis.

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

Um recurso experimental deve ser identificado claramente como tal na documentação e no próprio caminho de configuração, em vez de ficar oculto atrás de uma opção padrão com aparência estável.

## Relacionados

- [Recursos](/pt-BR/concepts/features)
- [Canais de lançamento](/pt-BR/install/development-channels)
