---
read_when:
    - Você mantém um Plugin do OpenClaw
    - Você vê um aviso de compatibilidade de Plugin
    - Você está planejando uma migração de SDK de Plugin ou de manifesto
summary: Contratos de compatibilidade de Plugin, metadados de descontinuação e expectativas de migração
title: Compatibilidade de Plugin
x-i18n:
    generated_at: "2026-04-25T18:19:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 511bd12cff1e72a93091cbb1ac7d75377b0b9d2f016b55f4cdc77293f6172a00
    source_path: plugins/compatibility.md
    workflow: 15
---

O OpenClaw mantém contratos antigos de Plugin conectados por meio de
adaptadores de compatibilidade nomeados antes de removê-los. Isso protege
Plugins existentes, empacotados e externos, enquanto os contratos do SDK,
manifesto, configuração, config e runtime do agente evoluem.

## Registro de compatibilidade

Os contratos de compatibilidade de Plugin são rastreados no registro central em
`src/plugins/compat/registry.ts`.

Cada registro tem:

- um código de compatibilidade estável
- status: `active`, `deprecated`, `removal-pending` ou `removed`
- owner: SDK, config, setup, canal, provider, execução de Plugin, runtime do agente
  ou core
- datas de introdução e descontinuação, quando aplicável
- orientação de substituição
- docs, diagnósticos e testes que cobrem o comportamento antigo e o novo

O registro é a fonte para planejamento de mantenedores e futuras verificações do
inspetor de Plugins. Se um comportamento voltado a Plugins mudar, adicione ou
atualize o registro de compatibilidade na mesma alteração que adiciona o
adaptador.

## Pacote do inspetor de Plugins

O inspetor de Plugins deve ficar fora do repositório principal do OpenClaw, como
um pacote/repositório separado, apoiado pelos contratos versionados de
compatibilidade e manifesto.

A CLI do primeiro dia deve ser:

```sh
openclaw-plugin-inspector ./my-plugin
```

Ela deve emitir:

- validação de manifesto/schema
- a versão de compatibilidade de contrato que está sendo verificada
- verificações de metadados de instalação/origem
- verificações de import no caminho frio
- avisos de descontinuação e compatibilidade

Use `--json` para uma saída estável legível por máquina em anotações de CI. O
core do OpenClaw deve expor contratos e fixtures que o inspetor possa consumir,
mas não deve publicar o binário do inspetor a partir do pacote principal `openclaw`.

## Política de descontinuação

O OpenClaw não deve remover um contrato de Plugin documentado na mesma release
em que introduz sua substituição.

A sequência de migração é:

1. Adicionar o novo contrato.
2. Manter o comportamento antigo conectado por meio de um adaptador de compatibilidade nomeado.
3. Emitir diagnósticos ou avisos quando autores de Plugins puderem agir.
4. Documentar a substituição e o cronograma.
5. Testar os caminhos antigo e novo.
6. Aguardar durante a janela de migração anunciada.
7. Remover apenas com aprovação explícita de release com breaking change.

Registros descontinuados devem incluir uma data de início do aviso, substituição, link
para a documentação e data prevista de remoção, quando conhecida.

## Áreas atuais de compatibilidade

Os registros atuais de compatibilidade incluem:

- imports amplos legados do SDK, como `openclaw/plugin-sdk/compat`
- formatos legados de Plugin baseados apenas em hooks e `before_agent_start`
- comportamento de allowlist e ativação de Plugins empacotados
- metadados legados de manifesto de variáveis de ambiente de provider/canal
- activation hints que estão sendo substituídos pela propriedade de contribuição do manifesto
- aliases de nomenclatura `embeddedHarness` e `agent-harness` enquanto a nomenclatura pública migra
  para `agentRuntime`
- fallback gerado de metadados de configuração de canal empacotado enquanto os metadados
  `channelConfigs` com registro em primeiro lugar são implementados
- a variável de ambiente legada para desativação do registro persistido de Plugins, enquanto fluxos de reparo migram operadores
  para `openclaw plugins registry --refresh` e `openclaw doctor --fix`

Novo código de Plugin deve preferir a substituição listada no registro e no
guia específico de migração. Plugins existentes podem continuar usando um caminho
de compatibilidade até que a documentação, os diagnósticos e as notas de release
anunciem uma janela de remoção.

## Notas de release

As notas de release devem incluir próximas descontinuações de Plugin com datas
previstas e links para a documentação de migração. Esse aviso precisa acontecer
antes que um caminho de compatibilidade passe para `removal-pending` ou `removed`.
