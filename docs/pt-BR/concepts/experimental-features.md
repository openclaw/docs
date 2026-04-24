---
read_when:
    - Você vê uma chave de configuração `.experimental` e quer saber se ela é estável
    - Você quer experimentar recursos de runtime em prévia sem confundi-los com padrões normais
    - Você quer um único lugar para encontrar as flags experimentais documentadas atualmente
summary: O que significam as flags experimentais no OpenClaw e quais delas estão documentadas atualmente
title: Recursos experimentais
x-i18n:
    generated_at: "2026-04-24T05:48:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a97e8efa180844e1ca94495d626956847a15a15bba0846aaf54ff9c918cda02
    source_path: concepts/experimental-features.md
    workflow: 15
---

Os recursos experimentais no OpenClaw são **superfícies de prévia com opt-in**. Eles
ficam atrás de flags explícitas porque ainda precisam de uso no mundo real antes de
merecerem um padrão estável ou um contrato público de longa duração.

Trate-os de forma diferente da configuração normal:

- Mantenha-os **desativados por padrão** a menos que a documentação relacionada diga para testar algum.
- Espere que **forma e comportamento mudem** mais rapidamente do que a configuração estável.
- Prefira primeiro o caminho estável quando ele já existir.
- Se você estiver implantando o OpenClaw amplamente, teste flags experimentais em um ambiente menor
  antes de incorporá-las a uma baseline compartilhada.

## Flags documentadas atualmente

| Superfície               | Chave                                                     | Use quando                                                                                                     | Mais                                                                                          |
| ------------------------ | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Runtime de modelo local  | `agents.defaults.experimental.localModelLean`             | Um backend local menor ou mais restritivo engasga com a superfície completa de ferramentas padrão do OpenClaw | [Modelos locais](/pt-BR/gateway/local-models)                                                       |
| Busca de memória         | `agents.defaults.memorySearch.experimental.sessionMemory` | Você quer que `memory_search` indexe transcrições de sessões anteriores e aceita o custo extra de armazenamento/indexação | [Referência de configuração de memória](/pt-BR/reference/memory-config#session-memory-search-experimental) |
| Ferramenta de planejamento estruturado | `tools.experimental.planTool`               | Você quer que a ferramenta estruturada `update_plan` seja exposta para rastreamento de trabalho em várias etapas em runtimes e UIs compatíveis | [Referência de configuração do Gateway](/pt-BR/gateway/config-tools#toolsexperimental) |

## Modo lean de modelo local

`agents.defaults.experimental.localModelLean: true` é uma válvula de alívio
para configurações mais fracas de modelos locais. Ela reduz ferramentas padrão pesadas como
`browser`, `cron` e `message`, para que o formato do prompt fique menor e menos frágil
para backends compatíveis com OpenAI de contexto pequeno ou mais restritivos.

Isso intencionalmente **não** é o caminho normal. Se o seu backend lida bem
com o runtime completo, deixe isso desativado.

## Experimental não significa oculto

Se um recurso é experimental, o OpenClaw deve dizer isso claramente na documentação e no
próprio caminho de configuração. O que ele **não** deve fazer é introduzir comportamento de prévia em um
controle com aparência estável e fingir que isso é normal. É assim que as
superfícies de configuração ficam bagunçadas.

## Relacionado

- [Recursos](/pt-BR/concepts/features)
- [Canais de release](/pt-BR/install/development-channels)
