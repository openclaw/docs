---
read_when:
    - Você mantém um Plugin do OpenClaw
    - Você viu um aviso de compatibilidade de Plugin
    - Você está planejando uma migração do SDK de Plugin ou do manifest
summary: Contratos de compatibilidade de Plugin, metadados de descontinuação e expectativas de migração
title: Compatibilidade de Plugin
x-i18n:
    generated_at: "2026-04-25T13:50:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 02e0cdbc763eed5a38b303fc44202ddd36e58bce43dc29b6348db3f5fea66f26
    source_path: plugins/compatibility.md
    workflow: 15
---

O OpenClaw mantém contratos antigos de Plugin conectados por adaptadores de
compatibilidade nomeados antes de removê-los. Isso protege Plugins existentes,
internos e externos, enquanto os contratos de SDK, manifest, setup, config e runtime
de agente evoluem.

## Registro de compatibilidade

Os contratos de compatibilidade de Plugin são rastreados no registro central em
`src/plugins/compat/registry.ts`.

Cada registro tem:

- um código estável de compatibilidade
- status: `active`, `deprecated`, `removal-pending` ou `removed`
- owner: SDK, config, setup, channel, provider, execução de Plugin, runtime de agente
  ou core
- datas de introdução e descontinuação, quando aplicável
- orientação de substituição
- docs, diagnósticos e testes que cobrem o comportamento antigo e o novo

O registro é a fonte para planejamento de maintainers e futuras verificações do
inspector de Plugin. Se um comportamento voltado para Plugin mudar, adicione ou atualize o
registro de compatibilidade na mesma alteração que adiciona o adaptador.

## Pacote plugin inspector

O plugin inspector deve ficar fora do repositório principal do OpenClaw como um
pacote/repositório separado, sustentado pelos contratos versionados de compatibilidade e
manifest.

A CLI do primeiro dia deve ser:

```sh
openclaw-plugin-inspector ./my-plugin
```

Ela deve emitir:

- validação de manifest/schema
- a versão de compatibilidade de contrato que está sendo verificada
- verificações de metadados de instalação/origem
- verificações de import no caminho frio
- avisos de descontinuação e compatibilidade

Use `--json` para saída estável legível por máquina em anotações de CI. O core do OpenClaw
deve expor contratos e fixtures que o inspector possa consumir, mas não deve
publicar o binário do inspector a partir do pacote principal `openclaw`.

## Política de descontinuação

O OpenClaw não deve remover um contrato de Plugin documentado na mesma release
que introduz sua substituição.

A sequência de migração é:

1. Adicionar o novo contrato.
2. Manter o comportamento antigo conectado por um adaptador de compatibilidade nomeado.
3. Emitir diagnósticos ou avisos quando autores de Plugin puderem agir.
4. Documentar a substituição e o cronograma.
5. Testar os caminhos antigo e novo.
6. Esperar durante a janela de migração anunciada.
7. Remover somente com aprovação explícita de release com breaking change.

Registros descontinuados devem incluir uma data de início do aviso, substituição, link de docs
e data-alvo de remoção, quando conhecida.

## Áreas atuais de compatibilidade

Os registros atuais de compatibilidade incluem:

- imports amplos legados de SDK, como `openclaw/plugin-sdk/compat`
- formatos legados de Plugin apenas com hooks e `before_agent_start`
- comportamento de lista de permissão e habilitação de Plugins internos
- metadados legados de manifest de variáveis de ambiente de provider/channel
- dicas de ativação que estão sendo substituídas por ownership de contribuição de manifest
- aliases de nomenclatura `embeddedHarness` e `agent-harness` enquanto a nomenclatura pública migra
  para `agentRuntime`
- fallback de metadados gerados de configuração de canal interno enquanto os metadados
  `channelConfigs` com registry-first são implementados

Novo código de Plugin deve preferir a substituição listada no registro e no
guia de migração específico. Plugins existentes podem continuar usando um caminho de
compatibilidade até que docs, diagnósticos e notas de release anunciem uma janela de remoção.

## Notas de release

As notas de release devem incluir futuras descontinuações de Plugin com datas-alvo e
links para docs de migração. Esse aviso precisa acontecer antes que um caminho de
compatibilidade passe para `removal-pending` ou `removed`.
