---
read_when:
    - Você está alterando a formatação Markdown ou a fragmentação para canais de saída
    - Você está adicionando um novo formatador de canal ou mapeamento de estilo
    - Você está depurando regressões de formatação entre canais
summary: Pipeline de formatação Markdown para canais de saída
title: Formatação Markdown
x-i18n:
    generated_at: "2026-04-24T05:47:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: cf052e11fe9fd075a4337ffa555391c7003a346240b57bb65054c3f08401dfd9
    source_path: concepts/markdown-formatting.md
    workflow: 15
---

O OpenClaw formata Markdown de saída convertendo-o em uma representação intermediária
compartilhada (IR) antes de renderizar a saída específica de cada canal. A IR mantém o
texto-fonte intacto enquanto carrega spans de estilo/link, para que a fragmentação e a renderização possam
permanecer consistentes entre os canais.

## Objetivos

- **Consistência:** uma etapa de parsing, vários renderizadores.
- **Fragmentação segura:** dividir o texto antes da renderização para que a formatação inline nunca
  seja quebrada entre chunks.
- **Adequação ao canal:** mapear a mesma IR para Slack mrkdwn, Telegram HTML e Signal
  style ranges sem fazer parsing do Markdown novamente.

## Pipeline

1. **Fazer parse de Markdown -> IR**
   - A IR é texto simples mais spans de estilo (bold/italic/strike/code/spoiler) e spans de link.
   - Offsets são unidades de código UTF-16 para que os style ranges do Signal se alinhem com sua API.
   - Tabelas são analisadas apenas quando um canal opta pela conversão de tabelas.
2. **Fragmentar IR (formatação primeiro)**
   - A fragmentação acontece no texto da IR antes da renderização.
   - A formatação inline não é dividida entre chunks; spans são fatiados por chunk.
3. **Renderizar por canal**
   - **Slack:** tokens mrkdwn (bold/italic/strike/code), links como `<url|label>`.
   - **Telegram:** tags HTML (`<b>`, `<i>`, `<s>`, `<code>`, `<pre><code>`, `<a href>`).
   - **Signal:** texto simples + ranges `text-style`; links viram `label (url)` quando o rótulo é diferente.

## Exemplo de IR

Markdown de entrada:

```markdown
Hello **world** — see [docs](https://docs.openclaw.ai).
```

IR (esquemática):

```json
{
  "text": "Hello world — see docs.",
  "styles": [{ "start": 6, "end": 11, "style": "bold" }],
  "links": [{ "start": 19, "end": 23, "href": "https://docs.openclaw.ai" }]
}
```

## Onde é usada

- Adaptadores de saída de Slack, Telegram e Signal renderizam a partir da IR.
- Outros canais (WhatsApp, iMessage, Microsoft Teams, Discord) ainda usam texto simples ou
  suas próprias regras de formatação, com conversão de tabela Markdown aplicada antes da
  fragmentação quando habilitada.

## Tratamento de tabelas

Tabelas Markdown não são compatíveis de forma consistente entre clientes de chat. Use
`markdown.tables` para controlar a conversão por canal (e por conta).

- `code`: renderizar tabelas como blocos de código (padrão para a maioria dos canais).
- `bullets`: converter cada linha em marcadores (padrão para Signal + WhatsApp).
- `off`: desabilitar parsing e conversão de tabelas; o texto bruto da tabela passa direto.

Chaves de configuração:

```yaml
channels:
  discord:
    markdown:
      tables: code
    accounts:
      work:
        markdown:
          tables: off
```

## Regras de fragmentação

- Os limites de fragmentação vêm dos adaptadores/configuração do canal e são aplicados ao texto da IR.
- Cercas de código são preservadas como um único bloco com uma nova linha final para que os canais
  as renderizem corretamente.
- Prefixos de lista e de blockquote fazem parte do texto da IR, então a fragmentação
  não divide no meio do prefixo.
- Estilos inline (bold/italic/strike/inline-code/spoiler) nunca são divididos entre
  chunks; o renderizador reabre estilos dentro de cada chunk.

Se você precisar de mais detalhes sobre o comportamento de fragmentação entre canais, consulte
[Streaming + chunking](/pt-BR/concepts/streaming).

## Política de links

- **Slack:** `[label](url)` -> `<url|label>`; URLs simples permanecem simples. O autolink
  é desabilitado durante o parsing para evitar links duplicados.
- **Telegram:** `[label](url)` -> `<a href="url">label</a>` (modo de parsing HTML).
- **Signal:** `[label](url)` -> `label (url)`, a menos que o rótulo corresponda à URL.

## Spoilers

Marcadores de spoiler (`||spoiler||`) são analisados apenas para Signal, onde mapeiam para
ranges de estilo SPOILER. Outros canais os tratam como texto simples.

## Como adicionar ou atualizar um formatador de canal

1. **Fazer parse uma vez:** use o helper compartilhado `markdownToIR(...)` com opções
   apropriadas para o canal (autolink, estilo de heading, prefixo de blockquote).
2. **Renderizar:** implemente um renderizador com `renderMarkdownWithMarkers(...)` e um
   mapa de marcadores de estilo (ou style ranges do Signal).
3. **Fragmentar:** chame `chunkMarkdownIR(...)` antes de renderizar; renderize cada chunk.
4. **Conectar ao adaptador:** atualize o adaptador de saída do canal para usar o novo fragmentador
   e renderizador.
5. **Testar:** adicione ou atualize testes de formatação e um teste de entrega de saída se o
   canal usar fragmentação.

## Armadilhas comuns

- Tokens com colchetes angulares do Slack (`<@U123>`, `<#C123>`, `<https://...>`) devem ser
  preservados; escape HTML bruto com segurança.
- O HTML do Telegram exige escapar texto fora das tags para evitar markup quebrado.
- Os style ranges do Signal dependem de offsets UTF-16; não use offsets de code point.
- Preserve novas linhas finais para blocos de código com cercas, para que os marcadores de fechamento caiam
  em sua própria linha.

## Relacionados

- [Streaming and chunking](/pt-BR/concepts/streaming)
- [System prompt](/pt-BR/concepts/system-prompt)
