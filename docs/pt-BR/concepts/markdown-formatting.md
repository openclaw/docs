---
read_when:
    - Você está alterando a formatação Markdown ou a segmentação para canais de saída
    - Você está adicionando um novo formatador de canal ou mapeamento de estilo
    - Você está depurando regressões de formatação entre canais
summary: Pipeline de formatação Markdown para canais de saída
title: Formatação Markdown
x-i18n:
    generated_at: "2026-05-06T05:50:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9dcc75cec0462d610f2b5bbd258a2686b15eeb4b9d369ee4d7727571da7edcc
    source_path: concepts/markdown-formatting.md
    workflow: 16
---

OpenClaw formata Markdown de saída convertendo-o em uma representação intermediária
compartilhada (IR) antes de renderizar a saída específica de cada canal. A IR mantém o
texto de origem intacto enquanto carrega intervalos de estilo/link, para que a divisão em
partes e a renderização possam permanecer consistentes entre canais.

## Objetivos

- **Consistência:** uma etapa de análise, vários renderizadores.
- **Divisão segura em partes:** dividir o texto antes da renderização para que a formatação inline nunca
  quebre entre partes.
- **Adequação ao canal:** mapear a mesma IR para mrkdwn do Slack, HTML do Telegram e intervalos de
  estilo do Signal sem reanalisar o Markdown.

## Pipeline

1. **Analisar Markdown -> IR**
   - A IR é texto simples mais intervalos de estilo (negrito/itálico/tachado/código/spoiler) e intervalos de link.
   - Os deslocamentos são unidades de código UTF-16 para que os intervalos de estilo do Signal se alinhem à API dele.
   - Tabelas são analisadas apenas quando um canal opta pela conversão de tabelas.
2. **Dividir IR em partes (formatação primeiro)**
   - A divisão em partes acontece no texto da IR antes da renderização.
   - A formatação inline não é dividida entre partes; os intervalos são fatiados por parte.
3. **Renderizar por canal**
   - **Slack:** tokens mrkdwn (negrito/itálico/tachado/código), links como `<url|label>`.
   - **Telegram:** tags HTML (`<b>`, `<i>`, `<s>`, `<code>`, `<pre><code>`, `<a href>`).
   - **Signal:** texto simples + intervalos `text-style`; links se tornam `label (url)` quando o rótulo é diferente.

## Exemplo de IR

Markdown de entrada:

```markdown
Hello **world** - see [docs](https://docs.openclaw.ai).
```

IR (esquemática):

```json
{
  "text": "Hello world - see docs.",
  "styles": [{ "start": 6, "end": 11, "style": "bold" }],
  "links": [{ "start": 19, "end": 23, "href": "https://docs.openclaw.ai" }]
}
```

## Onde é usada

- Adaptadores de saída do Slack, Telegram e Signal renderizam a partir da IR.
- Outros canais (WhatsApp, iMessage, Microsoft Teams, Discord) ainda usam texto simples ou
  suas próprias regras de formatação, com conversão de tabelas Markdown aplicada antes da
  divisão em partes quando habilitada.

## Tratamento de tabelas

Tabelas Markdown não têm suporte consistente entre clientes de chat. Use
`markdown.tables` para controlar a conversão por canal (e por conta).

- `code`: renderiza tabelas como blocos de código (padrão para a maioria dos canais).
- `bullets`: converte cada linha em marcadores (padrão para Signal + WhatsApp).
- `off`: desabilita a análise e conversão de tabelas; o texto bruto da tabela é repassado.

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

## Regras de divisão em partes

- Os limites de partes vêm dos adaptadores/configurações do canal e são aplicados ao texto da IR.
- Cercas de código são preservadas como um único bloco com uma nova linha final para que os canais
  as renderizem corretamente.
- Prefixos de listas e prefixos de citações fazem parte do texto da IR, então a divisão em partes
  não ocorre no meio do prefixo.
- Estilos inline (negrito/itálico/tachado/código-inline/spoiler) nunca são divididos entre
  partes; o renderizador reabre estilos dentro de cada parte.

Se precisar de mais informações sobre o comportamento de divisão em partes entre canais, consulte
[Streaming + divisão em partes](/pt-BR/concepts/streaming).

## Política de links

- **Slack:** `[label](url)` -> `<url|label>`; URLs nuas permanecem nuas. O autolink
  é desabilitado durante a análise para evitar links duplicados.
- **Telegram:** `[label](url)` -> `<a href="url">label</a>` (modo de análise HTML).
- **Signal:** `[label](url)` -> `label (url)` a menos que o rótulo corresponda à URL.

## Spoilers

Marcadores de spoiler (`||spoiler||`) são analisados apenas para Signal, onde são mapeados para
intervalos de estilo SPOILER. Outros canais os tratam como texto simples.

## Como adicionar ou atualizar um formatador de canal

1. **Analisar uma vez:** use o helper compartilhado `markdownToIR(...)` com opções apropriadas ao canal
   (autolink, estilo de título, prefixo de citação).
2. **Renderizar:** implemente um renderizador com `renderMarkdownWithMarkers(...)` e um
   mapa de marcadores de estilo (ou intervalos de estilo do Signal).
3. **Dividir em partes:** chame `chunkMarkdownIR(...)` antes da renderização; renderize cada parte.
4. **Conectar o adaptador:** atualize o adaptador de saída do canal para usar o novo divisor em partes
   e o renderizador.
5. **Testar:** adicione ou atualize testes de formatação e um teste de entrega de saída se o
   canal usar divisão em partes.

## Armadilhas comuns

- Tokens do Slack com colchetes angulares (`<@U123>`, `<#C123>`, `<https://...>`) devem ser
  preservados; escape HTML bruto com segurança.
- O HTML do Telegram exige escape de texto fora das tags para evitar marcação quebrada.
- Os intervalos de estilo do Signal dependem de deslocamentos UTF-16; não use deslocamentos de pontos de código.
- Preserve novas linhas finais para blocos de código cercados para que os marcadores de fechamento fiquem em
  sua própria linha.

## Relacionados

<CardGroup cols={2}>
  <Card title="Streaming e divisão em partes" href="/pt-BR/concepts/streaming" icon="bars-staggered">
    Comportamento de streaming de saída, limites de partes e entrega específica por canal.
  </Card>
  <Card title="Prompt do sistema" href="/pt-BR/concepts/system-prompt" icon="message-lines">
    O que o modelo vê antes da conversa, incluindo arquivos injetados do espaço de trabalho.
  </Card>
</CardGroup>
