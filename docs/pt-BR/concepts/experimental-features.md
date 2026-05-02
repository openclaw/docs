---
read_when:
    - Você vê uma chave de configuração `.experimental` e quer saber se ela é estável
    - Você quer experimentar recursos de tempo de execução em prévia sem confundi-los com os padrões normais
    - Você quer um único lugar para encontrar os sinalizadores experimentais documentados atualmente
summary: O que significam os sinalizadores experimentais no OpenClaw e quais estão documentados atualmente
title: Recursos experimentais
x-i18n:
    generated_at: "2026-05-02T22:18:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 066efa297bac995597f1092ed6473d9cff28c01d7e28fa1382d7997f8f83a346
    source_path: concepts/experimental-features.md
    workflow: 16
---

Os recursos experimentais no OpenClaw são **superfícies de prévia opt-in**. Eles ficam
atrás de flags explícitas porque ainda precisam de uso real antes de
merecer um padrão estável ou um contrato público duradouro.

Trate-os de forma diferente da configuração normal:

- Mantenha-os **desativados por padrão**, a menos que a documentação relacionada diga para você experimentar um.
- Espere que **forma e comportamento mudem** mais rápido do que a configuração estável.
- Prefira primeiro o caminho estável quando já existir um.
- Se você estiver implantando o OpenClaw amplamente, teste flags experimentais em um ambiente
  menor antes de incorporá-las a uma linha de base compartilhada.

## Flags documentadas atualmente

| Superfície               | Chave                                                     | Use quando                                                                                                     | Mais                                                                                          |
| ------------------------ | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Tempo de execução de modelo local | `agents.defaults.experimental.localModelLean`             | Um backend local menor ou mais rígido engasga com a superfície completa de ferramentas padrão do OpenClaw       | [Modelos locais](/pt-BR/gateway/local-models)                                                       |
| Pesquisa de memória      | `agents.defaults.memorySearch.experimental.sessionMemory` | Você quer que `memory_search` indexe transcrições de sessões anteriores e aceita o custo extra de armazenamento/indexação | [Referência de configuração de memória](/pt-BR/reference/memory-config#session-memory-search-experimental) |
| Ferramenta de planejamento estruturado | `tools.experimental.planTool`                             | Você quer a ferramenta estruturada `update_plan` exposta para acompanhamento de trabalho em várias etapas em runtimes e UIs compatíveis | [Referência de configuração do Gateway](/pt-BR/gateway/config-tools#toolsexperimental)              |

## Modo enxuto de modelo local

`agents.defaults.experimental.localModelLean: true` é uma válvula de alívio de pressão para configurações de modelos locais mais fracas. Quando ativada, o OpenClaw remove três ferramentas padrão — `browser`, `cron` e `message` — da superfície de ferramentas do agente em cada turno. Nada mais muda.

### Por que estas três ferramentas

Essas três ferramentas têm as descrições maiores e o maior número de formatos de parâmetros no runtime padrão do OpenClaw. Em um backend compatível com OpenAI, de contexto pequeno ou mais rígido, essa é a diferença entre:

- Esquemas de ferramentas caberem de forma limpa no prompt vs. comprimirem o histórico da conversa.
- O modelo escolher a ferramenta certa vs. emitir chamadas de ferramenta malformadas porque há esquemas demais com aparência parecida.
- O adaptador Chat Completions permanecer dentro dos limites de saída estruturada do servidor vs. disparar um 400 pelo tamanho do payload de chamada de ferramenta.

Removê-las não reconfigura silenciosamente o OpenClaw — apenas encurta a lista de ferramentas. O modelo ainda tem `read`, `write`, `edit`, `exec`, `apply_patch`, busca/busca de conteúdo na web (quando configurada), memória e ferramentas de sessão/agente disponíveis.

### Quando ativar

Ative o modo enxuto quando você já tiver comprovado que o modelo consegue falar com o Gateway, mas turnos completos do agente se comportam mal. A cadeia de sinais típica é:

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` é bem-sucedido.
2. Um turno normal do agente falha com chamadas de ferramenta malformadas, prompts grandes demais ou o modelo ignorando suas ferramentas.
3. Alternar `localModelLean: true` elimina a falha.

### Quando deixar desativado

Se o seu backend lida corretamente com o runtime padrão completo, deixe isto desativado. O modo enxuto é uma solução de contorno, não um padrão. Ele existe porque algumas pilhas locais precisam de uma superfície de ferramentas menor para se comportar; modelos hospedados e máquinas locais bem provisionadas não precisam.

O modo enxuto também não substitui `tools.profile`, `tools.allow`/`tools.deny` nem a saída de emergência `compat.supportsTools: false` do modelo. Se você precisar de uma superfície de ferramentas permanentemente mais estreita para um agente específico, prefira esses controles estáveis em vez da flag experimental.

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

Reinicie o Gateway depois de alterar a flag e então confirme a lista reduzida de ferramentas com:

```bash
openclaw status --deep
```

A saída de status profundo lista as ferramentas ativas do agente; `browser`, `cron` e `message` devem estar ausentes quando o modo enxuto estiver ativado.

## Experimental não significa oculto

Se um recurso é experimental, o OpenClaw deve dizer isso claramente na documentação e no
próprio caminho de configuração. O que ele **não** deve fazer é contrabandear comportamento de prévia para um
controle com aparência estável e fingir que isso é normal. É assim que superfícies de
configuração ficam confusas.

## Relacionado

- [Recursos](/pt-BR/concepts/features)
- [Canais de lançamento](/pt-BR/install/development-channels)
