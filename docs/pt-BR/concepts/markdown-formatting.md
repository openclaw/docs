---
read_when:
    - Você está alterando a formatação ou a divisão em blocos do Markdown para canais de saída
    - Você está adicionando um novo formatador de canal ou mapeamento de estilo
    - Você está depurando regressões de formatação em vários canais
summary: Pipeline de formatação Markdown para canais de saída
title: Formatação Markdown
x-i18n:
    generated_at: "2026-07-11T23:54:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f9a35fd9a6386068e1e3bec73ec6e692f49239b468f42dd737f919b1c6a88e41
    source_path: concepts/markdown-formatting.md
    workflow: 16
---

OpenClaw converte o Markdown de saída em uma representação intermediária
(IR) compartilhada antes de renderizar a saída específica de cada canal. A IR mantém texto simples e
intervalos de estilo/links, de modo que uma única etapa de análise alimente todos os canais e a divisão em partes nunca
separe a formatação no meio de um intervalo.

## Pipeline

1. **Analisar Markdown em IR** (`markdownToIR`) - texto simples e intervalos de estilo
   (negrito, itálico, tachado, código, bloco de código, spoiler, citação em bloco,
   cabeçalho 1-6) e intervalos de links. Os deslocamentos são unidades de código UTF-16, para que os intervalos
   de estilo do Signal se alinhem diretamente à sua API. As tabelas são analisadas somente quando o canal
   adota um modo de tabela.
2. **Dividir a IR em partes** (`chunkMarkdownIR` / `renderMarkdownIRChunksWithinLimit`)
   - a divisão ocorre no texto da IR antes da renderização, portanto os estilos embutidos e
     links são segmentados por parte, em vez de serem interrompidos em um limite.
3. **Renderizar por canal** (`renderMarkdownWithMarkers`) - um mapa de marcadores de estilo
   transforma os intervalos na marcação nativa do canal.

| Canal                                                            | Renderizador                                                                          | Observações                                                                                          |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Slack                                                            | tokens mrkdwn (`*bold*`, `_italic_`, `` `code` ``, delimitadores de código)            | Links se tornam `<url\|label>`; links automáticos são desativados durante a análise para evitar duplicação |
| Telegram                                                         | tags HTML (`<b>`, `<i>`, `<s>`, `<code>`, `<pre><code>`, `<a href>`, `<tg-spoiler>`)  | Também oferece suporte a tabelas e cabeçalhos de mensagens avançadas (`<h1>`-`<h6>`) quando `richMessages` está ativado |
| Signal                                                           | texto simples + intervalos `text-style`                                                | Links são renderizados como `label (url)` quando o rótulo é diferente da URL                         |
| Discord, WhatsApp, iMessage, Microsoft Teams e outros canais     | texto simples                                                                         | Sem estilos baseados em IR; a conversão de tabelas Markdown ainda ocorre via `convertMarkdownTables` |

## Exemplo de IR

Markdown de entrada:
__OC_I18N_900000__
IR (esquemática):
__OC_I18N_900001__
## Tratamento de tabelas

`markdown.tables` controla como um canal converte tabelas Markdown, por
canal e, opcionalmente, por conta:

| Modo      | Comportamento                                                                                   |
| --------- | ----------------------------------------------------------------------------------------------- |
| `code`    | Renderiza como uma tabela ASCII alinhada dentro de um bloco de código (padrão de contingência)  |
| `bullets` | Converte cada linha em itens de lista no formato `label: value`                                 |
| `block`   | Mantém tabelas nativas quando o transporte oferece suporte; caso contrário, usa `code`          |
| `off`     | Desativa a análise de tabelas; o texto bruto da tabela é transmitido sem alterações             |

Padrões de Plugin por canal: Signal, WhatsApp e Matrix usam
`bullets` por padrão; Mattermost usa `off`; Telegram usa `block` por padrão (que
é resolvido como `code`, a menos que a conta tenha `richMessages` ativado). Qualquer
canal sem um padrão explícito do Plugin usa `code`.
__OC_I18N_900002__
## Regras de divisão em partes

- Os limites das partes vêm dos adaptadores/configurações do canal e se aplicam ao texto da IR, não
  à saída renderizada.
- Blocos de código delimitados são mantidos como um único bloco com uma nova linha ao final, para que
  os canais renderizem corretamente o delimitador de fechamento.
- Prefixos de listas e citações em bloco fazem parte do texto da IR, portanto a divisão nunca
  ocorre no meio de um prefixo.
- Estilos embutidos nunca são divididos entre partes; o renderizador reabre um estilo
  aberto no início da parte seguinte.

Consulte [Streaming e divisão em partes](/concepts/streaming) para saber mais sobre limites de partes e
o comportamento de entrega entre canais.

## Política de links

- **Slack:** `[label](url)` -> `<url|label>`; URLs simples permanecem simples.
- **Telegram:** `[label](url)` -> `<a href="url">label</a>` (modo de análise HTML).
- **Signal:** `[label](url)` -> `label (url)`, a menos que o rótulo já
  corresponda à URL.

## Spoilers

Marcadores de spoiler (`||spoiler||`) são analisados para o Signal (mapeados para intervalos de estilo
`SPOILER`) e o Telegram (mapeados para `<tg-spoiler>`). Outros canais tratam
`||...||` como texto simples.

## Adicionar ou atualizar um formatador de canal

1. **Analise uma única vez** com `markdownToIR(...)`, fornecendo opções apropriadas ao canal
   (`autolink`, `headingStyle`, `blockquotePrefix`, `tableMode`).
2. **Renderize** com `renderMarkdownWithMarkers(...)` e um mapa de marcadores de estilo (ou
   lógica personalizada de intervalos de estilo para transportes como o Signal).
3. **Divida em partes** com `chunkMarkdownIR(...)` ou
   `renderMarkdownIRChunksWithinLimit(...)` antes de renderizar cada parte.
4. **Conecte o adaptador** para chamar o novo divisor e renderizador a partir do
   caminho de envio de saída.
5. **Teste** com testes de formatação e um teste de entrega de saída, caso o canal
   divida mensagens em partes.

## Armadilhas comuns

- Tokens entre sinais de maior e menor do Slack (`<@U123>`, `<#C123>`, `<https://...>`) devem
  sobreviver ao escape; HTML bruto ainda precisa ser escapado com segurança.
- O HTML do Telegram exige o escape do texto fora das tags para evitar marcação inválida.
- Os intervalos de estilo do Signal usam deslocamentos UTF-16, não deslocamentos de pontos de código.
- Preserve as novas linhas finais em blocos de código delimitados, para que o marcador de fechamento
  fique em sua própria linha.

## Relacionado

<CardGroup cols={2}>
  <Card title="Streaming e divisão em partes" href="/pt-BR/concepts/streaming" icon="bars-staggered">
    Comportamento do streaming de saída, limites das partes e entrega específica por canal.
  </Card>
  <Card title="Prompt do sistema" href="/pt-BR/concepts/system-prompt" icon="message-lines">
    O que o modelo vê antes da conversa, incluindo arquivos injetados do espaço de trabalho.
  </Card>
</CardGroup>
